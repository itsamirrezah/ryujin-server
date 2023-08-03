import { CardType, DeltaCard, Position } from "./types";

const BOARD_WIDTH = 5

export const DEFAULT_POSITION: Position = {
  a1: "wP", b1: "wP", c1: "wK", d1: "wP", e1: "wP",
  a5: "bP", b5: "bP", c5: "bK", d5: "bP", e5: "bP"
}

function getDelta(options: number[]) {
  const delta = [] as DeltaCard[]
  for (let i = 0; i < options.length; i++) {
    const opt = options[i]
    const y = Math.floor(opt / BOARD_WIDTH) - 2
    const x = (opt % BOARD_WIDTH) - 2
    delta.push({ x, y })
  }
  return { options, delta }
}
export const cards: CardType[] = [
  { name: "tiger", ...getDelta([2, 17]) },
  { name: "cobra", ...getDelta([8, 11, 18]) },
  { name: "dragon", ...getDelta([5, 9, 16, 18]) },
  { name: "rabbit", ...getDelta([8, 14, 16]) },
  { name: "crab", ...getDelta([7, 10, 14]) },
  { name: "elephant", ...getDelta([6, 8, 11, 13]) },
  { name: "frog", ...getDelta([6, 10, 18]) },
  { name: "goose", ...getDelta([6, 11, 13, 18]) },
  { name: "rooster", ...getDelta([8, 11, 13, 16]) },
  { name: "monkey", ...getDelta([6, 8, 16, 18]) },
  { name: "mantis", ...getDelta([6, 8, 17]) },
  { name: "ox", ...getDelta([7, 13, 17]) },
  { name: "horse", ...getDelta([7, 11, 17]) },
  { name: "crane", ...getDelta([7, 16, 18]) },
  { name: "boar", ...getDelta([7, 11, 13]) },
  { name: "eel", ...getDelta([6, 13, 16]) },
]

export const SUB_JOIN_ROOM = 'JOIN_ROOM';
export const SUB_MOVE = 'MOVE'
export const SUB_FLAG = 'OPPONENT_FLAG'
export const SUB_RESIGNATION = 'RESIGNATION'
export const SUB_CREATE_ROOM = 'CREATE_ROOM'
