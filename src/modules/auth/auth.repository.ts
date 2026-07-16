import { eq } from "drizzle-orm";
import type { DbClient } from "../../db/client.js";
import { users, type NewUser, type User } from "../../db/schema/index.js";

export class AuthRepository {
  constructor(private readonly db: DbClient) {}

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));

    return user;
  }

  async findById(id: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));

    return user;
  }

  async create(input: NewUser): Promise<User> {
    const [user] = await this.db.insert(users).values(input).returning();

    if (!user) {
      throw new Error("Failed to create user");
    }

    return user;
  }
}
