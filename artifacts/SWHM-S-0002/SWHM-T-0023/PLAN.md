# PLAN — SWHM-T-0023 · User interfaces

Sprint: SWHM-S-0002 · Change: `swhm-i-0002-user-authentication-sign-on` · Capability: `user-authentication`
Requirements: **Sign-in form displays username and password inputs**, **Sign-in form pre-populates username from cookie**, **Sign-up form displays registration fields**, **Sign-on error page displays authentication failure message**

Read `openspec/changes/swhm-i-0002-user-authentication-sign-on/design.md` § Form Parameters
first, then `artifacts/SWHM-S-0002/INTERFACES.md` for the HTTP contract these screens call and
the page list this ticket owns, then `artifacts/SWHM-S-0002/SPEC-DISCREPANCIES.md` § S6, § S7
and § S11.

## Design reference

Idea SWHM-I-0002 carries **no design blocks** — `a2a_get_idea_design` returned an empty
manifest, so there is nothing under `artifacts/SWHM-S-0002/design/` and no mockup to match.
Build from the existing design system: tokens and the `cn()` / CVA component pattern in
DESIGN.md, and the page shape of the existing `src/pages/*.tsx`. Do not add a design token, do
not add a `tailwind.config.js`, and do not use the `bg-destructive` + `text-destructive-foreground`
pair — light-mode `--destructive-foreground` is a known broken token (S11); put error text in
`text-destructive` on the page background instead.

## Objective

Build the five screens this capability needs and the guard that protects two of them, calling
the endpoints that already exist and asserting what each scenario says a user can see.

## Steps

1. **Sign-in page.** `src/pages/signon.tsx` → `/signon`. One form with a labelled username text
   input (`j_username`), a labelled password input of `type="password"` (`j_password`), a
   "Remember My User Name" checkbox (`j_remember_username`) and a submit button; posts to
   `POST /api/signon` and navigates to the returned `redirectTo` (S7). Every control gets a real
   `<label>` — the scenario is asserted through accessible roles and names.
2. **Pre-fill.** Initialise the username field from `readCookie("bp_signon")`
   (`src/utils/cookies.ts`, SWHM-T-0020), falling back to an empty string when the cookie is
   absent.
3. **Sign-up section.** In the same page, a "New customer" form with `j_username`,
   `j_password`, `j_password_2` (both `type="password"`) and a submit button, posting to
   `POST /api/signon/create-user`. Reject a mismatched confirmation in the browser before
   submitting (tasks 9.5) — the server checks it too, and that is the enforcement.
   Keep the two forms' field ids distinct so the accessible names stay unambiguous.
4. **Error pages.** `src/pages/signon-failed.tsx` → `/signon-failed`, displaying exactly:
   "There were errors signing you in. The user name and password you entered were not found in
   our records. Please try again." — one scenario asserts this string verbatim. And
   `src/pages/user-creation-error.tsx` → `/user-creation-error`, displaying the `error` the
   create-user endpoint returned, with a link back to `/signon`.
5. **Guard and protected pages.** `src/components/RequireSignOn.tsx` calls
   `GET /api/signon/check?resource=<current path>` on mount and, when the answer is a denial,
   navigates to the returned `redirectTo` — the server has already stored ORIGINAL_URL by then
   (S6). Wrap `src/pages/signon-welcome.tsx` (the post-sign-in landing) and
   `src/pages/customer.tsx` (the placeholder standing for `customer.screen`, S5) in it. Keep
   both pages minimal: a heading and the signed-in username from `GET /api/signon/session`.
6. **Tests.** `src/pages/signon.test.tsx` (jsdom, following `src/pages/index.test.tsx`): the
   sign-in form exposes the username textbox, the password field, the "Remember My User Name"
   checkbox and a submit button; with a `bp_signon` cookie set the username field's value is
   "alice"; without it the field is empty; the sign-up form exposes username, password, password
   repeat and submit. `src/pages/signon-failed.test.tsx`: the page renders the message string
   verbatim.

## File / module ownership

May create or modify — nothing else:

| Path                                | Why                                                    |
| ----------------------------------- | ------------------------------------------------------ |
| `src/pages/signon.tsx`              | NEW — sign-in + new-customer sign-up                   |
| `src/pages/signon.test.tsx`         | NEW — form and pre-fill cover                          |
| `src/pages/signon-failed.tsx`       | NEW — the `signon_failed.jsp` equivalent               |
| `src/pages/signon-failed.test.tsx`  | NEW — the verbatim message                             |
| `src/pages/user-creation-error.tsx` | NEW — the `user_creation_error.jsp` equivalent         |
| `src/pages/signon-welcome.tsx`      | NEW — protected post-sign-in landing                   |
| `src/pages/customer.tsx`            | NEW — protected placeholder for `customer.screen`      |
| `src/components/RequireSignOn.tsx`  | NEW — client route guard                               |
| `src/components/index.ts`           | export the guard, matching the existing barrel pattern |

Out of ownership: `src/pages/index.tsx` and its test, `src/index.css`, `src/utils/`,
`src/components/ui/`, every `auth/` module, `routes/`, `middleware/`, `db/`, `drizzle/`,
`vite.config.ts`, `vitest.config.ts`, `e2e/`, `openspec/`, `artifacts/`, and the
repository-root narrative documents.

## Definition of Done

AC-1 is met by step 1, AC-2 and AC-3 by step 2, AC-4 by step 3, AC-5 by the first page in
step 4 — all proved by the assertions in step 6. Each restates a scenario in the change's
delta spec. The browser-level flows across these screens are SWHM-T-0024's.
