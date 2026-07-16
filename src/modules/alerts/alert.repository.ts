import { and, desc, eq, type SQL } from "drizzle-orm";
import type { DbClient } from "../../db/client.js";
import { alerts, devices, users, type Alert, type NewAlert } from "../../db/schema/index.js";
import type { AlertStatus, AlertType } from "../../types/alert.js";
import type { AlertWithUser } from "./alert.types.js";

export class AlertRepository {
  constructor(private readonly db: DbClient) {}

  async create(input: NewAlert): Promise<Alert> {
    const [alert] = await this.db.insert(alerts).values(input).returning();

    if (!alert) {
      throw new Error("Failed to create alert");
    }

    return alert;
  }

  async findById(id: string): Promise<AlertWithUser | undefined> {
    const [row] = await this.db
      .select({
        alert: alerts,
        user: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
        },
      })
      .from(alerts)
      .leftJoin(users, eq(alerts.userId, users.id))
      .where(eq(alerts.id, id));

    return row ? { ...row.alert, user: row.user?.id ? row.user : null } : undefined;
  }

  async list(filters: {
    eventId?: string;
    type?: AlertType;
    status?: AlertStatus;
    limit: number;
  }): Promise<AlertWithUser[]> {
    const conditions: SQL[] = [];

    if (filters.eventId) {
      conditions.push(eq(alerts.eventId, filters.eventId));
    }

    if (filters.type) {
      conditions.push(eq(alerts.type, filters.type));
    }

    if (filters.status) {
      conditions.push(eq(alerts.status, filters.status));
    }

    const rows = await this.db
      .select({
        alert: alerts,
        user: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
        },
      })
      .from(alerts)
      .leftJoin(users, eq(alerts.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(alerts.triggeredAt))
      .limit(filters.limit);

    return rows.map((row) => ({
      ...row.alert,
      user: row.user?.id ? row.user : null,
    }));
  }

  async findDeviceOwner(
    eventId: string,
    deviceId: string,
  ): Promise<{ eventId: string; deviceId: string; userId: string } | undefined> {
    const [device] = await this.db
      .select({
        eventId: devices.eventId,
        deviceId: devices.deviceId,
        userId: devices.userId,
      })
      .from(devices)
      .where(and(eq(devices.eventId, eventId), eq(devices.deviceId, deviceId)));

    return device;
  }

  async updateStatus(input: {
    id: string;
    status: AlertStatus;
    operatorId: string;
    allowedEventId?: string;
  }): Promise<Alert | undefined> {
    const now = new Date();
    const lifecycleFields =
      input.status === "ACKNOWLEDGED"
        ? { acknowledgedBy: input.operatorId, acknowledgedAt: now }
        : input.status === "RESOLVED"
          ? { resolvedBy: input.operatorId, resolvedAt: now }
          : {};

    const [alert] = await this.db
      .update(alerts)
      .set({
        status: input.status,
        updatedAt: now,
        ...lifecycleFields,
      })
      .where(
        input.allowedEventId
          ? and(eq(alerts.id, input.id), eq(alerts.eventId, input.allowedEventId))
          : eq(alerts.id, input.id),
      )
      .returning();

    return alert;
  }
}
