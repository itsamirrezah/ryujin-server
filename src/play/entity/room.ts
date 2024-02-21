import { nanoid } from 'nanoid'
import { PlayerInfo } from '../types';

export class Room {
  public readonly players: PlayerInfo[] = []
  public id: string;
  public isPrivate: boolean
  public obsolote: boolean;
  public wantsRematch: string[] = []

  constructor(room: Partial<Room>) {
    this.id = room.id;
    this.players = room.players;
    this.isPrivate = room.isPrivate;
    this.obsolote = room.obsolote;
    this.wantsRematch = room.wantsRematch
  }

  static createNewRoom(player: PlayerInfo, isPrivate = false) {
    return new Room(
      {
        id: nanoid(8),
        players: [player],
        isPrivate,
        obsolote: false,
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

  isObsolote(): boolean {
    return this.obsolote
  }

  setPrivate() {
    this.isPrivate = true
    return this
  }

  hasUser(playerId: string): boolean {
    return !!this.players.find(player => player.socketId === playerId)
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
    const index = this.players.findIndex(p => p.userId === playerId)
    this.players.splice(index, 1)
    this.obsolote = true
    return this
  }
}
