# Design references — SWHM-S-0014

Idea `SWHM-I-0008` (Order Submission & Checkout), canvas doc version 8, frozen.
Exported during planning (SWHM-T-0147). The mockups are authoritative for both
screens; the wireframes fix structure only.

| File                                     | Variant   | Screen                  | Authored size | What it fixes                                                                                                                                                 |
| ---------------------------------------- | --------- | ----------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wireframe-enter-order-information.html` | wireframe | Enter Order Information | —             | The two-section structure and the field order within each section.                                                                                            |
| `wireframe-order-confirmation.html`      | wireframe | Order Confirmation      | —             | The confirmation card: order id and the email line, nothing else.                                                                                             |
| `mockup-enter-order-information.html`    | mockup    | Enter Order Information | 1440×900      | Billing / Shipping / Your Order three-column layout, every field with its `maxlength`, both dropdowns' options, the per-field invalid state, the two actions. |
| `mockup-order-confirmation.html`         | mockup    | Order Confirmation      | 1440×900      | The confirmation card, the order-id block, the "confirmation e-mail soon at …" line, and the Continue Shopping action.                                        |

Both mockups declare their `:root` tokens as the hex equivalents of this
repository's own OKLCH values in `src/index.css` — they introduce no new token.
The one thing they do introduce that the design system did not already carry is
the per-field invalid state (destructive border, `aria-invalid="true"`, and a
short destructive message directly beneath the input). That is now documented in
DESIGN.md § Form validation states, so build it from there rather than from the
mockup's CSS.

Two details worth reading off the mockup rather than guessing:

- The order form's right-hand column is a read-only summary of the cart being
  ordered, and it carries the note that tax and shipping are not calculated and
  that the cart is emptied on submit.
- The confirmation screen renders "Your order Id is" as a label above the number,
  not as one sentence. See the change's § Spec discrepancies S13 for why that
  matters to how the assertion is written.
