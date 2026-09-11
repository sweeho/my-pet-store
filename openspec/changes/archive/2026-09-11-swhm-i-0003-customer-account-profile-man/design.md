# Account Management — Design Document

The delta spec in `specs/account-management/` was extracted from the legacy Java EE
petstore and is adopted unedited. This document records how that behaviour is built **on
this stack**, and the decisions taken to get there. The full legacy-to-repository artifact
mapping lives in `artifacts/SWHM-S-0003/SPEC-DISCREPANCIES.md`; the exact schemas, types
and signatures the three tickets share are pinned in `artifacts/SWHM-S-0003/INTERFACES.md`.

Read those two alongside this file. This one is the reasoning; they are the contract.

## Measured context

- `db/schema.ts` carries `users` (template demo content, probed by `e2e/smoke.spec.ts`),
  `auth_users` (`user_name` PK, scrypt-hashed `password`) and `sessions`. No customer,
  account or profile entity exists.
- `auth/` is the established capability-module pattern — a top-level directory outside the
  ones Nitro scans, because a `.ts` file under `routes/` becomes an HTTP endpoint by
  existing. Its tests run in Vitest's `server` project (`vitest.config.ts:50`).
- `/customer` exists as a placeholder page behind `RequireSignOn`, created by SWHM-S-0002 as
  the ORIGINAL_URL redirect target. It is the screen this capability fills in.
- Registration is `POST /api/signon/create-user` → `auth/user.ts:insertUser` →
  `auth/validation.ts:validateNewUser`. Nothing checks whether a user name is already taken.

## Entity hierarchy

The legacy model, preserved:

```
Customer (root) — userName (PK, = auth_users.user_name)
  ├─ Account — status ("active" | "disabled")
  │   ├─ ContactInfo — givenName, familyName, telephone, email
  │   │   └─ Address — streetName1, streetName2, city, state, zipCode, country
  │   └─ CardMetadata — cardType, expiryDate (MM/YYYY), lastFour
  └─ Profile — preferredLanguage, favoriteCategory, myListPreference, bannerPreference
```

Every relationship is 1:1, so each table takes `user_name` as its own primary key and
foreign-keys upward with `ON DELETE CASCADE`. That is what the legacy CMP cascade-delete
did, expressed as a constraint rather than as container behaviour, and it removes a
surrogate id per table that nothing would ever select by.

## Decisions

### D1 — Card metadata is stored; the card number is not

The spec requires a `CreditCard` entity holding the card number. Two standing constraints
forbid it: `PRODUCT.md` § Scope makes "owning payment card data directly" a non-goal, and
`legacy-analysis/rebuild-guidance.md` § Gotchas #10 says the legacy probably stored
plaintext and "Do NOT replicate that."

So the table is `card_metadata` — `card_type`, `expiry_date`, `last_four`. The edit form
accepts a full number, the update path reduces it to four digits, and nothing writes the
rest. Card type and expiry round-trip exactly, and the expiry-parsing scenario is
untouched, so the only scenario clause this costs is the literal storage of the number.

This is the same trade SWHM-S-0002 made for plaintext passwords, and it binds every later
capability: a card number that a real payment flow needs belongs to SWHM-I-0009
(`payment-processing`), which the non-goal already says integrates a processor.
**Promoted to ARCHITECTURE.md § Key Decisions.**

### D2 — Registration creates the account; there is no second creation endpoint

The spec's creation form collects credentials and profile data together. Half of that
already exists and is specified by another capability: `POST /api/signon/create-user`
creates the credential row. Building a second creation path would duplicate it and leave
two ways to make a customer.

Instead `insertUser` calls `createCustomer(userName)` on success, which writes the account
and profile rows with their defaults — exactly what `ejbPostCreate` did, at exactly the
moment it did it. Everything the customer supplies beyond credentials is captured by the
edit form. `POST /api/customer` is deliberately absent.

### D3 — Duplicate rejection is a credential rule, so it goes in `auth/validation.ts`

The idea's third acceptance criterion is not met by the code today: `validateNewUser`
checks length and forbidden characters, so a repeat registration reaches the `auth_users`
primary-key constraint and throws a raw SQLite error the route does not recognise.

Adding the check to `validateNewUser` as a `CreateUserError` puts it where the other two
credential rules already live, and `create-user.post.ts` already maps `CreateUserError` to
the user-creation error page. The descriptive message therefore reaches the customer with
no change to the route or the page — the smallest change that satisfies the criterion.

### D4 — The read route returns defaults, never a 404

Customers registered during SWHM-S-0002 have credential rows and no account rows, and a
customer who has never opened `/customer` has nothing to show either. A 404 would make the
profile screen's first render an error state for every existing customer.

`getAccountOrDefaults` returns the spec's own Profile defaults (`en_US`, null,
true, true) and empty contact fields when no row exists, so the form's pre-population
scenario is satisfied for an account that has not been filled in yet.

### D5 — "Applied to subsequent sessions" means the preference, not translated content

The idea says the language preference is "applied to subsequent sessions". No scenario in
the delta spec describes translated content, and `internationalization` is a separate
capability with its own change (SWHM-I-0005).

Scope here: the stored preference is returned for that customer on a later, separate
session and drives the document's `lang` attribute. That is observable and testable in the
browser tier. Translating copy is left to SWHM-I-0005, and this sprint does not claim it.

### D6 — Language and category are enforced server side; state and country are not

The spec's language and category vocabularies are complete and are read back as behaviour,
so an out-of-vocabulary value is a rejection. Its state and country lists are the legacy
form's dropdown options — three US states and four countries — and no scenario describes
rejecting a fourth. Enforcing those would fail any address outside three states, so they
are offered as the form's options and accepted as typed.

## Form behaviour

One screen, `/customer`, rather than the spec's two JSPs. It renders read-only by default —
which is the wireframe the idea carries — and reveals an edit form pre-filled from
`GET /api/customer`, which is the SPA's equivalent of the spec's EL pre-population. Saving
`PUT`s and returns to the read-only state.

The wireframe draws only the read-only half; the edit form is built from the existing
design system, as SWHM-S-0002 built the sign-on screens. See
`artifacts/SWHM-S-0003/design/MANIFEST.md`.

## Out of scope

- Account suspension — the `status` column exists and is always `active` (idea non-scope).
- Multiple billing/shipping addresses — the spec is 1:1; separate addresses arrive with
  order placement, SWHM-I-0008. Raised as an improvement ticket.
- Address validation against postal services (idea non-scope).
- Changing a password (idea non-scope).
