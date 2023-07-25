import { nanoid } from "nanoid";
import { Card, Player, cards, DEFAULT_POSITION } from "../consts";
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
  public gameTime: number
  public whiteRemainingTime: number
  public blackRemainingTime: number
  public lastTurnChangedTime: number

  constructor(game: Partial<Game>) {
    this.id = game.id
    this.roomId = game.roomId
    this.turnColor = game.turnColor
    this.whiteId = game.whiteId
    this.blackId = game.blackId
    this.turnId = game.turnId
    this.boardPosition = game.boardPosition
    this.whiteCards = game.whiteCards
    this.blackCards = game.blackCards
    this.reserveCards = game.reserveCards
    this.gameTime = game.gameTime
    this.whiteRemainingTime = game.whiteRemainingTime
    this.blackRemainingTime = game.blackRemainingTime
    this.lastTurnChangedTime = game.lastTurnChangedTime
  }

  static createEmptyGame(roomId: string, players: Player[]) {
    const id = nanoid(8)
    const turnColor = Math.random() > .5 ? "w" : "b"
    const [p1, p2] = players;
    const whiteId = Math.random() > .5 ? p1.socketId : p2.socketId
    const blackId = whiteId === p1.socketId ? p2.socketId : p1.socketId
    const turnId = turnColor === "w" ? whiteId : blackId
    const boardPosition = DEFAULT_POSITION
    const [wCards, bCards, deck] = this.shuffleCards(cards)
    const whiteCards = wCards
    const blackCards = bCards
    const reserveCards = deck
    const gameTime = 10000
    const whiteRemainingTime = gameTime
    const blackRemainingTime = gameTime
    const lastTurnChangedTime = new Date().getTime()
    return new Game({
      id,
      roomId,
      turnColor,
      whiteId,
      blackId,
      turnId,
      boardPosition,
      whiteCards,
      blackCards,
      reserveCards,
      gameTime,
      whiteRemainingTime,
      blackRemainingTime,
      lastTurnChangedTime
    })
  }

  static shuffleCards(allCards: Card[]) {
    const deck = [...allCards]
    const wCards: Card[] = []
    const bCards: Card[] = []

    for (let i = 0; i < 4; i++) {
      const randomNumber = Math.random()
      const selectedIdx = Math.floor(randomNumber * deck.length)
      const card = deck[selectedIdx]
      if (wCards.length < 2) wCards.push(card)
      else if (bCards.length < 2) bCards.push(card)
      deck.splice(selectedIdx, 1)
    }
    return [
      wCards as [Card, Card],
      bCards as [Card, Card],
      deck.sort(() => Math.random() < 0.5 ? 1 : -1)
    ] as const
  }

  hasRoom(roomId: string): boolean {
    return this.roomId === roomId
  }
  squareHasPiece(square: SquareType): boolean {
    return !!this.boardPosition[square]
  }

  playerHasCard(playerCards: Card[], card: Card) {
    return !!playerCards.find(c => c.name === card.name)
  }

  playerHasTurn(playerId: string) {
    return this.turnId === playerId
  }

  changeTurn() {
    this.turnColor = this.turnColor === "w" ? "b" : "w"
    this.turnId = this.turnId === this.whiteId ? this.blackId : this.whiteId
    return this
  }

  subtituteWithDeck(card: Card) {
    const turnCards = this.turnColor === "w" ? this.whiteCards : this.blackCards
    const idx = turnCards.findIndex(c => c.name === card.name)
    turnCards.splice(idx, 1)
    turnCards.push(this.reserveCards[0])
    this.reserveCards.splice(0, 1)
    this.reserveCards.push(card)
    return this
  }

  calculateRemainingTime() {
    const now = new Date().getTime()
    const spendTime = now - this.lastTurnChangedTime
    if (this.turnColor === "w") this.whiteRemainingTime -= spendTime
    else this.blackRemainingTime -= spendTime
    this.lastTurnChangedTime = now
    return this
  }

  movePiece(from: SquareType, to: SquareType) {
    this.boardPosition[to] = this.boardPosition[from]
    delete this.boardPosition[from]
    return this
  }
}
