import {
  boolean,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { events } from "./events.js";
import { users } from "./users.js";

export const thresholdConfigs = pgTable(
  "threshold_configs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    hrMin: integer("hr_min").notNull(),
    hrMax: integer("hr_max").notNull(),
    densityThreshold: integer("density_threshold").notNull(),
    isActive: boolean("is_active").notNull().default(false),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    eventVersionIdx: uniqueIndex("threshold_configs_event_version_idx").on(
      table.eventId,
      table.version,
    ),
  }),
);

export type ThresholdConfig = typeof thresholdConfigs.$inferSelect;
export type NewThresholdConfig = typeof thresholdConfigs.$inferInsert;
