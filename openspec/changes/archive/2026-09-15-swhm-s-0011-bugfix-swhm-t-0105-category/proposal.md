# Make the language-unavailable panel name its subject, at every level

## Why

One defect, SWHM-T-0105, raised during SWHM-S-0010's own integration QA: a category with no
translation in the language being read shows a panel whose body reads "This **item** has nothing
translated into de_DE." The screen is a category screen. The word is wrong.

Re-verified against this branch rather than taken from the report, and every claim in it holds:

- `src/pages/catalog/UnavailableInLanguage.tsx:27` types `entity?: "product" | "item"` and line 35
  defaults it to `"item"`. Line 40 is `const container = noun ? CONTAINER_NOUN[noun] : entity`, so a
  caller that passes neither prop gets the literal string `item` in its body copy.
- `src/pages/catalog/category/[categoryId].tsx:76-80` — the `reason === "missing-translation"` branch
  passes `locale`, `onViewInEnglish` and `onChangeLocale`, and no `entity`. It takes the default.
- `src/pages/catalog/product/[productId].tsx:77-82` passes `entity="product"`, which is why only the
  category screen is wrong, and `src/pages/catalog/item/[itemId].tsx:68-72` passes nothing and is
  correct only because the default happens to be its noun.

This is not an implementation slip in the ticket that introduced it. SWHM-S-0010 brought all three
detail screens onto the reason-aware branch in one work item, and gave the panel an `entity` prop in
the next one — a prop whose union named two of the three screens. The category screen's branch was
created by the first work item and was never a caller the second one considered, so it inherited a
default that describes a different level of the catalogue. Nothing failed: a default cannot fail.

The same is true one layer up. SWHM-S-0010's delta scenario for this text reads "GIVEN a visitor on
the screen of a **product** that has no translation" — it was written as the oracle for the screen
being fixed, so it had nothing to say about the screen being touched alongside it, and the archived
spec of record carries no scenario covering the category screen's body text at all. The panel's own
test file asserts the item default (UL-03) and `entity="product"` (UL-03b) and stops there.

This is the second time in two sprints that this panel has shipped the wrong noun. The recurring
mechanism is the default, not either call site — a prop that silently supplies user-visible prose
turns "a new caller forgot something" into "a new caller is wrong", with no compiler error and no
failing test. So this change removes the default rather than adding a third value to it.

## What Changes

- Make the panel's subject a required prop covering all three catalogue levels, so every call site —
  the ones that exist and the ones a later sprint adds — must say what it is describing, and the
  compiler says so when one does not.
- Pass a category as the subject from the category screen's untranslated branch, which is the defect.
  The other four call sites gain an explicit subject that reproduces the word they already render.
- Drop the lookup table that derived the subject from a list's plural noun. Once every caller names
  its subject, the table is a second source for a fact the caller already carries.
- Cover the category screen's own untranslated text, at the panel tier, the screen tier and the
  browser tier — the three places the gap that let this ship would have been caught.

## Impact

- **`internationalization`** — one MODIFIED requirement (_Language recovery from an untranslated
  screen_), gaining a sentence that binds the state's text to the level of the catalogue the screen
  shows, and one regression scenario for the category screen. Every scenario it already carries is
  reproduced unchanged.
- **Code** — `src/pages/catalog/UnavailableInLanguage.tsx`, the three catalogue detail screens under
  `src/pages/catalog/`, their unit tests, and `e2e/language.spec.ts`.
- **Not changed** — every route under `routes/api/catalog/`, `catalog/availability.ts`,
  `catalog/locale.ts` and `catalog/seed.ts`. No API contract, no response shape and no seeded content
  moves; the server already answers this case correctly and the fault is entirely in the copy the
  browser renders from that answer.
- **Root docs** — `ARCHITECTURE.md` only, and only one bullet in § Key Decisions: a shared component
  that renders prose does not default the words it renders. That constrains work beyond this change.
  `PRODUCT.md` is unmoved (no capability gained or lost), and `DESIGN.md` is unmoved (§ Unavailable
  content states already requires the three parts of this pattern and the panel still has all three —
  naming the subject correctly is conformance to it, not a change to it).

## Follow-ups / out of scope

Found while root-causing, covered by this defect in neither cause nor fix, and left for a later
sprint. Planning cannot raise a defect ticket by design, so they are recorded here.

- **The category screen's untranslated branch is unreachable with a supported language.** All five
  seeded categories carry `en_US`, `ja_JP` and `zh_CN` rows — `catalog/seed.ts` fixes that as its
  minimum content — so the only way to reach the branch is an unsupported locale such as
  `?locale=de_DE`, which `resolveLocale` passes through by design. That is enough to observe the fix,
  and it is how this defect was found, but it means the branch a visitor can actually reach through
  the interface is dead code against the seeded catalogue. Whether the demo catalogue should carry a
  partially-translated category is a content decision, not a defect.
- **The language-unavailable panel names an unsupported locale as its raw code.** With
  `?locale=de_DE` the heading reads "Not available in de_DE yet", which contradicts DESIGN.md
  § Unavailable content states — "Name a language in its own script, never as a locale code". The
  fallback at `UnavailableInLanguage.tsx:39` is `LANGUAGE_NAMES[locale] ?? locale`. It is only
  reachable for a locale the interface never offers, so it is latent rather than observed, and fixing
  it needs a decision about what an unnamed language should be called.
- **Four of the five capability specs still carry a placeholder Purpose** —
  `internationalization`, `account-management`, `catalog-browsing` and `user-authentication` each open
  with "TBD - created by archiving change …". Carried forward from SWHM-S-0010's proposal, still open.
  A delta cannot fix it: the text lives in `openspec/specs/`, which the platform owns.
- **`MissingReason` is mirrored rather than shared** between `catalog/availability.ts` and
  `src/pages/catalog/shared.ts`. Carried forward from SWHM-S-0010's proposal, still open.
- **The three items carried forward from SWHM-S-0009 are still open**: the 0-byte
  `tailwind.config.ts`, `middleware/auth.ts` attaching `{ name: "Yeasin" }` to every request, and
  `src/constants/index.ts`'s unused `API_BASE_URL`. SWHM-T-0091 tracks the last of these.
