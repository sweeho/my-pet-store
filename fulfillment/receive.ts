// Fixed in artifacts/SWHM-S-0017/SWHM-T-0193/PLAN.md § Fixed interface
// contracts (design.md § Spec discrepancies S1, S11). The request-validation
// counterpart to a JMS message selector: extracts and validates the request
// content before any database access, so a malformed request is refused
// here rather than accepted and failing later (2.6/2.7's "extract the
// message content"). Pure — no db access — so it can be asserted on its own.
import { InvalidFulfillmentMessageError } from "./errors";
import type { FulfillmentRequest } from "./types";

export function parseFulfillmentRequest(body: unknown): FulfillmentRequest {
  // Reading an optional property off an unvalidated value before narrowing
  // it with typeof below — the same shape order/index.post.ts's
  // readBody<OrderSubmission>() call takes for a request body nobody has
  // checked the runtime type of yet.
  const orderId = (body as Partial<FulfillmentRequest> | null | undefined)?.orderId;

  if (typeof orderId !== "number" || !Number.isFinite(orderId)) {
    throw new InvalidFulfillmentMessageError("Fulfilment request must be { orderId: number }.");
  }

  return { orderId };
}
