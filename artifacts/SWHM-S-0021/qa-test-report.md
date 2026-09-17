---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0021
idea: SWHM-I-0014
branch: vortex/sprint/swhm-s-0021-5e503761
upstream:
  [
    artifacts/SWHM-S-0021/SPRINT-PLAN.md,
    artifacts/SWHM-S-0021/integration-test-result.md,
    artifacts/SWHM-S-0021/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHM-S-0021/sprint-summary.md]
---

# QA test report — SWHM-S-0021

## Executive Summary

**Verdict: PASS.** Sprint goal "Consistent look and site navigation across every screen" (idea SWHM-I-0014, change `swhm-i-0014-consistent-look-and-site-nav`) holds on the integrated sprint branch. All 38 scenarios across the change's two delta specs (`application-foundation`, `user-authentication`) verified pass — see `SCENARIO-VERDICT:` lines below. `StoreHeader` renders on every routable screen except the four sign-on screens, carries the correct control order per variant (store/catalogue/administration), reports identity only once the session read answers, gates the Admin link on the `administrator` role without that link ever being the actual guard, and the home/About pages and every screen's content now sit on the shared design tokens and one of exactly two shared column widths. One minor defect (DEFECT-1: a route guard's pending state used the wrong one of the two shared widths) was found during AC verification and fixed in place; none escalated. Full unit suite (901 tests), lint, typecheck, build and the full Playwright E2E suite (45 tests) all pass on the branch as it stands after the fix.

## E2E Test Status

Executed — not merely configured. `bun run test:e2e -- --project=chromium`: **45 passed, 0 failed, 0 skipped** (Playwright's own summary: `45 passed (11.3s)`). Full command, per-spec table and the machine-checkable marker are in `artifacts/SWHM-S-0021/integration-test-result.md`.

## Unit Test Results

```
$ NODE_ENV=test bun --bun vitest run

 Test Files  132 passed (132)
      Tests  901 passed (901)
```

Re-run after DEFECT-1's fix (same command) reproduces the identical result. `bun run lint` and `bun run typecheck` (`tsc --build`) both exit 0 with no findings. `bun run build` succeeds (`tsc --build && vite build`, Nitro server + client bundles emit cleanly).

## Code Review

Read `StoreHeader.tsx`, `layout.ts`, `AdminShell.tsx`, `RequireSignOn.tsx`, `RequireAdmin.tsx`, `routes/api/signon/session.get.ts`, `check.get.ts`, `logout.post.ts`, and every screen the three tickets touched, against `openspec/changes/swhm-i-0014-consistent-look-and-site-nav/design.md`'s decisions (D1–D12) and the two delta specs.

- Session read (`session.get.ts`) is a pure read as D2/D3 require — confirmed no write path; `check.get.ts`'s side effect (`setOriginalUrl`) is untouched and is not called from the header.
- Admin link visibility is presentation-only (D4); `/admin` access is still enforced server-side by `middleware/signon.ts` and client-side by `RequireAdmin` — verified `admin.spec.ts`'s denial paths still redirect/refuse independent of the header.
- **DEFECT-1** (see `integration-defects-resolution.md`): `RequireSignOn`'s pending state used `ADMIN_CONTENT_WIDTH` (832px) though it exclusively guards customer screens laid out at `CONTENT_WIDTH` (672px), producing a real width jump on `/payment`, `/customer`, `/enter-order-information`, `/order-completed`, `/signon-welcome`. Fixed in place; `RequireAdmin` was already correct (832px, guards only `/admin`+`/supplier`).
- `DESIGN.md` § Page frame (added this sprint) described only one shared width, omitting the deliberate two-width split (`design.md` D6) the sprint actually shipped and this report accepts per D6's own note to QA. Corrected the paragraph in place to name both `CONTENT_WIDTH`/`ADMIN_CONTENT_WIDTH` and the route-guard width mapping DEFECT-1 fixes — a documentation gap, not a functional defect, so not logged as a DEFECT entry.
- **Design fidelity (advisory, informs but does not gate this verdict):** compared the built header against `artifacts/SWHM-S-0021/design/mockup-header-states-visitor-customer-administr.html` (the authority per `design.md`) — control order per variant (D7a), the pre-session copy ("Checking your session…"), and the Admin-before-username ordering in the identity block all match the mockup's stage markup exactly. Compared the home page against `mockup-home-page-on-the-store-design-system-adm.html` and the cart against `mockup-cart-with-the-shared-header-customer-sig.html`: both render on the project's own tokens (no Space Grotesk, no inline OKLCH re-declaration) per D12, matching structure and placement. No material deviation found.
- No dead code, no unrelated files touched by any of the three tickets beyond their declared ownership maps (SWHM-T-0236/0237/0238 `PLAN.md`s).

## Coverage Summary

No coverage tool is configured in this project (no `coverage` script in `package.json`, no coverage config in `vitest.config.ts`) — this is a pre-existing project condition, not something this sprint changed. Proxy evidence: unit test count grew from the pre-sprint baseline to 901 passing tests across 132 files (SWHM-T-0236 added `StoreHeader.test.tsx` + the session route test; SWHM-T-0237 added tests for every one of the twelve customer-facing screens plus two new repository-level conformance tests; SWHM-T-0238 updated all seven admin/supplier page tests plus `AdminShell`/`RequireSignOn`/`RequireAdmin` tests), and every screen named in the sprint's acceptance criteria has at least one test asserting the header renders.

## Issues Found

- **DEFECT-1** — RequireSignOn's pending state used the administration content width instead of the store width it actually guards. Severity: minor. Detected during AC verification of "Shared content column widths". **FIXED-IN-PLACE** — full entry, root cause and re-validation evidence in `artifacts/SWHM-S-0021/integration-defects-resolution.md`. No future-sprint DEFECT ticket filed.

No other defects found. E2E, unit, lint, typecheck and build gates are all green on the branch as delivered after this fix.

### Scenario verdicts — `application-foundation` delta spec

SCENARIO-VERDICT: Persistent store header on every screen / The header renders on a screen that had none — pass
SCENARIO-VERDICT: Persistent store header on every screen / The store mark leads home — pass
SCENARIO-VERDICT: Persistent store header on every screen / The catalogue link leads to the catalogue — pass
SCENARIO-VERDICT: Persistent store header on every screen / The cart link reports how many lines the cart holds — pass
SCENARIO-VERDICT: Persistent store header on every screen / An empty cart shows no number — pass
SCENARIO-VERDICT: Persistent store header on every screen / The sign-on screens carry no header — pass
SCENARIO-VERDICT: Persistent store header on every screen / The administration screens keep their context and their back-link — pass
SCENARIO-VERDICT: Persistent store header on every screen / The administration header offers no route to where the visitor already is — pass
SCENARIO-VERDICT: Persistent store header on every screen / The header is reached before the screen's content — pass
SCENARIO-VERDICT: Persistent store header on every screen / The header holds together at a narrow viewport — pass (verified via e2e/home.spec.ts's 375px assertion; the header is one shared component so the same markup/CSS is exercised on every screen it renders on)
SCENARIO-VERDICT: Persistent store header on every screen / A catalogue screen fills the header's trailing slot — pass
SCENARIO-VERDICT: Header reports who the visitor is / Nothing is claimed before the session state is known — pass
SCENARIO-VERDICT: Header reports who the visitor is / A signed-out visitor is offered sign-in only — pass
SCENARIO-VERDICT: Header reports who the visitor is / A signed-on visitor is named — pass
SCENARIO-VERDICT: Header reports who the visitor is / Signing out ends the session and returns home — pass
SCENARIO-VERDICT: Header reports who the visitor is / The header does not displace the post-sign-on destination — pass
SCENARIO-VERDICT: Administrative entry from the header / An administrator is offered the administration area — pass
SCENARIO-VERDICT: Administrative entry from the header / A shopper is offered nothing of the kind — pass
SCENARIO-VERDICT: Administrative entry from the header / The administration area is refused without the link — pass
SCENARIO-VERDICT: Shared content column widths / Two screens in a purchase sit in the same column — pass
SCENARIO-VERDICT: Shared content column widths / The header lines up with the content beneath it — pass
SCENARIO-VERDICT: Shared content column widths / No screen declares a width of its own — pass
SCENARIO-VERDICT: Shared content column widths / The order form stays usable in the shared column — pass
SCENARIO-VERDICT: Store-wide conformance to the design tokens / The home page and About page use the tokens — pass
SCENARIO-VERDICT: Store-wide conformance to the design tokens / The home page reads as the same store as the catalogue — pass
SCENARIO-VERDICT: Store-wide conformance to the design tokens / The not-found screen is a screen of the store — pass
SCENARIO-VERDICT: Product-branded application shell / Home page names the product — pass
SCENARIO-VERDICT: Product-branded application shell / Browser tab and web app manifest name the product — pass
SCENARIO-VERDICT: Product-branded application shell / Home page requests no third-party asset — pass
SCENARIO-VERDICT: Product-branded application shell / No page fetches a web font from a third-party host — pass
SCENARIO-VERDICT: Product-branded application shell / Boilerplate example screens are not reachable — pass
SCENARIO-VERDICT: Application shell navigation / Primary call to action opens the catalogue — pass
SCENARIO-VERDICT: Application shell navigation / Sign-in control opens the sign-on screen — pass
SCENARIO-VERDICT: Application shell navigation / No control leads nowhere — pass

### Scenario verdicts — `user-authentication` delta spec

SCENARIO-VERDICT: Report signed-on identity and administrative role to the client / A signed-on administrator's role is reported — pass
SCENARIO-VERDICT: Report signed-on identity and administrative role to the client / A signed-on shopper holds no role — pass
SCENARIO-VERDICT: Report signed-on identity and administrative role to the client / A signed-out visitor is reported as such — pass
SCENARIO-VERDICT: Report signed-on identity and administrative role to the client / Reading the session does not become the post-sign-on destination — pass

38 of 38 scenarios verified; 0 fail; 0 not-testable; 0 spec gaps.

## Recommendation

**Proceed — fire `validation.all_acs_passed`.** DEFECT-1 was fixed in place with a passing re-validation; no unfixable defects were found; every scenario in both delta specs passes on the integrated branch. This ticket (SWHM-T-0240) will transition to DONE first to merge the fix and these three artifacts onto the sprint branch, then the sprint verdict fires.
