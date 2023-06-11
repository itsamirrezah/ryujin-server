import { UsePipes, ValidationPipe } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from "socket.io";
import { CREATE_OR_JOIN_ROOM } from './consts';

@UsePipes(new ValidationPipe())
@WebSocketGateway({ namespace: 'play' })
export class PlayGateway {
  @WebSocketServer()
  server: Server

  @SubscribeMessage(CREATE_OR_JOIN_ROOM)
  createOrJoinRoom() {
    return "joined"
  }
}
