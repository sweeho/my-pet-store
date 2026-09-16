# Design System

See [PRODUCT.md](./PRODUCT.md) for what this is, [ARCHITECTURE.md](./ARCHITECTURE.md) for how it's built.

## Tokens

OKLCH custom properties in `src/index.css` (`:root` light, `.dark` dark), mapped to Tailwind utilities via `@theme inline`. Add a token in both places + the theme block, or Tailwind won't generate a class for it.

| Token                                                | Tailwind class                                       |
| ---------------------------------------------------- | ---------------------------------------------------- |
| `--background` / `--foreground`                      | `bg-background` / `text-foreground`                  |
| `--primary` / `--secondary` / `--muted` / `--accent` | `bg-*`                                               |
| `--destructive` / `--destructive-foreground`         | `bg-destructive` / `text-destructive-foreground`     |
| `--border` / `--input` / `--ring`                    | `border-border` / `border-input` / `outline-ring/50` |
| `--radius` (+ `sm`/`md`/`lg`/`xl`)                   | `rounded-*`                                          |

### Contrast

A `--x` / `--x-foreground` pair must never resolve to the same colour in either theme, and must meet WCAG 2.1 AA for normal text (4.5:1). `src/theme-tokens.test.ts` enforces both for the destructive pair — distinctness in both themes, the ratio in light. The other pairs are not yet covered by an automated check; measure before changing one.

Two gotchas when picking a foreground: the light neutrals `oklch(0.97 0 0)` (`--secondary`, `--muted`, `--accent`) are too dark to clear 4.5:1 against a saturated background, and the `.dark` destructive pair sits at 2.63:1 — below AA — so it is not a model to copy.

## Theming

Dark-mode tokens exist but no toggle is wired up — nothing sets `.dark` on `<html>` yet.

## Components

Pattern (see `src/components/ui/button.tsx` + `button-variants.ts`):

- Variants via `class-variance-authority`
- Class merging via `cn()` (`clsx` + `tailwind-merge`) — always last, so callers can override
- Polymorphism via Radix `Slot` (`asChild` prop)
- Variants exported from a separate `*-variants.ts` file, not the component file (avoids an `eslint-plugin-react-refresh` warning)

New shared components go in `src/components/ui/`, follow this pattern, get a `*.test.tsx`.

