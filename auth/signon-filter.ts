import { isProtectedResource, SIGN_ON_PAGE } from "./protected-resources";
import type { SignOnSession } from "./session";

export type AccessVerdict = { allowed: true } | { allowed: false; redirectTo: string };

export function evaluateAccess(session: SignOnSession, requestedPath: string): AccessVerdict {
  if (session.j_signon || !isProtectedResource(requestedPath)) {
    return { allowed: true };
  }
  return { allowed: false, redirectTo: SIGN_ON_PAGE };
}
