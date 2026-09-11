import { defineHandler, sendRedirect } from "nitro/h3";

import { setOriginalUrl, useSignOnSession } from "../auth/session";
import { evaluateAccess } from "../auth/signon-filter";

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

  setOriginalUrl(session, path);
  return sendRedirect(event, verdict.redirectTo, 302);
});
