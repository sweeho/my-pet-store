# Design — SWHM-S-0023 bugfix

Measured at planning time (2026-10-22) against the platform's inspection records and this repository on the sprint branch `vortex/sprint/swhm-s-0023-8ac9cbb9`. Nothing below is carried over from the defect report unverified.

## Findings

- **F1. Four runs are marked `teardown_failed`, and none has a ledger row.** Inspection runs for this project with `staging_status = teardown_failed`: `8ff769c8` (12:36Z), `6b614cd3` (15:58Z), `19d598a1` (16:52Z, scope `whole-app`) and `434e2f3a` (17:00Z, scope `whole-app`). All ran on 2026-09-15 against `http://172.18.0.30:5173`, built from `81f55c7`. Each has 0 rows in the inspector staging ledger, and the project has 0 in total. The report's claim that `6b614cd3` has usable ledger entries does not hold.
- **F2. The data was created through the product's own forms.** The step log of `19d598a1` (121 steps, all `ok`) covers browse, search, `signup-then-view-edit-profile`, the sign-in journeys, `signup-username-too-long` / `-invalid-chars` (both rejected at `/user-creation-error`, so they wrote nothing), a protected-resource redirect, a phone pass, a keyboard pass, and not-found paths. Only the sign-up and profile-edit steps write anything. In this product those writes go through `auth/authenticate.ts` (`createUser`), `auth/user.ts` and `auth/session.ts` into `auth_users` and `sessions`, and through the account screens into the account/profile tables in `db/schema.ts`.
- **F3. The ledger only covers the inspector's staging tools.** Each ledger row is keyed by the staging `tool` and `entity_ref` that created it. A form submitted in the browser goes through no staging tool, so it can never produce a row. An empty ledger is what this run should have produced, not a lost write.
- **F4. The data store was the preview's, and it is gone.** `db/client.ts` opens `sqlite.db` from the serving process's working directory. That file belonged to the Projector screen at `172.18.0.30:5173`, which refused a connection on 2026-10-22, and the screen has been rebuilt for every sprint since `81f55c7`. No code in this repository runs inspections, stages data, writes the ledger or tears anything down. A search for `inspector`, `staging`, `ledger` and `teardown` across the source finds only comments and archived artifacts.
- **F5. No finding was caused by leftovers.** The four runs filed five findings in total, each about the product as built: Google Fonts hotlinking, missing product images, the post-sign-in redirect, and the sign-up form's sections. None describes data the inspector failed to create.

## Decisions

- **D1. Do not fix SWHM-T-0096 in this repository; defer it with the owner named.** The two defective behaviours belong to the Vortex inspection platform. One is the teardown, which reports `teardown_failed` with nothing ledgered to tear down. The other is the absence of any record for data created through the UI. An implementation ticket here could not change either one. This follows change `swhm-s-0022-bugfix-swhm-t-0235-swhm-t-02` D7.
- **D2. Do not add product-side cleanup.** A purge endpoint, an inspector marker column or a reset script would be a new capability with a destructive surface, built only to compensate for the platform. The durable fix is on the platform side (D4). Building it in the product would also leave every other project the inspector covers just as exposed.
- **D3. Carry no spec delta.** Nothing the product does changes, and a requirement written only to satisfy the change format would be a requirement nobody asked for. `.openspec.yaml` sets `skip_specs: true`, which is the CLI's documented form for a change that modifies no specs.
- **D4. Findings handed to the platform's owners (not steps for this sprint).**
  1. **Do not report `teardown_failed` when the ledger is empty.** With nothing ledgered, the true state is "nothing to tear down, and UI-created data unknown". It is not a failed teardown, and the current status hides the real gap.
  2. **Record UI-driven writes, or isolate them.** Either record the write requests the browser driver observes (method, URL and response for every POST/PUT/PATCH/DELETE) as unverified staging entries, or give each inspection run a fresh copy of the screen's data store. The second needs no knowledge of the product's schema.
  3. **Write the ledger entry before the staged item is created**, as the report recommends. That still applies to the staging tools, but it would not have changed these four runs (F3).

## Open questions

- **O1. Should the inspector's sign-up journey use a known, reusable test account?** The inspector config has a `test_credential_ref` slot. Pre-provisioning an account would stop each run creating a new one. Deciding that is an operator decision about the inspection's configuration, not about the product.
