import { nanoid } from 'nanoid'
import { PlayerInfo } from '../types';

export class Room {
  public readonly players: PlayerInfo[] = []
  public id: string;
  public isPrivate: boolean

  constructor(room: Partial<Room>) {
    this.id = room.id;
    this.players = room.players;
    this.isPrivate = room.isPrivate
  }

  static createNewRoom(player: PlayerInfo, isPrivate = false) {
    return new Room(
      {
        id: nanoid(8),
        players: [player],
        isPrivate
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

  setPrivate() {
    this.isPrivate = true
    return this
  }

  hasUser(playerId: string): boolean {
    return !!this.players.find(player => player.userId === playerId)
  }
}
