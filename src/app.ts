import Fastify from "fastify";
import { HttpError } from "./lib/http-error.js";
import { registerAuthRoutes } from "./modules/auth/auth.route.js";
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

  await registerJwtPlugin(app);
  await registerHealthRoute(app);
  await registerAuthRoutes(app);

  return app;
}
