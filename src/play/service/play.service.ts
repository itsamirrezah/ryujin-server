import { Injectable } from '@nestjs/common';
import { Card, Player } from '../consts';
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

  async joinRoom(player: Player): Promise<Room> {
    return this.roomService.joinRoom(player)
  }

  prepareGame(roomId: string, players: Player[]): Promise<Game> {
    return this.gameService.create(roomId, players)
  }

  async movePiece(roomId: string, from: SquareType, to: SquareType, selectedCard: Card, playerId: string) {
    return this.gameService.movePiece(roomId, from, to, selectedCard, playerId)
  }
}
