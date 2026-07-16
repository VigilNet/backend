import {
  boolean,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const thresholdConfigs = pgTable(
  "threshold_configs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    version: integer("version").notNull(),
    hrMin: integer("hr_min").notNull(),
    hrMax: integer("hr_max").notNull(),
    densityThreshold: integer("density_threshold").notNull(),
    isActive: boolean("is_active").notNull().default(false),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    versionIdx: uniqueIndex("threshold_configs_version_idx").on(table.version),
  }),
);

export type ThresholdConfig = typeof thresholdConfigs.$inferSelect;
export type NewThresholdConfig = typeof thresholdConfigs.$inferInsert;
