import type { FastifyInstance } from "fastify";
import { getDbContext } from "../../db/client.js";
import { assertEventAccess, requireAdmin, requireDashboardAccess } from "../../lib/auth-guard.js";
import { ConfigRepository } from "./config.repository.js";
import { ConfigService } from "./config.service.js";
import type { UpdateThresholdConfigInput } from "./config.types.js";

const updateThresholdBodySchema = {
  type: "object",
  required: ["hrMin", "hrMax", "densityThreshold"],
  additionalProperties: false,
  properties: {
    hrMin: { type: "integer", minimum: 1 },
    hrMax: { type: "integer", minimum: 1 },
    densityThreshold: { type: "integer", minimum: 1 },
  },
} as const;

const eventQuerySchema = {
  type: "object",
  required: ["eventId"],
  additionalProperties: false,
  properties: {
    eventId: { type: "string", minLength: 1 },
  },
} as const;

type EventQuery = {
  eventId: string;
};

function createConfigService(): ConfigService {
  return new ConfigService(new ConfigRepository(getDbContext().db));
}

export async function registerConfigRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: EventQuery }>(
    "/config/thresholds/active",
    {
      preHandler: requireDashboardAccess,
      schema: {
        querystring: eventQuerySchema,
      },
    },
    async (request) => {
      assertEventAccess(request, request.query.eventId);
      const configService = createConfigService();
      const thresholdConfig = await configService.getActiveThresholdConfig(request.query.eventId);

      return { thresholdConfig };
    },
  );

  app.put<{ Body: UpdateThresholdConfigInput; Querystring: EventQuery }>(
    "/admin/config/thresholds",
    {
      preHandler: requireAdmin,
      schema: {
        body: updateThresholdBodySchema,
        querystring: eventQuerySchema,
      },
    },
    async (request) => {
      const configService = createConfigService();
      const thresholdConfig = await configService.createActiveThresholdConfig(
        request.body,
        request.user.sub,
        request.query.eventId,
      );

      return { thresholdConfig };
    },
  );
}
