import { defineHandler, readBody, setResponseStatus } from "nitro/h3";

import { useSignOnSession } from "../../../auth/session";
import { authorizeCard, type AuthorizeField } from "../../../payment/authorize";
import type { CardSubmission } from "../../../payment/types";

type AuthorizeRefusal = { error: string; field: AuthorizeField; alert: string };
type AuthorizeOutcome = { status: "approved" | "declined" };
type AuthorizeApiResult = { error: string } | AuthorizeRefusal | AuthorizeOutcome;

// Mirrors routes/api/order/index.post.ts's own-check pattern: an explicit
// session guard, independent of whatever the /payment and /api/payment
// protected-resource entries also cover (design.md § Codebase findings F8).
export default defineHandler(async (event): Promise<AuthorizeApiResult> => {
  const session = useSignOnSession(event);
  const userName = session.j_signon_username;

  if (!userName) {
    setResponseStatus(event, 401);
    return { error: "Not signed on" };
  }

  const submission = (await readBody<CardSubmission>(event)) ?? ({} as CardSubmission);
  const result = authorizeCard(submission);

  if (result.status === "invalid") {
    setResponseStatus(event, 400);
    return { error: result.message, field: result.field, alert: result.alert };
  }

  // A decline is a business outcome the processor sent back, not a request
  // error — it keeps its 200 (design.md § Decisions D6; PLAN.md step 4).
  return { status: result.status };
});
