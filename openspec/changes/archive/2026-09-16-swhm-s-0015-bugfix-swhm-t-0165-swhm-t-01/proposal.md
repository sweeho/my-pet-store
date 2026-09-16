# Bind the order confirmation to the placement that produced it

## Why

Two defects, SWHM-T-0165 and SWHM-T-0166, both reporting one thing: a shopper who submits a
valid order lands on a confirmation screen that never shows the order identifier or the email
address, because `src/pages/enter-order-information.tsx` navigated to `/order-completed` with no
router state and `src/pages/order-completed.tsx` renders that block only when the state is there.
SWHM-T-0166 is the same defect reported a second time — it was auto-raised when SWHM-T-0162 was
conditionally accepted with the corresponding browser assertion still red, and its own report says
so and links the two.

**Re-verified against this sprint branch rather than taken from the reports, and the code no longer
matches them. The reported fault is already fixed here.** The reports are accurate about the
mechanism and about the state of the branch they were written against; that branch is not this one:

- `src/pages/enter-order-information.tsx:362` reads the placement response —
  `const result = (await response.json()) as { orderId: number; email: string }` — and line 367 is
  `navigate("/order-completed", { state: { orderId: result.orderId, email: result.email } })`.
  Both reports quote line 355 / line 365 as a bare `navigate("/order-completed")`. Neither line
  says that now.
- `git log -L 360,368:src/pages/enter-order-information.tsx` returns exactly one commit, `5d0bb64`
  ("SWHM-I-0008: Order Submission & Checkout", #106) — the squash merge that landed SWHM-S-0014 on
  `dev`, and the commit this sprint branch forks from. The lines were created already carrying the
  state argument. The wiring the reports say was never scheduled was completed inside SWHM-S-0014
  itself, after both reports snapshotted the branch at `d6a16aa` and before the sprint landed.
  `vortex/sprint/swhm-s-0014-61fcd4b6` no longer exists on the remote, so the reported state is no
  longer reachable to diff against — the squash is the whole history these lines have.
- The regression coverage both reports ask for is present and green.
  `src/pages/enter-order-information.test.tsx:222-231` mocks the placement response and asserts
  `navigateMock` was called with `("/order-completed", { state: { orderId: 1005, email: … } })` —
  SWHM-T-0165's own AC2, already written. `src/pages/order-completed.test.tsx` carries OC-01 to
  OC-08, including OC-03 (a different identifier renders, not a hard-coded 1005) and OC-05 / OC-08
  (no identifier block and no email line when there is no state). `e2e/order.spec.ts:126-158`
  drives the browser journey end to end and asserts the visible order-id group, the billing email,
  the emptied cart and a higher identifier on a second order — SWHM-T-0166's own ACs. That journey
  was then observed passing in a real browser: CI run `35138625151` on this sprint branch is green,
  37 of 37 E2E tests, `e2e/order.spec.ts:126` among them.
- The one seam neither report examined also holds. `/order-completed` is wrapped in
  `RequireSignOn`, which is the obvious way state could still be lost on arrival; it does not
  navigate on the allowed path (`src/components/RequireSignOn.tsx:21-25`), it re-renders on
  `location.pathname` only, and so `location.state` survives the access check.

So there is no code fault left to fix, and this change does not pretend to fix one. What is left is
the reason the fault was possible at all, and that is still open. The archived requirement said the
confirmation screen shows the identifier and the email _when displayed_ — every one of its three
scenarios starts from an order that has already reached the screen. None of them said who puts it
there. `navigate("/order-completed")` satisfied the written spec completely while discarding the
data, which is why it passed review, passed its own sprint's unit tier, and was caught only by a
browser assertion at the end. A requirement whose scenarios all begin after the handoff cannot
catch a broken handoff.

## What Changes

- **No production code changes.** Every behaviour both defects ask for is already implemented and
  already asserted at the unit, screen and browser tiers. Changing correct code to close a ticket
  would be the only way to introduce a regression here.
- **Specify the handoff, not just the rendering.** The `order-placement` requirement covering the
  confirmation screen gains a sentence binding the identifier and email it shows to the placement
  that reached it, and three regression scenarios: one for the submission carrying its placement's
  result through, one for a second order confirming with its own higher identifier, and one for the
  screen reached with no result showing no identifier rather than a placeholder. All three are
  oracles for assertions that exist and pass today, so the spec of record stops describing only the
  half of this behaviour that was never broken.
- **Close both defects against that spec.** SWHM-T-0165 carries the screen-tier criteria,
  SWHM-T-0166 the browser-tier ones, and SWHM-T-0166 depends on SWHM-T-0165 so the duplicate is
  never dispatched first.

## Impact

- **`order-placement`** — one MODIFIED requirement (_Order confirmation screen displays order ID and
  email_), gaining a paragraph binding the confirmation to its placement and three regression
  scenarios. All three scenarios it already carries are reproduced unchanged.
- **Code** — none expected. The file-ownership maps on both defects exist to bound a corrective
  change if the browser tier contradicts the finding above; the expected outcome is that both
  tickets confirm the criteria and close without a diff.
- **Not changed** — `order/order.ts`, `order/validation.ts`, `routes/api/order/index.post.ts` and
  `src/pages/order-completed.tsx`. The response shape `{ orderId, email }` is settled and correct,
  and the confirmation screen already renders from it; SWHM-T-0166's own report says none of them
  needs to move.
- **Root docs** — none. No capability is gained or lost, no topology, data model or integration
  point moves, and no design token, type scale, grid, interaction pattern or accessibility standard
  changes. A behaviour-only defect sprint that changes no behaviour fires none of the three
  triggers, so `PRODUCT.md`, `ARCHITECTURE.md` and `DESIGN.md` are all deliberately untouched. No
  decision here binds work beyond this change, so nothing is promoted to § Key Decisions.

## Follow-ups / out of scope

Found while root-causing, not covered by either defect, and left for a later sprint. Planning has no
defect-creation authority by design, so they are recorded here rather than filed.

- **The confirmation screen's state guard validates `orderId` but not `email`.**
  `src/pages/order-completed.tsx:11-17` checks `typeof value.orderId === "number"` and nothing else,
  so a state object carrying an identifier and no email passes the guard and renders "You should
  receive a confirmation e-mail soon at **.**" with an empty address. Unreachable today — the
  placement route always returns both fields, and `order/order.ts` types `email` as non-optional —
  so this is latent rather than observed, and it is the same shape of silent-omission failure this
  change specifies against. Tightening the guard to require a string email is a small, safe
  hardening that belongs to whoever next touches that file.
- **`order-placement`'s spec of record still opens with a placeholder Purpose** — "TBD - created by
  archiving change swhm-i-0008-order-submission-checkout. Update Purpose after archive." A delta
  cannot fix it: the text lives in `openspec/specs/`, which the platform owns at archive time. This
  is the same carried-forward item recorded against `internationalization`, `account-management`,
  `catalog-browsing` and `user-authentication` in SWHM-S-0010 and SWHM-S-0011, now confirmed for a
  fifth capability.
- **Conditional acceptance raised a duplicate of an already-refined defect.** SWHM-T-0165 was filed
  first and refined; SWHM-T-0166 was then auto-raised for the same file and the same line when
  SWHM-T-0162 was accepted with the assertion red, and the duplication was caught by a human note in
  the second report rather than by the mechanism that created it. Two dispatches are now committed
  to one already-fixed fault. Whether conditional acceptance should check open defects against the
  file and line it is about to raise against is a process question, not a defect in this codebase.
