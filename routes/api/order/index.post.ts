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
  const session = useSignOnSession(event);
  const userName = session.j_signon_username;

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

  // placeOrder (order/order.ts) wraps the order insert, the line item
  // inserts and the cart clear in one transaction (SWHM-T-0158). The
  // shopper's cart is keyed by session id, never username, so that id
  // travels alongside userName from the same resolved session.
  return placeOrder(userName, submission, session.id);
});
