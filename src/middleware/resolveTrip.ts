import type { RequestHandler } from "express";

import prisma from "../lib/prisma.js";
import { gone, notFound } from "../utils/httpError.js";

/**
 * Turn the :code path parameter into req.trip, and decide 404 vs 410.
 *
 * Runs before every trip-scoped route, public ones included. Deliberately does
 * NOT enforce writability — a LOCKED or EXPIRED trip must stay readable, which
 * is requireActive's job.
 */
export const resolveTrip: RequestHandler = async (req, _res, next) => {
  // Express 5 types params as string | string[], since a wildcard can repeat.
  const code = req.params["code"];

  if (typeof code !== "string" || code.length === 0) {
    throw notFound("TRIP_NOT_FOUND");
  }

  // Look up by shareCode, never by Trip.id. The id is internal; the share code
  // is the public handle, and keeping that separation is why shareCode exists.
  const trip = await prisma.trip.findUnique({ where: { shareCode: code } });

  if (!trip) {
    throw notFound("TRIP_NOT_FOUND");
  }

  // Check BOTH conditions. `status` is an optimisation maintained by the purge
  // sweep, not the truth — between sweeps a row still says ACTIVE while the
  // trip is actually over. Trusting status alone serves expired trips for up to
  // one sweep interval.
  if (trip.status === "EXPIRED" || trip.expiresAt <= new Date()) {
    throw gone();
  }

  req.trip = trip;
  next();
};
