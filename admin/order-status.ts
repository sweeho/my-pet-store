// Batch order status update, fixed in artifacts/SWHM-S-0012/SWHM-T-0119/PLAN.md
// § Fixed interface contracts.
//
// S5 (design.md § Spec discrepancies): the legacy framing delegates to an
// AsyncSender EJB that posts an OrderApproval message to a queue. bun:sqlite
// is a single-connection embedded database — there is no concurrent writer
// to isolate from and no queue to hand work to (catalog/transaction.ts
// already records this same reasoning for a read). What a transaction gives
// instead is the property the scenario actually asserts: every order in the
// batch moves or none does.
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { orders } from "../db/schema";
import type { OrderStatus } from "./types";

export type StatusUpdateResult = {
  updated: number[];
  notFound: number[];
};

// D5 (design.md): unknown order ids are reported, not silently dropped —
// a batch that matches nothing is still a success with an empty `updated`
// list, not an error, so the caller can tell "no such orders" apart from a
// request that changed nothing because of a wrong endpoint.
export function updateOrderStatus(orderIds: number[], newStatus: OrderStatus): StatusUpdateResult {
  return db.transaction(() => {
    const updated: number[] = [];
    const notFound: number[] = [];

    for (const orderId of orderIds) {
      const row = db
        .update(orders)
        .set({ status: newStatus })
        .where(eq(orders.orderId, orderId))
        .returning({ orderId: orders.orderId })
        .get();

      if (row) {
        updated.push(orderId);
      } else {
        notFound.push(orderId);
      }
    }

    return { updated, notFound };
  });
}
