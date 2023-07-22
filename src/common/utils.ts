import { User } from "@prisma/client"

function exclude<T, Key extends keyof T>(t: T, keys: Key[]): Omit<T, Key> {
  if (!t) return t
  for (const key of keys) {
    delete t[key]
  }
  return t
}

export interface USER_SENSETIVE_KEYS {
  password: string,
  googleId: string,
}

export function excludeUserSensetiveKeys(user: User): Omit<User, keyof USER_SENSETIVE_KEYS> {
  return exclude(user, ['password', 'googleId'])
}
