// PLAN.md step 2: creating this file is the whole registration step. Access
// control is the path-level /api/fulfillment entry in
// auth/protected-resources.ts, enforced by middleware/signon.ts before this
// handler ever runs — mirroring routes/api/order/index.post.ts's shape,
// the closest existing route (design.md D1: the queue becomes a request).
import { defineHandler, readBody, setResponseStatus } from "nitro/h3";

import { InvalidFulfillmentMessageError, OrderNotFoundError } from "../../../fulfillment/errors";
import { processOrder } from "../../../fulfillment/fulfillment";
import { parseFulfillmentRequest } from "../../../fulfillment/receive";
import { readOrderStatus } from "../../../fulfillment/status";
import type { FulfillmentResponse } from "../../../fulfillment/types";

type FulfillmentErrorResult = { error: string };
type Result = FulfillmentResponse | FulfillmentErrorResult;

export default defineHandler(async (event): Promise<Result> => {
  let request;
  try {
    request = parseFulfillmentRequest(await readBody<unknown>(event));
  } catch (error) {
    if (!(error instanceof InvalidFulfillmentMessageError)) throw error;
    setResponseStatus(event, 400);
    return { error: error.message };
  }

  try {
    const invoice = processOrder(request.orderId);
    // processOrder above already succeeded, which requires the order to
    // exist — it throws OrderNotFoundError otherwise — so status cannot be
    // null here.
    const status = readOrderStatus(request.orderId)!;
    return { orderId: request.orderId, invoice, status };
  } catch (error) {
    if (!(error instanceof OrderNotFoundError)) throw error;
    setResponseStatus(event, 404);
    return { error: error.message };
  }
});
