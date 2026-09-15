---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0009
ticket: SWHM-T-0094
branch: vortex/fix/SWHM-T-0094-every-page-hotlinks-google-fonts-contrad-21e01de4
upstream: [artifacts/SWHM-S-0009/SWHM-T-0094/PLAN.md]
---

# TDD result — SWHM-T-0094

## Test cases

| Test                                                                                                      | Covers     | Intent                                                                                            |
| --------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `e2e/home.spec.ts › Home page › requests no font, stylesheet, or preconnect hint from a third-party host` | AC-1, AC-2 | every request the home page issues and every `<head>` link element name only the app's own origin |

## Red run

The regression assertion is browser-only (design.md D2: jsdom cannot see a `<head>` link Vite
injects at build time), and this implementation container has no Chromium installed
(`scripts/ensure-playwright-browser.mjs` fails its own preflight — see `AGENTS.md`'s "Implementation
containers do not ship a Chromium" note, the same situation SWHM-T-0016/0018/0020/0022/0023/0024
recorded). The bug is instead reproduced directly against the real build artifact the browser would
have loaded, which is the actual mechanism the fix removes:

`bun run build` (before the fix, HEAD `81f55c7`), then inspecting the rendered `<head>` the server
emits (`.output/server/_chunks/renderer-template.mjs`):

```
<link rel="preconnect" href="https://fonts.gstatic.com/" crossorigin="anonymous">
<link rel="preload" as="style" onload="this.rel='stylesheet'" href="https://fonts.googleapis.com/css2?family=Space Grotesk:wght@300;400;500;700&display=swap">
```

Both lines name a third-party host (`fonts.gstatic.com`, `fonts.googleapis.com`), which is exactly
what the new assertion's `offOriginRequests` / `offOriginLinks` checks fail on — a real RED, quoted
from the actual pre-fix build output rather than a Playwright run.

## Green run

`bun run build` (after the fix) — the same `<head>` now carries no font-related link:

```
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <!-- <link rel="icon" type="image/svg+xml" href="/vite.svg" /> -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <title>My Pet Store</title>
  </head>
```

`grep -n "fonts.googleapis\|fonts.gstatic\|preconnect" .output/server/_chunks/renderer-template.mjs`
— no match (exit 1).

`bun run verify:full` was attempted first (this stack's full gate); its `test:e2e` stage fails the
same preflight noted above (`node scripts/ensure-playwright-browser.mjs`: Chromium not installed at
`/ms-playwright/chromium-1155/chrome-linux/chrome`). Per `AGENTS.md` § Test & validate and the prior
agent note, the documented fallback is `bun run verify` — lint + typecheck + the complete unit suite
— with the gap stated rather than retried; the Playwright spec itself is observed in CI on this
branch and again at INTEGRATION_QA (design.md § Verification note).

`bun run verify` (lint + typecheck + complete unit suite, after the fix):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ node scripts/ensure-generated-files.mjs
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  55 passed (55)
      Tests  302 passed (302)
   Duration  4.55s
```

Lint and typecheck reported no errors; all 55 test files / 302 tests pass — no regression from
removing the `unplugin-fonts` plugin and dependency.

TDD-RESULT: 302 passed, 0 failed
