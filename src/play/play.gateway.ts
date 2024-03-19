import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { SessionData } from 'express-session';
import { Server, Socket } from "socket.io";
import { AuthGuard } from 'src/auth/auth.guard';
import { UsersService } from 'src/users/users.service';
import {
  SUB_JOIN_ROOM,
  SUB_MOVE,
  SUB_CLAIM_OPPONENT_TIMEOUT,
  SUB_RESIGNATION,
  SUB_CREATE_ROOM,
  SUB_PASS_TURN,
  SUB_REQUEST_REMATCH,
  SUB_LEAVE_ROOM
} from './consts';
import { GameInfoDto } from './dto/game-info-dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { MoveDto } from './dto/move-dto';
import { InvalidMoveException } from './error';
import { PlayService } from './service/play.service';
import { ServerEvents, PlayerInfo } from './types';

@UsePipes(new ValidationPipe({ transform: true }))
@WebSocketGateway({
  namespace: "/play",
  transports: ["websocket"],
  cors: {
    origin: [process.env.WEB_HOST],
    credentials: true
  },
})

export class PlayGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server<ServerEvents>

  constructor(
    private readonly playService: PlayService,
    private readonly usersService: UsersService
  ) { }

  async handleConnection(client: Socket<ServerEvents>, ...args: any[]) {
    //FIX: non authenticated users are still able to connect to gateway in short amount of time, during which they can send events.
    //They will be disconnected from the server eventually.
    const session = client.request['session'] as SessionData
    const sessionId = client.request['sessionID']
    if (!session || !session?.user || !sessionId) {
      client.disconnect(true);
      return;
    }
    const serverSession = await this.usersService.findSessionById(sessionId)
    if (!serverSession) {
      client.disconnect(true)
      return;
    }
    const activeSocket = await this.usersService.getActiveSocket(session.user.id)
    if (activeSocket && activeSocket !== client.id) {
      client.disconnect(true);
      return;
    }
    await this.usersService.setActiveSocket(session.user.id, client.id)
  }

  async handleDisconnect(@ConnectedSocket() client: Socket<ServerEvents>) {
    const session = client.request['session'] as SessionData
    if (!session.user) return;

    const activeSocket = await this.usersService.getActiveSocket(session.user.id)
    if (activeSocket === client.id) {
      await this.usersService.removeActiveSocket(session.user.id)
    }

    const room = await this.playService.playerLeftRoom(client.id)
    if (room) {
      if (room.players.length > 0) {
        client.to(room.id).emit("UPDATE_PLAYERS", room)
      }
      await client.leave(room.id)
    }
    const game = await this.playService.playerLeftGame(client.id)
    if (!game) return;
    this.server.to(game.roomId).emit("END_GAME", {
      id: game.id,
      whiteId: game.whiteId,
      blackId: game.blackId,
      whiteCards: game.whiteCards,
      blackCards: game.blackCards,
      boardPosition: game.boardPosition,
      whiteRemaining: game.whiteRemainingTime,
      blackRemaining: game.blackRemainingTime,
      endGame: game.endGame
    })
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage(SUB_CREATE_ROOM)
  async createRoom(@MessageBody() payload: GameInfoDto, @ConnectedSocket() client: Socket<ServerEvents>) {
    const userSess = client.request['session']['user']
    const player = { socketId: client.id, userId: userSess.id, username: userSess.username } as PlayerInfo
    const room = await this.playService.createPrivateRoom(player, payload)
    await client.join(room.id)
    client.emit("UPDATE_PLAYERS", room)
    return room
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage(SUB_JOIN_ROOM)
  async createOrJoinRoom(@MessageBody() payload: JoinRoomDto, @ConnectedSocket() client: Socket<ServerEvents>) {
    const userSess = client.request['session']['user']
    const player = { socketId: client.id, userId: userSess.id, username: userSess.username } as PlayerInfo
    const prevRoom = await this.playService.leftFromPrevRoom(player.socketId)
    if (prevRoom) {
      if (prevRoom.players.length > 0) {
        client.to(prevRoom.id).emit("UPDATE_PLAYERS", prevRoom)
      }
      await client.leave(prevRoom.id)
    }

    const room = await this.playService.joinRoom(player, payload.gameInfo, payload?.roomId)
    await client.join(room.id)
    this.server.to(room.id).emit("UPDATE_PLAYERS", room)
    if (room.isFull()) {
      const game = await this.playService.prepareGame(room.id, room.players, room.gameInfo)
      this.server.to(room.id).emit(
        "START_GAME",
        {
          id: game.id,
          whiteId: game.whiteId,
          blackId: game.blackId,
          whiteCards: game.whiteCards,
          blackCards: game.blackCards,
          boardPosition: game.boardPosition,
          turnId: game.turnId,
          gameTime: game.gameTime
        })
    }
    return room
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage(SUB_LEAVE_ROOM)
  async cancelJoinRoom(@ConnectedSocket() client: Socket<ServerEvents>) {
    const room = await this.playService.playerLeftRoom(client.id)
    if (!room) return;
    if (room.players.length > 0) {
      client.to(room.id).emit("UPDATE_PLAYERS", room)
    }
    await client.leave(room.id)
    return room
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage(SUB_MOVE)
  async movePiece(@MessageBody() movePayload: MoveDto, @ConnectedSocket() client: Socket<ServerEvents>) {
    const { gameId, playerId, from, to, selectedCard } = movePayload
    try {
      const game = await this.playService.movePiece(gameId, from, to, selectedCard, playerId)

      if (game.endGame) {
        return this.server.to(game.roomId).emit(
          "END_GAME",
          {
            id: game.id,
            whiteId: game.whiteId,
            blackId: game.blackId,
            whiteCards: game.whiteCards,
            blackCards: game.blackCards,
            boardPosition: game.boardPosition,
            whiteRemaining: game.whiteRemainingTime,
            blackRemaining: game.blackRemainingTime,
            endGame: game.endGame
          })
      }

      client.to(game.roomId).emit(
        "OPPONENT_MOVED",
        {
          type: "move",
          from: movePayload.from,
          to: movePayload.to,
          selectedCard: movePayload.selectedCard,
          replacedCard: game.getLastCard(playerId),
          whiteRemaining: game.whiteRemainingTime,
          blackRemaining: game.blackRemainingTime
        })

      client.emit('MOVE_CONFIRMED', {
        replacedCard: game.getLastCard(playerId),
        whiteRemaining: game.whiteRemainingTime,
        blackRemaining: game.blackRemainingTime
      })
    } catch (e) {
      if (e instanceof InvalidMoveException) {
        const { payload: game } = e
        client.emit(
          "MOVE_REJECTED",
          {
            id: game.id,
            whiteId: game.whiteId,
            blackId: game.blackId,
            whiteCards: game.whiteCards,
            blackCards: game.blackCards,
            boardPosition: game.boardPosition,
            turnId: game.turnId,
            whiteRemaining: game.whiteRemainingTime,
            blackRemaining: game.blackRemainingTime
          })
      }
    }
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage(SUB_PASS_TURN)
  async passTurn(@MessageBody() payload: { gameId: string, playerId: string }, @ConnectedSocket() client: Socket<ServerEvents>) {
    const { gameId, playerId } = payload
    try {
      const game = await this.playService.passTurn(gameId, playerId)
      client.to(game.roomId).emit("OPPONENT_MOVED", {
        type: "pass",
        whiteRemaining: game.whiteRemainingTime,
        blackRemaining: game.blackRemainingTime,
      })
    } catch (e) {
      if (e instanceof InvalidMoveException) {
        const { payload: game } = e
        client.emit(
          "MOVE_REJECTED",
          {
            id: game.id,
            whiteId: game.whiteId,
            blackId: game.blackId,
            whiteCards: game.whiteCards,
            blackCards: game.blackCards,
            boardPosition: game.boardPosition,
            turnId: game.turnId,
            whiteRemaining: game.whiteRemainingTime,
            blackRemaining: game.blackRemainingTime
          })
      }
    }
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage(SUB_CLAIM_OPPONENT_TIMEOUT)
  async confirmPlayerFlag(@MessageBody() gameId: string, @ConnectedSocket() client: Socket<ServerEvents>) {
    const game = await this.playService.hasGameEndedByFlag(gameId)
    if (game.endGame) {
      return this.server.to(game.roomId).emit(
        "END_GAME",
        {
          id: game.id,
          whiteId: game.whiteId,
          blackId: game.blackId,
          whiteCards: game.whiteCards,
          blackCards: game.blackCards,
          boardPosition: game.boardPosition,
          whiteRemaining: game.whiteRemainingTime,
          blackRemaining: game.blackRemainingTime,
          endGame: game.endGame
        }
      )
    }
    client.emit("TIMEOUT_REJECTED", { whiteRemaining: game.whiteRemainingTime, blackRemaining: game.blackRemainingTime })
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage(SUB_RESIGNATION)
  async confirmPlayerResign(@MessageBody() payload: { gameId: string, playerId: string }) {
    const { gameId, playerId } = payload
    const game = await this.playService.playerResigned(gameId, playerId)
    if (!game.endGame) throw new Error("error")
    return this.server.to(game.roomId).emit(
      "END_GAME",
      {
        id: game.id,
        whiteId: game.whiteId,
        blackId: game.blackId,
        whiteCards: game.whiteCards,
        blackCards: game.blackCards,
        boardPosition: game.boardPosition,
        whiteRemaining: game.whiteRemainingTime,
        blackRemaining: game.blackRemainingTime,
        endGame: game.endGame
      }
    )
  }


  @UseGuards(AuthGuard)
  @SubscribeMessage(SUB_REQUEST_REMATCH)
  async rematchRequest(@MessageBody() payload: { gameId: string, playerId: string }, @ConnectedSocket() client: Socket<ServerEvents>) {
    const { gameId, playerId } = payload
    const room = await this.playService.requestRematch(gameId, playerId)
    if (room.wantsRematch.length >= 2) {
      const game = await this.playService.prepareGame(room.id, room.players, room.gameInfo)
      return this.server.to(room.id).emit(
        "START_GAME",
        {
          id: game.id,
          whiteId: game.whiteId,
          blackId: game.blackId,
          whiteCards: game.whiteCards,
          blackCards: game.blackCards,
          boardPosition: game.boardPosition,
          turnId: game.turnId,
          gameTime: game.gameTime
        })
    }
    client.to(room.id).emit("OPPONENT_REMATCH")
  }
}
