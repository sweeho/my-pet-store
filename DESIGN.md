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

## Tabular data

A table renders `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` — never a grid of `<div>`s. The semantics are the accessibility: a screen reader announces a column header with each cell only where the real elements are present, and no `role` attribute reconstructs that as reliably as the element it imitates.

Where a table is read-only, it renders no control at all — no `<input>`, `<select>`, `<button>` or `contenteditable` inside the body. A disabled control still reads as a control the visitor has been denied; an absent one reads as information, which is what a read-only table is. Tests assert the absence directly rather than checking a disabled state.

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
