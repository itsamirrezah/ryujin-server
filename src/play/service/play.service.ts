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

  prepareGame(roomId: string, players: string[]): Game {
    const game = this.gameService.getGameByRoom(roomId)
    if (!game) return this.gameService.create(roomId, players)
    return game[0]
  }

  movePiece(roomId: string, from: SquareType, to: SquareType, selectedCard: Card, playerId: string) {
    const game = this.gameService.getGameByRoom(roomId)
    if (!game) throw new Error("game not found")
    const [, idx] = game
    return this.gameService.movePiece(idx, from, to, selectedCard, playerId)
  }
}
