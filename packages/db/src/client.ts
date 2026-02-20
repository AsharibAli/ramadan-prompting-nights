import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function createClient(connectionString: string) {
  const client = postgres(connectionString, {
    prepare: false,
    max: 5, // connection pool size (appropriate for most deployments)
    idle_timeout: 20, // close idle connections after 20 seconds
    max_lifetime: 60 * 30, // recycle connections every 30 minutes
    connect_timeout: 10, // fail fast if DB unreachable
  });
  const drizzleConfig = {
    schema,
    driver: "pg",
    dbCredentials: {
      connectionString,
    },
  };
  return drizzle(client, drizzleConfig);
}

export const db = createClient(process.env.DATABASE_URL!);
