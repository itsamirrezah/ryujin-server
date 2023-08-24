import { User } from "@prisma/client"

function exclude<T, Key extends keyof T>(t: T, keys: Key[]): Omit<T, Key> {
  if (!t) return t
  for (const key of keys) {
    delete t[key]
  }
  return t
}

export type USER_SENSETIVE_KEYS = {
  password: string,
  googleId: string,
}

export type UserSanitized = Omit<User, keyof USER_SENSETIVE_KEYS>

export function excludeUserSensetiveKeys(user: User): UserSanitized {
  return exclude(user, ['password', 'googleId'])
}
