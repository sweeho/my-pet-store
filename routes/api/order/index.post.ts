import { defineHandler, readBody, setResponseStatus } from "nitro/h3";

import { useSignOnSession } from "../../../auth/session";
import {
  OrderValidationError,
  validateOrderSubmission,
  type OrderSubmission,
} from "../../../order/validation";

type OrderErrorResult = { error: string; section?: string; field?: string };
type PlaceOrderResult = OrderErrorResult | { accepted: true };

export default defineHandler(async (event): Promise<PlaceOrderResult> => {
  const { j_signon_username: userName } = useSignOnSession(event);

  if (!userName) {
    setResponseStatus(event, 401);
    return { error: "Not signed on" };
  }

  const submission = (await readBody<OrderSubmission>(event)) ?? ({} as OrderSubmission);

  try {
    validateOrderSubmission(submission);
  } catch (error) {
    if (!(error instanceof OrderValidationError)) throw error;
    setResponseStatus(event, 400);
    return { error: error.message, section: error.section, field: error.field };
  }

  // Order creation, line item creation and cart clearing are wired in here
  // by SWHM-T-0156 (design.md § Phases 4-6). Until then, a valid submission
  // is accepted without being persisted.
  return { accepted: true };
});
