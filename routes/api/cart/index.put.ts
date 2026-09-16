import { defineHandler, readBody, setResponseStatus } from "nitro/h3";

import { updateItems } from "../../../cart/cart";
import { useSignOnSession } from "../../../auth/session";
import type { Cart } from "../../../cart/types";

type CartUpdate = { itemId: string; quantity: number };
type UpdateCartRequest = { updates?: unknown };
type UpdateCartResult = Cart | { error: string };

function isValidUpdate(value: unknown): value is CartUpdate {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { itemId?: unknown }).itemId === "string" &&
    typeof (value as { quantity?: unknown }).quantity === "number"
  );
}

// Public — no session.j_signon check (design.md D3), same as the other cart routes.
export default defineHandler(async (event): Promise<UpdateCartResult> => {
  const session = useSignOnSession(event);
  const body = (await readBody<UpdateCartRequest>(event)) ?? {};

  if (!Array.isArray(body.updates) || !body.updates.every(isValidUpdate)) {
    setResponseStatus(event, 400);
    return { error: "updates must be an array of { itemId: string, quantity: number }" };
  }

  return updateItems(session.id, body.updates);
});
