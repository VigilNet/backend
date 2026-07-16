import type { FastifyInstance } from "fastify";

export async function registerHealthRoute(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => ({
    status: "ok",
    service: "vigilnet-backend",
    timestamp: new Date().toISOString(),
  }));
}
