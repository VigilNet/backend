import { and, desc, eq } from "drizzle-orm";
import type { DbClient } from "../../db/client.js";
import {
  thresholdConfigs,
  type NewThresholdConfig,
  type ThresholdConfig,
} from "../../db/schema/index.js";

export class ConfigRepository {
  constructor(private readonly db: DbClient) {}

  async findActive(eventId: string): Promise<ThresholdConfig | undefined> {
    const [config] = await this.db
      .select()
      .from(thresholdConfigs)
      .where(and(eq(thresholdConfigs.eventId, eventId), eq(thresholdConfigs.isActive, true)))
      .orderBy(desc(thresholdConfigs.version))
      .limit(1);

    return config;
  }

  async findLatest(eventId: string): Promise<ThresholdConfig | undefined> {
    const [config] = await this.db
      .select()
      .from(thresholdConfigs)
      .where(eq(thresholdConfigs.eventId, eventId))
      .orderBy(desc(thresholdConfigs.version))
      .limit(1);

    return config;
  }

  async deactivateAll(eventId: string): Promise<void> {
    await this.db
      .update(thresholdConfigs)
      .set({ isActive: false })
      .where(and(eq(thresholdConfigs.eventId, eventId), eq(thresholdConfigs.isActive, true)));
  }

  async create(input: NewThresholdConfig): Promise<ThresholdConfig> {
    const [config] = await this.db.insert(thresholdConfigs).values(input).returning();

    if (!config) {
      throw new Error("Failed to create threshold config");
    }

    return config;
  }
}
