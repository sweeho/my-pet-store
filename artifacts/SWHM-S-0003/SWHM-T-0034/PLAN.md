# SWHM-T-0034 — Account data model and duplicate-account rejection

Change `swhm-i-0003-customer-account-profile-man`. **Read
`openspec/changes/swhm-i-0003-customer-account-profile-man/design.md` first** — it carries
the decisions this plan rests on. Exact shapes are pinned in
`../INTERFACES.md`; they are a contract, not a suggestion, because SWHM-T-0035 and
SWHM-T-0036 are written against them.

## Objective

Give a customer somewhere to keep everything the account holds beyond credentials, and make
a repeat registration fail with a message instead of a database error.

This is the first ticket in the chain and the only one that touches `db/schema.ts` or
`auth/`.

## Design reference

Idea SWHM-I-0003 carries one design block, exported to
`../design/wireframe-customer-profile.html` (index: `../design/MANIFEST.md`). It is a
screen wireframe and this ticket builds no screen, so it constrains nothing here — it is
listed because the fields it labels are the fields these tables must be able to hold.
Check that every labelled field has a column: first name, last name, street address, city,
state/province, postal code, country.

## Steps

1. **Schema** — add the six tables to `db/schema.ts` exactly as `../INTERFACES.md` § Tables
   specifies: `customers`, `accounts`, `profiles`, `contact_info`, `addresses`,
   `card_metadata`. Each takes `user_name` as its primary key and foreign-keys upward with
   `ON DELETE CASCADE`; the relationships are 1:1 throughout, which is why there is no
   surrogate id. Mirror the column style of the tables already in the file.
   → verify: the new tables read like the existing ones, and `card_metadata` has no
   card-number column.

2. **Migration** — generate it into `drizzle/` and commit it. A schema change is not
   complete without the migration (ARCHITECTURE.md § Data model).
   → verify: a new file is present in `drizzle/` and the journal lists it.

3. **Module scaffold** — create `account/` as a top-level directory. It must NOT go under
   `routes/`, where a `.ts` file becomes an HTTP endpoint by existing, and it must not be
   named `utils`. Register `account/**/*.test.ts` in Vitest's `server` project include and
   add it to the `client` project's exclude — the jsdom project cannot resolve `bun:sqlite`
   at all, so a test that reaches `db/client.ts` from there fails at import.
   → verify: a trivial test in `account/` runs in the `server` project.

4. **Types and vocabularies** — `account/types.ts` and `account/vocabulary.ts`, verbatim
   from `../INTERFACES.md`. One exported list per vocabulary, shared by the validator here
   and by the form in SWHM-T-0036 — two copies would drift.

5. **`account/card.ts`** — `expiryMonth`, `expiryYear`, `lastFour`. The parsing contract is
   in design.md D1 and SPEC-DISCREPANCIES S4: `"12/2025"` gives `"12"` and `"2025"`; a
   malformed or empty value gives the legacy fallbacks `"01"` and `"2010"`.

6. **`account/customer.ts`** — `createCustomer`, `findAccount`, `getAccountOrDefaults`,
   `updateAccount`. `createCustomer` writes the account row with status `"active"` and the
   profile row with the spec's defaults. `getAccountOrDefaults` returns those defaults
   rather than undefined when no row exists (design.md D4) — customers registered in
   SWHM-S-0002 have no account rows and must not see an error state.
   `updateAccount` reduces any supplied `cardNumber` to `lastFour` and discards it
   (design.md D1); nothing downstream may see the full number.

7. **`account/validation.ts`** — `validateAccountUpdate` rejects a language outside
   `LANGUAGES`, a category outside `CATEGORIES` and a card type outside `CARD_TYPES` with
   `AccountValidationError`. It does NOT reject state or country: those vocabularies are the
   legacy form's dropdown options, no scenario describes rejecting a fourth, and enforcing
   them would fail any address outside three US states (design.md D6).

8. **Duplicate rejection** — in the EXISTING `auth/validation.ts`, add a check to
   `validateNewUser` that throws `new CreateUserError("User ID ${userName} already exists")`
   when the name is taken. Keep its exported signature. It runs inside `insertUser`, and
   `routes/api/signon/create-user.post.ts` already catches `CreateUserError` and redirects
   to the user-creation error page — so **do not change that route or that page**
   (design.md D3).
   → verify: a second registration of the same name returns the message and adds no row.

9. **Wire registration** — call `createCustomer(userName)` from the success path of
   `auth/user.ts:insertUser`, after the insert. This is what `ejbPostCreate` did
   (design.md D2). `insertUser`'s exported signature is unchanged.
   → verify: registering a new user leaves account and profile rows with the defaults.

10. **Tests** — in `account/`, in the `server` project: creation writes both rows with the
    right defaults; `getAccountOrDefaults` returns defaults for an unknown user;
    `updateAccount` round-trips contact info, address, card metadata and profile; expiry
    parsing including the fallback; `lastFour`; each validation rejection; and the duplicate
    user name. Mirror the shape of the existing `auth/*.test.ts` files.

## File / module ownership

Create or modify **only** these:

- `db/schema.ts`
- `drizzle/**` (generated migration + journal)
- `vitest.config.ts` (add `account/**` to the `server` include and the `client` exclude)
- `account/types.ts`, `account/vocabulary.ts`, `account/card.ts`, `account/customer.ts`,
  `account/validation.ts`, and their `*.test.ts`
- `auth/validation.ts`, `auth/user.ts` (and their existing tests, extended)

Do not touch `routes/**`, `src/**`, `middleware/**`, `auth/session.ts`,
`auth/authenticate.ts`, or the template's `users` table and its routes.

## Definition of Done

The ticket's acceptance criteria AC-1 through AC-8, verified by the tests in step 10.

Fixed contracts this ticket establishes and may not deviate from: the six table and column
names, the exported type shapes, and the five function signatures — all in
`../INTERFACES.md`. SWHM-T-0035 codes against them before this ticket merges. If one is
wrong, comment on the ticket and message `planning` rather than changing it.
