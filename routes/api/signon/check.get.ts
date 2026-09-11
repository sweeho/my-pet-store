import { defineHandler, getQuery } from "nitro/h3";

import { setOriginalUrl, useSignOnSession } from "../../../auth/session";
import { type AccessVerdict, evaluateAccess } from "../../../auth/signon-filter";
import { SIGN_ON_PAGE } from "../../../auth/protected-resources";

function isSameOriginPath(resource: unknown): resource is string {
  return typeof resource === "string" && resource.startsWith("/") && !resource.startsWith("//");
}

export default defineHandler((event): AccessVerdict => {
  const { resource } = getQuery(event);
  const session = useSignOnSession(event);

  if (!isSameOriginPath(resource)) {
    return { allowed: false, redirectTo: SIGN_ON_PAGE };
  }

  const verdict = evaluateAccess(session, resource);
  if (!verdict.allowed) {
    setOriginalUrl(session, resource);
  }
  return verdict;
});
