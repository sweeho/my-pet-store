# My Pet Store

See [ARCHITECTURE.md](./ARCHITECTURE.md) for how it is built, [DESIGN.md](./DESIGN.md) for the visual system.

## Mission

My Pet Store is a web storefront for pets and pet supplies. It is being rebuilt, capability by capability, from a legacy Java EE petstore whose extracted specifications are the source of record for what each capability must do — see `legacy-analysis/` for the extraction and `openspec/specs/` for the specifications themselves. What the store sells, and how an order reaches a customer, are still open; who a customer is, is not.

## Problem space and users

- **Shoppers** want to find and buy pet products without wading through a general-purpose marketplace, and want the store to recognise them when they come back.
- **The team** needs a foundation it has watched run before building any of that. Every later sprint inherits whatever the previous one leaves behind, which is why the first capability was the application itself rather than a feature.

The shopper problem is the reason the product exists; the team problem is the reason the first sprint contained no shopper-facing feature.

## Capability map

One line per capability. Behaviours belong in the capability's spec under `openspec/specs/`, not here.

| Capability               | What it covers                                                                                                                                                                            | Spec                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `application-foundation` | The running, product-branded application and the automated gate that proves it — what a visitor sees at `/`, what a clean checkout must produce, and what CI must report on a branch push | `openspec/specs/application-foundation/` |
| `user-authentication`    | Who a customer is and what proves it — account creation and its constraints, credential verification, signed-on session state, which resources require it, and remembering a username     | `openspec/specs/user-authentication/`    |
| `account-management`     | What an account holds beyond credentials — contact information and address, card metadata, and profile preferences, and how a customer reads and updates them                             | `openspec/specs/account-management/`     |

## Scope

**In scope, standing:** a browser-based storefront served by this repository's own frontend and API, verified end to end by its own test suites before anything is considered landed.

**Non-goals, standing:**

- Native mobile applications. The product is delivered in a browser.
- Being a general marketplace or a multi-tenant platform. My Pet Store is one store.
- Owning payment card data directly. The store keeps enough to recognise a card a customer has already told it about — the type, the expiry and the last four digits — and never the card number itself. Any capability that needs the number integrates a processor rather than storing it.
- Federated or social sign-in, multi-factor authentication, and password reset or recovery. A customer is identified by a username and a password they set; anything beyond that is a separate product decision, not an extension of the current one.
- Roles or permissions beyond authenticated and unauthenticated. An administrative capability is specified separately and will state its own model.
- Re-scaffolding the technical foundation. The stack the application was bootstrapped onto is settled — see ARCHITECTURE.md § Key Decisions.

## Not yet decided

These are open at the product level. A future idea has to settle each before a capability can be specified for it; none is an omission from this document.

- The catalogue model — whether the store sells live animals, supplies, or both, and how inventory is sourced.
- Order history, and whether an account keeps more than one address. A customer has one contact address today; separate billing and shipping addresses are a question for order placement, not for the account.
- Checkout, payment and fulfilment.

The `users` table inherited from the template is still demo content and is not a product decision; the authenticated customer is a separate entity (ARCHITECTURE.md § Data model).

## Success measures

At the product level, and deliberately few:

- A shopper can complete the store's primary journey end to end in a browser, without an error state that has no recovery.
- A returning shopper can sign in and reach the resource they asked for, rather than being dropped somewhere else.
- The verification pipeline reports a verdict on every change before it lands, so the foundation's health is observed rather than assumed.
