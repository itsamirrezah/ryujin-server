import { Game } from "./entity/game"

export class InvalidMoveException extends Error {
  public payload: Game
  constructor(message: string, payload: Game) {
    super(message)
    this.payload = payload
  }
}
