// =============================================================================
// STEP 4f — Trip validation schemas
// =============================================================================
//
// PURPOSE
//   Every value that crosses the HTTP boundary is validated here and nowhere
//   else. Services receive already-typed, already-trusted input.
//
// -----------------------------------------------------------------------------
// WHAT TO EXPORT
// -----------------------------------------------------------------------------
//
//   export const createTripSchema
//   export const tripCodeParamSchema
//   export const updateTripSchema
//   export type CreateTripInput = z.infer<typeof createTripSchema>
//
// -----------------------------------------------------------------------------
// createTripSchema  (body of POST /trips)
// -----------------------------------------------------------------------------
//
//   title        z.string().trim().min(1).max(80)
//                  .trim() BEFORE .min(1), or "   " passes as a valid title.
//
//   currency     z.enum(SUPPORTED_CURRENCIES)
//                  Define SUPPORTED_CURRENCIES as a const tuple in this file —
//                  start with ["INR","USD","EUR","GBP","JPY","AED"] and grow it.
//                  An open z.string().length(3) means you cannot know the
//                  currency's exponent, and the DB CHECK on currencyMinorUnits
//                  will reject the row anyway. An allowlist is a perfectly good
//                  v1 and removes a whole class of bug.
//
//   expiryHours  z.coerce.number().int().positive()
//                  .max(env.TRIP_TTL_MAX_HOURS)
//                  .default(env.TRIP_TTL_DEFAULT_HOURS)
//
//                  Take HOURS, not an absolute expiresAt. If the client sends a
//                  timestamp you must defend against clock skew, past dates and
//                  year-3000 values. A bounded duration has none of those
//                  problems, and the service computes expiresAt itself.
//
//                  The .max() is the load-bearing part: without a server-side
//                  cap, anyone can create a permanent trip and your
//                  "self-destructing" product quietly stops self-destructing.
//
// -----------------------------------------------------------------------------
// tripCodeParamSchema  (the :code path parameter)
// -----------------------------------------------------------------------------
//
//   code   z.string().length(env.SHARE_CODE_LENGTH).regex(/^[A-Za-z0-9_-]+$/)
//
//   nanoid's default alphabet is A-Za-z0-9_- — match it exactly. Used by
//   resolveTrip to reject nonsense before it reaches the database.
//
// -----------------------------------------------------------------------------
// updateTripSchema  (body of PATCH /trips/:code, host only)
// -----------------------------------------------------------------------------
//
//   title        optional, same rules as above
//   expiryHours  optional, same cap — extending must respect TRIP_TTL_MAX_HOURS
//                measured from NOW, not from the original creation time, or
//                repeated extensions become an unbounded trip.
//
//   Add .refine() requiring at least one key, so an empty PATCH is a 400 rather
//   than a silent no-op that looks like success.
//
// -----------------------------------------------------------------------------
// HOW THESE GET APPLIED
// -----------------------------------------------------------------------------
//   Write one small `validate(schema, source)` middleware in src/middleware/
//   that parses req.body / req.params / req.query, ASSIGNS THE PARSED RESULT
//   BACK, and lets ZodError propagate to the error handler.
//
//   Assigning back is the part people skip. The parsed object is the one with
//   coercions and defaults applied — if you validate but keep using the raw
//   req.body, expiryHours is still the string "72" and the default never
//   materialises.

export {};
