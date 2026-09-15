import { setResponseStatus, type H3Event } from "nitro/h3";

import { useSignOnSession } from "../auth/session";
import { findUserRole } from "../auth/user";
import { ADMIN_ROLE } from "../auth/protected-resources";
import type { AdminContext, AdminError } from "./types";

// Resolves the session and checks the role every /api/admin route needs, so
// each route calls this once instead of repeating the check (design.md D6).
// The path-level decision already ran in middleware/signon.ts; this exists
// to hand the route a typed username, not to re-decide access.
export function requireAdmin(event: H3Event): AdminContext | AdminError {
  // Not a React hook — a server-side session accessor whose name happens to
  // start with "use" (auth/session.ts is owned by another ticket this sprint).
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const session = useSignOnSession(event);

  if (!session.j_signon || !session.j_signon_username) {
    setResponseStatus(event, 401);
    return { error: "Not signed on" };
  }

  const role = findUserRole(session.j_signon_username);
  if (role !== ADMIN_ROLE) {
    setResponseStatus(event, 403);
    return { error: "Forbidden" };
  }

  return { userName: session.j_signon_username };
}

export function isAdminError(result: AdminContext | AdminError): result is AdminError {
  return "error" in result;
}
