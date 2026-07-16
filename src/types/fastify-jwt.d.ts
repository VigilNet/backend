import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      sub: string;
      role: "ADMIN" | "PARTICIPANT";
    };
    user: {
      sub: string;
      role: "ADMIN" | "PARTICIPANT";
    };
  }
}
