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

  async leftFromPrevRoom(playerId: string): Promise<Room> {
    const room = await this.roomService.getRoomByPlayerId(playerId)
    if (!room) return;
    const updatedRoom = room.playerLeft(playerId)
    await this.roomService.updateRoomDb(updatedRoom)
    return updatedRoom
  }

  async joinRoom(player: PlayerInfo, roomId?: string): Promise<Room> {
    if (!roomId)
      return await this.roomService.joinRoom(player)
    const room = await this.roomService.getRoomById(roomId)
    if (room.isObsolote()) throw new Error("Room is no longer in used")
    if (room.hasUser(player.socketId)) throw new Error("already join in room")
    if (!room) throw new Error("room not found")
    const updatedRoom = room.join(player)
    await this.roomService.updateRoomDb(updatedRoom)
    return updatedRoom
  }

  async prepareGame(roomId: string, players: PlayerInfo[]): Promise<Game> {
    const updatedRoom = (await this.roomService.getRoomById(roomId)).resetRematch()
    await this.roomService.updateRoomDb(updatedRoom)
    return this.gameService.create(updatedRoom.id, players)
  }

  async movePiece(gameId: string, from: SquareType, to: SquareType, selectedCard: CardType, playerId: string) {
    const game = await this.gameService.getGameById(gameId)
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

  async passTurn(gameId: string, playerId: string) {
    const game = await this.gameService.getGameById(gameId)
    if (!game) throw new Error("no game found")
    if (game.endGame) {
      throw new InvalidMoveException("game over", game)
    }
    let updatedGame = game.calculateRemainingTime().checkEndgameByFlag()
    if (updatedGame.endGame) {
      await this.gameService.updateGameDb(updatedGame)
      throw new InvalidMoveException("game over", updatedGame)
    }

    if (!updatedGame.playerHasTurn(playerId) || !updatedGame.isValidToPassTurn(playerId)) throw new InvalidMoveException("cannot pass turn", updatedGame)

    updatedGame = updatedGame.changeTurn()
    await this.gameService.updateGameDb(updatedGame)

    return updatedGame
  }
  async hasGameEndedByFlag(gameId: string) {
    const game = await this.gameService.getGameById(gameId)
    if (!game) throw new Error("not found game")
    if (game.endGame) return game
    const updatedGame = game.calculateRemainingTime().checkEndgameByFlag()
    await this.gameService.updateGameDb(updatedGame)
    return updatedGame
  }

  //FIXME: check if playerId is a valid player or not.
  async playerResigned(gameId: string, playerId: string) {
    const game = await this.gameService.getGameById(gameId)
    if (!game) throw new Error("game not found")
    if (game.endGame) return game
    const updatedGame = game.calculateRemainingTime()
      .checkEndgameByFlag()
      .resign(playerId)
    await this.gameService.updateGameDb(updatedGame)
    return updatedGame
  }

  async requestRematch(gameId: string, playerId: string) {
    const game = await this.gameService.getGameById(gameId)
    if (!game.hasEndGame()) throw new Error("game is not ended")
    const room = await this.roomService.getRoomById(game.roomId)
    const updatedRoom = room.setRematch(playerId)
    await this.roomService.updateRoomDb(updatedRoom)
    return updatedRoom
  }

  async playerLeftRoom(socketId: string): Promise<Room> | undefined {
    const room = await this.roomService.getRoomByPlayerId(socketId)
    if (!room) {
      return;
    }
    room.playerLeft(socketId)
    await this.roomService.updateRoomDb(room)
    return room
  }

  async playerLeftGame(socketId: string): Promise<Game> {
    const game = await this.gameService.getGameByPlayer(socketId)
    if (!game) return;

    const updatedGame = game.playerLeft(socketId).calculateRemainingTime()
    await this.gameService.updateGameDb(updatedGame)
    return updatedGame
  }

  async isRoomAvailable(roomId: string) {
    const room = await this.roomService.getRoomById(roomId)
    const isAvailable = !room.isFull() && !room.isObsolote() && room.players.length > 0
    if (!isAvailable) throw new Error("not available")
    return room
  }
}
