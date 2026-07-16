import fastifyCors from "@fastify/cors";
import Fastify from "fastify";
import { HttpError } from "./lib/http-error.js";
import { registerAlertRoutes } from "./modules/alerts/alert.route.js";
import { registerAuthRoutes } from "./modules/auth/auth.route.js";
import { registerConfigRoutes } from "./modules/config/config.route.js";
import { registerDeviceRoutes } from "./modules/devices/device.route.js";
import { registerEventRoutes } from "./modules/events/event.route.js";
import { registerJwtPlugin } from "./plugins/jwt.js";
import { registerHealthRoute } from "./routes/health.route.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof HttpError) {
      return reply.code(error.statusCode).send({ error: error.message });
    }

    if (typeof error === "object" && error !== null && "validation" in error) {
      return reply.code(400).send({ error: "Invalid request payload" });
    }

    app.log.error(error);

    return reply.code(500).send({ error: "Internal server error" });
  });

  await app.register(fastifyCors, {
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "OPTIONS"],
    origin: true,
  });
  await registerJwtPlugin(app);
  await registerHealthRoute(app);
  await registerAuthRoutes(app);
  await registerConfigRoutes(app);
  await registerDeviceRoutes(app);
  await registerAlertRoutes(app);
  await registerEventRoutes(app);

  return app;
}
