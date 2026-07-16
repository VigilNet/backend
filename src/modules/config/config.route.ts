import type { FastifyInstance } from "fastify";
import { getDbContext } from "../../db/client.js";
import { requireAdmin, requireAuth } from "../../lib/auth-guard.js";
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

function createConfigService(): ConfigService {
  return new ConfigService(new ConfigRepository(getDbContext().db));
}

export async function registerConfigRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/config/thresholds/active",
    {
      preHandler: requireAuth,
    },
    async () => {
      const configService = createConfigService();
      const thresholdConfig = await configService.getActiveThresholdConfig();

      return { thresholdConfig };
    },
  );

  app.put<{ Body: UpdateThresholdConfigInput }>(
    "/admin/config/thresholds",
    {
      preHandler: requireAdmin,
      schema: {
        body: updateThresholdBodySchema,
      },
    },
    async (request) => {
      const configService = createConfigService();
      const thresholdConfig = await configService.createActiveThresholdConfig(
        request.body,
        request.user.sub,
      );

      return { thresholdConfig };
    },
  );
}
