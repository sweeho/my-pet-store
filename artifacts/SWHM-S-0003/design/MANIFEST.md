# Design reference — SWHM-S-0003

Idea **SWHM-I-0003** · canvas doc version **2** (frozen) · exported at planning.

| File                              | Block id                               | Title            | Variant   | Bytes | Author self-check |
| --------------------------------- | -------------------------------------- | ---------------- | --------- | ----- | ----------------- |
| `wireframe-customer-profile.html` | `2a9e5f4d-a696-46ed-bdb4-96b0f4f3db6f` | Customer Profile | wireframe | 5382  | not run           |

`sha256(wireframe-customer-profile.html) = c7975478368c3ddf19ab646dd0f105fe7b74fe756ed627caf9b06b391fc7e3b5`,
which matches the checksum the design tool reports for the authored block — the committed
file is byte-exact.

## What the wireframe actually draws

Read the file; this is an index, not a substitute. In outline:

- A top nav strip matching the app's global nav (logo left, links right).
- An `h1` "Customer Profile" over a two-card page, max width 672px.
- **Card 1 — "Contact information"**, badged `Read only`, a two-column grid of
  label-over-value rows: First name, Last name, Street address (full width), City,
  State / Province, Postal code, Country.
- **Card 2 — "Account details"**, badged `Read only`, four rows whose labels are
  deliberately blank. The block's own comment says the brief named "other account
  details" without naming them, so "field names deliberately not invented".
- Values are rendered as plain text bars — `.value` is explicitly commented
  "read-only value: a plain text bar, no input box, no edit affordance".

## The gap this leaves, and how it is resolved

The wireframe covers a **read-only** profile. It draws no edit form, no credit-card
fields and no language control, while the idea's own user stories ask to _update_
contact information and _set_ a language preference. It is authoritative for what it
draws and silent everywhere else.

Resolution, carried by every ticket plan in this sprint: the read-only view is built to
this file — its two-card structure, its labels and its label-over-value rows. The edit
form, the card-metadata fields and the preference controls are built from the existing
design system (`DESIGN.md`), exactly as SWHM-S-0002 built the sign-on screens against no
mockup at all. Card 2's blank labels are filled from the delta spec's own account fields
rather than invented. Recorded in full as S6 in `../SPEC-DISCREPANCIES.md`.
