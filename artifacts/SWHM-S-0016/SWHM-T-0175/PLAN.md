# PLAN — SWHM-T-0175

**Task group:** `## 1. Data Model` (checkboxes 1.1, 1.2)
**Change:** `swhm-i-0009-payment-credit-card-processi`
**Capability:** `payment-processing`
**Requirement:** Credit card storage (ADDED)

## Objective

Create the `payment/` capability module, write the types the three following tickets code against, and confirm the storage path a card takes — without adding a column, a migration or encryption. The group's two checkboxes ask for a `CreditCard` entity with a number and a cardholder, and for encrypted storage; neither is built, for the reasons in `design.md § Spec discrepancies` S1–S3 and `§ Decisions` D1. Read that document first.

## Design reference

`artifacts/SWHM-S-0016/design/` — see `MANIFEST.md`. No screen is built by this ticket; the mockups matter here only for the fields the payment submission must carry, which fix the shape of the transient type this ticket defines. The "Encrypted at rest" pill and the persisted cardholder name in those mockups are explicitly not built (S2, S3).

## Steps

1. **Read `design.md` first**, in full — the Planning record from `## Codebase findings` down. It records that `card_metadata` already exists, that a card number is never persisted, and that the accepted card types are already fixed elsewhere.
2. **Create `payment/types.ts`, written whole** (`design.md § Decisions` D8 — no later ticket in this sprint extends it). It carries two shapes that must be distinguished: what is _submitted_ for an authorization, which includes the transient card number and cardholder name, and what is _stored_, which is the existing `CardMetadata` from `account/types.ts` and is imported, never redefined.
3. **Register the module in all three places** (`design.md § Decisions` D3, `§ Codebase findings` F9): the Vitest `server` project's `include`, the `client` project's `exclude`, and `tsconfig.node.json`'s `include`. Registering in one and not the others is the documented failure mode — a test that reaches the database driver from the jsdom project cannot resolve it at all.
4. **Confirm the storage path rather than building a new one.** `account/customer.ts` already reduces a submitted number to its last four digits before writing, and `card_metadata` already holds the type, the expiry and those digits. Establish in a test that this is what "stored for authorization" means here, and add no schema change.

## File / module ownership

Create or modify only:

- `payment/types.ts` (new) — written whole by this ticket
- `payment/index.ts` (new, optional barrel)
- `payment/types.test.ts` (new) — the storage-path assertion for AC-1
- `vitest.config.ts` — `payment/**/*.test.ts` into the `server` include, `payment/**` into the `client` exclude
- `tsconfig.node.json` — `payment` into `include`

Do not modify `db/schema.ts`, `drizzle/`, `account/card.ts`, `account/customer.ts`, `account/vocabulary.ts` or `account/types.ts`. `card_metadata` and the `{ cardType, expiryDate, lastFour }` shape are fixed interface contracts settled in change `swhm-i-0003-customer-account-profile-man`.

## Definition of Done

- AC-1 holds, evidenced by the assertion that carries it.
- `payment/` resolves from the `server` Vitest project and from `tsconfig.node.json`, and is excluded from the `client` project.
- No schema change, no migration, no encryption, and no card number written anywhere.
