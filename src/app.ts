import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import prisma from "./lib/prisma.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import tripRoutes from "./modules/trip/trip.routes.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: false,
    // A browser will not send a custom header cross-origin unless it is listed
    // here. Omit these and the frontend fails preflight with no useful error.
    allowedHeaders: ["Content-Type", "x-member-token", "x-host-token"],
  }),
);
app.use(express.json({ limit: "100kb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "SplitLink API is running",
  });
});

// Temporary. Proves the driver adapter is wired and the migration applied —
// /health only proves Express started. Remove once real routes exist.
app.get("/health/db", async (_req, res) => {
  const trips = await prisma.trip.count();
  res.status(200).json({ success: true, database: "connected", trips });
});

app.use("/trips", tripRoutes);
// app.use("/trips", tripMemberRoutes);  // join / me, once member.routes.ts exists

// These two must stay LAST, and in this order.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
