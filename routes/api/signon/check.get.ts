import { defineHandler, getQuery } from "nitro/h3";

import { setOriginalUrl, useSignOnSession } from "../../../auth/session";
import { type AccessVerdict, evaluateAccess } from "../../../auth/signon-filter";
import { SIGN_ON_PAGE } from "../../../auth/protected-resources";
import { findUserRole } from "../../../auth/user";

function isSameOriginPath(resource: unknown): resource is string {
  return typeof resource === "string" && resource.startsWith("/") && !resource.startsWith("//");
}

export default defineHandler((event): AccessVerdict => {
  const { resource } = getQuery(event);
  const session = useSignOnSession(event);

  if (!isSameOriginPath(resource)) {
    return { allowed: false, reason: "not-signed-on", redirectTo: SIGN_ON_PAGE };
  }

  const role = session.j_signon_username ? findUserRole(session.j_signon_username) : null;
  const verdict = evaluateAccess(session, resource, role);
  if (!verdict.allowed && verdict.reason === "not-signed-on") {
    setOriginalUrl(session, resource);
  }
  return verdict;
});
