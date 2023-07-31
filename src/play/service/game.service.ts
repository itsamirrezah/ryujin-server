import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/common/redis.service';
import { Card, Player } from '../consts';
import { Game } from '../entity/game';
import { InvalidMoveException } from '../error';
import { SquareType } from '../types';


@Injectable()
export class GameService {

  constructor(private readonly redisService: RedisService) { }

  async create(roomId: string, players: Player[]): Promise<Game> {
    const newGame = Game.createEmptyGame(roomId, players)
    await this.redisService.set(`game:${newGame.roomId}:${newGame.id}`, JSON.stringify(newGame))
    return newGame
  }
  async getGameByRoom(roomId: string): Promise<Game> | undefined {
    const gameIds = await this.redisService.keys(`game:${roomId}:*`)
    if (gameIds.length > 1 || gameIds.length <= 0) throw new Error("something went wrong")
    const stringifyGame = await this.redisService.get(gameIds[0])
    const parsedGame = JSON.parse(stringifyGame) as Game
    return new Game(parsedGame)
  }

  async movePiece(roomId: string, from: SquareType, to: SquareType, selectedCard: Card, playerId: string) {
    const game = await this.getGameByRoom(roomId)
    if (!!game.endGame) {
      throw new Error("game has ended")
    }
    const playerHasCard = game.playerHasCard(game.turnColor === "w" ? game.whiteCards : game.blackCards, selectedCard)
    const invalidMove = !game.playerHasTurn(playerId) || !game.squareHasPiece(from) || !playerHasCard
    if (invalidMove) throw new InvalidMoveException("invalid move", game)
    const updatedGame = game.movePiece(from, to)
      .subtituteWithDeck(selectedCard)
      .calculateRemainingTime()
      .checkEndgameByMove()
      .changeTurn()
    await this.redisService.set(`game:${updatedGame.roomId}:${updatedGame.id}`, JSON.stringify(updatedGame))
    return updatedGame
  }

  async isGameEndedByFlag(roomId: string) {
    const game = await this.getGameByRoom(roomId)
    if (!game) throw new Error("not found game")
    const updatedGame = game.calculateRemainingTime().checkEndgameByFlag()
    await this.redisService.set(`game:${updatedGame.roomId}:${updatedGame.id}`, JSON.stringify(updatedGame))
    return updatedGame
  }

}
