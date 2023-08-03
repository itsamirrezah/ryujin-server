import { nanoid } from 'nanoid'
import { PlayerInfo } from '../types';

export class Room {
  public readonly players: PlayerInfo[] = []
  public id: string;

  constructor(players: PlayerInfo[], id?: string) {
    if (!id) this.id = nanoid(8)
    else this.id = id
    if (players.length > 2) throw new Error('wrong number of players')
    this.players = players
  }

  join(player: PlayerInfo): Room {
    if (this.players.length >= 2) throw new Error('Room is full')
    this.players.push(player)
    return this;
  }

  isFull(): boolean {
    return this.players.length === 2
  }

  hasUser(playerId: string): boolean {
    return !!this.players.find(player => player.userId === playerId)
  }
}
