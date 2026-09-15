// =============================================================================
// STEP 4g — Trip service
// =============================================================================
//
// PURPOSE
//   All trip business logic and every Prisma call. Knows nothing about Express:
//   no req, no res, no status codes beyond throwing HttpError. That is what
//   makes it testable without booting a server.
//
// -----------------------------------------------------------------------------
// WHAT TO EXPORT
// -----------------------------------------------------------------------------
//
//   export async function createTrip(input: CreateTripInput, ipHash?: string)
//   export async function getTripDetail(tripId: string)
//   export async function updateTrip(tripId: string, input: UpdateTripInput)
//   export async function lockTrip(tripId: string)
//
// -----------------------------------------------------------------------------
// createTrip — the most interesting function in the first slice
// -----------------------------------------------------------------------------
//
// 1. Generate three secrets up front:
//      shareCode   = generateShareCode()
//      hostToken   = generateToken()
//      memberToken = generateToken()    // the host's own member credential
//
// 2. Derive currencyMinorUnits from the currency. Keep a small map in this
//    module: JPY -> 0, KWD/BHD/OMR -> 3, everything else -> 2. Do NOT accept it
//    from the client; it is a property of the currency, not a user choice, and
//    the DB CHECK only allows 0, 2 or 3.
//
// 3. expiresAt = new Date(Date.now() + expiryHours * 3600_000).
//    The schema already capped expiryHours, so no second check is needed here.
//
// 4. Create the Trip AND its HOST Member in ONE transaction. Prisma's nested
//    create does this for you in a single statement:
//
//      prisma.trip.create({
//        data: { ...trip fields, members: { create: { ...host member } } },
//        include: { members: true },
//      })
//
//    This must be atomic. A trip with no host is unrecoverable — nobody can
//    ever administer it, and there is no login with which to fix it.
//
// 5. Wrap in a retry loop for shareCode collisions: catch Prisma P2002 where
//    meta.target mentions shareCode, regenerate, retry, max 3 attempts, then
//    throw. At 12 characters this will never fire — write it anyway, because
//    the alternative is a 500 with no explanation on the day it does.
//
// 6. RETURN THE PLAINTEXT TOKENS. This is the only moment they exist outside
//    the client; the database holds only hashes and they cannot be recovered.
//    Make the shape explicit so the route cannot forget one:
//
//      { trip, hostToken, memberToken, shareCode }
//
// -----------------------------------------------------------------------------
// getTripDetail
// -----------------------------------------------------------------------------
//
//   Include members ordered by joinedAt. Later this also carries expenses and
//   balances — leave a TODO.
//
//   NEVER select tokenHash or hostTokenHash. Use an explicit `select` rather
//   than the default "everything", so adding a sensitive column to the schema
//   later cannot silently start leaking it through this endpoint.
//
//   Sort members deterministically. Unordered results make the frontend list
//   jump around between refreshes for no visible reason.
//
// -----------------------------------------------------------------------------
// updateTrip / lockTrip
// -----------------------------------------------------------------------------
//
//   updateTrip: recompute expiresAt from NOW when expiryHours is supplied.
//   lockTrip:   set status = "LOCKED". Idempotent — locking a locked trip is a
//               200, not an error; the host may double-click.
//
// -----------------------------------------------------------------------------
// RULE FOR THIS FILE
// -----------------------------------------------------------------------------
//   Services throw HttpError; they never touch res. If you find yourself
//   wanting `res` here, the logic belongs in the route — or, more often, the
//   route should be doing less.

export {};
