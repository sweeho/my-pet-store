import { defineHandler, readBody, setResponseStatus } from "nitro/h3";

import { useSignOnSession } from "../../../auth/session";
import { placeOrder, type PlaceOrderResult as OrderResult } from "../../../order/order";
import {
  OrderValidationError,
  validateOrderSubmission,
  type OrderSubmission,
} from "../../../order/validation";

type OrderErrorResult = { error: string; section?: string; field?: string };
type PlaceOrderResult = OrderErrorResult | OrderResult;

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

  // Line item creation and cart clearing are wired in here by SWHM-T-0157
  // and SWHM-T-0158 (design.md § Phases 5-6), inside the transaction that
  // arrives with SWHM-T-0158.
  return placeOrder(userName, submission);
});
