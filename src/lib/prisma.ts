import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

// Prisma 7's client ships without a query engine, so a driver adapter is
// required. The connection string is handed straight to `pg` — which is why
// DATABASE_URL must not carry Prisma-only parameters such as ?schema=.
//
// TODO(config): read this from src/config/env.ts once that exists, so a
// missing DATABASE_URL fails at boot rather than on the first query.
const connectionString = process.env["DATABASE_URL"];

if (!connectionString) {
  throw new Error("DATABASE_URL is not set — copy .env.example to .env");
}

const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({ adapter });

export default prisma;
