import { nanoid } from 'nanoid'

export class Room {
  public readonly players: string[] = []
  public id: string;

  constructor(players: string[], id?: string) {
    if (!id) this.id = nanoid(8)
    else this.id = id
    if (players.length > 2) throw new Error('wrong number of players')
    this.players = players
  }

  join(clientId: string): Room {
    if (this.players.length >= 2) throw new Error('Room is full')
    this.players.push(clientId)
    return this;
  }

  isFull(): boolean {
    return this.players.length === 2
  }

  hasUser(clientId: string): boolean {
    return this.players.includes(clientId)
  }
}
