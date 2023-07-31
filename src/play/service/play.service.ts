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
    const playerHasCard = game.playerHasCard(game.turnColor === "w" ? game.whiteCards : game.blackCards, selectedCard)
    const invalidMove = !game.playerHasTurn(playerId) || !game.squareHasPiece(from) || !playerHasCard
    if (invalidMove) throw new InvalidMoveException("invalid move", game)

    const updatedGame = game.movePiece(from, to)
      .subtituteWithDeck(selectedCard)
      .calculateRemainingTime()
      .checkEndgameByMove()
      .changeTurn()
    await this.gameService.updateGameDb(updatedGame)
    return updatedGame
  }

  async hasGameEndedByFlag(roomId: string) {
    const game = await this.gameService.getGameByRoom(roomId)
    if (!game) throw new Error("not found game")
    const updatedGame = game.calculateRemainingTime().checkEndgameByFlag()
    await this.gameService.updateGameDb(updatedGame)
    return updatedGame
  }
}
