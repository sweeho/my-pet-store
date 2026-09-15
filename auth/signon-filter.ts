import { isProtectedResource, SIGN_ON_PAGE } from "./protected-resources";
import type { SignOnSession } from "./session";

export type AccessVerdict = { allowed: true } | { allowed: false; redirectTo: string };

export function evaluateAccess(session: SignOnSession, requestedPath: string): AccessVerdict {
  if (session.j_signon || !isProtectedResource(requestedPath)) {
    return { allowed: true };
  }
  return { allowed: false, redirectTo: SIGN_ON_PAGE };
}

// Only a navigation may set the post-sign-on return address (design.md D5):
// a background fetch/XHR to a protected resource must not overwrite it.
// Sec-Fetch-Mode/Sec-Fetch-Dest are sent by modern browsers on every
// request; the Accept fallback covers a request where neither is present.
export function isNavigationRequest(headers: Headers): boolean {
  const fetchMode = headers.get("sec-fetch-mode");
  if (fetchMode !== null) return fetchMode === "navigate";

  const fetchDest = headers.get("sec-fetch-dest");
  if (fetchDest !== null) return fetchDest === "document";

  const accept = headers.get("accept");
  if (!accept) return false;
  return accept.split(",")[0]?.trim().toLowerCase() === "text/html";
}
