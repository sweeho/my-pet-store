# Account Management — Implementation Tasks

Every checkbox is tagged with the ticket that owns it. The platform ticks them server-side
as each ticket merges. Decisions are in `design.md`; shared shapes in
`artifacts/SWHM-S-0003/INTERFACES.md`.

## 1. Data model

- [x] 1.1 Add `customers`, `accounts`, `profiles`, `contact_info`, `addresses` and `card_metadata` to `db/schema.ts`, each keyed on `user_name` with cascading foreign keys (SWHM-T-0034)
- [x] 1.2 Key `customers.user_name` to `auth_users.user_name` so the credential row stays the identity (SWHM-T-0034)
- [x] 1.3 Store card type, expiry and last four digits only — no card-number column, per design.md D1 (SWHM-T-0034)
- [x] 1.4 Generate the drizzle migration into `drizzle/` and commit it with the schema change (SWHM-T-0034)

## 2. Account module

- [x] 2.1 Create the `account/` capability directory outside Nitro's scanned paths and register its tests in Vitest's `server` project (SWHM-T-0034)
- [x] 2.2 Implement `createCustomer(userName)` writing the account row with status `active` and the profile row with defaults `en_US` / null / true / true (SWHM-T-0034)
- [x] 2.3 Implement `findAccount` and `getAccountOrDefaults`, the latter returning profile defaults when no row exists, per design.md D4 (SWHM-T-0034)
- [x] 2.4 Implement `updateAccount` populating contact info, address, card metadata and profile from one update payload (SWHM-T-0034)
- [x] 2.5 Implement `expiryMonth` / `expiryYear` parsing `MM/YYYY`, falling back to `01` / `2010` for a malformed value (SWHM-T-0034)
- [x] 2.6 Implement `lastFour` and reduce any supplied card number to it before persistence (SWHM-T-0034)
- [x] 2.7 Export the language, category, card-type, state and country vocabularies from one module shared by the validator and the form (SWHM-T-0034)
- [x] 2.8 Validate language, category and card type server side; accept state and country as typed, per design.md D6 (SWHM-T-0034)

## 3. Duplicate-account rejection

- [x] 3.1 Reject an already-registered user name in `auth/validation.ts` with a descriptive `CreateUserError`, per design.md D3 (SWHM-T-0034)
- [x] 3.2 Call `createCustomer` from the existing `insertUser` success path so registration creates the account and profile rows (SWHM-T-0034)

## 4. Account API

- [x] 4.1 Add `GET /api/customer` returning the signed-on customer's contact information, address, card metadata and preferences (SWHM-T-0035)
- [x] 4.2 Add `PUT /api/customer` applying an update and returning the updated account (SWHM-T-0035)
- [x] 4.3 Resolve the customer from the existing sign-on session and refuse an unauthenticated request without returning account data (SWHM-T-0035)
- [x] 4.4 Answer a validation failure with a descriptive message and leave stored values unchanged (SWHM-T-0035)
- [x] 4.5 Scope every read and write to the session's own user name so one customer cannot reach another's account (SWHM-T-0035)
- [x] 4.6 Cover the routes with tests under `routes/` in the `server` project (SWHM-T-0035)

## 5. Profile screens

- [x] 5.1 Replace the `/customer` placeholder with the read-only profile view, built to `artifacts/SWHM-S-0003/design/wireframe-customer-profile.html` (SWHM-T-0036)
- [x] 5.2 Render contact information and account details as labelled read-only rows in the wireframe's two-card layout (SWHM-T-0036)
- [x] 5.3 Add an edit affordance revealing a form pre-filled from the current account, per design.md § Form behaviour (SWHM-T-0036)
- [x] 5.4 Offer language, category, card type, state and country as the specified options (SWHM-T-0036)
- [x] 5.5 Accept a full card number on the form and display only the last four digits after saving (SWHM-T-0036)
- [x] 5.6 Return the view to its read-only state showing the submitted values after a save (SWHM-T-0036)
- [x] 5.7 Keep the screen behind the existing `RequireSignOn` guard so an unauthenticated visit lands on sign-on (SWHM-T-0036)
- [x] 5.8 Use `text-destructive` on the page background for error text, avoiding the known invisible token pair (SWHM-T-0036)

## 6. Language preference

- [x] 6.1 Apply the stored preference to the document's `lang` attribute on load (SWHM-T-0036)
- [x] 6.2 Report the stored preference for that customer on a later, separate session, per design.md D5 (SWHM-T-0036)

## 7. Verification

- [x] 7.1 Cover the account module's creation, defaults, update and expiry parsing in the `server` project (SWHM-T-0034)
- [x] 7.2 Cover the profile screens in the `client` project (SWHM-T-0036)
- [x] 7.3 Add a Playwright spec covering view, edit, save, sign-out and sign-in-again (SWHM-T-0036)
