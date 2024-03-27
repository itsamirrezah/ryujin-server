import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/common/redis.service';
import { Game } from '../entity/game';
import { GameInfo, PlayerInfo } from '../types';

@Injectable()
export class GameService {

  constructor(private readonly redisService: RedisService) { }

  async create(roomId: string, players: PlayerInfo[], gameInfo: GameInfo): Promise<Game> {
    const newGame = Game.create(roomId, players, gameInfo)
    await this.redisService.client.set(`game:${newGame.roomId}:${newGame.id}`, JSON.stringify(newGame))
    return newGame
  }

  async getGameByRoom(roomId: string): Promise<Game> | undefined {
    const gameIds = await this.redisService.client.keys(`game:${roomId}:*`)
    if (gameIds.length <= 0) throw new Error("something went wrong")
    const stringifyGame = await this.redisService.client.get(gameIds[0])
    const parsedGame = JSON.parse(stringifyGame) as Game
    return new Game(parsedGame)
  }

  async getGameById(id: string): Promise<Game> {
    const gameIds = await this.redisService.client.keys(`game:*:${id}`)
    if (gameIds.length > 1 || gameIds.length <= 0) throw new Error("gameIds length error")
    const stringifyGame = await this.redisService.client.get(gameIds[0])
    const parsedGame = JSON.parse(stringifyGame) as Game
    return new Game(parsedGame)
  }

  async updateGameDb(game: Game) {
    await this.redisService.client.set(`game:${game.roomId}:${game.id}`, JSON.stringify(game))
  }

  async getGameByPlayer(playerId: string) {
    const gameIds = await this.redisService.client.keys(`game:*:*`)
    if (gameIds.length === 0) return;

    for (let i = 0; i < gameIds.length; i++) {
      const stringifyGame = await this.redisService.client.get(gameIds[i])
      const parsedGame = JSON.parse(stringifyGame) as Game
      const game = new Game(parsedGame)
      if (!game.hasEndGame() && game.hasPlayer(playerId)) return game
    }
    return;
  }

}
