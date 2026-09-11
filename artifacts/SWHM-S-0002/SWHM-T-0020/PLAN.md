# PLAN — SWHM-T-0020 · Cookie persistence

Sprint: SWHM-S-0002 · Change: `swhm-i-0002-user-authentication-sign-on` · Capability: `user-authentication`
Requirement: **Persist username in browser cookie when requested**

Read `openspec/changes/swhm-i-0002-user-authentication-sign-on/design.md` § Username
Persistence first, then `artifacts/SWHM-S-0002/INTERFACES.md` for the surfaces this ticket
owns.

## Design reference

No design blocks on idea SWHM-I-0002 — nothing under `artifacts/SWHM-S-0002/design/`. The
sign-in form that consumes `readCookie` belongs to SWHM-T-0023.

## Objective

Deliver the "Remember My User Name" mechanism on both sides: the server helpers that write and
clear the `bp_signon` cookie, and the browser helper the sign-in form uses to pre-fill from it.
SWHM-T-0021 wires these into the sign-in request; this ticket owns the behaviour and its cover.

## Steps

1. **Server helpers.** `auth/remember-cookie.ts` — `REMEMBER_COOKIE = "bp_signon"`,
   `REMEMBER_COOKIE_MAX_AGE = 2_678_400`, `rememberUsername(event, userName)` and
   `forgetUsername(event)`. `rememberUsername` sets the cookie to the username with that
   `maxAge` and `path: "/"`; `forgetUsername` clears it by setting `maxAge: 0` — the scenario
   names the mechanism, so clear it that way rather than by any other expiry.
2. **Not httpOnly, deliberately.** The sign-in form reads this cookie in the browser to
   pre-fill the username (design.md § Username Persistence; S6 explains why no server render
   does it here). It carries a username only — never a credential and never session state,
   which lives in the httpOnly `bp_session` cookie instead.
3. **Browser helper.** `src/utils/cookies.ts` — `readCookie(name)`, parsing `document.cookie`
   and decoding the value; returns `undefined` when absent. Follow the shape of
   `src/utils/cn.ts` and export it from `src/utils/index.ts` if that barrel is how the
   neighbouring utility is exposed.
4. **Tests.** `auth/remember-cookie.test.ts` asserting the emitted `Set-Cookie` for both
   helpers — name `bp_signon`, the username as its value, `Max-Age=2678400` on the set, and
   `Max-Age=0` on the clear. `src/utils/cookies.test.ts` (jsdom) asserting a present cookie is
   read, a missing one yields `undefined`, and a neighbouring cookie with a similar prefix is
   not mistaken for it.

## File / module ownership

May create or modify — nothing else:

| Path                           | Why                                               |
| ------------------------------ | ------------------------------------------------- |
| `auth/remember-cookie.ts`      | NEW — set/clear `bp_signon`                       |
| `auth/remember-cookie.test.ts` | NEW — `Set-Cookie` assertions                     |
| `src/utils/cookies.ts`         | NEW — browser-side `readCookie`                   |
| `src/utils/cookies.test.ts`    | NEW — jsdom cover                                 |
| `src/utils/index.ts`           | re-export the new helper, if the barrel does that |

Out of ownership: every other `auth/` module, `db/`, `drizzle/`, `vitest.config.ts`,
`middleware/`, `routes/`, `src/pages/`, `src/components/`, `e2e/`, `openspec/`, `artifacts/`,
and the repository-root narrative documents.

## Definition of Done

AC-1 is met by `rememberUsername` and AC-2 by `forgetUsername`, both proved by the
`Set-Cookie` assertions in step 4. Each restates a scenario under "Persist username in browser
cookie when requested" in the change's delta spec. The end-to-end wiring of the checkbox is
SWHM-T-0021's criterion, not this ticket's.
