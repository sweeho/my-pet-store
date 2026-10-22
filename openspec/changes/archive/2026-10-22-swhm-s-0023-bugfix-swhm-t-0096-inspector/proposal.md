## Why

One defect is committed to this sprint: **SWHM-T-0096**, where the inspector's teardown left data behind on the `whole-app` scope and the staging ledger recorded no entries. I re-verified every claim in the report against the platform's inspection records on 2026-10-22, and the result changes the diagnosis in three ways:

- **The ledger is not empty because of a failure path. It has never been written for this project.** The four runs marked `teardown_failed` (`8ff769c8`, `6b614cd3`, `19d598a1`, `434e2f3a`, all on 2026-09-15 against commit `81f55c7`) each have zero staging rows, and the project as a whole has zero. The report says the `6b614cd3` ledger lists entries and names the failing one. That is false: it has none either.
- **The leftovers were never staged through a ledgered tool.** The run's own step log shows what it created: it drove the storefront's sign-up and profile-edit forms as a visitor would (journey `signup-then-view-edit-profile`, plus the sign-in journeys that reused that account). The writes landed in the inspected instance's own database (`auth_users`, `sessions` and the account/profile tables) as ordinary product traffic. The platform ledger only records the inspector's staging tools, so nothing it could record was ever invoked. That is why the ledger is empty, and the teardown had nothing it knew how to undo.
- **The predicted harm did not happen.** None of the four runs filed a finding that describes leftover data. Their findings (third-party fonts, missing product images, the sign-in redirect, the sign-up form sections) are each about the product as built.

Both halves of the defect sit outside this repository. The ledger write path and the teardown live in the Vortex inspection platform. The leftover rows lived in the database of a Projector preview at `http://172.18.0.30:5173`, which no longer answers, and the dev screen has been rebuilt many times since. No commit to My Pet Store can change either one.

## What Changes

- **No change lands in this repository.** SWHM-T-0096 gets the verified diagnosis and is deferred, with the owning platform component named, following the precedent set for SWHM-T-0235 in change `swhm-s-0022-bugfix-swhm-t-0235-swhm-t-02` (its design D7).
- The diagnosis is recorded in `design.md` and in `artifacts/SWHM-S-0023/SWHM-T-0096/PLAN.md`, so the platform's owners inherit a finished investigation.

Explicitly out of scope:

- **Adding a test-data purge, a "created by inspector" marker or a reset endpoint to the product.** Each one would be a new product capability built to compensate for a platform gap, and it would add a destructive surface to a storefront that has none today. See `design.md` D2.
- **Cleaning the preview database.** That instance is unreachable and has been superseded. There is nothing to clean from here.

## Impact

Affected capabilities: **none.** Nothing the product does changes, so this change carries no spec delta and sets `skip_specs: true`.

Affected code: none.

Risks this change accepts:

- **The next inspection that signs up may still find accounts it did not create.** That will keep happening until the platform either ledgers UI-driven writes or gives each inspection a fresh database. Accounts left on a screen are observable, but they do not break any journey the scope names: sign-up uses a new username each time, and no screen lists other users' accounts.
