import { defineHandler, sendRedirect, setResponseStatus } from "nitro/h3";

import { setOriginalUrl, useSignOnSession } from "../auth/session";
import { evaluateAccess, isNavigationRequest } from "../auth/signon-filter";

// A single-argument middleware handler short-circuits the H3 middleware chain
// whenever it returns a defined, non-404 value (see h3's toMiddleware), so
// returning sendRedirect(...) here stops the request before any route
// handler runs; returning undefined falls through to the next middleware /
// the matched route, exactly like middleware/auth.ts does today.
export default defineHandler((event) => {
  const path = event.url.pathname;
  const session = useSignOnSession(event);
  const verdict = evaluateAccess(session, path);

  if (verdict.allowed) return;

  // Only a navigation may become the post-sign-on return address (design.md
  // D5/D6) — a background fetch/XHR is refused in a form its caller can
  // read, not redirected to an HTML page it can't parse as JSON.
  if (!isNavigationRequest(event.headers)) {
    setResponseStatus(event, 401);
    return { error: "Not signed on" };
  }

  setOriginalUrl(session, path);
  return sendRedirect(event, verdict.redirectTo, 302);
});
