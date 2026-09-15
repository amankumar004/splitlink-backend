import type { RequestHandler } from "express";

import prisma from "../lib/prisma.js";
import { hashToken } from "../lib/tokens.js";
import { forbidden, unauthorized } from "../utils/httpError.js";

/**
 * Resolve `x-member-token` into the Member making the request.
 *
 * This is what makes anonymous writes attributable — without it, any holder of
 * the share link could post as anyone else.
 *
 * It proves "you are member X of this trip" and nothing more. Whether X may
 * modify a PARTICULAR row (edit this expense, confirm that settlement) is a
 * service-level check, because middleware has not loaded the row yet.
 */
export const requireMember: RequestHandler = async (req, _res, next) => {
  const trip = req.trip;

  if (!trip) {
    throw new Error("requireMember must run after resolveTrip");
  }

  // Header only. Query strings end up in logs, browser history and Referer.
  const token = req.header("x-member-token");

  if (!token) {
    throw unauthorized();
  }

  // Scoping by tripId is what stops a valid token for one trip from acting on
  // another. tokenHash alone is unique, so findUnique would also work — but
  // then the tripId check is yours to remember, and forgetting it is a real
  // cross-trip authorisation hole. Let the query carry the rule.
  const member = await prisma.member.findFirst({
    where: { tokenHash: hashToken(token), tripId: trip.id },
  });

  // Same code and message whether the header was absent, malformed or unknown.
  // Distinguishing them tells an attacker which share codes have live members.
  if (!member) {
    throw unauthorized();
  }

  if (!member.isActive) {
    throw forbidden("MEMBER_INACTIVE", "You have been removed from this trip");
  }

  req.member = member;
  next();
};
