# Consistent look and site navigation — Implementation Tasks

<!--
  BLOCKED — the ticket keys are missing, and every checkbox below needs one.

  The platform ticks these boxes by matching the "(TICKET-KEY)" tag at the end of a line, so an
  untagged checkbox is never ticked and shows as permanently outstanding. No key exists yet
  because this planning run could not create tickets: every project-scoped vortex_a2a tool refuses
  with "requires a codebase context" (see design.md § Blocker).

  The decomposition is settled — three TASKs, T1/T2/T3, described in design.md § Decomposition
  with their ownership maps and dependencies. Whoever creates them should tag the sections below
  in place: section 1 -> T1, sections 2-4 -> T2, section 5 -> T3.
-->

## 1. Header and session contract (T1)

- [ ] 1.1 Add `StoreHeader` with the store mark, catalogue link, cart link and line count, and the
      trailing slot, per design.md § Fixed interface contracts
- [ ] 1.2 Present the signed-out, signed-on and unresolved identity states in the header (design.md
      D5), with sign-out ending the session and returning to `/`
- [ ] 1.3 Present the Admin link only to an identity holding the administrator role (design.md D4)
- [ ] 1.4 Add the `role` field to `GET /api/signon/session` (design.md D2, D3)
- [ ] 1.5 Add `src/components/layout.ts` exporting the one shared content-width class (design.md D6)
- [ ] 1.6 Cover the header's states and the extended session response in the component and route
      tiers (design.md § Phases, phase 4)

## 2. Customer-facing screens (T2)

- [ ] 2.1 Render the header on cart, account, payment, order form, order confirmation, sign-on
      welcome, account-creation error, the not-found screen and the four catalogue screens
- [ ] 2.2 Pass the catalogue language switcher into the header's trailing slot (design.md D9)
- [ ] 2.3 Move every customer-facing screen onto the shared content width (design.md D6)
- [ ] 2.4 Re-flow the order form to two columns with a full-width summary (design.md D7)

## 3. Home and About on the design tokens (T2)

- [ ] 3.1 Replace the home page's bespoke navigation bar and mobile dialog with the shared header
- [ ] 3.2 Move the home page and About page onto the design tokens, removing every raw palette class
- [ ] 3.3 Replace the mobile-nav browser specification with header assertions, including a
      narrow-viewport assertion (design.md § Phases, phase 4)

## 4. Conformance tests (T2)

- [ ] 4.1 Add the content-width conformance test over the screen sources (design.md D11)
- [ ] 4.2 Add the palette-class conformance test over the home and About sources (design.md D11)

## 5. Administration and supplier screens (T3)

- [ ] 5.1 Reduce `AdminShell` to the header's administration variant plus the label and back-link,
      dropping its `username` prop (design.md D8)
- [ ] 5.2 Remove the now-dead session fetch from the seven `AdminShell` callers, leaving the
      spec-mandated page-level sign-out controls in place (design.md D8, F12)
- [ ] 5.3 Move the two route guards' pending and refusal states onto the shared content width
- [ ] 5.4 Update the affected component and page tests

## 6. Continuous integration

- [ ] 6.1 Confirm the existing workflows trigger on pushes and pull requests to `vortex/**`
      branches and run every tier the phases above extend (design.md § Phases, phase 5)
