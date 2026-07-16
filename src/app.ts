import Fastify from "fastify";
import { registerHealthRoute } from "./routes/health.route.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await registerHealthRoute(app);

  return app;
}
