import type { FastifyInstance } from "fastify";
import { getDbContext } from "../../db/client.js";
import {
  assertEventAccess,
  requireDashboardAccess,
  requireAuth,
} from "../../lib/auth-guard.js";
import { alertEventBus } from "../events/alert-event-bus.js";
import { EventRepository } from "../events/event.repository.js";
import { AlertRepository } from "./alert.repository.js";
import { AlertService } from "./alert.service.js";
import type {
  IngestAlertInput,
  ListAlertsQuery,
  StreamAlertInput,
  UpdateAlertStatusInput,
} from "./alert.types.js";

const ingestAlertBodySchema = {
  type: "object",
  required: ["device_id", "type", "ts", "lat", "lng", "payload"],
  additionalProperties: false,
  properties: {
    device_id: { type: "string", minLength: 1, maxLength: 80 },
    event_code: { type: "string", minLength: 1, maxLength: 32 },
    event_id: { type: "string", minLength: 1 },
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
    eventId: { type: "string", minLength: 1 },
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

const streamAlertBodySchema = {
  type: "object",
  required: ["device_id", "lat", "lng", "ts"],
  additionalProperties: false,
  properties: {
    device_id: { type: "string", minLength: 1, maxLength: 80 },
    lat: { type: "number", minimum: -90, maximum: 90 },
    lng: { type: "number", minimum: -180, maximum: 180 },
    ts: { type: "number" },
    payload: { type: "object" },
    active: { type: "boolean" },
  },
} as const;

type AlertParams = {
  id: string;
};

function createAlertService(): AlertService {
  const db = getDbContext().db;

  return new AlertService(new AlertRepository(db), new EventRepository(db));
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
      const { alert, created } = await alertService.ingestAlert(request.body);

      alertEventBus.publish({
        event: created ? "alert:new" : "alert:updated",
        eventId: alert.eventId,
        alert,
      });

      return { alert };
    },
  );

  app.post<{ Params: AlertParams; Body: StreamAlertInput }>(
    "/alerts/:id/stream",
    {
      schema: {
        params: alertParamsSchema,
        body: streamAlertBodySchema,
      },
    },
    async (request) => {
      const alertService = createAlertService();
      const alert = await alertService.streamUpdate(request.params.id, request.body);

      alertEventBus.publish({ event: "alert:updated", eventId: alert.eventId, alert });

      return { alert };
    },
  );

  app.get<{ Querystring: ListAlertsQuery }>(
    "/alerts",
    {
      preHandler: requireDashboardAccess,
      schema: {
        querystring: listAlertsQuerySchema,
      },
    },
    async (request) => {
      if (request.query.eventId) {
        assertEventAccess(request, request.query.eventId);
      }
      const alertService = createAlertService();
      const alerts = await alertService.listAlerts(request.query);

      return { alerts };
    },
  );

  app.get<{ Params: AlertParams }>(
    "/alerts/:id",
    {
      preHandler: requireDashboardAccess,
      schema: {
        params: alertParamsSchema,
      },
    },
    async (request) => {
      const alertService = createAlertService();
      const alert = await alertService.getAlert(request.params.id, request.user.eventId);

      return { alert };
    },
  );

  app.patch<{ Params: AlertParams; Body: UpdateAlertStatusInput }>(
    "/alerts/:id/status",
    {
      preHandler: requireDashboardAccess,
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
        request.user.operatorId ?? request.user.sub,
        request.user.eventId,
      );

      alertEventBus.publish({ event: "alert:updated", eventId: alert.eventId, alert });

      return { alert };
    },
  );
}
