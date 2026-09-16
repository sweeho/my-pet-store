import { defineHandler } from "nitro/h3";

import { invalidateSession, useSignOnSession } from "../../../auth/session";

type LogoutResult = { signedOut: true };

// Deliberately not a protected resource (PLAN.md step 2): ending a session you
// may not have is not a privileged act, and requiring one to end one turns an
// expired cookie into an error the client has to special-case. Idempotent —
// no cookie, or a cookie naming a row that is already gone, both succeed.
export default defineHandler((event): LogoutResult => {
  const session = useSignOnSession(event);
  invalidateSession(event, session);
  return { signedOut: true };
});
