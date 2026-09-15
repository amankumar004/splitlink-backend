import { timingSafeEqual } from "node:crypto";

import type { RequestHandler } from "express";

import prisma from "../lib/prisma.js";
import { hashToken } from "../lib/tokens.js";
import { forbidden, unauthorized } from "../utils/httpError.js";

/**
 * Gate trip administration: rename, extend expiry, remove a member, lock.
 *
 * Note what this does NOT do: it never reads req.member and checks
 * role === "HOST". The host token is a SEPARATE secret, issued once at trip
 * creation. The host's member token is the everyday credential they use for
 * adding expenses — keeping administration behind a second secret means that
 * everyday token leaking (shared tab, copied localStorage, screenshot) does not
 * hand over control of the trip.
 */
export const requireHost: RequestHandler = async (req, _res, next) => {
  const trip = req.trip;

  if (!trip) {
    throw new Error("requireHost must run after resolveTrip");
  }

  const token = req.header("x-host-token");

  if (!token) {
    throw unauthorized();
  }

  const provided = Buffer.from(hashToken(token), "hex");
  const expected = Buffer.from(trip.hostTokenHash, "hex");

  // Both are fixed-length digests of high-entropy secrets, so the timing leak
  // would not be exploitable — but timingSafeEqual costs nothing and removes
  // the question. It throws on length mismatch, hence the guard.
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    throw forbidden("NOT_HOST", "Only the trip host can do that");
  }

  // The host is a member too, and host actions still need an actor id for
  // ActivityLog. Loading it here means host routes need not stack requireMember.
  // The partial unique index guarantees at most one HOST per trip.
  const host = await prisma.member.findFirst({
    where: { tripId: trip.id, role: "HOST" },
  });

  req.isHost = true;

  if (host) {
    req.member = host;
  }

  next();
};
