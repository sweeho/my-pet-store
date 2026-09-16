# PLAN — SWHM-T-0176

**Task group:** `## 2. Validation` (checkboxes 2.1, 2.2, 2.3)
**Change:** `swhm-i-0009-payment-credit-card-processi`
**Capability:** `payment-processing`
**Requirements:** Card expiry validation (ADDED), Card type acceptance (ADDED)
**Depends on:** SWHM-T-0175 — `payment/types.ts` is complete before this ticket starts

## Objective

Decide whether a card may be used: an expiry comparison against the current date, and a card-type check against the store's accepted list. Both are pure functions over the submission type SWHM-T-0175 defined; neither reads the database and neither talks to a processor. Read `design.md` first — `§ Decisions` D2 and D4 settle the two questions this ticket would otherwise have to re-litigate.

## Design reference

`artifacts/SWHM-S-0016/design/` — see `MANIFEST.md`. The "validation and authorization states" mockup is the authority for **what a refusal says**: State A shows a form-level alert naming how many problems there are, with a per-field message beneath each offending control ("Card type not accepted…", "Card has expired (04 / 2024)."). This ticket produces the decisions those messages render; SWHM-T-0177 renders them.

## Steps

1. **Read `design.md` first**, in full.
2. **Write `payment/expiry.ts`** (`design.md § Decisions` D4). It compares the parsed month and year against the current date and **distinguishes a missing or malformed expiry from an expired one** — three outcomes, not two. This is the whole reason it is a new module: `account/card.ts`'s accessors fall back to `01`/`2010`, so a card with no expiry at all would otherwise be reported as expired, which is a different and wrong message to show a shopper.
3. **Leave `account/card.ts` untouched.** Its fallbacks are asserted by an archived scenario in the `account-management` spec of record (`design.md § Codebase findings` F3, F14). Read `MM`/`YYYY` through its accessors if that is convenient, but do not change what they return.
4. **Write `payment/validation.ts`** — the card-type check, importing `CARD_TYPES` from `account/vocabulary.ts` and never redefining it (`design.md § Decisions` D2). The delta spec's scenario says "GIVEN a Visa card"; this store accepts `Java(TM) Card`, `Duke Express` and `Meow Card`, and the discrepancy is recorded at S4 rather than resolved by editing the spec. Implement the requirement as written — a recognised type is accepted, an unknown one is rejected — against this store's list.
5. **Cover the boundaries in the module tests**: the month the card expires in is still valid through the end of that month; the month after is not. A malformed value is reported as missing, not expired.

## File / module ownership

Create or modify only:

- `payment/expiry.ts` + `payment/expiry.test.ts` (new)
- `payment/validation.ts` + `payment/validation.test.ts` (new)

Do not modify `account/card.ts`, `account/vocabulary.ts` or `account/validation.ts`. `CARD_TYPES` is a fixed interface contract this ticket reads and never redefines — it is the one place the accepted types are written down, and a second copy is how two screens come to disagree about what the store takes. `payment/types.ts` belongs to SWHM-T-0175.

## Definition of Done

- AC-1, AC-2 and AC-3 hold, each evidenced by the assertion that carries it.
- A missing or malformed expiry is reported as missing, never as expired, and the current month is not treated as past.
- `CARD_TYPES` has exactly one definition in the repository after this ticket, as it had before.
