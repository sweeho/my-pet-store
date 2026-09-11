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
