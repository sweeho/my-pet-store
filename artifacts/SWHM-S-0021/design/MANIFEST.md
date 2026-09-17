# Design reference — SWHM-S-0021

Idea SWHM-I-0014, "Consistent look and site navigation across every screen". Canvas doc v21, frozen.
Exported byte-exact from the idea's design blocks; the byte counts below match the manifest
`a2a_get_idea_design` returns.

| File                                                      | Block       | Variant   | Authored size | Bytes | Critique |
| --------------------------------------------------------- | ----------- | --------- | ------------- | ----- | -------- |
| `wireframe-before-after-shared-header-on-every-scre.html` | `wf-1`      | wireframe | —             | 6168  | —        |
| `mockup-header-states-visitor-customer-administr.html`    | `mk-states` | mockup    | 1440×1290     | 9859  | passed   |
| `mockup-home-page-on-the-store-design-system-adm.html`    | `mk-home`   | mockup    | 1440×900      | 4624  | passed   |
| `mockup-cart-with-the-shared-header-customer-sig.html`    | `mk-cart`   | mockup    | 1440×900      | 6561  | passed   |

**`mk-states` is the authority for this change.** Its six stages fix the header's control order per
variant, both content column widths, and the copy shown before the session is known. The other two
mockups show that header in place on a full screen. The wireframe is a greyscale sketch and says so:
"structure and placement only, not final colour or type".

**Read `openspec/changes/swhm-i-0014-consistent-look-and-site-nav/design.md` § Decisions D12 before
opening any of these.** They are standalone documents that link Space Grotesk from
`fonts.googleapis.com` and re-declare the OKLCH tokens inline. Neither may be copied: the application
ships and fetches no web font, `e2e/home.spec.ts` asserts that no page names a third-party host, and
the tokens already live in `src/index.css`. Take structure, placement, control order and copy from
them; build with the project's own tokens and the system type stack.

They also carry no media query — every one is authored at 1440px — so they settle nothing about the
narrow viewport the idea requires. See design.md § Open questions O1.

_Exported with `curl "$VORTEX_CANVAS_BASE_URL/design/<ideaId>/<blockId>.html"`, because
`a2a_get_idea_design`'s `write_to` argument reported success and wrote no file._
