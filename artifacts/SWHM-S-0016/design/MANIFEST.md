# Design manifest — SWHM-S-0016

Exported from idea **SWHM-I-0009** (doc version 8, frozen) during planning (SWHM-T-0172). These files are the authority for the payment screen. They contradict the change's own `## User Interface` section, which claims no screen records were extracted — see the Planning record's § Spec discrepancies, S5.

| File                                                     | Title                                                            | Variant   | Chars | sha256 (first 12) |
| -------------------------------------------------------- | ---------------------------------------------------------------- | --------- | ----- | ----------------- |
| `wireframe-checkout-payment-details.html`                | Checkout — Payment Details                                       | wireframe | 4290  | `e6f9b7b2c53d`    |
| `wireframe-checkout-payment-details-validation-and.html` | Checkout — Payment Details (validation and authorization states) | wireframe | 5249  | `1f25ce829bdc`    |
| `mockup-checkout-payment-details.html`                   | Checkout — Payment Details                                       | mockup    | 8378  | `54181a840060`    |
| `mockup-checkout-payment-details-validation-and.html`    | Checkout — Payment Details (validation and authorization states) | mockup    | 17061 | `d1fd1aea6c87`    |

**Build from the mockups, not the wireframes.** The wireframes carry the same layout without the states. The two "validation and authorization states" files fix the behaviour: State A is a validation refusal rendered per field with nothing sent to the processor, State B is the request in flight with the submit control disabled and reading "Authorizing…", and State C is a processor decline that leaves no order and charges nothing.

Two things the mockups show are deliberately **not** built: the "Encrypted at rest" pill (nothing is encrypted, because no card number is stored — S2) and a persisted cardholder name (captured transiently for the authorization request only — S3). The card-type options in the mockups are Visa, MasterCard and American Express; this store's accepted types are `Java(TM) Card`, `Duke Express` and `Meow Card` (S4).

## Export note

`a2a_get_idea_design(write_to=…)` reported a successful write for the first block — returning a path, a byte count and a sha256 — and created no file, then withheld that block's HTML on the next call as `already_written`, pointing at the file that does not exist. This is the third sprint the same failure has been recorded (SWHM-S-0012, SWHM-S-0014, SWHM-S-0016). All four blocks were recovered instead from the canvas renderer and unescaped from their iframe `srcdoc`. The recovery is byte-exact, not approximate: every file's character count matches the manifest the tool returned, and the first block's sha256 matches the one the tool reported for the file it did not write.
