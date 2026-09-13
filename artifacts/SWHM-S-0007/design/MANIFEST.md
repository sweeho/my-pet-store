# Design references — SWHM-S-0007

Exported from idea **SWHM-I-0005** (Multi-Language Support), canvas doc version **12**, frozen.

Every implementation and validation plan in this sprint cites these paths. They are committed on
the sprint branch, so a worktree forked from it already has them — open the file, do not re-fetch
the block.

| File                                                      | Block id                | Variant   | Authored size | Self-check |
| --------------------------------------------------------- | ----------------------- | --------- | ------------- | ---------- |
| `wireframe-catalog-before-after-the-language-contro.html` | `wf-catalog-language`   | wireframe | —             | not run    |
| `mockup-category-page-in-language-menu-open.html`         | `mock-catalog-ja`       | mockup    | 1440×900      | passed     |
| `mockup-category-page-in-no-content-in-this-lang.html`    | `mock-catalog-zh-empty` | mockup    | 1440×900      | passed     |

## What each one fixes

- **`wf-catalog-language`** — the before/after contrast. Before: language is fixed to the profile
  value or `en_US`, with no control and nothing naming the language you are reading. After: a
  `🌐 English (US) ▾` trigger on every catalogue screen with the three options, and a drill-in that
  says _"Not available in 中文 — switch to English (US)"_ instead of showing an empty list.
- **`mock-catalog-ja`** — the category screen in 日本語 with the menu open. Fixes the trigger's
  position (the heading row, right-aligned), the option list (`English (US)` / `日本語` / `中文`, each
  with its locale code as secondary text), the checked marker on the current language, and the
  footnote _"Saved to your profile — applies on every visit."_ Catalogue content is Japanese;
  `Previous` and `Next` stay English.
- **`mock-catalog-zh-empty`** — the same screen in 中文 with no product content. Fixes the copy:
  heading _"No products in 中文 yet"_, body _"This category has nothing translated into 中文. Nothing
  has gone wrong — the products exist, but not in this language."_, a primary
  **View in English (US)** action and a secondary **Change language** action. The category's own
  name and description still render in Chinese, because `category_details` does carry `zh_CN`.

## Export note

`a2a_get_idea_design(..., write_to=...)` reported success but wrote outside this container's
filesystem, so the three files were recovered from the canvas HTML render instead. They are
byte-exact: 4880 / 5447 / 4586 bytes, matching the byte counts the export tool reported, and the
character counts in the block manifest.
