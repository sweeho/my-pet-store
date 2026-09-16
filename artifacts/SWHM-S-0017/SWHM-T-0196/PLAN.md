# PLAN — SWHM-T-0196

**Task group:** `## 10. Integration & Exception Handling` (checkboxes 10.1–10.6)
**Change:** `swhm-i-0010-order-fulfillment-shipping`
**Capability:** `fulfillment-management`
**Requirements:** none directly — this ticket hardens the entry point built by SWHM-T-0193 and covers the whole capability in the browser.

## Objective

Make the capability's failure behaviour deliberate, and prove the administrator's path through both screens in a real browser. **Read `design.md` first**, from `## Codebase findings` down — S11 (with no queue, a message selector is request validation and retry is idempotence) and S12 (this product has no logging facility and this ticket does not introduce one).

## Design reference

`artifacts/SWHM-S-0017/design/` — see `MANIFEST.md`. Both mockups matter here as the source of the accessible names the browser spec locates: the **Display Inventory** and **Logout** controls on the home screen, and the four column headers, per-row controls and **Update Inventory** control on the inventory screen.

## Steps

1. **Map failures at the route boundary** in `routes/api/fulfillment/process.post.ts`: `InvalidFulfillmentMessageError` → 400, `OrderNotFoundError` → 404, anything else → 500 with no stack trace and no internal message in the body. The first two are already mapped by SWHM-T-0193; this ticket adds the third and the response shape.
2. **Log a failed run to the server's error output**, naming the order id (10.5). `console.error` is the only mechanism present (F17); adding a logging dependency is a decision nobody has taken and is not taken here. Say so in a comment so the next reader does not take the absence for an oversight.
3. **Assert that a failed run leaves nothing behind** (AC-1). The pass is one transaction (D2), so this is a property of the design — assert it rather than assuming it, by forcing a failure partway and reading the order, its lines and the inventory back.
4. **Assert idempotence instead of building retry logic** (10.2, S11). Nothing retries a run automatically; what makes a retry safe is that a second pass skips lines already shipped (D3). The second identical request answers with no invoice and changes nothing.
5. **Write `e2e/fulfillment.spec.ts`** (10.6), following `e2e/admin.spec.ts`'s shape — it already signs in as the seeded administrator and navigates the administrative screens. Cover one journey: sign in, reach `/supplier`, follow **Display Inventory** to `/supplier/inventory`, see the four column headers, set a new quantity on one ticked row, submit, and see that row's existing quantity showing the new figure while an untouched row is unchanged.
6. **Cover the fulfilment run in the same spec** through an API request: a run against a fillable order answers with an invoice; the identical second request answers with none and leaves every quantity as the first left it (AC-4).
7. **Keep the browser tier honest about its data.** `e2e/` runs against the file-backed development database with its seed (F14), and a spec that writes must not depend on a figure a previous run left behind — derive the expected value from what the screen showed, or use a unique value per run as `e2e/admin.spec.ts` does for usernames.

## Fixed interface contracts

None owned by this ticket. It codes against `POST /api/fulfillment/process` and `POST /api/supplier/inventory` as their tickets fixed them; a shape that turns out to be wrong is raised on that ticket, not changed here.

## File / module ownership

Create or modify only:

- `e2e/fulfillment.spec.ts` (new)
- `routes/api/fulfillment/process.post.ts` — error mapping and logging only (shared with SWHM-T-0193, which is a dependency of this ticket, so the two never run concurrently)
- `routes/api/fulfillment/process.post.test.ts` — the failure cases

Do not modify any `fulfillment/` module, any screen, `auth/protected-resources.ts`, or `.github/workflows/ci.yml` — CI already triggers on `vortex/**` pushes and pull requests and runs every tier (F16).

## Definition of Done

- AC-1 … AC-4 hold, each evidenced by the assertion that carries it.
- A 500 response body carries no stack trace and no internal message.
- No logging dependency, no retry scheduler and no queue is added.
