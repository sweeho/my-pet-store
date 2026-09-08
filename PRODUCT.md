# My Pet Store

See [ARCHITECTURE.md](./ARCHITECTURE.md) for how it is built, [DESIGN.md](./DESIGN.md) for the visual system.

## Mission

My Pet Store is a web storefront for pets and pet supplies. It is at the foundation stage: the application runs, names itself, and proves its own build and test pipeline. The commerce surface — what is sold, to whom, and how — is not yet decided and is stated as such below rather than assumed.

## Problem space and users

- **Shoppers** want to find and buy pet products without wading through a general-purpose marketplace.
- **The team** needs a foundation it has watched run before building any of that. Every later sprint inherits whatever this one leaves behind, which is why the first capability is the application itself rather than a feature.

The shopper problem is the reason the product exists; the team problem is the reason the first sprint contains no shopper-facing feature.

## Capability map

One line per capability. Behaviours belong in the capability's spec under `openspec/specs/`, not here.

| Capability               | What it covers                                                                                                                                                                            | Spec                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `application-foundation` | The running, product-branded application and the automated gate that proves it — what a visitor sees at `/`, what a clean checkout must produce, and what CI must report on a branch push | `openspec/specs/application-foundation/` |

## Scope

**In scope, standing:** a browser-based storefront served by this repository's own frontend and API, verified end to end by its own test suites before anything is considered landed.

**Non-goals, standing:**

- Native mobile applications. The product is delivered in a browser.
- Being a general marketplace or a multi-tenant platform. My Pet Store is one store.
- Owning payment card data directly. Any future payment capability integrates a processor rather than storing card details.
- Re-scaffolding the technical foundation. The stack the application was bootstrapped onto is settled — see ARCHITECTURE.md § Key Decisions.

## Not yet decided

These are open at the product level. A future idea has to settle each before a capability can be specified for it; none is an omission from this document.

- The catalogue model — whether the store sells live animals, supplies, or both, and how inventory is sourced.
- Whether shoppers have accounts, and what an account is for. The current `users` table and the request-scoped user in `middleware/auth.ts` are boilerplate demo content, not a product decision.
- Checkout, payment and fulfilment.

## Success measures

At the product level, and deliberately few:

- A shopper can complete the store's primary journey end to end in a browser, without an error state that has no recovery.
- The verification pipeline reports a verdict on every change before it lands, so the foundation's health is observed rather than assumed.
