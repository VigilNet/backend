import { pgEnum } from "drizzle-orm/pg-core";
import { alertStatuses, alertTypes, deviceTypes, userRoles } from "../../types/alert.js";

export const userRoleEnum = pgEnum("user_role", userRoles);
export const deviceTypeEnum = pgEnum("device_type", deviceTypes);
export const alertTypeEnum = pgEnum("alert_type", alertTypes);
export const alertStatusEnum = pgEnum("alert_status", alertStatuses);