A primitive with exactly one appearance is the documented exception: `src/components/ui/table.tsx` exports real semantic elements (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`) with no `*-variants.ts` file, because a CVA file whose only variant is the default adds a layer that expresses nothing. Add the variants file when a second appearance actually exists, not in anticipation of one.

## Form validation states

A form reports a problem in two places, and they say different things.

**At the field.** The invalid input carries `aria-invalid="true"` and a destructive border, and the message sits directly beneath it as an element with `role="alert"`, naming what is wrong with that field. `aria-invalid` is what makes the state available to a screen reader — the border alone conveys it to sighted readers only, which is why the attribute is not optional and is not a styling hook. Keep the message to the correction the reader has to make; it is read out as soon as it appears, so a long one is heard before the field it belongs to is reached.

**At the form.** One `role="alert"` above the form says a submission was refused, without enumerating the fields. It exists because a screen reader's focus is on the submit control at that moment and may never travel far enough to encounter a field-level message, and because a long form can refuse on a field that is scrolled out of view. Where a submission fails for a reason no single field owns — the server rejected it, a precondition was not met — this is the only place it can be said.

Both are absent until there is something to report. A form does not render an empty alert region waiting to be filled: an alert that is always present is announced as a state change when its text arrives only if it is a live region, and one that renders empty on first paint has already spent that announcement. Tests locate both by role, never by class name.

Field length limits are `maxlength` attributes on the input. They are a constraint, not a validation state — the field stops accepting input rather than turning invalid — so they carry no message and no `aria-invalid`.

## Pending actions

A submit control that starts work the reader must not start twice is disabled from the moment it is pressed until the outcome is known, and its label changes to the present participle of what it is doing — "Authorizing…" rather than "Authorize payment". The label change is not decoration: a disabled control with its original label reads as refused rather than busy, and a reader who cannot see the pointer has nothing else to distinguish the two.

Alongside it, an element with `role="status"` names what is happening in a full sentence. This is the same live-region mechanism as § Loading states and it is announced without stealing focus — which matters more here than on a loading screen, because the reader's focus is on the control they just pressed and moving it would lose their place.

The distinction from § Loading states is what is pending. There, a screen has nothing to show until a fetch lands, so the indicator stands in for absent content. Here the content is present and unchanged; what is pending is an action the reader started, and the screen's job is to say so without appearing to have lost it. A screen that does neither invites a second press, and for an irreversible action a second press is the failure.

Restore the control and remove the status region when the outcome arrives — do not leave a spent status region on the page. If the outcome is a refusal, it is reported through § Form validation states, not by leaving the control disabled.

## Tabular data

A table renders `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` — never a grid of `<div>`s. The semantics are the accessibility: a screen reader announces a column header with each cell only where the real elements are present, and no `role` attribute reconstructs that as reliably as the element it imitates.

Where a table is read-only, it renders no control at all — no `<input>`, `<select>`, `<button>` or `contenteditable` inside the body. A disabled control still reads as a control the visitor has been denied; an absent one reads as information, which is what a read-only table is. Tests assert the absence directly rather than checking a disabled state.

**Where a table is editable**, the controls live in the row and the submit control does not. Three things follow, and none is optional:

- **Every control in a row carries an accessible name that names that row's subject** — `aria-label="New quantity for BIRDS-PARROTS-1"`, not "New quantity". A column header labels a cell for a reader moving through the table; it does not reach a control inside one, so an input named only by its column is announced identically in every row and a screen reader user cannot tell which row they are editing. This is the cell-level counterpart of the naming rule in § Form validation states, and it is what a test locates the control by.
- **Selecting a row and editing it are separate controls**, and the selection is what decides what is written. A typed value in an unticked row is not submitted. The alternative — inferring intent from whether a field was touched — makes a screen that cannot distinguish "I typed this and changed my mind" from "I meant it", and makes every row the screen was rendered with a candidate for overwriting with a stale value.
- **The submit control sits outside the table**, after it, with a line of text beside it stating what will be written. One control writes the selected rows together; a per-row save button turns one intention into many actions with no way to see what is still outstanding.

The form's outcome is reported as § Form validation states describes, at the form rather than the field, and its in-flight state as § Pending actions describes — an editable table is a form that happens to be laid out as a table, and inherits both.

## Reported figures

A magnitude is drawn from the tokens above, not from a charting dependency — a horizontal bar is a `<div>` whose width is a percentage of the largest value in the set, on a `bg-secondary` track (`src/components/ReportBars.tsx`). ARCHITECTURE.md § Stack records that no visualisation library is present and that adding one is an untaken decision.

The bar is `aria-hidden`; the value it depicts is rendered beside it as text, and the rows are a `<ul>`. A bar conveys a comparison a sighted reader makes at a glance and carries nothing a screen reader can use, so labelling it would announce the same number twice. Where the figure is a magnitude of the same kind rendered in several places, the component takes a formatter rather than assuming money or a count — the same bar serves revenue and order counts.

## Brand mark

`src/components/StoreMark.tsx` is the store's mark — an inline SVG plus the `STORE_NAME` wordmark, both drawn in `currentColor` so the mark takes its colour from whatever surface it sits on. It is deliberately not a `ui/` primitive and does not follow the variants pattern above: it has no variants, only an optional `className` for sizing, and it sits in `src/components/` with the other behavioural components.

The whole mark is `aria-hidden`. Whatever renders it supplies the accessible name on the surrounding element — the landing header and its mobile panel each carry an `sr-only` span inside the logo link, which is what `getByRole("link", { name: … })` matches. Naming the mark as well would make every logo link announce the store twice.

A mark, icon or font is never referenced from a third-party host. The template this page was generated from hotlinked its logo from `tailwindcss.com`, which shipped a demo asset to every visitor and made the store's own branding depend on someone else's CDN.

## Loading states

A screen that gates its render on a fetch shows a pending indicator, never an empty page. The
indicator is an element with `role="status"` that names what is loading — an ARIA live region, so a
screen reader announces the state change without stealing focus — and it disappears once the content
is present. Keep the screen's stable chrome (its heading, its container) rendered alongside it, so
the page has an identity from first paint.

There is no skeleton primitive and no spinner component; the role is the pattern. Tests locate the
indicator by that role, never by class name or DOM shape, which is how everything else in this
codebase is located too.

## Image states

An image whose source may not resolve falls back once to `/images/placeholder.svg`, a committed flat vector with no external reference. The handler checks whether the current `src` is already the placeholder before reassigning, so a placeholder that itself fails to load is a no-op rather than a second swap — without that guard an unreachable fallback re-enters the error handler indefinitely.

`alt` does not change with the swap. It names the thing the image stands for, not the file that happened to load, so the accessible name is identical whichever of the two renders — which is also what lets a test assert the fallback on `src` alone.

The fallback is a degradation, not a fix: a screen showing the placeholder is still issuing a request that 404s. Where an asset is genuinely expected to exist, ship it — the placeholder is for the case where it legitimately might not.

## Unavailable content states

An empty region is not an answer. Where a screen has nothing to show and the reason is something the
visitor could act on, it says what the reason is and offers the action — in the same place the content
would have been, not as a banner above it.

The pattern has three parts, and a screen that drops any one of them is worse than the empty list it
replaced:

1. **A heading that names the specific cause**, in the visitor's own terms and including the value that
   caused it — "No products in 中文 yet", not "No results".
2. **A body that says nothing is broken.** A visitor's first reading of an empty screen is that the
   store is empty or the page failed. Contradict that explicitly.
3. **A primary action that resolves it in one click**, plus a secondary action that changes the
   condition instead of escaping it.

A recovery action renders its own control; it never operates one belonging to another region of the screen. Reaching for another component's node and dispatching events at it produces a control that works once per page load — see ARCHITECTURE.md § Key Decisions for why, and for what to do instead.

Name a language in its own script (`中文`, `日本語`), never as a locale code — the person reading it may
not read the rest of the interface. This is distinct from a search that matched nothing, which is a
correct empty result and keeps its own short message.

This is a state of the screen, not a screen of its own: keep the chrome — heading, container, and any
control the visitor needs to change the condition — rendered around it. A dedicated route would lose
the context that makes the recovery action obvious, and would make Back the only way out.

Tests locate the heading and both actions by role and accessible name, as everything else here does.

## Icons

`lucide-react` for general use, `@heroicons/react` for `@headlessui/react` overlays (nav dialog).

## Animation

`tw-animate-css` — Tailwind v4-compatible successor to `tailwindcss-animate`.
