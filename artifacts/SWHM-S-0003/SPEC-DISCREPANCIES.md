# Spec discrepancies — SWHM-S-0003 · change `swhm-i-0003-customer-account-profile-man`

The `account-management` delta spec was EXTRACTED from the legacy Java EE petstore. It
describes what that system did. This repository is a React 19 SPA + Nitro 3 (H3 2) server

- Drizzle/SQLite under Bun, so a number of the spec's artifacts have no counterpart here.

This follows the precedent set by `../SWHM-S-0002/SPEC-DISCREPANCIES.md`: **the delta spec
is not edited.** Each entry states what the spec says, what the code actually is, and the
resolution every ticket plan builds to. Where a scenario names a legacy artifact, the
resolution preserves the scenario's OBSERVABLE outcome — which is what validation reports
a verdict against at integration QA.

---

## S1 — The spec describes EJB entity beans; this repository has Drizzle tables

`design.md` and `tasks.md` as seeded name `ejbCreate(userId)`, `ejbPostCreate()`,
CMP relationships with cascade-delete, `CustomerEJBAction.perform(CREATE event)`,
`scf.createCustomer(userId)`, a `CustomerEvent` payload, and the form endpoints
`createcustomer.do` and `customer.do`. None of these exists here, and
`legacy-analysis/rebuild-guidance.md` states that the legacy paths do NOT define the
rebuild's API.

Both files have been rewritten for this stack — `design.md` because implementation reads
it first for the technical decisions, `tasks.md` because the platform ticks its checkboxes
by ticket key and the seeded list carried no keys at all. `proposal.md` and
`specs/account-management/spec.md` are the adopted extraction and are left as they are.

**Resolution** — a one-to-one mapping, used identically by every ticket plan:

| Spec artifact                            | This repository                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------- |
| `Customer` (CMP entity, `userId` PK)     | `customers` table, `user_name` PK → `auth_users.user_name`                            |
| `Account` entity                         | `accounts` table (`status`)                                                           |
| `Profile` entity                         | `profiles` table                                                                      |
| `ContactInfo` entity                     | `contact_info` table                                                                  |
| `Address` entity                         | `addresses` table                                                                     |
| `CreditCard` entity                      | `card_metadata` table — see S3                                                        |
| `ejbCreate` + `ejbPostCreate` defaulting | one `createCustomer(userName)` in `account/customer.ts`                               |
| `CustomerEJBAction` / `CustomerEvent`    | `account/account.ts` + the handlers under `routes/api/customer/`                      |
| `scf.createCustomer(userId)`             | `createCustomer(userName)`                                                            |
| `createcustomer.do` (action=create)      | `POST /api/customer`                                                                  |
| `customer.do` (action=update)            | `PUT /api/customer`                                                                   |
| Account creation / edit JSP forms        | `/customer` (`src/pages/customer.tsx`) — one screen, read-only view plus an edit form |
| EL pre-population of edit fields         | `GET /api/customer` feeding the form's initial values                                 |
| CMP cascade-delete                       | SQLite `ON DELETE CASCADE` foreign keys                                               |

The stored value vocabularies the scenarios name — languages `en_US` / `ja_JP` / `zh_CN`,
categories `BIRDS` / `CATS` / `DOGS` / `FISH` / `REPTILES`, states `California` /
`New York` / `Texas`, countries `USA` / `Canada` / `Japan` / `China`, card types
`Java(TM) Card` / `Duke Express` / `Meow Card`, and account statuses `active` /
`disabled` — are kept verbatim. They are observable, and several are asserted directly.

## S2 — "Customer" versus the existing `auth_users` and `users` tables

`db/schema.ts` already carries two user-shaped tables. `users` is template demo content
(numeric key, `name`, `email`) probed deliberately by `e2e/smoke.spec.ts`; SWHM-S-0002 § S2
already ruled it out as a product entity and pinned its routes as a fixed contract.
`auth_users` (`user_name` PK, `password`) is the authenticated customer's credential row.

The spec's `Customer` root has `userId` as its primary key, which is exactly
`auth_users.user_name`.

**Resolution** — `customers.user_name` is the primary key AND a foreign key to
`auth_users.user_name`. The credential row stays the identity; the customer row is
everything the account holds beyond credentials. `auth_users` gains no columns, so nothing
in the authentication capability changes shape, and `users` is untouched.

## S3 — Credit card storage: the spec mandates storing the card number

`specs/account-management/spec.md` § Store credit card information requires a `CreditCard`
entity holding "card number, card type, and expiry date", and its scenario asserts the
entity is created "with those values".

Two standing constraints forbid it:

- `PRODUCT.md` § Scope, standing non-goal: "Owning payment card data directly. Any future
  payment capability integrates a processor rather than storing card details."
- `legacy-analysis/rebuild-guidance.md` § Gotchas #10: "No explicit PCI compliance guidance
  in legacy. Assume this is a rebuild opportunity for PCI-compliant vault; legacy probably
  stores plaintext (bad). **Do NOT replicate that.**"

**Resolution** — the table is `card_metadata` and holds `card_type`, `expiry_date`
(`MM/YYYY`) and `last_four` only. The full card number is accepted by the edit form,
reduced to its last four digits before it reaches persistence, and never written anywhere.
Every scenario in the requirement except the literal storage of the number is preserved:
card type and expiry round-trip exactly, and the expiry-parsing scenario
(`12/2025` → `12`, `2025`) is unaffected. This is the same shape of deliberate deviation
SWHM-S-0002 recorded for plaintext passwords at its § S3, and it is recorded here rather
than by editing the spec.

A payment capability that needs a real card number is SWHM-I-0009
(`payment-processing`), which the non-goal already says integrates a processor.

