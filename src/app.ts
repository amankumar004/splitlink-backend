import cors from "cors";
import express from "express";
import helmet from "helmet";

import prisma from "./lib/prisma.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env["CLIENT_URL"] ?? true, credentials: false }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "SplitLink API is running",
  });
});

// Temporary. Proves the driver adapter is wired and the migration applied —
// /health only proves Express started. Remove once real routes exist.
app.get("/health/db", async (_req, res) => {
  try {
    const trips = await prisma.trip.count();
    res.status(200).json({ success: true, database: "connected", trips });
  } catch (error) {
    res.status(500).json({
      success: false,
      database: "unreachable",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

export default app;
