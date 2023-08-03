import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/common/redis.service';
import { Game } from '../entity/game';
import { PlayerInfo } from '../types';

@Injectable()
export class GameService {

  constructor(private readonly redisService: RedisService) { }

  async create(roomId: string, players: PlayerInfo[]): Promise<Game> {
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

  async updateGameDb(game: Game) {
    await this.redisService.set(`game:${game.roomId}:${game.id}`, JSON.stringify(game))
  }
}
