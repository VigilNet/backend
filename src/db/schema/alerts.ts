import {
  doublePrecision,
  index,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { AlertPayload } from "../../types/alert.js";
import { alertStatusEnum, alertTypeEnum } from "./enums.js";
import { events } from "./events.js";
import { users } from "./users.js";

export const alerts = pgTable(
  "alerts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    alertCode: varchar("alert_code", { length: 32 }).notNull(),
    type: alertTypeEnum("type").notNull(),
    deviceId: varchar("device_id", { length: 80 }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    status: alertStatusEnum("status").notNull().default("NEW"),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    triggeredAt: timestamp("triggered_at", { withTimezone: true }).notNull(),
    payload: jsonb("payload").$type<AlertPayload>().notNull(),
    acknowledgedBy: uuid("acknowledged_by").references(() => users.id, { onDelete: "set null" }),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
    resolvedBy: uuid("resolved_by").references(() => users.id, { onDelete: "set null" }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    alertCodeIdx: uniqueIndex("alerts_alert_code_idx").on(table.alertCode),
    eventIdx: index("alerts_event_idx").on(table.eventId),
    statusIdx: index("alerts_status_idx").on(table.status),
    typeIdx: index("alerts_type_idx").on(table.type),
    triggeredAtIdx: index("alerts_triggered_at_idx").on(table.triggeredAt),
  }),
);

export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
