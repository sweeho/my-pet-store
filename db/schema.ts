import { index, integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
});

export const authUsers = sqliteTable("auth_users", {
  userName: text("user_name").primaryKey(),
  password: text("password").notNull(), // scrypt-hashed, see S3
  role: text("role"), // null = ordinary customer; "administrator" = holds the marker
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  jSignon: integer("j_signon", { mode: "boolean" }).notNull().default(false),
  jSignonUsername: text("j_signon_username"),
  originalUrl: text("original_url"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Six tables holding what an account holds beyond credentials. Every one is
// keyed on user_name and foreign-keys upward with ON DELETE CASCADE: the
// relationships are 1:1 throughout, so a shared primary key carries them and
// no surrogate id is introduced (ARCHITECTURE.md § Key Decisions).
export const customers = sqliteTable("customers", {
  userName: text("user_name")
    .primaryKey()
    .references(() => authUsers.userName, { onDelete: "cascade" }),
});

export const accounts = sqliteTable("accounts", {
  userName: text("user_name")
    .primaryKey()
    .references(() => customers.userName, { onDelete: "cascade" }),
  status: text("status").notNull().default("active"),
});

export const profiles = sqliteTable("profiles", {
  userName: text("user_name")
    .primaryKey()
    .references(() => customers.userName, { onDelete: "cascade" }),
  preferredLanguage: text("preferred_language").notNull().default("en_US"),
  favoriteCategory: text("favorite_category"),
  myListPreference: integer("my_list_preference", { mode: "boolean" }).notNull().default(true),
  bannerPreference: integer("banner_preference", { mode: "boolean" }).notNull().default(true),
});

export const contactInfo = sqliteTable("contact_info", {
  userName: text("user_name")
    .primaryKey()
    .references(() => customers.userName, { onDelete: "cascade" }),
  givenName: text("given_name"),
  familyName: text("family_name"),
  telephone: text("telephone"),
  email: text("email"),
});

export const addresses = sqliteTable("addresses", {
  userName: text("user_name")
    .primaryKey()
    .references(() => contactInfo.userName, { onDelete: "cascade" }),
  streetName1: text("street_name1"),
  streetName2: text("street_name2"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country"),
});

// No card-number column — see ARCHITECTURE.md § Key Decisions (D1).
export const cardMetadata = sqliteTable("card_metadata", {
  userName: text("user_name")
    .primaryKey()
    .references(() => customers.userName, { onDelete: "cascade" }),
  cardType: text("card_type"),
  expiryDate: text("expiry_date"),
  lastFour: text("last_four"),
});

// Entity/detail split: one row per entity, one row per entity per locale.
// This is the localization mechanism itself, not a normalization preference
// — it's what makes "missing locale data returns null" a data fact rather
// than a code branch (design.md § Planning record, D2).
export const category = sqliteTable("category", {
  catid: text("catid").primaryKey(),
});

export const categoryDetails = sqliteTable(
  "category_details",
  {
    catid: text("catid")
      .notNull()
      .references(() => category.catid, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    descn: text("descn").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.catid, t.locale] }),
    index("category_details_locale_idx").on(t.locale),
  ],
);

export const product = sqliteTable(
  "product",
  {
    productid: text("productid").primaryKey(),
    catid: text("catid")
      .notNull()
      .references(() => category.catid, { onDelete: "cascade" }),
  },
  (t) => [index("product_catid_idx").on(t.catid)],
);

export const productDetails = sqliteTable(
  "product_details",
  {
    productid: text("productid")
      .notNull()
      .references(() => product.productid, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    descn: text("descn").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.productid, t.locale] }),
    index("product_details_locale_idx").on(t.locale),
  ],
);

export const item = sqliteTable(
  "item",
  {
    itemid: text("itemid").primaryKey(),
    productid: text("productid")
      .notNull()
      .references(() => product.productid, { onDelete: "cascade" }),
    listPrice: real("list_price").notNull(),
    unitCost: real("unit_cost").notNull(),
  },
  (t) => [index("item_productid_idx").on(t.productid)],
);

