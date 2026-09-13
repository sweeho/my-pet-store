# Design — observable pending state on data-gated screens

## Measured context

| Fact                                                | Evidence                                                                                                                                                               |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The flake is a 5000ms timeout, not a wrong value    | CI run 34601581810, `Received: <element(s) not found>` at `e2e/customer-profile.spec.ts:83`                                                                            |
| It is localised to the final navigation             | failing attempt 7.6s, passing retry 2.7s; the 4.9s gap is the assertion budget                                                                                         |
| `/customer` has no DOM until two reads resolve      | `src/components/RequireSignOn.tsx:19`, `src/pages/customer.tsx:140`                                                                                                    |
| The reads are serial, not parallel                  | `CustomerProfile`'s `useEffect` cannot run until `RequireSignOn` renders its children                                                                                  |
| Their latency tracks total load, not their own cost | synchronous `bun:sqlite` reads on one Nitro process (`db/client.ts:18`); Playwright is `fullyParallel: true` against one shared dev server (`playwright.config.ts:11`) |
| The "second flaky spec" corroboration is false      | `e2e/catalog.spec.ts:76` failed all 3 attempts in <150ms on a `MAX_USERID_LENGTH` assertion; already fixed on `dev`                                                    |

Not reproduced by execution in this container: `bun run test:e2e` fails its preflight —
Playwright's Chromium is genuinely not installed here (see `.vortex/agents-generated.md` §
"Implementation containers do not ship a Chromium"). Diagnosis is from the CI log plus the source on
this branch.

## D1 — The fix is app-side and test-side, and only the test-side half removes the flake

Stating this plainly because it would be easy to ship the pending indicator and claim the flake
fixed. A pending indicator does not make two round trips faster. What it does is make the screen's
state **observable**, which is what lets the test wait on a real signal instead of a blind budget.
The two halves do different jobs:

- **App-side** fixes a user-facing defect: a blank page of unbounded duration. This is the part the
  spec delta records, and it is worth doing on its own merits.
- **Test-side** fixes the flake: wait for the contact-information region — which exists only once
  `/api/customer` has resolved — with an explicit generous budget, then assert the saved values with
  the default budget.

Rejected: raising the timeout on the content assertion alone. It widens the window in which a real
regression in this render path goes unnoticed, which is precisely what SWHM-T-0059's AC-2 forbids.
The two-step wait keeps the content assertion tight: a screen that renders with the wrong first name
still fails in 5s, and a screen that never renders still fails.

## D2 — `RequireSignOn` keeps its contract; only its empty branch changes

The guard's job — deny, redirect, preserve the original URL — is settled in
`openspec/specs/user-authentication/`, and its access decision comes from one pure function
(`auth/signon-filter.ts`) shared with server middleware. None of that moves. The only change is what
it renders during the undecided window: a `role="status"` element instead of `null`. The denial path
still calls `navigate(result.redirectTo)` and still never renders children, so
`e2e/signon.spec.ts:59` — which observes a URL, not a body — is unaffected.

Rejected: collapsing `/api/signon/check` and `/api/customer` into one read, or letting children mount
before the verdict. Both require the guard to know what its children need, or to render a protected
screen before access is granted. That trades a timing defect for an access-control one, and the guard
wraps `/signon-welcome` too.

## D3 — The pending indicator is `role="status"`, and it is the accessible signal, not a spinner

`role="status"` is an ARIA live region: a screen reader announces the state change without stealing
focus, which is the correct behaviour for "content is on its way". It also gives Playwright and
Testing Library a queryable handle that does not depend on any class name or DOM shape, matching how
every other assertion in this codebase locates things (`getByRole`, `getByLabel`). No animation, no
skeleton geometry — the design system has no skeleton primitive and inventing one for two screens
would be scope this defect does not carry. `DESIGN.md` § Loading states records the pattern.

## D4 — The customer profile keeps its heading while it loads

`src/pages/customer.tsx` currently returns `null` for the entire page. The fix renders the page shell
— the `<h1>Customer Profile</h1>` — with the pending indicator beneath it, so the screen has a
stable identity from first paint. This matters for the test as well as the user: the heading
assertion at `e2e/customer-profile.spec.ts:47` then holds from the moment the guard passes rather
than only after the account read.

## D5 — Why the delta ADDS rather than MODIFIES

A defect normally MODIFIES the requirement it violated, carrying a regression scenario. Here no
requirement was violated, because none exists: none of the four specs of record says anything about
what a screen presents while a read is in flight. `application-foundation` is the right home — it
already carries the app-shell and cross-cutting UI guarantees, including the token-contrast
requirement SWHM-S-0005 added under the same reasoning. The requirement is written to cover any
data-gated screen, not just `/customer`, so the catalogue screens (proposal § F1) are already
specified when someone fixes them.

## D6 — Promoted to `ARCHITECTURE.md` § Key Decisions

D2 binds work beyond this change: every future protected screen inherits the guard, and every future
client-fetching screen faces the same choice. One bullet is promoted; the rest stay here.
