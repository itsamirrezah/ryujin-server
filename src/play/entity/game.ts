import { nanoid } from "nanoid";
import { cards, DEFAULT_POSITION } from "../consts";
import { CardType, PlayerInfo, EndGame } from "../types";
import { PieceType, Position, SquareType } from "../types";

export class Game {
  public id: string;
  public roomId: string;
  public turnColor: "w" | "b";
  public turnId: string;
  public whiteId: string;
  public blackId: string;
  public boardPosition: Position;
  public whiteCards = [] as CardType[];
  public blackCards = [] as CardType[];
  public reserveCards = [] as CardType[];
  public gameTime: number
  public whiteRemainingTime: number
  public blackRemainingTime: number
  public lastTurnChangedTime: number
  public endGame?: EndGame

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
    this.endGame = game.endGame
  }

  static createEmptyGame(roomId: string, players: PlayerInfo[]) {
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

  static shuffleCards(allCards: CardType[]) {
    const deck = [...allCards]
    const wCards: CardType[] = []
    const bCards: CardType[] = []

    for (let i = 0; i < 4; i++) {
      const randomNumber = Math.random()
      const selectedIdx = Math.floor(randomNumber * deck.length)
      const card = deck[selectedIdx]
      if (wCards.length < 2) wCards.push(card)
      else if (bCards.length < 2) bCards.push(card)
      deck.splice(selectedIdx, 1)
    }
    return [
      wCards as [CardType, CardType],
      bCards as [CardType, CardType],
      deck.sort(() => Math.random() < 0.5 ? 1 : -1)
    ] as const
  }

  hasRoom(roomId: string): boolean {
    return this.roomId === roomId
  }
  squareHasPiece(square: SquareType): boolean {
    return !!this.boardPosition[square]
  }

  playerHasCard(playerCards: CardType[], card: CardType) {
    return !!playerCards.find(c => c.name === card.name)
  }

  playerHasTurn(playerId: string) {
    return this.turnId === playerId
  }

  changeTurn() {
    if (this.endGame) return this
    this.turnColor = this.turnColor === "w" ? "b" : "w"
    this.turnId = this.turnId === this.whiteId ? this.blackId : this.whiteId
    return this
  }

  subtituteWithDeck(card: CardType) {
    if (this.endGame) return this
    const turnCards = this.turnColor === "w" ? this.whiteCards : this.blackCards
    const idx = turnCards.findIndex(c => c.name === card.name)
    turnCards.splice(idx, 1)
    turnCards.push(this.reserveCards[0])
    this.reserveCards.splice(0, 1)
    this.reserveCards.push(card)
    return this
  }

  calculateRemainingTime() {
    if (this.endGame) return this
    const now = new Date().getTime()
    const spendTime = now - this.lastTurnChangedTime
    if (this.turnColor === "w") this.whiteRemainingTime -= spendTime
    else this.blackRemainingTime -= spendTime
    this.lastTurnChangedTime = now
    return this
  }

  movePiece(from: SquareType, to: SquareType) {
    if (this.endGame) return this
    this.boardPosition[to] = this.boardPosition[from]
    delete this.boardPosition[from]
    return this
  }

  private pieceExist(piece: PieceType) {
    return !!Object.values(this.boardPosition).find(p => p === piece)
  }

  checkEndgameByFlag() {
    if (this.endGame) return this

    if (this.whiteRemainingTime <= 0) {
      this.endGame = !this.pieceExist("bK")
        ? { result: "draw", "by": "insufficent material" }
        : { result: "won", playerWon: this.blackId, playerWonColor: "b", by: "time" }
    }
    else if (this.blackRemainingTime <= 0) {
      this.endGame = !this.pieceExist("wK")
        ? { result: "draw", "by": "insufficent material" }
        : { result: "won", playerWon: this.whiteId, playerWonColor: "w", by: "time" }
    }
    return this
  }

  private checkKingConquer(king: "wK" | "bK") {
    const temple = king[0] === "w" ? "c5" : "c1"
    if (!this.pieceExist(king)) return false
    return this.boardPosition[temple] === king
  }

  private hasBothKingsRemoved() {
    return !this.pieceExist("wK") && !this.pieceExist("bK")
  }

  checkEndgameByMove() {
    if (this.endGame) return this
    const king = `${this.turnColor}K` as "wK" | "bK"
    if (this.checkKingConquer(king)) {
      this.endGame = { result: "won", by: "conquer temple", playerWon: this.turnId, playerWonColor: this.turnColor }
    } else if (this.hasBothKingsRemoved()) {
      this.endGame = { result: "draw", by: "insufficent material" }
    }
    return this
  }

  isInvalidMove(playerId: string, selectedCard: CardType, from: SquareType) {
    const playerHasCard = this.playerHasCard(this.turnColor === "w" ? this.whiteCards : this.blackCards, selectedCard)
    return !this.playerHasTurn(playerId) || !this.squareHasPiece(from) || !playerHasCard
  }

  private getCardOptions(
    sourceSquare: SquareType,
    card: CardType,
    moveAs: "w" | "b",
  ): SquareType[] {
    const COLUMNS = "abcde".split("")
    const deltaOptions = card.delta
    const options = [] as SquareType[]

    for (let i = 0; i < deltaOptions.length; i++) {
      const delta = deltaOptions[i]
      const currentCol = COLUMNS.findIndex(col => col === sourceSquare[0])
      const currentRow = parseInt(sourceSquare[1])
      const destCol = COLUMNS[currentCol + (moveAs === "w" ? delta.x : delta.x * -1)]
      const destRow = currentRow + (moveAs === "w" ? delta.y * -1 : delta.y);
      const outOfBound = !destCol || !destRow || destRow < 1 || destRow > 5
      if (outOfBound) continue
      const destSquare = destCol + destRow as SquareType
      const piece = this.boardPosition[destSquare]
      const friendlyFire = !!piece && piece[0] === moveAs
      if (friendlyFire) continue
      options.push(destSquare)
    }
    return options
  }
  isValidToPassTurn(playerId: string) {
    const [playerCards, playerColor] = playerId === this.whiteId ? [this.whiteCards, "w"] : [this.blackCards, "b"]
    const sourceSquares = Object.entries(this.boardPosition)
    for (let i = 0; i < sourceSquares.length; i++) {
      const [square, piece] = sourceSquares[i] as [SquareType, PieceType]
      if (piece[0] !== playerColor) continue
      for (let j = 0; j < playerCards.length; j++) {
        const card = playerCards[j]
        const options = this.getCardOptions(square, card, playerColor as "w" | "b")
        if (options.length > 0) return false
      }
      return true
    }
  }

  resign(playerId: string) {
    if (this.endGame) return this
    const winningPlayerId = this.whiteId === playerId ? this.blackId : this.whiteId
    const winningColor = winningPlayerId === this.whiteId ? "w" : "b"
    this.endGame = { result: "won", by: "resignation", playerWon: winningPlayerId, playerWonColor: winningColor }
    return this
  }

  getLastCard(playerId: string) {
    const cards = playerId === this.whiteId ? this.whiteCards : this.blackCards;
    return cards[cards.length - 1]
  }
}
