import type { FastifyInstance } from "fastify";
import { getDbContext } from "../../db/client.js";
import { requireAuth } from "../../lib/auth-guard.js";
import { EventRepository } from "../events/event.repository.js";
import { AuthRepository } from "./auth.repository.js";
import { AuthService } from "./auth.service.js";
import type { LoginInput, RegisterInput } from "./auth.types.js";

const registerBodySchema = {
  type: "object",
  required: ["email", "fullName", "password"],
  additionalProperties: false,
  properties: {
    email: { type: "string", minLength: 3, maxLength: 320 },
    fullName: { type: "string", minLength: 1, maxLength: 160 },
    password: { type: "string", minLength: 8 },
    role: { type: "string", enum: ["ADMIN", "PARTICIPANT"] },
  },
} as const;

const loginBodySchema = {
  type: "object",
  required: ["email", "password"],
  additionalProperties: false,
  properties: {
    email: { type: "string", minLength: 3, maxLength: 320 },
    password: { type: "string", minLength: 1 },
  },
} as const;

function createAuthService(): AuthService {
  return new AuthService(new AuthRepository(getDbContext().db));
}

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: RegisterInput }>(
    "/auth/register",
    {
      schema: {
        body: registerBodySchema,
      },
    },
    async (request) => {
      const authService = createAuthService();
      const user = await authService.register(request.body);
      const token = app.jwt.sign({ sub: user.id, role: user.role });

      return { token, user };
    },
  );

  app.post<{ Body: LoginInput }>(
    "/auth/login",
    {
      schema: {
        body: loginBodySchema,
      },
    },
    async (request) => {
      const authService = createAuthService();
      const user = await authService.login(request.body);
      const token = app.jwt.sign({ sub: user.id, role: user.role });

      return { token, user };
    },
  );

  app.get(
    "/auth/me",
    {
      preHandler: requireAuth,
    },
    async (request) => {
      if (request.user.role === "EO" && request.user.eventId) {
        const event = await new EventRepository(getDbContext().db).findById(request.user.eventId);

        if (!event) {
          throw new Error("Event token is invalid");
        }

        return {
          user: {
            id: event.id,
            email: `${event.code}@event.vigilnet`,
            fullName: event.name,
            role: "EO",
            createdAt: event.createdAt,
          },
        };
      }

      const authService = createAuthService();
      const user = await authService.getById(request.user.sub);

      return { user };
    },
  );
}
