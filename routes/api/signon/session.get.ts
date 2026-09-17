import { defineHandler } from "nitro/h3";

import { useSignOnSession } from "../../../auth/session";
import { findUserRole } from "../../../auth/user";

// Pure read (design.md § Decisions D2, D3): reports identity and role and writes nothing.
// GET /api/signon/check is the one that records original_url — probing it here to learn the
// role would silently overwrite where a signed-out visitor is returned after signing on (F6).
export default defineHandler((event) => {
  const session = useSignOnSession(event);

  return {
    j_signon: session.j_signon,
    j_signon_username: session.j_signon_username,
    original_url: session.original_url,
    role: session.j_signon_username ? findUserRole(session.j_signon_username) : null,
  };
});