## S4 — `getExpiryMonth()` / `getExpiryYear()` are Java accessors

The expiry-parsing scenario is written against two Java bean accessors and their legacy
defaults ("substring before `/` or default `01`", "after `/` or default `2010`").

**Resolution** — one exported function pair in `account/card.ts`, keeping the observable
behaviour the scenario asserts: `expiryMonth("12/2025") === "12"` and
`expiryYear("12/2025") === "2025"`. The legacy fallbacks `01` / `2010` are preserved for a
malformed or empty stored value, because the scenario's requirement text names them and a
stored row predating validation could still hit that path.

## S5 — The spec has no read path, only creation and editing

The requirements cover creating an account, storing each entity, and displaying a create
form and an edit form. Nothing specifies reading an account back. But the edit form is
required to be "pre-populated with current values ... via expression language", which in a
server-rendered JSP is the read path — it has no client to fetch from.

**Resolution** — `GET /api/customer` exists as the SPA's equivalent of EL pre-population.
It is not a new requirement; it is how the pre-population scenario is satisfied when the
form runs in a browser rather than in a JSP. Its acceptance criteria on SWHM-T-0035 are
written as the pre-population outcome the scenario names.

## S6 — The wireframe draws a read-only profile and no edit form

Idea SWHM-I-0003 carries one design block, "Customer Profile", exported byte-exact to
`design/wireframe-customer-profile.html` (see `design/MANIFEST.md`). It draws contact
information and a second "Account details" card, both badged **Read only**, with values as
plain text bars and an explicit comment: "no input box, no edit affordance". It draws no
edit form, no credit-card fields and no language control — while the idea's own user
stories ask to update contact information and set a language preference, and the spec
requires both a create form and an edit form.

The block's own comment explains the second card: the brief said "other account details"
without naming them, so "field names deliberately not invented".

**Resolution** — the wireframe is authoritative for what it draws and silent elsewhere.
SWHM-T-0036 builds the read-only view to this file: the two-card structure, the labels it
names, the label-over-value rows, the 672px page. The edit form, the card-metadata fields
and the preference controls are built from the existing design system (`DESIGN.md`), the
same way SWHM-S-0002 built the sign-on screens with no mockup at all. Card 2's blank labels
are filled from the delta spec's own account fields — account status, telephone, email and
card type — rather than invented.

## S7 — "Create account" already partly exists, and its duplicate case is unhandled

The spec's account-creation form collects credentials _and_ profile data in one step. This
repository already creates the credential half: `POST /api/signon/create-user` →
`auth/user.ts:insertUser` → `auth/validation.ts:validateNewUser`, delivered by
SWHM-S-0002. Rebuilding a second creation path would duplicate existing functionality.

Separately, the idea's own acceptance criterion — "Duplicate accounts are rejected with a
descriptive error message" — is **not met by the code today**. `validateNewUser` checks
length and forbidden characters only; nothing checks whether the user name is taken, so a
repeat registration reaches the `auth_users` primary-key constraint and throws a raw SQLite
error that `create-user.post.ts` does not recognise as a `CreateUserError` and rethrows.

**Resolution** — no second creation path. `createCustomer(userName)` is called from the
existing `insertUser` success path, so registering creates the account and profile rows
with their defaults exactly as `ejbPostCreate` did. The duplicate check is added to
`auth/validation.ts` as a `CreateUserError`, which the existing route already maps to the
user-creation error page — so the descriptive message appears with no route change.
Everything the customer supplies beyond credentials is captured by the edit form, which is
what the "create form" requirement's fields become.

## S8 — Account status has no way to change

`specs/account-management/spec.md` § Account status field specifies `active` and `disabled`,
and the seeded `proposal.md` § Risk already flags that "no UI shown for disabling". The idea
puts "Account suspension or deactivation" explicitly **out of scope**.

**Resolution** — the column exists, is written as `active` at creation, and is displayed.
Nothing in this sprint changes it. The only scenario the requirement carries — status is
`active` on creation — is fully satisfied.

## S9 — "Applied to subsequent sessions" is not translation

The idea's acceptance criterion is "Language preference is stored and applied to subsequent
sessions". The delta spec only ever requires the preference to be _stored_; no scenario
describes translated content. `internationalization` is a separate capability with its own
change (SWHM-I-0005), and `PRODUCT.md` § Not yet decided does not promise translation here.

**Resolution** — "applied" is scoped to: the stored preference is returned for that customer
on a later, separate session, and it drives the document's `lang` attribute. Translating
content is left to SWHM-I-0005. SWHM-T-0036's criteria are written to that outcome, and the
sprint does not claim more.

## S10 — Address is 1:1, but the idea asks for multiple addresses

The idea's second user story is "manage multiple addresses for billing and shipping". The
delta spec contradicts it directly: § Store contact information requires contact information
be "associated with exactly one Address entity", and the legacy model is
`Account → ContactInfo (1:1) → Address (1:1)`.

**Resolution** — one address, per the spec of record, which is the source the sprint is
judged against. Separate billing and shipping addresses arrive with order placement
(SWHM-I-0008), which is where the legacy model puts them. Raised as an
improvement-labelled ticket rather than built against no scenario.

## S11 — State and country vocabularies are narrower than any real address

§ Address constraints admits three states (California, New York, Texas) and four countries
(USA, Canada, Japan, China) — the legacy form's dropdown options, not a validation rule.

**Resolution** — both are offered as the edit form's options, matching the scenarios, which
only ever assert that a valid value is stored successfully. They are not enforced as a
server-side rejection: no scenario describes rejecting a fourth state, and rejecting one
would fail any address outside three US states. Language and category ARE enforced server
side, because those vocabularies are complete and are read back as behaviour.
