import { Position } from "./types";

export const DEFAULT_POSITION: Position = {
  a1: "wP", b1: "wP", c1: "wK", d1: "wP", e1: "wP",
  a5: "bP", b5: "bP", c5: "bK", d5: "bP", e5: "bP"
}

export type Card = {
  name: string,
  options: number[];
}

export const cards: Card[] = [
  { name: "tiger", options: [2, 17] },
  { name: "cobra", options: [8, 11, 18] },
  { name: "dragon", options: [5, 9, 16, 18] },
  { name: "rabbit", options: [8, 14, 16] },
  { name: "crab", options: [7, 10, 14] },
  { name: "elephant", options: [6, 8, 11, 13] },
  { name: "frog", options: [6, 10, 18] },
  { name: "goose", options: [6, 11, 13, 18] },
  { name: "rooster", options: [8, 11, 13, 16] },
  { name: "monkey", options: [6, 8, 16, 18] },
  { name: "mantis", options: [6, 8, 17] },
  { name: "horse", options: [7, 11, 17] },
  { name: "ox", options: [7, 13, 17] },
  { name: "crane", options: [7, 16, 18] },
  { name: "boar", options: [7, 11, 13] },
  { name: "eel", options: [6, 13, 16] },
]
export const CREATE_OR_JOIN_ROOM = 'CREATE_OR_JOIN_ROOM';
export const JOIN_ROOM = 'JOIN_ROOM';
export const START_GAME = 'START_GAME'
