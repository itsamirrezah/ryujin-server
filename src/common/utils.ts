import { User } from "@prisma/client"

function exclude<T, Key extends keyof T>(t: T, keys: Key[]): Omit<T, Key> {
  if (!t) return t
  for (const key of keys) {
    delete t[key]
  }
  return t
}

export function excludeUserSensetiveKeys(user: User): Omit<User, 'password'>{
  return exclude(user, ['password'])
}
