import { defineHandler, getRouterParam, setResponseStatus } from "nitro/h3";

import { removeItem } from "../../../../cart/cart";
import { useSignOnSession } from "../../../../auth/session";
import type { Cart } from "../../../../cart/types";

type Result = Cart | { error: string };

// Public — no session.j_signon check (design.md D3), same as the other cart
// routes. Fixed contract: 200 with the resulting Cart (PLAN.md § Fixed
// interface contracts). Removing an item the cart does not hold is a no-op
// (cart/cart.ts's removeItem), so this route never answers 404 for it.
export default defineHandler((event): Result => {
  const itemId = getRouterParam(event, "itemId");
  if (!itemId) {
    setResponseStatus(event, 400);
    return { error: "Missing itemId" };
  }

  const session = useSignOnSession(event);
  return removeItem(session.id, itemId);
});
