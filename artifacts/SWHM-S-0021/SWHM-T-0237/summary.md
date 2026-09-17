---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0021
ticket: SWHM-T-0237
branch: vortex/feat/SWHM-T-0237-header-tokens-and-shared-width-across-th-31ee6696
upstream: [artifacts/SWHM-S-0021/SWHM-T-0237/PLAN.md]
downstream: [artifacts/SWHM-S-0021/qa-test-report.md]
---

# Summary — SWHM-T-0237: Header, tokens and shared width across the customer-facing screens

## What changed

Rendered the shared `StoreHeader` (built by SWHM-T-0236) on the twelve customer-facing screens that
had none, moved the home and About pages off their raw palette classes onto the store's design
tokens, and moved every owned screen onto the single shared `CONTENT_WIDTH` column
(`src/components/layout.ts`). Re-flowed `/enter-order-information` to `lg:grid-cols-2` (design.md
D7) since the old three-column grid no longer fits the shared width. The home page's bespoke header,
its `@headlessui/react` mobile-nav `Dialog` and its `@heroicons/react` icons are gone, replaced by
`StoreHeader` (design.md F10); `@heroicons/react` is left installed but unused, per that finding.

## Files

- `src/pages/{index,about,cart,customer,payment,enter-order-information,order-completed,signon-welcome,user-creation-error,NotFound}.tsx` — added `<StoreHeader />`, moved onto `CONTENT_WIDTH`.
- `src/pages/catalog/{index,category/[categoryId],product/[productId],item/[itemId]}.tsx` — added `<StoreHeader>` with the existing `LanguageSwitcher` passed into its trailing slot (design.md D9), moved onto `CONTENT_WIDTH`.
- `src/pages/enter-order-information.tsx` — grid re-flow (`lg:grid-cols-[1fr_1fr_340px]` → `lg:grid-cols-2`, order summary `col-span-full`).
- `src/pages/signon-welcome.tsx` — exported the previously-private content component so its test can render it directly, matching the sibling pages' convention.
- `src/layout-width.test.ts`, `src/palette-classes.test.ts` — new repository-level conformance guards (design.md D11).
- `e2e/home.spec.ts` — removed the retired mobile-nav spec (F10), added the narrow-viewport header assertion (design.md § Open questions O1).
- `src/pages/{about,NotFound,signon-welcome,user-creation-error}.test.tsx` — new test files (these screens had none).
- Every other owned page's `*.test.tsx`, plus `src/pages/[...all].test.tsx` (re-exports `NotFound`) — updated fetch mocks to answer `StoreHeader`'s own `/api/signon/session` and `/api/cart` reads, and added a "renders the shared header" assertion.

## AC coverage

- AC-1/2/3 (header renders; store mark → `/`; catalogue link → `/catalog`) — `StoreHeader` on all twelve screens; one "renders the shared header" test per screen (`tdd-test-result.md`).
- AC-4 (sign-on screens carry no header) — the four sign-on screens (`signon.tsx`, `signon-failed.tsx`, `admin/signon.tsx`, `admin/signon-failed.tsx`) are untouched; exempted by path in `layout-width.test.ts`.
- AC-5 (catalogue trailing slot / language persists) — `catalog/index.test.tsx › fills the header's trailing slot…`; cross-navigation persistence is `useCatalogLocale`'s existing cookie/query mechanism, unchanged.
- AC-6 (header reached before content) — satisfied by construction: the header is a preceding DOM sibling of each screen's own content, so it precedes it in both DOM and tab order.
- AC-7 (narrow viewport) — `e2e/home.spec.ts`'s new test; not executed in this container (see Notes).
- AC-8/9 (shared column; header lines up with content) — every owned screen's container is `cn(CONTENT_WIDTH, "mx-auto p-6")`, the same constant `StoreHeader` uses for its own inner container.
- AC-10 (no screen declares its own width) — `src/layout-width.test.ts`.
- AC-11/12 (tokens; home reads as the same store as catalogue) — home and About rewritten on `bg-background`/`text-foreground`/`text-muted-foreground`/`bg-secondary`; `src/palette-classes.test.ts`.
- AC-13 (not-found is a screen of the store) — `NotFound.tsx` now renders `StoreHeader` and the store's typography; `NotFound.test.tsx`.
- AC-14/15 (branded shell; no third-party asset; product name) — unchanged pre-existing behaviour, reasserted by the rewritten `index.test.tsx`.
- AC-16/17/18 (Get started → `/catalog`; Sign in → `/signon`; no placeholder link) — `index.test.tsx`'s CTA/sign-in/placeholder-fragment tests.

## Verification

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run
 Test Files  132 passed (132)
      Tests  897 passed (897)
```

See `tdd-test-result.md` — `TDD-RESULT: 897 passed, 0 failed`.

## Notes

- `bun run test:e2e` (part of `verify:full`) failed its own preflight in this container:
  `scripts/ensure-playwright-browser.mjs` reports Chromium is genuinely not installed (a known gap
  for implementation containers on this project — see `AGENTS.md` § Notes from previous agents).
  Not retried, no browser installed, per that note; `bun run verify` stands in. The new narrow-viewport
  assertion in `e2e/home.spec.ts` and the rest of the E2E tier run in CI and at integration QA.
- D6/D7a/D9/D12 are followed as `StoreHeader` and `layout.ts` already implement them (SWHM-T-0236,
  merged); this ticket only consumes that component and constants, per its ownership boundary — no
  file under `src/components/` was touched.
- Minor deviation from `PLAN.md`, recorded here per the deviation protocol: `signon-welcome.tsx`'s
  content component was changed from a private function to a named export
  (`SignOnWelcomeContent`), matching the pattern every sibling RequireSignOn-gated page already uses
  (`CustomerProfile`, `Payment`, `EnterOrderInformation`, `OrderCompleted`) so its test can render the
  content directly instead of also faking `RequireSignOn`'s own access-check endpoint. No fixed
  interface contract or ownership map changed.
