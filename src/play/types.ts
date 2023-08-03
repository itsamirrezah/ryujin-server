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
  by: "conquer temple" | "time" | "resignation"
})

export type PlayerInfo = {
  socketId: string,
  userId: string,
  username: string
}

export type TimePayload = { whiteRemaining: number, blackRemaining: number }

export type OpponentMovePayload = {
  from: SquareType,
  to: SquareType,
  selectedCard: CardType,
} & TimePayload;

export type JoinRoomPayload = {
  id: string,
  players: PlayerInfo[]
}

export type GamePayload = {
  whiteId: string,
  blackId: string,
  whiteCards: CardType[],
  blackCards: CardType[],
  reserveCards: CardType[],
  boardPosition: Position,
  turnId: string,
  gameTime: number
}
export type EndGamePayload = {
  endGame: EndGame
} & Omit<GamePayload, "gameTime" | "turnId"> & TimePayload

export type RejMovePayload = Omit<GamePayload, "gameTime"> & TimePayload

export type ServerEvents = {
  JOIN_ROOM: (payload: JoinRoomPayload) => void
  START_GAME: (payload: GamePayload) => void
  OPPONENT_MOVED: (payload: OpponentMovePayload) => void,
  END_GAME: (payload: EndGamePayload) => void
  ACK_MOVE: (payload: TimePayload) => void
  REJ_MOVE: (payload: RejMovePayload) => void
  REJ_FLAG: (payload: TimePayload) => void
}
