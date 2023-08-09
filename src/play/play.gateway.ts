import { UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from "socket.io";
import { UsersService } from 'src/users/users.service';
import { SUB_JOIN_ROOM, SUB_MOVE, SUB_FLAG, SUB_RESIGNATION, SUB_CREATE_ROOM, SUB_PASS, SUB_REMATCH } from './consts';
import { JoinRoomDto } from './dto/join-room.dto';
import { MoveDto } from './dto/move-dto';
import { InvalidMoveException } from './error';
import { PlayService } from './service/play.service';
import { ServerEvents, PlayerInfo } from './types';

@UsePipes(new ValidationPipe())
@WebSocketGateway({
  namespace: 'play',
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

  async handleConnection(client: Socket, ...args: any[]) {
    //FIX: non authenticated users are still able to connect to gateway in short amount of time, during which they can send events.
    //They will be disconnected from the server eventually.
    const user = client.request['session']['user']
    if (!user) {
      client.disconnect();
      return;
    }
    const userIsExist = await this.usersService.findOne({ id: user.id })
    if (!userIsExist) client.disconnect()
  }

  async handleDisconnect(client: Socket) {
    const user = client.request['session']['user']
    if (!user) return;
    const game = await this.playService.playerLeft(client.id)
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

  @SubscribeMessage(SUB_CREATE_ROOM)
  async createRoom(client: Socket<ServerEvents>) {
    const userSess = client.request['session']['user']
    const player = { socketId: client.id, userId: userSess.id, username: userSess.username } as PlayerInfo
    const room = await this.playService.createPrivateRoom(player)
    await client.join(room.id)
    client.emit("JOIN_ROOM", room)
  }

  @SubscribeMessage(SUB_JOIN_ROOM)
  async createOrJoinRoom(@MessageBody() payload: JoinRoomDto, @ConnectedSocket() client: Socket) {
    const userSess = client.request['session']['user']
    const player = { socketId: client.id, userId: userSess.id, username: userSess.username } as PlayerInfo
    const room = await this.playService.joinRoom(player, payload?.roomId)
    await client.join(room.id)
    this.server.to(room.id).emit("JOIN_ROOM", room)
    if (room.isFull()) {
      const game = await this.playService.prepareGame(room.id, room.players)
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
  }

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
      client.emit('ACK_MOVE', {
        replacedCard: game.getLastCard(playerId),
        whiteRemaining: game.whiteRemainingTime,
        blackRemaining: game.blackRemainingTime
      })
    } catch (e) {
      if (e instanceof InvalidMoveException) {
        const { payload: game } = e
        client.emit(
          "REJ_MOVE",
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

  @SubscribeMessage(SUB_PASS)
  async passTurn(@MessageBody() payload: { gameId: string, playerId: string }, @ConnectedSocket() client: Server<ServerEvents>) {
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
          "REJ_MOVE",
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

  @SubscribeMessage(SUB_FLAG)
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
    client.emit("REJ_FLAG", { whiteRemaining: game.whiteRemainingTime, blackRemaining: game.blackRemainingTime })
  }

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


  @SubscribeMessage(SUB_REMATCH)
  async rematchRequest(@MessageBody() payload: { gameId: string, playerId: string }, @ConnectedSocket() client: Socket<ServerEvents>) {
    const { gameId, playerId } = payload
    const room = await this.playService.requestRematch(gameId, playerId)
    if (room.wantsRematch.length >= 2) {
      const game = await this.playService.prepareGame(room.id, room.players)
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
