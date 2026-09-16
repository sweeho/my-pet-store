# My Pet Store

See [ARCHITECTURE.md](./ARCHITECTURE.md) for how it is built, [DESIGN.md](./DESIGN.md) for the visual system.

## Mission

My Pet Store is a web storefront for pets and pet supplies. It is being rebuilt, capability by capability, from a legacy Java EE petstore whose extracted specifications are the source of record for what each capability must do — see `legacy-analysis/` for the extraction and `openspec/specs/` for the specifications themselves. How an order reaches a customer is still open; who a customer is, what the store sells, and who may act on the store's behalf are not.

## Problem space and users

- **Shoppers** want to find and buy pet products without wading through a general-purpose marketplace, and want the store to recognise them when they come back. They are in more than one country and do not all read English, so the language they read the catalogue in is part of what the store recognises about them — and is something a shopper can set without first having an account.
- **The store operator** runs the shop rather than shopping in it. They need to see what shoppers have done — the order queue, its state, what sold over a period — and to act on it, without a second application, a second credential store, or the ability to be mistaken for a shopper by the parts of the product that serve shoppers.
- **The team** needs a foundation it has watched run before building any of that. Every later sprint inherits whatever the previous one leaves behind, which is why the first capability was the application itself rather than a feature.

The shopper problem is the reason the product exists; the operator problem is what makes it a business rather than a catalogue; the team problem is the reason the first sprint contained no user-facing feature.

## Capability map

One line per capability. Behaviours belong in the capability's spec under `openspec/specs/`, not here.

| Capability               | What it covers                                                                                                                                                                            | Spec                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `application-foundation` | The running, product-branded application and the automated gate that proves it — what a visitor sees at `/`, what a clean checkout must produce, and what CI must report on a branch push | `openspec/specs/application-foundation/` |
| `user-authentication`    | Who a customer is and what proves it — account creation and its constraints, credential verification, signed-on session state, which resources require it, and remembering a username     | `openspec/specs/user-authentication/`    |
| `account-management`     | What an account holds beyond credentials — contact information and address, card metadata, and profile preferences, and how a customer reads and updates them                             | `openspec/specs/account-management/`     |
| `catalog-browsing`       | What the store sells and how a shopper finds it — the category, product and item hierarchy, localized content for each, paginated browsing, and keyword search across items               | `openspec/specs/catalog-browsing/`       |
| `internationalization`   | Which language a shopper reads the store in — the supported languages, how the active one is chosen and remembered, and what a screen says where that language has no content             | `openspec/specs/internationalization/`   |
| `admin-operations`       | What the person running the store can see and do — which identity may act as an administrator, the order queue and its state, moving several orders at once, and what sold over a period  | `openspec/specs/admin-operations/`       |
| `shopping-cart`          | What a shopper has chosen but not yet bought — adding an item, changing or removing what is in the cart, what it comes to, and how long it lasts                                          | `openspec/specs/shopping-cart/`          |

## Scope

**In scope, standing:** a browser-based storefront served by this repository's own frontend and API, verified end to end by its own test suites before anything is considered landed. The same application serves the person running the store, behind the same session and the same credential store as the people shopping in it.

**The identity model, standing:** a person is anonymous, or signed on, or signed on as an administrator. Those are the three states, and the third is a marker on the identity record rather than a second account system — there is one credential store and one access decision for the whole product. Nothing in the product grants or revokes the marker; see § Not yet decided.

**What a visit holds, standing:** browsing and choosing are open to anyone. A shopper does not sign in to look at the catalogue or to put something in a cart — a visit carries a cart from the first thing added to it, and that cart belongs to the visit rather than to an account. Where each capability draws its own line between open browsing and a signed-on action is stated by that capability, never inherited. What happens to a cart when its owner signs in, and whether one outlives the visit, are open; see § Not yet decided.

**Non-goals, standing:**

