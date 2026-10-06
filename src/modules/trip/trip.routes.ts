import { Router } from "express";

import { hashIp } from "../../lib/clientIp.js";
import { resolveTrip } from "../../middleware/resolveTrip.js";
import { validate } from "../../middleware/validate.js";
import { createTripSchema, tripCodeParamSchema } from "./trip.schema.js";
import { TripService } from "./trip.service.js";

const router = Router();
const tripService = new TripService(); // stateless, so one instance is fine

/**
 * POST /trips — create a trip and its HOST member.
 *
 * Public by definition: no token exists yet. This is the one response that
 * carries plaintext tokens, and the only time they are ever available.
 *
 * TODO: rate-limit this route before going public — it is the abuse vector.
 */
router.post("/", validate(createTripSchema), async (req, res) => {
  const { trip, hostToken, memberToken } = await tripService.createTrip({
    body: req.body,
    ipHash: hashIp(req.ip), // needs app.set("trust proxy") once behind a proxy
  });

  // No try/catch: Express 5 forwards rejections to errorHandler.
  res.status(201).json({
    success: true,
    data: { trip, hostToken, memberToken },
  });
});

/**
 * GET /trips/:code — the share link. Public: holding the code is the credential.
 *
 * validate -> rejects a malformed code before it reaches the database.
 * resolveTrip -> loads req.trip, and answers 404 (never existed) vs 410 (over).
 */
router.get(
  "/:code",
  validate(tripCodeParamSchema, "params"),
  resolveTrip,
  async (req, res) => {
    // Non-null: resolveTrip throws rather than calling next() without a trip.
    const trip = await tripService.getTripDetail(req.trip!.id);

    res.status(200).json({
      success: true,
      data: { trip },
    });
  },
);

export default router;
