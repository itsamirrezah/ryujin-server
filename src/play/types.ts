export type PieceType = "wP" | "wK" | "bP" | "bK";

export type SquareType =
  "a5" | "b5" | "c5" | "d5" | "e5" |
  "a4" | "b4" | "c4" | "d4" | "e4" |
  "a3" | "b3" | "c3" | "d3" | "e3" |
  "a2" | "b2" | "c2" | "d2" | "e2" |
  "a1" | "b1" | "c1" | "d1" | "e1"

export type Position = { [key in SquareType]?: PieceType }

export type CardType = {
  name: string,
  options: number[],
  delta: DeltaCard[];
}

export type DeltaCard = {
  x: number,
  y: number
}

export type EndGame = {
  result: "draw",
  by: "insufficent material" | "agreement"
} | ({
  result: "won",
  playerWon: string,
  playerWonColor: "w" | "b"
  by: "conquer temple" | "time" | "resignation" | "slaughter" | "abandon"
})

export type PlayerInfo = {
  socketId: string,
  userId: string,
  username: string
}

export type TimePayload = { whiteRemaining: number, blackRemaining: number }

export type OpponentMovePayload = ({
  type: "move",
  from: SquareType,
  to: SquareType,
  selectedCard: CardType,
  replacedCard: CardType,
} | {
  type: "pass"
}) & TimePayload;

export type UpdatePlayersPayload = {
  id: string,
  players: PlayerInfo[]
}

export type GamePayload = {
  id: string,
  whiteId: string,
  blackId: string,
  whiteCards: CardType[],
  blackCards: CardType[],
  boardPosition: Position,
  turnId: string,
  gameTime: number
}

export type EndGamePayload = {
  endGame: EndGame
} & Omit<GamePayload, "gameTime" | "turnId"> & TimePayload

export type MoveRejectedPayload = Omit<GamePayload, "gameTime"> & TimePayload

export type MoveConfirmedPayload = {
  replacedCard: CardType
} & TimePayload

export type ServerEvents = {
  UPDATE_PLAYERS: (payload: UpdatePlayersPayload) => void
  START_GAME: (payload: GamePayload) => void
  OPPONENT_MOVED: (payload: OpponentMovePayload) => void,
  END_GAME: (payload: EndGamePayload) => void
  MOVE_CONFIRMED: (payload: MoveConfirmedPayload) => void
  MOVE_REJECTED: (payload: MoveRejectedPayload) => void
  TIMEOUT_REJECTED: (payload: TimePayload) => void,
  OPPONENT_REMATCH: () => void
}
