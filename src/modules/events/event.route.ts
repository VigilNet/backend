import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../lib/auth-guard.js";
import { alertEventBus, type AlertEvent } from "./alert-event-bus.js";

function formatSseEvent(event: AlertEvent): string {
  return `event: ${event.event}\ndata: ${JSON.stringify(event.alert)}\n\n`;
}

export async function registerEventRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/events/alerts",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      reply.raw.writeHead(200, {
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream",
      });
      reply.raw.write("event: connected\ndata: {}\n\n");

      const unsubscribe = alertEventBus.subscribe((event) => {
        reply.raw.write(formatSseEvent(event));
      });

      request.raw.on("close", unsubscribe);

      return reply;
    },
  );
}
