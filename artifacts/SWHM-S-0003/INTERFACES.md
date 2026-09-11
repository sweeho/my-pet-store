# Fixed interfaces — SWHM-S-0003 · change `swhm-i-0003-customer-account-profile-man`

Three sequenced tickets code against one surface. Everything below is a **fixed contract**:
SWHM-T-0034 creates it, SWHM-T-0035 and SWHM-T-0036 consume it, and no ticket may change a
name or a shape here without a plan revision from planning (see the escalation note at the
bottom).

Same role as `../SWHM-S-0002/INTERFACES.md`.

## Value vocabularies

Verbatim from the delta spec. Exported as `const` arrays from `account/vocabulary.ts` so
the server validator and the form's options are the same list.

| Name         | Values                                       | Enforced server side                            |
| ------------ | -------------------------------------------- | ----------------------------------------------- |
| `LANGUAGES`  | `en_US`, `ja_JP`, `zh_CN`                    | yes                                             |
| `CATEGORIES` | `BIRDS`, `CATS`, `DOGS`, `FISH`, `REPTILES`  | yes                                             |
| `CARD_TYPES` | `Java(TM) Card`, `Duke Express`, `Meow Card` | yes                                             |
| `STATES`     | `California`, `New York`, `Texas`            | no — form options only (SPEC-DISCREPANCIES S11) |
| `COUNTRIES`  | `USA`, `Canada`, `Japan`, `China`            | no — form options only (SPEC-DISCREPANCIES S11) |
| `STATUSES`   | `active`, `disabled`                         | n/a — always `active` this sprint (S8)          |

## Tables — `db/schema.ts` (owned by SWHM-T-0034)

Column names are snake_case in SQLite, camelCase in the Drizzle object, matching the
existing tables in that file.

- **`customers`** — `user_name` TEXT **PK**, FK → `auth_users.user_name` ON DELETE CASCADE.
- **`accounts`** — `user_name` TEXT PK, FK → `customers.user_name` ON DELETE CASCADE;
  `status` TEXT NOT NULL DEFAULT `'active'`.
- **`profiles`** — `user_name` TEXT PK, FK → `customers.user_name` ON DELETE CASCADE;
  `preferred_language` TEXT NOT NULL DEFAULT `'en_US'`; `favorite_category` TEXT NULL;
  `my_list_preference` INTEGER (boolean) NOT NULL DEFAULT true;
  `banner_preference` INTEGER (boolean) NOT NULL DEFAULT true.
- **`contact_info`** — `user_name` TEXT PK, FK → `customers.user_name` ON DELETE CASCADE;
  `given_name`, `family_name`, `telephone`, `email` TEXT, all nullable.
- **`addresses`** — `user_name` TEXT PK, FK → `contact_info.user_name` ON DELETE CASCADE;
  `street_name1`, `street_name2`, `city`, `state`, `zip_code`, `country` TEXT, all nullable.
- **`card_metadata`** — `user_name` TEXT PK, FK → `customers.user_name` ON DELETE CASCADE;
  `card_type` TEXT NULL; `expiry_date` TEXT NULL (`MM/YYYY`); `last_four` TEXT NULL.
  **There is no card-number column.** See SPEC-DISCREPANCIES S3.

The spec's 1:1 relationships are modelled as a shared `user_name` primary key rather than a
surrogate id per table — one customer has exactly one of each, and the legacy model is 1:1
throughout. `contact_info` → `addresses` is 1:1 for the same reason (S10).

Nullable everywhere except `status` and the profile defaults: registration creates the rows
before the customer has supplied anything, which is what `ejbPostCreate` did.

## `account/` module (owned by SWHM-T-0034)

A new top-level capability directory, outside the ones Nitro scans, per
ARCHITECTURE.md § Routing. Its tests must be registered in Vitest's `server` project.

