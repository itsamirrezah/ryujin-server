import { UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from "socket.io";
import { UsersService } from 'src/users/users.service';
import { SUB_JOIN_ROOM, SUB_MOVE, SUB_FLAG, SUB_RESIGNATION } from './consts';
import { MoveDto } from './dto/move-dto';
import { InvalidMoveException } from './error';
import { PlayService } from './service/play.service';
import { ServerEvents, PlayerInfo } from './types';

@UsePipes(new ValidationPipe())
@WebSocketGateway({
  namespace: 'play',
  cors: {
    origin: ["http://localhost:3000"],
    credentials: true
  },
})
export class PlayGateway implements OnGatewayConnection {
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

  @SubscribeMessage(SUB_JOIN_ROOM)
  async createOrJoinRoom(client: Socket) {
    const userSess = client.request['session']['user']
    const player = { socketId: client.id, userId: userSess.id, username: userSess.username } as PlayerInfo
    const room = await this.playService.joinRoom(player)
    await client.join(room.id)
    this.server.to(room.id).emit("JOIN_ROOM", room)
    if (room.isFull()) {
      const game = await this.playService.prepareGame(room.id, room.players)
      this.server.to(room.id).emit(
        "START_GAME",
        {
          whiteId: game.whiteId,
          blackId: game.blackId,
          whiteCards: game.whiteCards,
          blackCards: game.blackCards,
          reserveCards: game.reserveCards,
          boardPosition: game.boardPosition,
          turnId: game.turnId,
          gameTime: game.gameTime
        })
    }
  }

  @SubscribeMessage(SUB_MOVE)
  async movePiece(@MessageBody() movePayload: MoveDto, @ConnectedSocket() client: Socket<ServerEvents>) {
    const { roomId, playerId, from, to, selectedCard } = movePayload
    try {
      const game = await this.playService.movePiece(roomId, from, to, selectedCard, playerId)

      if (game.endGame) {
        return this.server.to(roomId).emit(
          "END_GAME",
          {
            whiteId: game.whiteId,
            blackId: game.blackId,
            whiteCards: game.whiteCards,
            blackCards: game.blackCards,
            reserveCards: game.reserveCards,
            boardPosition: game.boardPosition,
            whiteRemaining: game.whiteRemainingTime,
            blackRemaining: game.blackRemainingTime,
            endGame: game.endGame
          })
      }

      client.to(roomId).emit(
        "OPPONENT_MOVED",
        {
          from: movePayload.from,
          to: movePayload.to,
          selectedCard: movePayload.selectedCard,
          whiteRemaining: game.whiteRemainingTime,
          blackRemaining: game.blackRemainingTime
        })
      client.emit('ACK_MOVE', { whiteRemaining: game.whiteRemainingTime, blackRemaining: game.blackRemainingTime })
    } catch (e) {
      if (e instanceof InvalidMoveException) {
        const { payload: game } = e
        client.emit(
          "REJ_MOVE",
          {
            whiteId: game.whiteId,
            blackId: game.blackId,
            whiteCards: game.whiteCards,
            blackCards: game.blackCards,
            reserveCards: game.reserveCards,
            boardPosition: game.boardPosition,
            turnId: game.turnId,
            whiteRemaining: game.whiteRemainingTime,
            blackRemaining: game.blackRemainingTime
          })
      }
    }
  }

  @SubscribeMessage(SUB_FLAG)
  async confirmPlayerFlag(@MessageBody() roomId: string, @ConnectedSocket() client: Socket<ServerEvents>) {
    const game = await this.playService.hasGameEndedByFlag(roomId)
    if (game.endGame) {
      return this.server.to(roomId).emit(
        "END_GAME",
        {
          whiteId: game.whiteId,
          blackId: game.blackId,
          whiteCards: game.whiteCards,
          blackCards: game.blackCards,
          reserveCards: game.reserveCards,
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
  async confirmPlayerResign(@MessageBody() payload: { roomId: string, playerId: string }) {
    const { roomId, playerId } = payload
    const game = await this.playService.playerResigned(roomId, playerId)
    if (!game.endGame) throw new Error("error")
    return this.server.to(roomId).emit(
      "END_GAME",
      {
        whiteId: game.whiteId,
        blackId: game.blackId,
        whiteCards: game.whiteCards,
        blackCards: game.blackCards,
        reserveCards: game.reserveCards,
        boardPosition: game.boardPosition,
        whiteRemaining: game.whiteRemainingTime,
        blackRemaining: game.blackRemainingTime,
        endGame: game.endGame
      }
    )
  }
}
