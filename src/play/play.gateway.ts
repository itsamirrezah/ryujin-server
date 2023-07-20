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
import { CREATE_OR_JOIN_ROOM, JOIN_ROOM, START_GAME } from './consts';
import { MoveDto } from './dto/move-dto';
import { InvalidMoveException } from './error';
import { PlayService } from './service/play.service';

//FIXME: add auth
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
  server: Server

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
  async movePiece(@MessageBody() movePayload: MoveDto, @ConnectedSocket() client: Socket) {
    const { roomId, playerId, from, to, selectedCard } = movePayload
    try {
      const game = this.playService.movePiece(roomId, from, to, selectedCard, playerId)
      this.server.to(roomId).emit("OPPONENT_MOVE", movePayload)
      this.server.to(roomId).emit("UPDATE_TIME", { white: game.whiteRemainingTime, black: game.blackRemainingTime })
    } catch (e) {
      if (e instanceof InvalidMoveException) {
        const { message, payload } = e
        client.emit("INVALID_MOVE", { message, payload })
      }
    }
  }
}
