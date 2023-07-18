import { Injectable } from '@nestjs/common';
import { Card } from '../consts';
import { Game } from '../entity/game';
import { InvalidMoveException } from '../error';
import { SquareType } from '../types';

//FIXME: use database 
const games = [] as Game[]

@Injectable()
export class GameService {
  create(roomId: string, players: string[]): Game {
    const newGame = new Game(roomId, players)
    games.push(newGame)
    return newGame
  }
  getGameByRoom(roomId: string): [Game, number] | undefined {
    const idx = games.findIndex(game => game.hasRoom(roomId))
    if (idx < 0) return;
    const game = games[idx]
    return [game, idx]
  }

  movePiece(idx: number, from: SquareType, to: SquareType, selectedCard: Card, playerId: string): Game {
    const game = games[idx]
    const playerHasCard = game.playerHasCard(game.turnColor === "w" ? game.whiteCards : game.blackCards, selectedCard)
    const invalidMove = !game.playerHasTurn(playerId) || !game.squareHasPiece(from) || !playerHasCard
    if (invalidMove) throw new InvalidMoveException("invalid move", game)

    const updatedGame = game.movePiece(from, to)
      .subtituteWithDeck(selectedCard)
      .calculateRemainingTime()
      .changeTurn()
    games[idx] = updatedGame
    return updatedGame
  }

}
