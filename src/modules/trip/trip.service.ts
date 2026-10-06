import { Prisma } from "../../generated/prisma/client.js";
import prisma from "../../lib/prisma.js";
import {
  generateShareCode,
  generateToken,
  hashToken,
} from "../../lib/tokens.js";
import { conflict, notFound } from "../../utils/httpError.js";
import type { CreateTripInput } from "./trip.schema.js";

// ISO-4217 exponents. Add entries as SUPPORTED_CURRENCIES grows (JPY 0, KWD 3).
const MINOR_UNITS: Record<string, number> = { INR: 2, USD: 2 };

// Never return token hashes to a caller. Explicit select, so adding a sensitive
// column later cannot silently start leaking it.
const TRIP_PUBLIC = {
  id: true,
  shareCode: true,
  title: true,
  currency: true,
  currencyMinorUnits: true,
  status: true,
  maxMembers: true,
  expiresAt: true,
  createdAt: true,
  members: {
    select: {
      id: true,
      name: true,
      role: true,
      isActive: true,
      joinedAt: true,
    },
    orderBy: { joinedAt: "asc" },
  },
} satisfies Prisma.TripSelect;

function isShareCodeCollision(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    String(error.meta?.["target"] ?? "").includes("shareCode")
  );
}

export class TripService {
  async createTrip(payload: { body: CreateTripInput; ipHash?: string | null }) {
    const { body, ipHash } = payload;

    const hostToken = generateToken();
    // Separate secret from hostToken: a leaked everyday token must not grant admin.
    const memberToken = generateToken();
    const expiresAt = new Date(Date.now() + body.expiryHours * 3600_000);

    // Retry only on a shareCode collision. At 12 chars this is effectively dead code.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const trip = await prisma.trip.create({
          data: {
            title: body.title,
            currency: body.currency,
            currencyMinorUnits: MINOR_UNITS[body.currency] ?? 2,
            expiresAt,
            maxMembers: body.maxMembers,
            shareCode: generateShareCode(), // regenerated each attempt
            hostTokenHash: hashToken(hostToken),
            createdByIpHash: ipHash ?? null, // abuse control only, never identity
            // Nested create = one statement. A trip with no host is unrecoverable.
            members: {
              create: {
                name: body.hostName,
                role: "HOST",
                tokenHash: hashToken(memberToken),
              },
            },
          },
          select: TRIP_PUBLIC,
        });

        // Only moment the plaintext exists outside the client — the DB has hashes.
        return { trip, hostToken, memberToken };
      } catch (error) {
        if (isShareCodeCollision(error) && attempt < 2) continue;
        throw error;
      }
    }

    throw conflict("CONFLICT", "Could not allocate a unique share code");
  }

  /**
   * Takes the INTERNAL id, because resolveTrip has already turned the public
   * shareCode into a Trip and decided 404 vs 410. Never look up by shareCode
   * here, or that decision gets silently bypassed.
   */
  async getTripDetail(tripId: string) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: TRIP_PUBLIC,
    });

    if (!trip) {
      throw notFound("TRIP_NOT_FOUND", "Trip not found");
    }

    return trip;
  }
}
