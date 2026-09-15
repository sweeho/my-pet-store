---
artifact: fix-note
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0009
ticket: SWHM-T-0097
branch: vortex/fix/SWHM-T-0097-merely-browsing-the-catalog-anonymously-0e97d282
upstream: [artifacts/SWHM-S-0009/SWHM-T-0097/PLAN.md]
downstream: [artifacts/SWHM-S-0009/qa-test-report.md]
---

# Fix note — SWHM-T-0097: Merely browsing the catalog anonymously corrupts the post-sign-in redirect

## Root cause

`middleware/signon.ts` called `setOriginalUrl(session, path)` on every denied request, with no
notion of who asked or why (design.md RC-3). `/api/customer` is in `PROTECTED_RESOURCES` and every
catalogue screen background-fetches it on mount via `useCatalogLocale` (`src/pages/catalog/shared.ts`)
purely to resolve locale. An anonymous catalogue visit therefore denied that background fetch and
overwrote `sessions.original_url` with `/api/customer`; a subsequent successful sign-in handed that
value back verbatim as `redirectTo` (`routes/api/signon/index.post.ts`), landing the visitor on a raw
JSON response instead of the sign-on welcome screen. Confirmed against the change's design doc; no
correction to Planning's RCA needed.

## Fix

Denial and "remember the return address" were one decision; the fix splits them (design.md D5/D6).
A new pure predicate, `isNavigationRequest`, classifies a request from its Fetch Metadata headers
(`Sec-Fetch-Mode: navigate` / `Sec-Fetch-Dest: document`), falling back to an `Accept` header
preferring `text/html` when neither is present. `middleware/signon.ts` now calls `setOriginalUrl`
only when the request is a navigation; a denied non-navigation request is answered `401` directly
(matching what `routes/api/customer/index.get.ts` already answers when reached with no session)
instead of being redirected to an HTML page it cannot parse as JSON. `evaluateAccess` and
`PROTECTED_RESOURCES` are unchanged — what is protected and who may reach it did not move. The
predicate lives in `auth/signon-filter.ts` rather than `middleware/` because `middleware/**` runs
under jsdom in this project's Vitest config and cannot resolve `bun:sqlite` (design.md D7).

## Regression test

`auth/signon-filter.test.ts › auth/signon-filter isNavigationRequest` (SF-04 through SF-10) pins
the predicate: a navigation via `Sec-Fetch-Mode`/`Sec-Fetch-Dest`, a background fetch/XHR via the
same headers, and the `Accept`-header fallback when neither Fetch Metadata header is present.
`middleware/signon.ts` itself has no unit test — it is outside both Vitest projects' include lists
(same jsdom/`bun:sqlite` constraint) — so the end-to-end corrupting sequence (anonymous catalogue
browse → sign-in → lands on `/signon-welcome`) is covered by a new scenario appended to
`e2e/signon.spec.ts`. Per design.md's Verification note, the browser tier does not run in this
implementation container (Chromium is genuinely absent) and is observed in CI on this ticket branch
and again at integration QA. Red→green for the unit-level regression is recorded in
`tdd-test-result.md`.

## Files touched

- `auth/signon-filter.ts` — added `isNavigationRequest`.
- `auth/signon-filter.test.ts` — added SF-04..SF-10 covering the predicate.
- `middleware/signon.ts` — only calls `setOriginalUrl` for a navigation; answers `401` for a denied
  non-navigation request instead of redirecting.
- `e2e/signon.spec.ts` — added the anonymous-browse-then-sign-in regression scenario.
