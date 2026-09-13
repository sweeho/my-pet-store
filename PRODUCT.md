# My Pet Store

See [ARCHITECTURE.md](./ARCHITECTURE.md) for how it is built, [DESIGN.md](./DESIGN.md) for the visual system.

## Mission

My Pet Store is a web storefront for pets and pet supplies. It is being rebuilt, capability by capability, from a legacy Java EE petstore whose extracted specifications are the source of record for what each capability must do — see `legacy-analysis/` for the extraction and `openspec/specs/` for the specifications themselves. How an order reaches a customer is still open; who a customer is, and what the store sells, are not.

## Problem space and users

- **Shoppers** want to find and buy pet products without wading through a general-purpose marketplace, and want the store to recognise them when they come back. They are in more than one country and do not all read English, so the language they read the catalogue in is part of what the store recognises about them — and is something a shopper can set without first having an account.
- **The team** needs a foundation it has watched run before building any of that. Every later sprint inherits whatever the previous one leaves behind, which is why the first capability was the application itself rather than a feature.

The shopper problem is the reason the product exists; the team problem is the reason the first sprint contained no shopper-facing feature.

## Capability map

One line per capability. Behaviours belong in the capability's spec under `openspec/specs/`, not here.

| Capability               | What it covers                                                                                                                                                                            | Spec                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `application-foundation` | The running, product-branded application and the automated gate that proves it — what a visitor sees at `/`, what a clean checkout must produce, and what CI must report on a branch push | `openspec/specs/application-foundation/` |
| `user-authentication`    | Who a customer is and what proves it — account creation and its constraints, credential verification, signed-on session state, which resources require it, and remembering a username     | `openspec/specs/user-authentication/`    |
| `account-management`     | What an account holds beyond credentials — contact information and address, card metadata, and profile preferences, and how a customer reads and updates them                             | `openspec/specs/account-management/`     |
| `catalog-browsing`       | What the store sells and how a shopper finds it — the category, product and item hierarchy, localized content for each, paginated browsing, and keyword search across items               | `openspec/specs/catalog-browsing/`       |
| `internationalization`   | Which language a shopper reads the store in — the supported languages, how the active one is chosen and remembered, and what a screen says where that language has no content             | `openspec/specs/internationalization/`   |

## Scope

**In scope, standing:** a browser-based storefront served by this repository's own frontend and API, verified end to end by its own test suites before anything is considered landed.

**Non-goals, standing:**

- Native mobile applications. The product is delivered in a browser.
- Being a general marketplace or a multi-tenant platform. My Pet Store is one store.
- Owning payment card data directly. The store keeps enough to recognise a card a customer has already told it about — the type, the expiry and the last four digits — and never the card number itself. Any capability that needs the number integrates a processor rather than storing it.
- Federated or social sign-in, multi-factor authentication, and password reset or recovery. A customer is identified by a username and a password they set; anything beyond that is a separate product decision, not an extension of the current one.
- Roles or permissions beyond authenticated and unauthenticated. An administrative capability is specified separately and will state its own model.
- Personalised merchandising — recommendations, wishlists, favourites, reviews and ratings. The catalogue shows what the store sells; what a particular shopper might also like is a product decision nobody has taken.
- Translating the store's own interface. What the store sells is localized — catalogue names and descriptions exist per language — but the chrome around it (labels, buttons, validation messages) is English, and so are prices, dates and number formats. A capability that needs a translated interface, a localized currency or a right-to-left layout states that requirement itself rather than inheriting it. The store also never guesses a shopper's language from their browser: it is chosen, or it is English.
- Showing a shopper content in a language they did not ask for. Where a category, product or item has no content in the chosen language, the store says so and offers English — it never falls back silently to another language, because a shopper cannot tell a translation from a substitution.
- Re-scaffolding the technical foundation. The stack the application was bootstrapped onto is settled — see ARCHITECTURE.md § Key Decisions.

## Not yet decided

These are open at the product level. A future idea has to settle each before a capability can be specified for it; none is an omission from this document.

- Whether the catalogue's contents are administered in the product or loaded as data. The store now has a catalogue structure — categories holding products holding purchasable items, each localized — but nothing in the product creates or edits one; the demo catalogue is seeded.
- Order history, and whether an account keeps more than one address. A customer has one contact address today; separate billing and shipping addresses are a question for order placement, not for the account.
- Checkout, payment and fulfilment.

The `users` table inherited from the template is still demo content and is not a product decision; the authenticated customer is a separate entity (ARCHITECTURE.md § Data model).

## Success measures

At the product level, and deliberately few:

- A shopper can complete the store's primary journey end to end in a browser, without an error state that has no recovery.
- A shopper can find a product they came for, by browsing a category or by searching, without knowing how the catalogue is organised.
- A shopper reads the catalogue in a language they chose, and is never shown an empty screen where the real answer is that the content has not been translated yet.
- A returning shopper can sign in and reach the resource they asked for, rather than being dropped somewhere else.
- The verification pipeline reports a verdict on every change before it lands, so the foundation's health is observed rather than assumed.
