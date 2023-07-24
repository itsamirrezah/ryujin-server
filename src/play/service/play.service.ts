import { Injectable } from '@nestjs/common';
import { Card } from '../consts';
import { Game } from '../entity/game';
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

  async joinRoom(clientId: string): Promise<Room> {
    return this.roomService.joinRoom(clientId)
  }

  prepareGame(roomId: string, players: string[]): Promise<Game> {
    return this.gameService.create(roomId, players)
  }

  async movePiece(roomId: string, from: SquareType, to: SquareType, selectedCard: Card, playerId: string) {
    return this.gameService.movePiece(roomId, from, to, selectedCard, playerId)
  }
}
