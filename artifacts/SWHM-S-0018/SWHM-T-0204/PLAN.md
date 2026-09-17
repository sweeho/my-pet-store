# SWHM-T-0204 — Auto-approval logic: locale thresholds and the order locale

Change: `swhm-i-0011-order-approval-workflow` · `tasks.md` group 1 · Requirement: **Auto-approve small orders based on locale and amount**

Read `openspec/changes/swhm-i-0011-order-approval-workflow/design.md` first — § Decisions D1, D2, D10, D11 and § Spec discrepancies S4, S5, S14 are what this ticket rests on, and they are not repeated here.

## Objective

An order placed under a locale whose threshold it falls below is `APPROVED` the moment it is created; every other order stays `PENDING`. This is the first ticket in the sprint, so it also writes the capability's shared type file whole and adds the `locale` column the decision reads.

## Design reference

`artifacts/SWHM-S-0018/design/mockup-orders-approval.html` — no UI here, but the mockup's subheading ("Orders above the auto-approval threshold for their locale") is the user-facing statement of what this ticket decides. `artifacts/SWHM-S-0018/design/MANIFEST.md` lists both exports.

## Steps

1. Write `order/approval-types.ts` **whole** (D10): `ApprovalLocale`, `ApprovalDecision`, `DecisionOutcome`, `SupplierPurchaseOrder`, `SupplierPoLine`, `NotificationKind`. Later tickets in this sprint import from it and do not append to it — SWHM-T-0205 through SWHM-T-0213 each depend on this one transitively for exactly that reason. Import `OrderStatus` from `admin/types.ts`; do not move or redefine it (D10, F1).
2. Add `locale: text("locale")` to `orders` in `db/schema.ts`, nullable, with a comment citing D2 for why it is copied at placement rather than read from the profile. Generate the migration into `drizzle/` and commit it — the schema change is incomplete without it.
3. Write `order/approval.ts`: `decideApproval(locale, orderAmount)` returning `"APPROVED" | "PENDING"`. Two threshold literals keyed by the strings in `account/vocabulary.ts` — `en_US` at 500, `ja_JP` at 50000. It reads no database and converts no currency (D1, S5). A locale that matches no threshold, `zh_CN` and `null` included, returns `PENDING` through the same branch the requirement's own "all other orders" clause describes — not a special case.
4. In `order/order.ts`'s `placeOrder`, inside the existing transaction: resolve the placing customer's `profiles.preferred_language`, write it to `orders.locale`, and set the inserted row's status from `decideApproval` rather than the current hardcoded `"PENDING"`. A customer with no profile row resolves to `null`, which stays `PENDING`.
5. Give the demo orders in `db/client.ts` a locale so the development database and the browser tier have a realistic mix — at least one `ja_JP` order, matching the mockup's yen rows. The `!process.env.VITEST` guard stays as it is (F19).
6. Tests: `order/approval.test.ts` covers the four scenarios directly plus the unmatched-locale and null-locale branches, at and either side of each boundary (the threshold is exclusive — `< 500`, not `<= 500`). Extend `order/order.test.ts` to assert that a placed order under threshold is `APPROVED`, one over is `PENDING`, and the locale is persisted.

## File/module ownership

Create: `order/approval-types.ts`, `order/approval.ts`, `order/approval.test.ts`, one file under `drizzle/`.
Modify: `db/schema.ts` (the `orders` table only), `order/order.ts`, `order/order.test.ts`, `db/client.ts` (the demo order seed only).

No other ticket in this sprint touches `order/approval-types.ts` or `order/approval.ts`. `db/schema.ts` is also written by SWHM-T-0207 and SWHM-T-0213, which is why the sprint's tickets run in one chain.

## Fixed interface contracts

Peers code against these; do not change them:

```ts
// order/approval-types.ts
export type ApprovalLocale = "en_US" | "ja_JP" | "zh_CN";
export type ApprovalDecision = "APPROVED" | "DENIED";
export type DecisionOutcome =
  | { orderId: number; result: "applied"; status: ApprovalDecision }
  | { orderId: number; result: "skipped"; status: OrderStatus }
  | { orderId: number; result: "notFound" };

// order/approval.ts
export function decideApproval(
  locale: ApprovalLocale | null,
  orderAmount: number,
): "APPROVED" | "PENDING";
```

`orders.locale` is `TEXT`, nullable. `DecisionOutcome`'s three-way shape is what SWHM-T-0205, SWHM-T-0206 and SWHM-T-0212 all report through.

## Definition of Done

AC-1 through AC-4, each observable in `order/approval.test.ts` and, for the placement path, in `order/order.test.ts`. The migration is committed alongside the schema change.