```ts
// account/types.ts
export type ContactInfo = {
  givenName: string | null; familyName: string | null;
  telephone: string | null; email: string | null;
};
export type Address = {
  streetName1: string | null; streetName2: string | null; city: string | null;
  state: string | null; zipCode: string | null; country: string | null;
};
export type CardMetadata = {
  cardType: string | null; expiryDate: string | null; lastFour: string | null;
};
export type Profile = {
  preferredLanguage: string; favoriteCategory: string | null;
  myListPreference: boolean; bannerPreference: boolean;
};
export type CustomerAccount = {
  userName: string; status: string;
  contactInfo: ContactInfo; address: Address;
  card: CardMetadata; profile: Profile;
};
export type AccountUpdate = {
  contactInfo?: Partial<ContactInfo>; address?: Partial<Address>;
  card?: { cardType?: string | null; expiryDate?: string | null; cardNumber?: string | null };
  profile?: Partial<Profile>;
};
```

`AccountUpdate.card.cardNumber` is the ONLY place a full number appears. It is an input
field, never a stored one: `updateAccount` reduces it to `lastFour` and discards the rest.

```ts
// account/customer.ts
export function createCustomer(userName: string): CustomerAccount;  // account+profile defaults
export function findAccount(userName: string): CustomerAccount | undefined;
export function getAccountOrDefaults(userName: string): CustomerAccount;
export function updateAccount(userName: string, update: AccountUpdate): CustomerAccount;

// account/card.ts
export function expiryMonth(expiryDate: string | null): string;  // "12/2025" -> "12", else "01"
export function expiryYear(expiryDate: string | null): string;   // "12/2025" -> "2025", else "2010"
export function lastFour(cardNumber: string): string;

// account/validation.ts
export class AccountValidationError extends Error {}
export function validateAccountUpdate(update: AccountUpdate): void;  // language, category, card type
```

`getAccountOrDefaults` is what the read route calls: a customer registered before this
sprint has no rows, and the read must return defaults rather than a 404 (SWHM-T-0035 AC-2).

## Duplicate-account rejection (owned by SWHM-T-0034)

Added to the EXISTING `auth/validation.ts`, not to `account/` — it is a credential-level
rule and the existing route already maps `CreateUserError` to the error page (S7).

```ts
// auth/validation.ts — new export, existing CreateUserError class
export function validateNewUser(userName: string, password: string): void;  // signature unchanged
```

`validateNewUser` gains a duplicate check that throws
`new CreateUserError("User ID ${userName} already exists")`. Because it runs inside the
existing `insertUser`, and `create-user.post.ts` already catches `CreateUserError` and
returns `{ created: false, error, redirectTo: "/user-creation-error" }`, the descriptive
message reaches the customer with **no change to the route or the page**. Both files stay
outside this sprint's ownership maps.

`insertUser` also calls `createCustomer(userName)` after a successful insert, so
registration produces the account and profile rows. Its exported signature is unchanged.

## HTTP surface (owned by SWHM-T-0035)

File-based under `routes/api/customer/`. The session is resolved with the existing
`useSignOnSession(event)` from `auth/session.ts`; the signed-on user name is
`session.j_signon_username`.

| Method | Path            | Body            | Success                         | Unauthenticated        |
| ------ | --------------- | --------------- | ------------------------------- | ---------------------- |
| GET    | `/api/customer` | —               | `200 CustomerAccount`           | `401`, no account data |
| PUT    | `/api/customer` | `AccountUpdate` | `200 CustomerAccount` (updated) | `401`                  |

A validation failure is `400` with `{ error: string }` carrying the
`AccountValidationError` message. The response body on success is exactly
`CustomerAccount` — the same object the module returns, no envelope — matching the shape
`routes/api/users/` already uses.

`POST /api/customer` is deliberately **not** created: registration already creates the
account (S7).

## Client surface (owned by SWHM-T-0036)

- `/customer` stays at `src/pages/customer.tsx` and stays wrapped in the existing
  `RequireSignOn` component. The placeholder body SWHM-S-0002 left there is replaced.
- The read-only view is built to `design/wireframe-customer-profile.html`; the edit form
  is built from `DESIGN.md` patterns (S6).
- The error surface must use `text-destructive` on the page background and must NOT pair
  `bg-destructive` with `text-destructive-foreground` — that token pair renders invisible
  text in light mode (DESIGN.md § Tokens; open defect SWHM-T-0025).

## Escalation

If a ticket finds one of these shapes wrong, it does **not** change it unilaterally — the
next ticket in the chain is already coding against it. Comment on the ticket and message
`planning`; planning revises the ticket descriptions and re-sequences. This is the plan
revision protocol, and it is cheaper than two tickets disagreeing about a column name.
