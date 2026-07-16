import type { FastifyRequest } from "fastify";
import { HttpError } from "./http-error.js";

export async function requireAuth(request: FastifyRequest): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    throw new HttpError(401, "Unauthorized");
  }
}

export async function requireAdmin(request: FastifyRequest): Promise<void> {
  await requireAuth(request);

  if (request.user.role !== "ADMIN") {
    throw new HttpError(403, "Admin access required");
  }
}
