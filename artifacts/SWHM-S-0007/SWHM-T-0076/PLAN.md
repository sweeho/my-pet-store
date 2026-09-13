# SWHM-T-0076 — Testing

**Change:** `swhm-i-0005-multi-language-support` · **Group:** `## 5. Testing` (5.1–5.4)
**Requirements:** Multi-language support; Language preference persistence; Locale parameter propagation
**Depends on:** SWHM-T-0075

> Read `openspec/changes/swhm-i-0005-multi-language-support/` first, then
> `artifacts/SWHM-S-0007/PLANNING-NOTES.md` § Phases → Test harness. No harness or CI change is owed
> by this ticket; if you think one is, read that section before touching a config file.

## Objective

Prove in a real browser what no jsdom test can reach: that a language choice survives a reload,
travels across navigation, follows a signed-on customer into a second browser, and that an
untranslated drill-in is distinguishable from a broken link.

## Why the browser tier and not more unit tests

Boxes 5.1–5.4 ask for catalogue queries exercised in each locale and for missing locale data returning
null. Those already exist at the data layer: `catalog/item.test.ts:99` covers the null case,
`catalog/query.test.ts:91-119` covers `ja_JP` and an absent locale, `catalog/performance.test.ts:32`
runs across all three. Confirm them; adding a fourth copy proves nothing new.

What is uncovered is every behaviour that needs a real cookie jar, a real reload and a real server
round trip. A jsdom test cannot observe a cookie surviving a page load, and cannot have two browser
contexts.

## Design reference

`artifacts/SWHM-S-0007/design/mockup-category-page-in-no-content-in-this-lang.html` — the copy and the
two actions the 中文 assertion targets. `artifacts/SWHM-S-0007/design/MANIFEST.md` lists all three
references.

## Steps

1. **`e2e/language.spec.ts`** (new). Keep it separate from `e2e/catalog.spec.ts`, which owns the
   browse-and-search journey — a language spec appended there would make one failure ambiguous between
   two capabilities.
2. **Visitor path.** Switch to 日本語 on `/catalog` through the control, assert a Japanese category name
   (`犬` — seeded, and the delta spec's own example), reload, assert it again, then navigate to a
   category screen and assert Japanese there too. No session anywhere in this test.
3. **Signed-on path.** Create a user and sign on via `page.request` so the session lands in the page's
   own cookie jar — the pattern `e2e/catalog.spec.ts:78-88` and `e2e/customer-profile.spec.ts` already
   use. Switch to 日本語 on a catalogue screen, then read `ja_JP` back from `GET /api/customer`. Then
   open a **fresh browser context**, sign on as the same customer, and assert the catalogue is Japanese
   with no cookie carried over — that is the "follows you to any device" claim, and a second context is
   the only way to make it.
4. **中文 path.** Switch to 中文, assert the five category names render in Chinese on `/catalog`, drill
   into a category, assert the unavailable-in-this-language message, click **View in English (US)**, and
   assert the product list is present in English. This reaches the real `zh_CN` gap in the seed
   (SWHM-T-0073 pins it) — seed nothing test-specific.
5. **Unknown id under a non-default locale.** With 日本語 active, request an unknown item id and assert
   the Not Found screen, not the unavailable message. This is the assertion that fails if anything
   infers "untranslated" from the locale alone rather than from the `reason` discriminator.
6. **Check `e2e/catalog.spec.ts` still passes.** Its signed-on-locale test (`:76-100`) sets
   `preferredLanguage` through `PUT /api/customer` and expects `/catalog` in Japanese — still correct
   under the new resolution order, since that path sets no cookie and no search param. If it fails,
   the resolution order regressed; fix the cause, not the assertion. Adjust the specs only where this
   sprint genuinely moved what they observe (e.g. new chrome changing an accessible name).
7. **Run the specs.** A spec that has not been executed is not a test.

## Fixed interface contracts

None defined. Consumed: the control's accessible name and option labels (SWHM-T-0072), and the
unavailable state's heading and two action names (SWHM-T-0075). Locate everything by role and
accessible name, as every existing spec in `e2e/` does — never by class name or DOM shape.

## File / module ownership

`e2e/language.spec.ts` (new); `e2e/catalog.spec.ts` only where step 6 requires it.

Not this ticket's: everything under `src/`, `catalog/`, `routes/` and `db/`. A product bug found here
is a defect ticket, not an edit — this ticket owns no product code. `playwright.config.ts` and
`.github/workflows/ci.yml` need no change: the browser tier already runs on :5178 with `--strictPort`,
and CI already runs it on every `vortex/**` push and pull request.

## Definition of Done

AC-1 through AC-6 on the ticket, mapping to steps 2, 3, 4, 5, 6 and 7 in order.

## Gotchas

- **The implementation containers ship no Chromium.** The E2E preflight
  (`scripts/ensure-playwright-browser.mjs`) fails fast saying so — six tickets in SWHM-S-0002 each hit
  it. That is expected: fall back to the browser-free core gate, state it plainly in the work log, and
  do **not** retry or install a browser (`.vortex/agents-generated.md`). Step 7 still stands — run the
  specs wherever a browser is available to you; the tier itself runs in CI on this ticket's branch and
  again at integration QA, which is where these assertions are finally observed. If you could not run
  them locally, say so rather than implying you did.
- Usernames in `e2e/` are built by `uniqueUsername()` and must stay within 25 characters
  (`MAX_USERID_LENGTH`); the helper throws rather than letting a truncated name confuse a failure.
- Playwright runs on :5178, a dev server on :5000 — they never collide, and `--strictPort` means a
  port clash fails loudly instead of silently absorbing the run.
- `bun --bun` matters wherever the web server is started: losing it breaks every `bun:sqlite`-backed
  route while static pages stay green, which is a silent failure by construction
  (`ARCHITECTURE.md § Cross-cutting constraints`).
- Assert on content that is genuinely locale-specific. `猫` is the `zh_CN` name for CATS _and_
  the `ja_JP` name, so it distinguishes neither language — `鳥`/`鸟` and `犬`/`狗` do.
