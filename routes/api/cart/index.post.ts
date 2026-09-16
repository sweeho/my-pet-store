import { defineHandler, readBody, setResponseStatus } from "nitro/h3";

import { addItem, UnknownItemError } from "../../../cart/cart";
import { useSignOnSession } from "../../../auth/session";
import type { Cart } from "../../../cart/types";

type AddItemRequest = { itemId: string; quantity?: number };
type AddItemResult = Cart | { error: string };

// Public — no session.j_signon check (design.md D3), same as the GET route.
export default defineHandler(async (event): Promise<AddItemResult> => {
  const session = useSignOnSession(event);
  const body = (await readBody<AddItemRequest>(event)) ?? ({} as AddItemRequest);

  try {
    return addItem(session.id, body.itemId, body.quantity);
  } catch (error) {
    if (!(error instanceof UnknownItemError)) throw error;
    setResponseStatus(event, 400);
    return { error: error.message };
  }
});
