# PLAN — SWHM-T-0024 · Integration testing

Sprint: SWHM-S-0002 · Change: `swhm-i-0002-user-authentication-sign-on` · Capability: `user-authentication`
Requirements: all ten in the change's delta spec, exercised end to end

Read `openspec/changes/swhm-i-0002-user-authentication-sign-on/tasks.md` § 10 first — the nine
checkboxes there are the test list, and this plan does not restate them. Then
`artifacts/SWHM-S-0002/INTERFACES.md` for the surfaces under test and
`artifacts/SWHM-S-0002/SPEC-DISCREPANCIES.md` for what each legacy name maps to.

## Design reference

No design blocks on idea SWHM-I-0002 — nothing under `artifacts/SWHM-S-0002/design/`. The
browser assertions target the screens SWHM-T-0023 built.

## Objective

Prove the capability as a whole rather than module by module: the registration-to-sign-in
journey through the API, and the three browser-only behaviours — the remembered username, the
interception of a protected page, and the return to the originally-requested URL.

## Steps

1. **API integration file.** `routes/api/signon/flows.test.ts` — cross-endpoint flows sharing
   one session, covering tasks 10.1–10.6: create an account and sign in with it; a 25-character
   username is accepted and a 26-character one is refused; `%` in a username is refused with the
   spec's message; the correct password authenticates and a wrong one does not; a username that
   was never created does not authenticate. These are flows, not repeats of the single-endpoint
   assertions each route already carries — add value by crossing endpoints, not by duplicating.
2. **Browser spec.** `e2e/signon.spec.ts`, following the shape of `e2e/home.spec.ts` and using
   accessible roles, covering tasks 10.7–10.9:
   - register a new customer from `/signon`, then sign in with "Remember My User Name" checked,
     reload `/signon`, and assert the username field is pre-filled from `bp_signon`;
   - visit `/customer` while unauthenticated and assert the browser lands on `/signon`;
   - from that same interception, sign in and assert the browser lands back on `/customer`.
     This is the scenario "User is redirected to original URL after successful sign-in", and it
     is the one assertion that proves ORIGINAL_URL survives the round trip.
3. **Test isolation.** Give each browser test a username that no other test uses — the E2E tier
   runs against a file-backed database and `fullyParallel` is on, so a fixed username makes the
   second run of the suite fail on a duplicate primary key. Derive it from the test title or a
   counter, not from a random value that makes a failure unreproducible.
4. **Run the browser tier before finishing.** A spec that has not been executed is not a test.
   If the E2E preflight reports Chromium genuinely missing in this container, say so in the work
   log and let CI run the tier — do not retry it and do not install a browser.

## File / module ownership

May create or modify — nothing else:

| Path                              | Why                                     |
| --------------------------------- | --------------------------------------- |
| `routes/api/signon/flows.test.ts` | NEW — cross-endpoint integration flows  |
| `e2e/signon.spec.ts`              | NEW — the three browser-only behaviours |

Out of ownership: every implementation file in this sprint — if a flow fails, the defect is in a
ticket that is already DONE, so raise it rather than edit the implementation from here.
`e2e/home.spec.ts`, `e2e/smoke.spec.ts`, `playwright.config.ts`, `vitest.config.ts`,
`openspec/`, `artifacts/`, and the repository-root narrative documents are all out of scope.

## Definition of Done

AC-1 through AC-7 are met by the flows in step 1 (10.1–10.6), AC-8 by the remembered-username
journey, AC-9 by the interception journey and AC-10 by the return-to-original-URL journey in
step 2. Each restates a scenario in the change's delta spec; together they are the evidence
validation reads at integration QA.
