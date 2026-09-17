// Recipient resolution at send time (design.md § Decisions D5). Reads the
// order's user_name (F7) and returns the account's contact fields through
// account/customer.ts's findAccount() — never by querying contact_info
// directly, which would be a second read path for the same fact. Every
// field is nullable, and neither an unmatched order nor an account with no
// rows at all throws — both resolve to all-null, the same terminal,
// non-error outcome an account that merely leaves a field empty produces
// (F6).
import { eq } from "drizzle-orm";

import { findAccount } from "../account/customer";
import { db } from "../db/client";
import { orders } from "../db/schema";
import type { NotificationRecipient } from "./types";

const EMPTY_RECIPIENT: NotificationRecipient = { email: null, givenName: null, familyName: null };

export function resolveRecipient(orderId: number): NotificationRecipient {
  const order = db
    .select({ userName: orders.userName })
    .from(orders)
    .where(eq(orders.orderId, orderId))
    .get();
  if (!order) {
    return EMPTY_RECIPIENT;
  }

  const account = findAccount(order.userName);
  if (!account) {
    return EMPTY_RECIPIENT;
  }

  return {
    email: account.contactInfo.email,
    givenName: account.contactInfo.givenName,
    familyName: account.contactInfo.familyName,
  };
}
