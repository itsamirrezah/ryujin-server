export class UserConflictError extends Error { }
export class UserNotFoundError extends Error { }
export class UserAlreadyExistError extends Error { }
export class IncorrectCredentials extends Error { }
export class IncorrectGoogleToken extends Error { }
export class ConfirmationEmailRequestDelayedException extends Error {
  constructor(message: string, public readonly ttlInSeconds: number) {
    super(message)
  }
}
