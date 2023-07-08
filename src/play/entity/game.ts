import { nanoid } from "nanoid";
import { Card, cards, DEFAULT_POSITION } from "../consts";
import { Position } from "../types";

export class Game {
  public id: string;
  public roomId: string;
  public turnColor: "w" | "b";
  public turnId: string;
  public whiteId: string;
  public blackId: string;
  public boardPosition: Position;
  public whiteCards = [] as Card[];
  public blackCards = [] as Card[];
  public reserveCards = [] as Card[];

  constructor(roomId: string, players: string[]) {
    this.id = nanoid(8)
    this.roomId = roomId
    this.turnColor = Math.random() > .5 ? "w" : "b"
    const [p1, p2] = players;
    this.whiteId = Math.random() > .5 ? p1 : p2
    this.blackId = this.whiteId === p1 ? p2 : p1
    this.turnId = this.turnColor === "w" ? this.whiteId : this.blackId
    this.boardPosition = DEFAULT_POSITION
    const allCards = [...cards]
    for (let i = 0; i < 4; i++) {
      const cIdx = Math.floor(Math.random() * 5)
      const card = allCards[cIdx]
      if (this.whiteCards.length < 2) this.whiteCards.push(card)
      else if (this.blackCards.length < 2) this.blackCards.push(card)
      allCards.splice(cIdx, 1)
    }
    this.reserveCards = allCards
  }

  hasRoom(roomId: string): boolean {
    return this.roomId === roomId
  }
}
