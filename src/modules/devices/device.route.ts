import type { FastifyInstance } from "fastify";
import { getDbContext } from "../../db/client.js";
import { requireAuth } from "../../lib/auth-guard.js";
import { ConfigRepository } from "../config/config.repository.js";
import { DeviceRepository } from "./device.repository.js";
import { DeviceService } from "./device.service.js";
import type { PairDeviceInput } from "./device.types.js";

const pairDeviceBodySchema = {
  type: "object",
  required: ["deviceId", "deviceType"],
  additionalProperties: false,
  properties: {
    deviceId: { type: "string", minLength: 1, maxLength: 80 },
    deviceType: { type: "string", enum: ["APP", "WATCH"] },
  },
} as const;

function createDeviceService(): DeviceService {
  const db = getDbContext().db;

  return new DeviceService(new DeviceRepository(db), new ConfigRepository(db));
}

export async function registerDeviceRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: PairDeviceInput }>(
    "/devices/pair",
    {
      preHandler: requireAuth,
      schema: {
        body: pairDeviceBodySchema,
      },
    },
    async (request) => {
      const deviceService = createDeviceService();
      const device = await deviceService.pairDevice(request.body, request.user.sub);

      return { device };
    },
  );

  app.get(
    "/devices/me",
    {
      preHandler: requireAuth,
    },
    async (request) => {
      const deviceService = createDeviceService();
      const devices = await deviceService.listDevicesForUser(request.user.sub);

      return { devices };
    },
  );
}
