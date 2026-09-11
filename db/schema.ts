import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
