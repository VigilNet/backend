import { eq } from "drizzle-orm";
import type { DbClient } from "../../db/client.js";
import { events, type Event, type NewEvent } from "../../db/schema/index.js";

export class EventRepository {
  constructor(private readonly db: DbClient) {}

  async findByCode(code: string): Promise<Event | undefined> {
    const [event] = await this.db
      .select()
      .from(events)
      .where(eq(events.code, code.trim().toUpperCase()));

    return event;
  }

  async findByOwner(userId: string): Promise<Event | undefined> {
    const [event] = await this.db.select().from(events).where(eq(events.createdBy, userId));

    return event;
  }

  async listByOwner(userId: string): Promise<Event[]> {
    return this.db.select().from(events).where(eq(events.createdBy, userId));
  }

  async findById(id: string): Promise<Event | undefined> {
    const [event] = await this.db.select().from(events).where(eq(events.id, id));

    return event;
  }

  async create(input: NewEvent): Promise<Event> {
    const [event] = await this.db.insert(events).values(input).returning();

    if (!event) {
      throw new Error("Failed to create event");
    }

    return event;
  }

  async updateCodeStatus(id: string, isActive: boolean): Promise<Event> {
    const [event] = await this.db
      .update(events)
      .set({ isActive })
      .where(eq(events.id, id))
      .returning();

    if (!event) {
      throw new Error("Failed to update event code status");
    }

    return event;
  }
}
