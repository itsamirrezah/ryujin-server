import { nanoid } from "nanoid";
import { DEFAULT_POSITION } from "../consts";
import { Position } from "../types";

export class Game {
  public id: string;
  public roomId: string
  public turnColor: "w" | "b";
  public playerW: string;
  public playerB: string;
  public boardPosition: Position

  constructor(roomId: string, players: string[]) {
    this.id = nanoid(8)
    this.turnColor = Math.random() > .5 ? "w" : "b"
    const [p1, p2] = players;
    this.playerW = Math.random() > .5 ? p1 : p2
    this.playerB = this.playerW === p1 ? p2 : p1
    this.boardPosition = DEFAULT_POSITION
  }

  hasRoom(roomId: string): boolean {
    return this.roomId === roomId
  }
}
