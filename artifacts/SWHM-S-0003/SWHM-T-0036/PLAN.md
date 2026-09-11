# SWHM-T-0036 — Customer profile screens and language preference

Change `swhm-i-0003-customer-account-profile-man`. **Read
`openspec/changes/swhm-i-0003-customer-account-profile-man/design.md` first.** Exact shapes
are pinned in `../INTERFACES.md`.

Depends on SWHM-T-0035, which owns the endpoints this ticket calls.

## Objective

Turn `/customer` from the placeholder SWHM-S-0002 left there into the profile screen: a
read-only view built to the wireframe, an edit form over the same data, and a language
preference that is still there on a later session.

## Design reference

`../design/wireframe-customer-profile.html` — byte-exact export of idea SWHM-I-0003's one
design block. Index and a description of what it draws: `../design/MANIFEST.md`.

**Read that file and build the read-only view to it.** It is authoritative for what it
draws: the two-card layout, the `Read only` badges, the uppercase card titles, the
label-over-value rows, the two-column grid with street address spanning both, and the
672px page. Its labels are the field names — First name, Last name, Street address, City,
State / Province, Postal code, Country.

It is **silent** about everything else. It draws no edit form, no card fields and no
language control, while the idea's user stories ask to update contact details and set a
language. Build those from the existing design system (`DESIGN.md`), the way SWHM-S-0002
built the sign-on screens against no mockup at all. Card 2, "Account details", has
deliberately blank labels — the block's own comment says the brief did not name them — so
fill them from the spec's own account fields: account status, telephone, email, card type.
Do not invent others. Full reasoning: `../SPEC-DISCREPANCIES.md` § S6.

## Steps

1. **Read-only view** — replace the placeholder body of `src/pages/customer.tsx`, keeping
   the existing `RequireSignOn` wrapper. Fetch from `GET /api/customer`. Render the two
   cards and their labelled rows per the wireframe.
   → verify: every field the wireframe labels appears with its label and its value.

2. **Edit affordance** — an edit control that reveals a form over the same data, pre-filled
   from the fetched account. This is the SPA's equivalent of the spec's EL pre-population
   (SPEC-DISCREPANCIES S5), so it must show current values, not blanks.
   → verify: opening the form shows what the view showed.

3. **Form fields** — contact information, address, card metadata and preferences. Language,
   category, card type, state and country are option lists, sourced from
   `account/vocabulary.ts` so they cannot drift from the server's validator. Language offers
   exactly `en_US`, `ja_JP`, `zh_CN`; category exactly `BIRDS`, `CATS`, `DOGS`, `FISH`,
   `REPTILES`.

4. **Card number** — the form accepts a full number, but the server stores only the last
   four digits (design.md D1). After saving, the displayed value is the last four. Do not
   keep the full number in client state after the request.
   → verify: saving a full number and reloading shows four digits.

5. **Save** — `PUT /api/customer`, then return the view to its read-only state showing the
   submitted values.
   → verify: the values shown after saving are the ones submitted.

6. **Validation errors** — render the `400 { error }` message. Use `text-destructive` on the
   page background. Do **not** pair `bg-destructive` with `text-destructive-foreground`:
   that token pair renders invisible text in light mode (DESIGN.md § Tokens, open defect
   SWHM-T-0025). SWHM-S-0002's error pages avoided it the same way.

7. **Language applied** — set the document's `lang` attribute from the stored preference on
   load. "Applied" is scoped to this plus the preference being reported on a later session;
   translating content belongs to the separate `internationalization` capability
   (design.md D5). Do not add translation infrastructure.
   → verify: after setting a language, signing out and signing in again, the view shows
   that language and `document.documentElement.lang` carries it.

8. **Guard** — keep the screen inside `RequireSignOn`, unchanged. An unauthenticated visit
   must land on sign-on, not the profile.

9. **Tests** — a component test in the `client` project (jsdom, by path) mirroring
   `src/pages/signon.test.tsx`: the view renders the labelled fields, the form pre-fills,
   an error message renders. Plus a Playwright spec in `e2e/` covering view → edit → save →
   sign out → sign in again → the language is still set. Mirror `e2e/home.spec.ts` for
   shape. The browser tier does not run in an engineer container; it runs in CI on this
   branch and again at integration QA, which is where that spec is observed.

## File / module ownership

Create or modify **only** these:

- `src/pages/customer.tsx`
- `src/pages/customer.test.tsx`
- new components under `src/components/` if the screen needs one that does not exist
- `e2e/customer-profile.spec.ts`
- `index.html` **only** if the `lang` attribute needs a default to be set from

Do not touch `account/**`, `db/schema.ts`, `routes/**`, `auth/**`, `src/index.css`, or the
existing sign-on pages and their tests. The `--destructive-foreground` token bug is a known
defect with its own ticket (SWHM-T-0025) — work around it as step 6 says, do not fix it
here.

## Definition of Done

The ticket's acceptance criteria AC-1 through AC-10, verified by the tests in step 9.

This ticket consumes fixed contracts rather than establishing them: the endpoints and
bodies in `../INTERFACES.md` § HTTP surface, and the vocabularies in § Value vocabularies.
If one is wrong, comment on the ticket and message `planning` rather than changing it —
SWHM-T-0035 has already merged against them.
