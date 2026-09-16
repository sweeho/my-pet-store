# Design references — idea SWHM-I-0010 (doc version 8, frozen)

Exported during planning (SWHM-T-0182) from the idea's design blocks. These files are the
authority for the two screens this change builds; the change's own extracted
`## Inventory Update Screen Implementation` and `## Supplier Home Page Implementation`
sections describe the legacy JSPs the screens replace, not what to build.

| File                              | Block title      | Variant   | Authored size | Bytes |
| --------------------------------- | ---------------- | --------- | ------------- | ----- |
| `wireframe-supplier-home.html`    | Supplier home    | wireframe | —             | 2964  |
| `wireframe-inventory-update.html` | Inventory update | wireframe | —             | 5095  |
| `mockup-supplier-home.html`       | Supplier home    | mockup    | 1440×900      | 5349  |
| `mockup-inventory-update.html`    | Inventory update | mockup    | 1440×1400     | 8999  |

Build from the **mockups**; the wireframes carry the same layout without the finished
surface, and they are the only place two facts appear:

- the routes the screens sit at — `/supplier` and `/supplier/inventory`
  (`wireframe-*.html` § note);
- the loading state — the heading stays, the list is replaced by a `role="status"` region
  reading "Loading inventory…" (`wireframe-inventory-update.html`).

The mockups fix the inventory table's four columns in order — **Item ID · Existing quantity ·
New quantity · Update** — the per-row text input and checkbox, the submit control **Update
Inventory** outside the table, and the hint that only ticked rows are written.

Byte counts match the tool manifest exactly, which is how the export was verified.
