import { and, desc, eq, notInArray, sql, type SQL } from "drizzle-orm";
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

  // The latest unresolved MANUAL_SOS for this person, if any — used so a
  // repeated trigger from someone already being responded to refreshes their
  // existing alert instead of piling up a new row per press. Once that alert
  // is RESOLVED/CANCELLED it's history, not a target for refreshing: the next
  // trigger starts a fresh alert instead.
  async findActiveByUser(input: {
    eventId: string;
    userId: string;
    type: AlertType;
  }): Promise<Alert | undefined> {
    const [alert] = await this.db
      .select()
      .from(alerts)
      .where(
        and(
          eq(alerts.eventId, input.eventId),
          eq(alerts.userId, input.userId),
          eq(alerts.type, input.type),
          notInArray(alerts.status, ["RESOLVED", "CANCELLED"]),
        ),
      )
      .orderBy(desc(alerts.triggeredAt))
      .limit(1);

    return alert;
  }

  async refreshTrigger(input: {
    id: string;
    lat: number;
    lng: number;
    triggeredAt: Date;
    payload: Record<string, unknown>;
  }): Promise<Alert | undefined> {
    const [alert] = await this.db
      .update(alerts)
      .set({
        lat: input.lat,
        lng: input.lng,
        triggeredAt: input.triggeredAt,
        payload: input.payload,
        updatedAt: new Date(),
      })
      .where(eq(alerts.id, input.id))
      .returning();

    return alert;
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

  async streamUpdate(input: {
    id: string;
    deviceId: string;
    lat: number;
    lng: number;
    payloadPatch: Record<string, unknown>;
    resolve: boolean;
  }): Promise<Alert | undefined> {
    const now = new Date();

    const [alert] = await this.db
      .update(alerts)
      .set({
        lat: input.lat,
        lng: input.lng,
        payload: sql`${alerts.payload} || ${JSON.stringify(input.payloadPatch)}::jsonb`,
        updatedAt: now,
        ...(input.resolve ? { status: "RESOLVED" as const, resolvedAt: now } : {}),
      })
      .where(
        and(
          eq(alerts.id, input.id),
          eq(alerts.deviceId, input.deviceId),
          notInArray(alerts.status, ["RESOLVED", "CANCELLED"]),
        ),
      )
      .returning();

    return alert;
  }
}
