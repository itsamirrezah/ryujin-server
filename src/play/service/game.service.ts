import { Injectable } from '@nestjs/common';
import { Game } from '../entity/game';
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
  getGameByRoom(roomId: string): Game | undefined {
    return games.find(game => game.hasRoom(roomId))
  }

  movePiece(roomId: string, from: SquareType, to: SquareType) {
    const idx = games.findIndex(g => g.roomId === roomId)
    if (idx < 0) throw new Error("game not found")
    let game = games[idx]
    game = game.move(from, to)
    games[idx] = game
    return game
  }

}
