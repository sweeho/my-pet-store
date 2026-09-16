import { defineHandler } from "nitro/h3";

import { getCart } from "../../../cart/cart";
import { useSignOnSession } from "../../../auth/session";
import type { Cart } from "../../../cart/types";

// Public — no session.j_signon check (design.md D3): an anonymous visitor
// gets a cart the same as a signed-on customer, never a 401 or a redirect.
export default defineHandler((event): Cart => {
  const session = useSignOnSession(event);
  return getCart(session.id);
});
