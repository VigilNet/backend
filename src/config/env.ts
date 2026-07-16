import "dotenv/config";

export type AppEnv = {
  nodeEnv: string;
  host: string;
  port: number;
  databaseUrl: string | undefined;
};

function parsePort(value: string | undefined): number {
  const port = Number(value ?? "3000");

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  return port;
}

export const env: AppEnv = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  host: process.env.HOST ?? "0.0.0.0",
  port: parsePort(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL,
};
