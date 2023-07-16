import { UsePipes, ValidationPipe } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from "socket.io";
import { CREATE_OR_JOIN_ROOM, JOIN_ROOM, START_GAME } from './consts';
import { MoveDto } from './dto/move-dto';
import { PlayService } from './service/play.service';

//FIXME: add auth
@UsePipes(new ValidationPipe())
@WebSocketGateway({ namespace: 'play', cors: true })
export class PlayGateway {
  @WebSocketServer()
  server: Server

  constructor(private readonly playService: PlayService) { }

  @SubscribeMessage(CREATE_OR_JOIN_ROOM)
  async createOrJoinRoom(client: Socket) {
    const room = this.playService.joinRoom(client.id)
    await client.join(room.id)
    this.server.to(room.id).emit(JOIN_ROOM, room)
    if (room.isFull()) {
      const game = this.playService.prepareGame(room.id, room.players)
      this.server.to(room.id).emit(START_GAME, game)
    }
  }

  @SubscribeMessage("MOVE")
  async movePiece(@MessageBody() movePayload: MoveDto) {
    const { roomId, playerId, from, to, selectedCard } = movePayload
    const game = this.playService.movePiece(playerId, roomId, from, to, selectedCard)
    this.server.to(roomId).emit("OPPONENT_MOVE", movePayload)
    this.server.to(roomId).emit("UPDATE_TIME", { white: game.whiteRemainingTime, black: game.blackRemainingTime })
  }
}
