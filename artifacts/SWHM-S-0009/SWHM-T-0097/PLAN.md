# PLAN — SWHM-T-0097: browsing anonymously corrupts the post-sign-on redirect

Change: `swhm-s-0009-bugfix-swhm-t-0094-swhm-t-00`. Read that change's `design.md` first — § RC-3 and
D5–D7 carry the mechanism, why the protected-resources list is not what is wrong, and why the new
predicate cannot live in `middleware/`.

## Objective

An anonymous visitor who has only browsed the catalogue lands on the sign-on welcome screen after
signing on, and a background request to a protected resource is refused in a form its caller can read.

## Design reference

The idea behind this sprint carries no design blocks — these are Inspector-raised defects with no
Ideas Canvas and no mockups, so there is nothing to export under `artifacts/SWHM-S-0009/design/`. This
defect changes no rendered surface.

## Steps

1. Add a pure predicate to `auth/signon-filter.ts` that classifies a request as a navigation from its
   headers: `Sec-Fetch-Mode: navigate` or `Sec-Fetch-Dest: document`, falling back to an `Accept`
   header preferring `text/html` when neither is present. See design.md D5 for the ordering and D7 for
   why this file and not `middleware/`.
2. Cover the predicate in `auth/signon-filter.test.ts` alongside the existing `evaluateAccess` cases:
   a navigation, a background fetch, and a request carrying neither Fetch Metadata header.
3. In `middleware/signon.ts`, call `setOriginalUrl` only when the predicate holds. Leave the
   `evaluateAccess` call exactly as it is — what is protected and who may reach it do not change
   (design.md D5).
4. For a denied request that is not a navigation, answer 401 rather than redirecting to the sign-on
   page (design.md D6). `useCatalogLocale` already has the `response.ok === false` branch this lands
   on, so `src/pages/catalog/shared.ts` needs no change.
5. Extend `e2e/signon.spec.ts` with the corrupting sequence: visit `/catalog` anonymously, then
   `/signon`, sign on with a valid account, and assert the browser is on `/signon-welcome`.
6. Leave `routes/api/signon/check.get.ts` and `auth/protected-resources.ts` untouched, and confirm
   CH-01, CH-02 and SI-01 still pass unchanged — see design.md D7 for why the check endpoint is a
   different case.

## File / module ownership

Only these files. No other ticket in this sprint touches any of them.

- `auth/signon-filter.ts`, `auth/signon-filter.test.ts`
- `middleware/signon.ts`
- `e2e/signon.spec.ts`

Fixed contract: `AccessVerdict` keeps its shape — `{ allowed: true } | { allowed: false; redirectTo: string }`
— and `evaluateAccess` keeps its signature, because `routes/api/signon/check.get.ts` returns the
verdict verbatim as its response body. `PROTECTED_RESOURCES`, `setOriginalUrl`'s signature, and
`POST /api/signon`'s `{ signedOn, redirectTo }` body do not move. A direct unauthenticated navigation
to `/customer`, `/enter-order-information` or `/signon-welcome` must still be remembered and returned
to after sign-on.

## Definition of Done

The ticket's acceptance criteria AC-1, AC-2 and AC-3 hold. AC-1 is observed by the browser-tier
sequence added in step 5 (in CI — see design.md § Verification note), AC-2 by the predicate tests in
step 2 together with the unchanged CH-01/CH-02/SI-01, AC-3 by the middleware behaviour in step 4.
