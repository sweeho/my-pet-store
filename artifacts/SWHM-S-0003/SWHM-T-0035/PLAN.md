# SWHM-T-0035 — Customer account API

Change `swhm-i-0003-customer-account-profile-man`. **Read
`openspec/changes/swhm-i-0003-customer-account-profile-man/design.md` first.** Exact shapes
are pinned in `../INTERFACES.md`.

Depends on SWHM-T-0034, which owns the `account/` module this ticket calls. Do not
re-implement any of it here.

## Objective

Put the signed-on customer's own account behind two endpoints: one to read it, one to
update it. This is the surface SWHM-T-0036's screens consume.

## Design reference

`../design/wireframe-customer-profile.html` (index: `../design/MANIFEST.md`). This ticket
builds no UI, but the read response must carry every field the wireframe labels — first
name, last name, street address, city, state/province, postal code, country — or the screen
cannot render. `CustomerAccount` in `../INTERFACES.md` already covers them; check rather
than assume.

## Steps

1. **`GET /api/customer`** — `routes/api/customer/index.get.ts`. Resolve the session with
   the existing `useSignOnSession(event)` from `auth/session.ts` and take the user name from
   `session.j_signon_username`. Call `getAccountOrDefaults` and return the
   `CustomerAccount` object directly — no envelope, matching the shape `routes/api/users/`
   already returns.
   → verify: a signed-on request returns contact information, address, card metadata and
   preferences in one response.

2. **Defaults, not a 404** — a customer with no account rows gets the profile defaults
   (design.md D4). `getAccountOrDefaults` already does this; the route must not add a
   not-found path on top of it. Customers registered in SWHM-S-0002 have no rows, and the
   spec's form-pre-population scenario has to work for them.

3. **`PUT /api/customer`** — `routes/api/customer/index.put.ts`. Read the body as
   `AccountUpdate`, call `validateAccountUpdate`, then `updateAccount`, and return the
   updated `CustomerAccount`.
   → verify: values submitted are present in a subsequent read of the same account.

4. **Unauthenticated requests** — if `session.j_signon_username` is null, answer `401` and
   return no account data. Both routes. This is the API half of the guard; the page half is
   the existing `RequireSignOn` component and belongs to SWHM-T-0036.
   → verify: a request with no session gets 401 and a body carrying no account fields.

5. **Validation failures** — answer `400` with `{ error: <the AccountValidationError
message> }` and leave stored values unchanged. A language outside `en_US` / `ja_JP` /
   `zh_CN` and a category outside `BIRDS` / `CATS` / `DOGS` / `FISH` / `REPTILES` are
   rejections; a state or country outside the listed options is **not** (design.md D6).
   → verify: after a rejected update, a read returns the previous preference.

6. **Isolation** — every read and write is scoped to the session's own user name. The user
   name must never be taken from the request body or a query parameter, which would let one
   customer address another's account.
   → verify: with two sessions, an update on one leaves the other's stored account intact.

7. **No `POST /api/customer`** — registration already creates the account (design.md D2).
   Do not add a creation endpoint.

8. **Tests** — `routes/api/customer/*.test.ts`, which run in the `server` project by path.
   Cover: a signed-on read; a read for a customer with no rows returning defaults; an
   update round-tripping all four groups; an unauthenticated read and an unauthenticated
   update; a rejected language and a rejected category leaving the stored value unchanged;
   and the two-session isolation case. Use a real `H3Event` with no server, as
   `routes/api/signon/*.test.ts` already does — mirror the nearest existing file.

## File / module ownership

Create or modify **only** these:

- `routes/api/customer/index.get.ts`
- `routes/api/customer/index.put.ts`
- `routes/api/customer/*.test.ts`

Everything else is read-only to this ticket. In particular do not modify `account/**` or
`db/schema.ts` (SWHM-T-0034 owns them), `auth/session.ts`, or `src/**` (SWHM-T-0036).

## Definition of Done

The ticket's acceptance criteria AC-1 through AC-8, verified by the tests in step 8.

Fixed contracts this ticket establishes for SWHM-T-0036: the two paths and methods, the
`CustomerAccount` response body with no envelope, the `AccountUpdate` request body, and the
`401` / `400 { error }` failure shapes — all in `../INTERFACES.md` § HTTP surface. If one is
wrong, comment on the ticket and message `planning` rather than changing it.