export const itemDetails = sqliteTable(
  "item_details",
  {
    itemid: text("itemid")
      .notNull()
      .references(() => item.itemid, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    image: text("image").notNull(),
    descn: text("descn").notNull(),
    attr1: text("attr1"),
    attr2: text("attr2"),
    attr3: text("attr3"),
    attr4: text("attr4"),
    attr5: text("attr5"),
  },
  (t) => [
    primaryKey({ columns: [t.itemid, t.locale] }),
    index("item_details_locale_idx").on(t.locale),
  ],
);

// An order and what was in it. orders carries its own order_id because the
// relationship to the customer is 1:N, not 1:1 — unlike the account entities
// above, which share the customer's key (ARCHITECTURE.md § Key Decisions).
// Indexed on status and order_date: the queue query filters on status, the
// report queries filter on the date range, and both are the whole read.
//
// billing_*/shipping_* reuse account/types.ts's Address and ContactInfo field
// sets under each prefix (design.md § Spec discrepancies S6, § Decisions D2):
// an order copies both addresses at placement rather than referencing the
// account's single one, so it stays a record of what was agreed. All are
// nullable, matching the account tables' own columns, so the existing demo
// seed in db/client.ts (which sets none of them) keeps inserting unchanged.
export const orders = sqliteTable(
  "orders",
  {
    orderId: integer("order_id").primaryKey({ autoIncrement: true }),
    userName: text("user_name")
      .notNull()
      .references(() => authUsers.userName),
    orderDate: integer("order_date", { mode: "timestamp" }).notNull(),
    orderAmount: real("order_amount").notNull(),
    status: text("status").notNull(),
    billingGivenName: text("billing_given_name"),
    billingFamilyName: text("billing_family_name"),
    billingTelephone: text("billing_telephone"),
    billingEmail: text("billing_email"),
    billingStreetName1: text("billing_street_name1"),
    billingStreetName2: text("billing_street_name2"),
    billingCity: text("billing_city"),
    billingState: text("billing_state"),
    billingZipCode: text("billing_zip_code"),
    billingCountry: text("billing_country"),
    shippingGivenName: text("shipping_given_name"),
    shippingFamilyName: text("shipping_family_name"),
    shippingTelephone: text("shipping_telephone"),
    shippingEmail: text("shipping_email"),
    shippingStreetName1: text("shipping_street_name1"),
    shippingStreetName2: text("shipping_street_name2"),
    shippingCity: text("shipping_city"),
    shippingState: text("shipping_state"),
    shippingZipCode: text("shipping_zip_code"),
    shippingCountry: text("shipping_country"),
  },
  (t) => [index("orders_status_idx").on(t.status), index("orders_order_date_idx").on(t.orderDate)],
);

// Keyed on (order_id, line_number) rather than a surrogate id — a line item
// never exists without its order. unitPrice is the price PAID, written at
// order creation and never joined back to item.listPrice (design.md D4): a
// join to the current price would silently restate history every time a
// price changes. catid/productid are resolved from the catalogue and stored
// at placement time, same as unitPrice (design.md § Decisions D5); nullable
// because the existing demo seed in db/client.ts does not set them.
// quantityShipped starts at 0 (design.md's extracted entity structure).
export const orderLineItem = sqliteTable(
  "order_line_item",
  {
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.orderId, { onDelete: "cascade" }),
    lineNumber: integer("line_number").notNull(),
    itemid: text("itemid")
      .notNull()
      .references(() => item.itemid),
    quantity: integer("quantity").notNull(),
    unitPrice: real("unit_price").notNull(),
    catid: text("catid").references(() => category.catid),
    productid: text("productid").references(() => product.productid),
    quantityShipped: integer("quantity_shipped").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.orderId, t.lineNumber] })],
);

// Quantity only — price is resolved on read through catalog/item.ts, so a
// cart line never disagrees with the catalogue about what an item costs
// (design.md D1). Both ON DELETE CASCADE declarations are intent only:
// foreign-key enforcement is off in this database (F4), so neither fires;
// clearing a cart on logout is an explicit delete, never a cascade (D4).
export const cartItems = sqliteTable(
  "cart_items",
  {
    sessionId: text("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    itemid: text("itemid")
      .notNull()
      .references(() => item.itemid, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.itemid] })],
);

// How many of an item the store holds — nothing else. No reservation
// column, no ledger, no history: the product records what is held now,
// never how it came to be that (design.md § Decisions D5;
// ARCHITECTURE.md § Data model). An item with no row here reads as
// quantity 0, not an error, so stocking an item is one write and adding a
// catalogue item stays a one-table operation.
export const inventory = sqliteTable("inventory", {
  itemid: text("itemid")
    .primaryKey()
    .references(() => item.itemid),
  quantity: integer("quantity").notNull(),
});
