# PLAN — SWHM-T-0193

**Task group:** `## 2. Message-Driven Bean Setup` (checkboxes 2.1–2.7)
**Change:** `swhm-i-0010-order-fulfillment-shipping`
**Capability:** `fulfillment-management`
**Requirement:** Receive purchase orders asynchronously via JMS queue (ADDED)

## Objective

Give the fulfilment pass its entry point, and register the access rules the whole capability needs. **Read `design.md` first**, from `## Codebase findings` down. S1 and S2 are this ticket: there is no broker, no bean and no deployment descriptor in this product (F12), and none is introduced. The queue becomes a request (D1) — that is the decision, and it is already taken.

## Design reference

`artifacts/SWHM-S-0017/design/` — see `MANIFEST.md`. No screen is built here. The mockups matter for one thing: both screens sit under `/supplier`, which is one of the three protected paths this ticket registers.

## Steps

1. **Write `fulfillment/receive.ts`** — `parseFulfillmentRequest(body: unknown): FulfillmentRequest`, throwing `InvalidFulfillmentMessageError` for anything that is not an order identifier. This is 2.6/2.7's "extract the message content" and 10.1's message selector in the form this product has for them (S1, S11). Keep it a pure function with no database access so it can be asserted on its own.
2. **Write `routes/api/fulfillment/process.post.ts`** — parse the body, call `processOrder`, answer `{ orderId, invoice, status }`. Mirror the existing route files' shape (`routes/api/order/index.post.ts` is the closest); creating the file is the whole registration step.
3. **Answer 400 for an unparseable body and 404 for `OrderNotFoundError`.** Broader failure mapping and logging belong to SWHM-T-0196 — do not build a general error handler here, and leave the 500 path for that ticket.
4. **Add three entries to `auth/protected-resources.ts`**, all `requiresRole: ADMIN_ROLE`: `/api/fulfillment`, `/supplier`, `/api/supplier`. A `requiresRole` entry protects its whole subtree by prefix, so `/api/fulfillment/process`, `/supplier/inventory` and both inventory endpoints are covered by these three lines and no screen or endpoint added later under them defaults to public (`ARCHITECTURE.md § Routing`).
5. **This ticket owns that file for the sprint.** The two screen tickets depend on this one precisely so nobody adds a fourth entry concurrently. Set `legacy:` to the legacy artefact each path replaces — it is a provenance label, not a route (F15).
6. **Assert the access rules, not just the happy path** (AC-4): signed out is denied, signed on without the role is refused rather than redirected (`ARCHITECTURE.md § Key Decisions` — a missing role is not a redirect).

## Fixed interface contracts

```ts
export function parseFulfillmentRequest(body: unknown): FulfillmentRequest;
```

`POST /api/fulfillment/process` — request `{ orderId: number }`, response `FulfillmentResponse` (`{ orderId, invoice, status }`, `fulfillment/types.ts`). The browser-tier ticket and any later caller code against this shape.

## File / module ownership

Create or modify only:

- `fulfillment/receive.ts` (new) + `fulfillment/receive.test.ts`
- `routes/api/fulfillment/process.post.ts` (new) + `routes/api/fulfillment/process.post.test.ts`
- `auth/protected-resources.ts` — the three entries, nothing else
- `auth/protected-resources.test.ts` — cases for the three entries

Do not modify `fulfillment/fulfillment.ts` or any module below it, `middleware/signon.ts`, `auth/signon-filter.ts`, or the existing resource entries.

## Definition of Done

- AC-1 … AC-4 hold, each evidenced by the assertion that carries it.
- The three new resource entries are the only change to the resource list, and every existing entry's behaviour is unchanged.
- No broker, queue, bean or deployment descriptor is added, and `package.json` gains no dependency.
