import { pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { userRoleEnum } from "./enums.js";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    fullName: varchar("full_name", { length: 160 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: userRoleEnum("role").notNull().default("PARTICIPANT"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
