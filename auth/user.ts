import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { authUsers } from "../db/schema";
import { validateNewUser } from "./validation";

export type AuthUser = { userName: string; password: string };

const SCRYPT_KEY_LENGTH = 64;

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function findUser(userName: string): AuthUser | undefined {
  return db.select().from(authUsers).where(eq(authUsers.userName, userName)).get();
}

export function insertUser(userName: string, password: string): AuthUser {
  validateNewUser(userName, password);
  const user: AuthUser = { userName, password: hashPassword(password) };
  db.insert(authUsers).values(user).run();
  return user;
}

export function matchPassword(user: AuthUser, password: string): boolean {
  const [scheme, salt, derivedHex] = user.password.split("$");
  if (scheme !== "scrypt" || !salt || !derivedHex) return false;

  const stored = Buffer.from(derivedHex, "hex");
  const candidate = scryptSync(password, salt, stored.length);
  return timingSafeEqual(stored, candidate);
}
