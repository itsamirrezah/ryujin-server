import { Injectable } from '@nestjs/common';
import { Game } from '../entity/game';

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
}
