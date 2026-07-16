import type { FastifyInstance } from "fastify";
import { getDbContext } from "../../db/client.js";
import { assertEventAccess, requireAdmin, requireAuth, requireDashboardAccess } from "../../lib/auth-guard.js";
import { alertEventBus, type AlertEvent } from "./alert-event-bus.js";
import { EventRepository } from "./event.repository.js";
import { EventService } from "./event.service.js";
import type { CreateEventInput, EventLoginInput, UpdateEventCodeStatusInput } from "./event.types.js";

function formatSseEvent(event: AlertEvent): string {
  return `event: ${event.event}\ndata: ${JSON.stringify(event.alert)}\n\n`;
}

const eventParamsSchema = {
  type: "object",
  required: ["code"],
  additionalProperties: false,
  properties: {
    code: { type: "string", minLength: 6, maxLength: 6 },
  },
} as const;

const createEventBodySchema = {
  type: "object",
  required: ["name", "venueName", "password"],
  additionalProperties: false,
  properties: {
    name: { type: "string", minLength: 1, maxLength: 160 },
    venueName: { type: "string", minLength: 1, maxLength: 160 },
    password: { type: "string", minLength: 8 },
  },
} as const;

const eventLoginBodySchema = {
  type: "object",
  required: ["code", "password"],
  additionalProperties: false,
  properties: {
    code: { type: "string", minLength: 6, maxLength: 6 },
    password: { type: "string", minLength: 1 },
  },
} as const;

const updateCodeStatusBodySchema = {
  type: "object",
  required: ["isActive"],
  additionalProperties: false,
  properties: {
    isActive: { type: "boolean" },
  },
} as const;

const alertEventsQuerySchema = {
  type: "object",
  required: ["eventId"],
  additionalProperties: false,
  properties: {
    eventId: { type: "string", minLength: 1 },
  },
} as const;

const eventIdParamsSchema = {
  type: "object",
  required: ["id"],
  additionalProperties: false,
  properties: {
    id: { type: "string", minLength: 1 },
  },
} as const;

type EventParams = {
  code: string;
};

type EventIdParams = {
  id: string;
};

type AlertEventsQuery = {
  eventId: string;
};

function createEventService(): EventService {
  const db = getDbContext().db;

  return new EventService(new EventRepository(db));
}

export async function registerEventRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/events/me",
    {
      preHandler: requireDashboardAccess,
    },
    async (request) => {
      if (!request.user.eventId) {
        return { event: null };
      }

      const eventService = createEventService();
      const event = await eventService.getEventById(request.user.eventId);

      return { event };
    },
  );

  app.get(
    "/admin/events",
    {
      preHandler: requireAdmin,
    },
    async (request) => {
      const eventService = createEventService();
      const events = await eventService.listEventsForOwner(request.user.sub);

      return { events };
    },
  );

  app.post<{ Body: EventLoginInput }>(
    "/events/login",
    {
      schema: {
        body: eventLoginBodySchema,
      },
    },
    async (request) => {
      const eventService = createEventService();
      const event = await eventService.loginOperator(request.body);
      const token = app.jwt.sign({
        sub: event.id,
        role: "EO",
        eventId: event.id,
        operatorId: event.createdBy,
      });

      return {
        token,
        event,
        user: {
          id: event.id,
          email: `${event.code}@event.vigilnet`,
          fullName: event.name,
          role: "EO",
          createdAt: event.createdAt,
        },
      };
    },
  );

  app.get<{ Params: EventParams }>(
    "/events/resolve/:code",
    {
      preHandler: requireAuth,
      schema: {
        params: eventParamsSchema,
      },
    },
    async (request) => {
      const eventService = createEventService();
      const event = await eventService.resolveByCode(request.params.code);

      return { event };
    },
  );

  app.post<{ Body: CreateEventInput }>(
    "/admin/events",
    {
      preHandler: requireAdmin,
      schema: {
        body: createEventBodySchema,
      },
    },
    async (request) => {
      const eventService = createEventService();
      const event = await eventService.createEvent(request.body, request.user.sub);

      return { event };
    },
  );

  app.patch<{ Body: UpdateEventCodeStatusInput; Params: EventIdParams }>(
    "/admin/events/:id/code",
    {
      preHandler: requireAdmin,
      schema: {
        body: updateCodeStatusBodySchema,
        params: eventIdParamsSchema,
      },
    },
    async (request) => {
      const eventService = createEventService();
      const event = await eventService.updateOwnedCodeStatus(
        request.user.sub,
        request.params.id,
        request.body.isActive,
      );

      return { event };
    },
  );

  app.get<{ Querystring: AlertEventsQuery }>(
    "/events/alerts",
    {
      preHandler: requireDashboardAccess,
      schema: {
        querystring: alertEventsQuerySchema,
      },
    },
    async (request, reply) => {
      const origin = request.headers.origin ?? "*";
      const eventId = request.query.eventId;
      assertEventAccess(request, eventId);

      reply.raw.writeHead(200, {
        "Access-Control-Allow-Origin": origin,
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream",
        Vary: "Origin",
      });
      reply.raw.write("event: connected\ndata: {}\n\n");

      const unsubscribe = alertEventBus.subscribe((event) => {
        if (event.eventId === eventId) {
          reply.raw.write(formatSseEvent(event));
        }
      });

      request.raw.on("close", unsubscribe);

      return reply;
    },
  );
}
