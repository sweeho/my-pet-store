import { index, integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
});

export const authUsers = sqliteTable("auth_users", {
  userName: text("user_name").primaryKey(),
  password: text("password").notNull(), // scrypt-hashed, see S3
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
