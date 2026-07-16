import { and, eq } from "drizzle-orm";
import type { DbClient } from "../../db/client.js";
import { devices, type Device, type NewDevice } from "../../db/schema/index.js";

export class DeviceRepository {
  constructor(private readonly db: DbClient) {}

  async findByEventAndDeviceId(eventId: string, deviceId: string): Promise<Device | undefined> {
    const [device] = await this.db
      .select()
      .from(devices)
      .where(and(eq(devices.eventId, eventId), eq(devices.deviceId, deviceId)));

    return device;
  }

  async findByUserId(userId: string, eventId?: string): Promise<Device[]> {
    return this.db
      .select()
      .from(devices)
      .where(
        eventId
          ? and(eq(devices.userId, userId), eq(devices.eventId, eventId))
          : eq(devices.userId, userId),
      );
  }

  async create(input: NewDevice): Promise<Device> {
    const [device] = await this.db.insert(devices).values(input).returning();

    if (!device) {
      throw new Error("Failed to pair device");
    }

    return device;
  }

  async updatePairing(
    id: string,
    input: Pick<NewDevice, "deviceType">,
  ): Promise<Device> {
    const [device] = await this.db
      .update(devices)
      .set(input)
      .where(eq(devices.id, id))
      .returning();

    if (!device) {
      throw new Error("Failed to update device pairing");
    }

    return device;
  }
}
