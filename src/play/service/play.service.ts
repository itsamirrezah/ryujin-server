import { Injectable } from '@nestjs/common';
import { Game } from '../entity/game';
import { Room } from '../entity/room';
import { InvalidMoveException } from '../error';
import { SquareType, CardType, PlayerInfo } from '../types';
import { GameService } from './game.service';
import { RoomService } from './room.service';

@Injectable()
export class PlayService {
  constructor(
    private readonly roomService: RoomService,
    private readonly gameService: GameService
  ) { }

  async createPrivateRoom(player: PlayerInfo) {
    const room = (await this.roomService.createRoom(player)).setPrivate()
    await this.roomService.updateRoomDb(room)
    return room
  }

  async joinRoom(player: PlayerInfo, roomId?: string): Promise<Room> {
    if (!roomId)
      return await this.roomService.joinRoom(player)
    const room = await this.roomService.getRoomById(roomId)
    if (room.hasUser(player.socketId)) throw new Error("already join in room")
    if (!room) throw new Error("room not found")
    const updatedRoom = room.join(player)
    await this.roomService.updateRoomDb(updatedRoom)
    return updatedRoom
  }

  prepareGame(roomId: string, players: PlayerInfo[]): Promise<Game> {
    return this.gameService.create(roomId, players)
  }

  async movePiece(roomId: string, from: SquareType, to: SquareType, selectedCard: CardType, playerId: string) {
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

  //FIXME: check if playerId is a valid player or not.
  async playerResigned(roomId: string, playerId: string) {
    const game = await this.gameService.getGameByRoom(roomId)
    if (!game) throw new Error("game not found")
    if (game.endGame) return game
    const updatedGame = game.calculateRemainingTime()
      .checkEndgameByFlag()
      .resign(playerId)
    await this.gameService.updateGameDb(updatedGame)
    return updatedGame

  }
}
