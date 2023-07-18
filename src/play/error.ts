export class InvalidMoveException extends Error {
  public payload: any
  constructor(message: string, payload: any) {
    super(message)
    this.payload = payload
  }
}
