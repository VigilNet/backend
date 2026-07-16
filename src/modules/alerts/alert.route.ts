import type { FastifyInstance } from "fastify";
import { getDbContext } from "../../db/client.js";
import { requireAdmin, requireAuth } from "../../lib/auth-guard.js";
import { AlertRepository } from "./alert.repository.js";
import { AlertService } from "./alert.service.js";
import type { IngestAlertInput, ListAlertsQuery, UpdateAlertStatusInput } from "./alert.types.js";

const ingestAlertBodySchema = {
  type: "object",
  required: ["device_id", "type", "ts", "lat", "lng", "payload"],
  additionalProperties: false,
  properties: {
    device_id: { type: "string", minLength: 1, maxLength: 80 },
    type: { type: "string", enum: ["BIOMETRIC_ANOMALY", "DENSITY_ANOMALY", "MANUAL_SOS"] },
    ts: { type: "number" },
    lat: { type: "number", minimum: -90, maximum: 90 },
    lng: { type: "number", minimum: -180, maximum: 180 },
    payload: { type: "object" },
  },
} as const;

const listAlertsQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    type: { type: "string", enum: ["BIOMETRIC_ANOMALY", "DENSITY_ANOMALY", "MANUAL_SOS"] },
    status: { type: "string", enum: ["NEW", "ACKNOWLEDGED", "RESOLVED", "CANCELLED"] },
    limit: { type: "string" },
  },
} as const;

const alertParamsSchema = {
  type: "object",
  required: ["id"],
  additionalProperties: false,
  properties: {
    id: { type: "string", minLength: 1 },
  },
} as const;

const updateStatusBodySchema = {
  type: "object",
  required: ["status"],
  additionalProperties: false,
  properties: {
    status: { type: "string", enum: ["ACKNOWLEDGED", "RESOLVED", "CANCELLED"] },
  },
} as const;

type AlertParams = {
  id: string;
};

function createAlertService(): AlertService {
  return new AlertService(new AlertRepository(getDbContext().db));
}

export async function registerAlertRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: IngestAlertInput }>(
    "/alerts/ingest",
    {
      schema: {
        body: ingestAlertBodySchema,
      },
    },
    async (request) => {
      const alertService = createAlertService();
      const alert = await alertService.ingestAlert(request.body);

      return { alert };
    },
  );

  app.get<{ Querystring: ListAlertsQuery }>(
    "/alerts",
    {
      preHandler: requireAuth,
      schema: {
        querystring: listAlertsQuerySchema,
      },
    },
    async (request) => {
      const alertService = createAlertService();
      const alerts = await alertService.listAlerts(request.query);

      return { alerts };
    },
  );

  app.get<{ Params: AlertParams }>(
    "/alerts/:id",
    {
      preHandler: requireAuth,
      schema: {
        params: alertParamsSchema,
      },
    },
    async (request) => {
      const alertService = createAlertService();
      const alert = await alertService.getAlert(request.params.id);

      return { alert };
    },
  );

  app.patch<{ Params: AlertParams; Body: UpdateAlertStatusInput }>(
    "/alerts/:id/status",
    {
      preHandler: requireAdmin,
      schema: {
        params: alertParamsSchema,
        body: updateStatusBodySchema,
      },
    },
    async (request) => {
      const alertService = createAlertService();
      const alert = await alertService.updateStatus(
        request.params.id,
        request.body,
        request.user.sub,
      );

      return { alert };
    },
  );
}
