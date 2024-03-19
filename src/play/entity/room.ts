import { nanoid } from 'nanoid'
import { GameInfo, PlayerInfo } from '../types';

export class Room {
  public id: string;
  public readonly players: PlayerInfo[] = []
  public gameInfo: GameInfo
  public isPrivate: boolean
  public obsolete: boolean;
  public wantsRematch: string[] = []

  constructor(room: Partial<Room>) {
    this.id = room.id;
    this.players = room.players;
    this.isPrivate = room.isPrivate;
    this.gameInfo = room.gameInfo;
    this.obsolete = room.obsolete;
    this.wantsRematch = room.wantsRematch
  }

  static create(player: PlayerInfo, gameInfo: GameInfo, isPrivate = false) {
    return new Room(
      {
        id: nanoid(8),
        players: [player],
        gameInfo,
        isPrivate,
        obsolete: false,
        wantsRematch: []
      }
    )
  }

  join(player: PlayerInfo): Room {
    if (this.players.length >= 2) throw new Error('Room is full')
    this.players.push(player)
    return this;
  }

  isFull(): boolean {
    return this.players.length === 2
  }

  isObsolete(): boolean {
    return this.obsolete
  }

  setPrivate() {
    this.isPrivate = true
    return this
  }

  hasUser(socketId: string): boolean {
    return !!this.players.find(player => player.socketId === socketId)
  }

  hasUserId(userId: string): boolean {
    return !!this.players.find(player => player.userId === userId)
  }

  setRematch(playerId: string) {
    if (!this.wantsRematch.includes(playerId)) this.wantsRematch.push(playerId)
    return this
  }

  resetRematch() {
    this.wantsRematch = []
    return this
  }

  playerLeft(playerId: string) {
    const index = this.players.findIndex(p => p.socketId === playerId)
    if (index < 0) return this;
    this.players.splice(index, 1)
    this.obsolete = true
    return this
  }

}
