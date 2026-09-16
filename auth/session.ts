import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { deleteCookie, getCookie, setCookie, type H3Event } from "nitro/h3";

import { db } from "../db/client";
import { sessions } from "../db/schema";

export const SESSION_COOKIE = "bp_session";

export type SignOnSession = {
  id: string;
  j_signon: boolean;
  j_signon_username: string | null;
  original_url: string | null;
};

type SessionRow = typeof sessions.$inferSelect;

function toSignOnSession(row: SessionRow): SignOnSession {
  return {
    id: row.id,
    j_signon: row.jSignon,
    j_signon_username: row.jSignonUsername,
    original_url: row.originalUrl,
  };
}

function createSession(event: H3Event): SignOnSession {
  const row: SessionRow = {
    id: randomUUID(),
    jSignon: false,
    jSignonUsername: null,
    originalUrl: null,
    updatedAt: new Date(),
  };
  db.insert(sessions).values(row).run();
  setCookie(event, SESSION_COOKIE, row.id, { httpOnly: true, sameSite: "lax", path: "/" });
  return toSignOnSession(row);
}

export function useSignOnSession(event: H3Event): SignOnSession {
  const cookieId = getCookie(event, SESSION_COOKIE);
  const existing = cookieId
    ? db.select().from(sessions).where(eq(sessions.id, cookieId)).get()
    : undefined;

  return existing ? toSignOnSession(existing) : createSession(event);
}

export function setSignedOn(session: SignOnSession, userName: string): SignOnSession {
  db.update(sessions)
    .set({ jSignon: true, jSignonUsername: userName, updatedAt: new Date() })
    .where(eq(sessions.id, session.id))
    .run();
  return { ...session, j_signon: true, j_signon_username: userName };
}

// Deletes the row rather than flagging it dead: a session that exists but is
// marked invalid is a second state every read would have to know about, and
// nothing in the product needs one (PLAN.md step 1). Idempotent — deleting a
// row that is already gone matches zero rows without throwing.
export function invalidateSession(event: H3Event, session: SignOnSession): void {
  db.delete(sessions).where(eq(sessions.id, session.id)).run();
  deleteCookie(event, SESSION_COOKIE, { httpOnly: true, sameSite: "lax", path: "/" });
}

export function setOriginalUrl(session: SignOnSession, url: string): SignOnSession {
  db.update(sessions)
    .set({ originalUrl: url, updatedAt: new Date() })
    .where(eq(sessions.id, session.id))
    .run();
  return { ...session, original_url: url };
}
