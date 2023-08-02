import { Injectable } from '@nestjs/common';
import { Card, Player } from '../consts';
import { Game } from '../entity/game';
import { Room } from '../entity/room';
import { InvalidMoveException } from '../error';
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
    const game = await this.gameService.getGameByRoom(roomId)
    if (!game) throw new Error("no game found")
    if (game.endGame) {
      throw new InvalidMoveException("game over", game)
    }

    let updatedGame = game.calculateRemainingTime().checkEndgameByFlag()
    if (updatedGame.endGame) {
      await this.gameService.updateGameDb(updatedGame)
      throw new InvalidMoveException("game over", updatedGame)
    }

    if (game.isInvalidMove(playerId, selectedCard, from)) throw new InvalidMoveException("invalid move", game)

    updatedGame = game.movePiece(from, to)
      .subtituteWithDeck(selectedCard)
      .checkEndgameByMove()
      .changeTurn()
    await this.gameService.updateGameDb(updatedGame)
    return updatedGame
  }

  async hasGameEndedByFlag(roomId: string) {
    const game = await this.gameService.getGameByRoom(roomId)
    if (!game) throw new Error("not found game")
    if (game.endGame) return game
    const updatedGame = game.calculateRemainingTime().checkEndgameByFlag()
    await this.gameService.updateGameDb(updatedGame)
    return updatedGame
  }
}
