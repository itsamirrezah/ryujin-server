import { nanoid } from "nanoid";
import { Card, cards, DEFAULT_POSITION } from "../consts";
import { Position, SquareType } from "../types";

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

  changeTurn() {
    this.turnColor = this.turnColor === "w" ? "b" : "w"
    this.turnId = this.turnId === this.whiteId ? this.blackId : this.whiteId
    return this
  }

  subtituteWithDeck(card: Card) {
    const turnCards = this.turnColor === "w" ? this.whiteCards : this.blackCards
    const idx = turnCards.findIndex(c => c.name === card.name)
    if (idx < 0) throw new Error("wrong selected card")
    turnCards.splice(idx, 1)
    turnCards.push(this.reserveCards[0])
    this.reserveCards.splice(0, 1)
    this.reserveCards.push(card)
    return this
  }

  move(from: SquareType, to: SquareType, selectedCard: Card) {
    this.boardPosition[to] = this.boardPosition[from]
    delete this.boardPosition[from]
    this.subtituteWithDeck(selectedCard)
    this.changeTurn()
    return this
  }
}
