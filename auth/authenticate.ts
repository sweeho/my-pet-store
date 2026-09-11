import { type AuthUser, findUser, insertUser, matchPassword } from "./user";

export function authenticate(userName: string, password: string): boolean {
  const user = findUser(userName);
  if (!user) return false;
  return matchPassword(user, password);
}

export function createUser(userName: string, password: string): AuthUser {
  return insertUser(userName, password);
}
