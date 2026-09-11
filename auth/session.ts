import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { getCookie, setCookie, type H3Event } from "nitro/h3";

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

export function setOriginalUrl(session: SignOnSession, url: string): SignOnSession {
  db.update(sessions)
    .set({ originalUrl: url, updatedAt: new Date() })
    .where(eq(sessions.id, session.id))
    .run();
  return { ...session, original_url: url };
}