- Native mobile applications. The product is delivered in a browser.
- A desktop or rich client of any kind. The legacy application deployed its administration screens as a Java Web Start desktop client; the replacement is pages in the application already being served. There is one deployable.
- Being a general marketplace or a multi-tenant platform. My Pet Store is one store.
- Owning payment card data directly. The store keeps enough to recognise a card a customer has already told it about — the type, the expiry and the last four digits — and never the card number itself. Any capability that needs the number integrates a processor rather than storing it.
- Federated or social sign-in, multi-factor authentication, and password reset or recovery. A customer is identified by a username and a password they set; anything beyond that is a separate product decision, not an extension of the current one.
- Permissions finer than the three identity states above. There are no per-screen grants, no groups and no delegation; a capability that needs one states that requirement itself rather than inheriting it.
- An audit trail of administrative actions. The store records what an order's state is, not who moved it or when. A capability that needs accountability for an operator's actions specifies it.
- Live or streaming operational dashboards. What sold is answered for a date range, on request.
- Personalised merchandising — recommendations, wishlists, favourites, reviews and ratings. The catalogue shows what the store sells; what a particular shopper might also like is a product decision nobody has taken.
- Translating the store's own interface. What the store sells is localized — catalogue names and descriptions exist per language — but the chrome around it (labels, buttons, validation messages) is English, and so are prices, dates and number formats. A capability that needs a translated interface, a localized currency or a right-to-left layout states that requirement itself rather than inheriting it. The store also never guesses a shopper's language from their browser: it is chosen, or it is English. This holds for the administration screens too, which are English and report in the default locale's category names.
- Showing a shopper content in a language they did not ask for. Where a category, product or item has no content in the chosen language, the store says so and offers English — it never falls back silently to another language, because a shopper cannot tell a translation from a substitution.
- Re-scaffolding the technical foundation. The stack the application was bootstrapped onto is settled — see ARCHITECTURE.md § Key Decisions.

## Not yet decided

These are open at the product level. A future idea has to settle each before a capability can be specified for it; none is an omission from this document.

- **How anyone becomes an administrator.** The identity record carries the marker and the product reads it, but no screen sets it — today it is seeded as development data. Whether that becomes a screen, a deployment-time value, or stays a database fact is unsettled, and until it is settled the store should not be deployed with the seeded account in place.
- **Whether sessions expire.** They do not, for anyone. The legacy application timed an administrator out after 54 minutes; adopting that is a decision about every session in the product, not an administration setting, so it belongs to the authentication capability rather than to this one.
- Whether the catalogue's contents are administered in the product or loaded as data. The store now has a catalogue structure — categories holding products holding purchasable items, each localized — but nothing in the product creates or edits one; the demo catalogue is seeded. The administration screens read orders; they do not edit the catalogue.
- **Order history as a shopper sees it.** Orders exist as data and an operator can read them, but nothing shows a customer their own past orders, and whether an account keeps more than one address is still a question for order placement rather than for the account.
- **Which price a shopper is charged.** The catalogue quotes one figure per item and the cart totals a different one — the store's cost rather than its list price. Both come from the extracted specification, which is explicit about each in turn, and the cart's own mockup prices its example item at cost. No code change settles this: it is a decision about what the store charges, and it has to be taken before anything takes a shopper's money. Until it is, the cart's subtotal is not a price anyone should act on.
- Checkout and payment — how an order comes to exist in the first place, and how it is paid for. A cart now exists to start from, and the mapping from a cart to an order's line items is built and tested, but nothing calls it.
- **What becomes of a cart.** It lasts as long as the visit and no longer: signing out empties it, and nothing recovers, merges or remembers one. Whether a returning shopper should find their cart where they left it, and whether signing in should adopt a cart built while anonymous, are unasked questions rather than deferred features.
- How money is represented once totals are summed. Reporting is the first place the product adds prices together; the representation it uses is provisional — see ARCHITECTURE.md § Data model.

The `users` table inherited from the template is still demo content and is not a product decision; the authenticated customer is a separate entity (ARCHITECTURE.md § Data model).

## Success measures

At the product level, and deliberately few:

- A shopper can complete the store's primary journey end to end in a browser, without an error state that has no recovery.
- A shopper can find a product they came for, by browsing a category or by searching, without knowing how the catalogue is organised.
- A shopper reads the catalogue in a language they chose, and is never shown an empty screen where the real answer is that the content has not been translated yet.
- A returning shopper can sign in and reach the resource they asked for, rather than being dropped somewhere else.
- The person running the store can answer "what is in the queue" and "what sold" from the product itself, without a database client.
- No screen or endpoint serving the operator is reachable by a shopper, and no shopper-facing screen changes because an operator exists.
- The verification pipeline reports a verdict on every change before it lands, so the foundation's health is observed rather than assumed.
