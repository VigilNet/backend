import { integer, jsonb, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import type { ThresholdConfig } from "./threshold-configs.js";
import { deviceTypeEnum } from "./enums.js";
import { users } from "./users.js";

export type ThresholdSnapshot = Pick<
  ThresholdConfig,
  "version" | "hrMin" | "hrMax" | "densityThreshold"
>;

export const devices = pgTable(
  "devices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    deviceId: varchar("device_id", { length: 80 }).notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    deviceType: deviceTypeEnum("device_type").notNull(),
    thresholdConfigVersion: integer("threshold_config_version").notNull(),
    thresholdSnapshot: jsonb("threshold_snapshot").$type<ThresholdSnapshot>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    deviceIdIdx: uniqueIndex("devices_device_id_idx").on(table.deviceId),
  }),
);

export type Device = typeof devices.$inferSelect;
export type NewDevice = typeof devices.$inferInsert;
