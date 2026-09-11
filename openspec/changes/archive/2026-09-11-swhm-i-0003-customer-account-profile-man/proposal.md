# Account Management Capability — Proposal

## Why

A customer of My Pet Store today is a user name and a password and nothing else.
SWHM-S-0002 settled who a customer is; it deliberately left what an account _holds_ to its
own capability, and `PRODUCT.md` § Not yet decided records that deferral in as many words.

Everything the store still has to build needs that account to exist. An order needs a
delivery address and a contact; a catalogue that remembers a favourite category needs
somewhere to keep it; a translated storefront needs a stored language preference to
translate into. Specifying those piecemeal, inside the capabilities that happen to need
them first, would scatter one entity across four changes.

There is also a defect to close. The idea's own acceptance criterion — duplicate accounts
are rejected with a descriptive error — is not met by the code: `auth/validation.ts` checks
length and forbidden characters only, so registering a name that already exists reaches the
`auth_users` primary-key constraint and surfaces as an unhandled database error.

## What Changes

- A customer account: contact information, a single address, card metadata and profile
  preferences, all keyed to the existing `auth_users` credential row.
- Registration creates the account and profile rows with the specified defaults
  (`en_US`, no favourite category, myList and banners on), the way the legacy
  `ejbPostCreate` did. No second account-creation endpoint is introduced.
- A read and an update endpoint for the signed-on customer's own account.
- `/customer` — a placeholder page since SWHM-S-0002 — becomes the profile screen: a
  read-only view built to the idea's wireframe, with an edit form over the same data.
- A duplicate user name is rejected at registration with a descriptive message.
- The stored language preference is reported on later sessions and drives the document
  language.

**Card numbers are deliberately not stored.** `PRODUCT.md` § Scope makes owning card data a
standing non-goal, and `legacy-analysis/rebuild-guidance.md` § Gotchas #10 directs the
rebuild not to replicate the legacy's plaintext card storage. Card type, expiry and the
last four digits are; the number itself never reaches persistence. The delta spec, which is
an unedited extraction from the legacy system, asks for the number — that deviation and ten
others are recorded in `artifacts/SWHM-S-0003/SPEC-DISCREPANCIES.md` rather than by editing
the spec, following the precedent SWHM-S-0002 set.

## Capabilities

### New Capabilities

- `account-management`: what a customer's account holds beyond credentials — contact
  information and address, card metadata, and profile preferences — together with how an
  account is created, read and updated.

### Modified Capabilities

None. `user-authentication` gains a duplicate-user-name rejection, but that behaviour is
already required by its own specification of record: "The system SHALL validate username
and password constraints and reject invalid input with descriptive error messages"
(`openspec/specs/user-authentication/`). This change implements an existing requirement
rather than altering one, so it carries no delta for that capability.

## Impact

**Code**

- `db/schema.ts` — six new tables; `drizzle/` gains the generated migration.
- `account/` — a new server-side capability module, outside the directories Nitro scans,
  with its tests registered in Vitest's `server` project.
- `auth/validation.ts`, `auth/user.ts` — the duplicate check, and the call that creates the
  account rows at registration. Exported signatures are unchanged.
- `routes/api/customer/` — the read and update endpoints.
- `src/pages/customer.tsx` — the profile screen, replacing the placeholder body.

**Unaffected on purpose**

`auth_users`, `sessions`, the sign-on routes and pages, and the template's `users` table and
its routes — which `e2e/smoke.spec.ts` probes as regression cover for the Bun-runtime
constraint — are all untouched.

**Risks**

- The idea asks for multiple billing and shipping addresses; the extracted spec is 1:1
  throughout and is the source of record. One address ships, and separate addresses are
  raised for order placement (SWHM-I-0008), where the legacy model puts them.
- The wireframe draws a read-only profile and no edit form, so the form is built from the
  existing design system rather than from a mockup.
- `Account.status` is specified as `active` or `disabled` with no way to change it;
  suspension is explicitly out of the idea's scope, so the column ships write-once.
