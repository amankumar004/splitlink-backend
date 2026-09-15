import type { RequestHandler } from "express";

import { forbidden, gone } from "../utils/httpError.js";

/**
 * Refuse writes to a trip that is closed or finished.
 *
 * Goes on every mutating route and on NO read route — a finished trip stays
 * readable so people can still see the final balances. That readability is the
 * whole reason LOCKED exists as a state distinct from deleted.
 */
export const requireActive: RequestHandler = (req, _res, next) => {
  const trip = req.trip;

  if (!trip) {
    // Wiring mistake by us, not a client error — surfaces as a 500.
    throw new Error("requireActive must run after resolveTrip");
  }

  switch (trip.status) {
    case "ACTIVE":
      next();
      return;

    case "LOCKED":
      throw forbidden("TRIP_LOCKED", "The host has closed this trip");

    case "EXPIRED":
      // resolveTrip already rejects these. Two independent checks of the same
      // rule is exactly what you want on the path that writes data.
      throw gone();
  }
};
