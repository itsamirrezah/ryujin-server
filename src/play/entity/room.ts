import { nanoid } from 'nanoid'

export class Room {
  public readonly players: string[] = []
  public id: string;

  constructor(playerId: string) {
    this.id = nanoid(8)
    this.join(playerId)
  }

  join(clientId: string) {
    if (this.players.length >= 2) throw new Error('Room is full')
    this.players.push(clientId)
    return this;
  }

  isAvailable() {
    return this.players.length < 2
  }
}
