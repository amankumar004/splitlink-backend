import { Router } from "express";

import { hashIp } from "../../lib/clientIp.js";
import { validate } from "../../middleware/validate.js";
import { createTripSchema } from "./trip.schema.js";
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

export default router;
