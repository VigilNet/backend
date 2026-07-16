import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      sub: string;
      role: "ADMIN" | "PARTICIPANT" | "EO";
      eventId?: string;
      operatorId?: string | null;
    };
    user: {
      sub: string;
      role: "ADMIN" | "PARTICIPANT" | "EO";
      eventId?: string;
      operatorId?: string | null;
    };
  }
}
