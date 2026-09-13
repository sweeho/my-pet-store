# Give data-gated screens an observable pending state

Sprint SWHM-S-0006 (BUGFIX). One committed defect: SWHM-T-0059.

## Why

`e2e/customer-profile.spec.ts` intermittently fails its last assertion — that the saved first name
"Priya" and the `ja_JP` language preference survive a brand-new session — with
`Received: <element(s) not found>` rather than a wrong value. Confirmed against the reported CI run
(`gh run view 34601581810 --log-failed`): the failing attempt took 7.6s, the passing retry 2.7s, and
the 4.9s difference is the 5000ms assertion budget. Nothing else in the test moved.

The screen the test is waiting on renders **nothing at all** until two client-side reads complete,
one after the other:

- `src/components/RequireSignOn.tsx:19` — `if (!allowed) return null` until `/api/signon/check`
  answers.
- `src/pages/customer.tsx:140` — `if (!account) return null` until `/api/customer` answers, and the
  component that issues that read only mounts once the guard above flips.

So `/customer` has no DOM whatsoever for the duration of two serial round trips. Both handlers are
synchronous Bun SQLite reads on a single-threaded Nitro process
(`routes/api/signon/check.get.ts`, `routes/api/customer/index.get.ts`, `db/client.ts:18`), and
Playwright runs `fullyParallel: true` against one shared dev server — so their latency is a function
of how many other specs are in flight, not of their own cost. Two consequences, one of which is a
user-facing defect in its own right:

1. A visitor sees an empty white page for an unbounded interval with no indication anything is
   happening. Nothing in `openspec/specs/` currently says otherwise.
2. A browser test has no intermediate signal to wait on, so its only recourse is to point a blind
   5000ms budget at the final content — which is exactly the assertion that flaked.

The defect report's supporting claim that a second spec (`e2e/catalog.spec.ts:76`) flaked in the same
run "under heavy CI load" **does not survive checking, and is corrected here**. That test failed
deterministically on all three attempts in 47ms/139ms/81ms with
`Error: test bug: username "catalog-locale-1789131510252" exceeds MAX_USERID_LENGTH (25)` — a hard
assertion in the test's own `uniqueUsername` helper, not a timeout. It was fixed before merge (the
label is `cat-locale`, 24 characters, at `e2e/catalog.spec.ts:79` today) and needs nothing here. The
"runner was under load" corroboration is therefore withdrawn; the root cause below does not rest on
it.

## What Changes

- Render an accessible pending indicator instead of `null` while a screen's gating read is in
  flight — in the shared route guard (`src/components/RequireSignOn.tsx`) and in the customer
  profile screen (`src/pages/customer.tsx`). The guard's redirect behaviour on a denial is unchanged.
- Anchor the end-to-end spec's post-re-sign-in wait on the settled screen (the contact-information
  region) before asserting its contents, instead of pointing one blind content assertion at a longer
  budget. The content assertion keeps its default timeout, so a wrong value still fails fast and a
  screen that never renders still fails.
- Add unit cover for the pending state in both components; keep `src/pages/customer.test.tsx`'s
  existing no-account-yet case.

## Impact

- **Capability affected:** `application-foundation` — one ADDED requirement, _Observable pending
  state on data-gated screens_. ADDED rather than MODIFIED because no requirement in any of the four
  specs of record says what a screen presents while its data is loading; this is a genuine spec gap,
  the same shape as `application-foundation`'s _Legible destructive surface colours_ in
  SWHM-S-0005.
- **Code:** `src/components/RequireSignOn.tsx`, `src/pages/customer.tsx`, plus test files. See the
  file-ownership map in `artifacts/SWHM-S-0006/SWHM-T-0059/PLAN.md`.
- **Blast radius beyond `/customer`:** `RequireSignOn` also wraps `/signon-welcome`
  (`src/pages/signon-welcome.tsx:33`). That screen gains the same pending indicator. No other page
  uses the guard, and `e2e/signon.spec.ts:59` (which asserts the unauthenticated redirect) observes a
  URL change, not an empty body, so it is unaffected.
- **Not affected:** no route handler, no database schema, no migration, no design token.

## Out of scope — follow-ups for a later sprint

Found while root-causing, deliberately not fixed here. Planning has no defect-creation authority, so
they are recorded here rather than ticketed.

- **F1 — The catalogue screens have the same blank-render shape.** `useCatalogLocale`
  (`src/pages/catalog/shared.ts`) resolves the locale from `/api/customer` before `useCatalogFetch`
  is given a non-null URL, so `/catalog` is also two serial reads deep with no pending state. This
  change does not touch it: `e2e/catalog.spec.ts` is not flaking today, and widening the fix to the
  catalogue would put two agents' changes in the same files for no observed defect. The requirement
  added here is written to cover it when it is fixed.
- **F2 — The shared SQLite connection sets no `busy_timeout` and no WAL journal mode**
  (`db/client.ts:18`). Single-process today, so it is latent; a second process (a PM2 cluster, a
  second Nitro worker) would take `SQLITE_BUSY` on the first concurrent write with no retry window.
- **F3 — An empty `tailwind.config.ts` still sits at the repository root.** Carried over unfixed
  from SWHM-S-0005's F3; `ARCHITECTURE.md` § Stack now documents it as inert, which is documentation
  standing in for deleting it.
