import { Injectable } from '@nestjs/common';
import { Room } from '../entity/room';
import { SquareType } from '../types';
import { GameService } from './game.service';
import { RoomService } from './room.service';

@Injectable()
export class PlayService {
  constructor(
    private readonly roomService: RoomService,
    private readonly gameService: GameService
  ) { }

  joinRoom(clientId: string): Room {
    const userRoom = this.roomService.getRoomByUser(clientId)
    if (userRoom) return userRoom
    const availableRoom = this.roomService.getAvailableRoom()
    if (availableRoom) {
      availableRoom.join(clientId)
      return availableRoom
    }
    return this.roomService.createRoom(clientId)
  }

  prepareGame(roomId: string, players: string[]) {
    const game = this.gameService.getGameByRoom(roomId)
    if (game) return game
    return this.gameService.create(roomId, players)
  }

  movePiece(player: string, roomId: string, from: SquareType, to: SquareType) {
    return this.gameService.movePiece(roomId, from, to)
  }
}

