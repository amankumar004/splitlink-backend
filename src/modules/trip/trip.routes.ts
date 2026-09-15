// =============================================================================
// STEP 4h — Trip routes
// =============================================================================
//
// PURPOSE
//   Wire HTTP to the service. Handlers should be three or four lines: call the
//   service, send the envelope. No business logic, no Prisma.
//
// -----------------------------------------------------------------------------
// WHAT TO EXPORT
// -----------------------------------------------------------------------------
//
//   const router = Router();
//   export default router;
//
//   Mount in src/app.ts:  app.use("/trips", tripRoutes);
//
// -----------------------------------------------------------------------------
// THE ROUTES
// -----------------------------------------------------------------------------
//
//   POST   /                 validate(createTripSchema, "body")
//                            -> 201
//
//   GET    /:code            validate(tripCodeParamSchema, "params"),
//                            resolveTrip
//                            -> 200
//
//   PATCH  /:code            validate(params), resolveTrip, requireHost,
//                            validate(updateTripSchema, "body")
//                            -> 200
//
//   POST   /:code/lock       validate(params), resolveTrip, requireHost
//                            -> 200
//
//   Member joining lives in member.routes.ts but mounts under this prefix as
//   POST /:code/join — keep the URL trip-shaped even though the code is grouped
//   by the resource being created.
//
// -----------------------------------------------------------------------------
// MIDDLEWARE ORDER — this is the part that goes wrong
// -----------------------------------------------------------------------------
//
//   Always: validate params -> resolveTrip -> auth -> validate body -> handler
//
//   resolveTrip before ANY auth, because requireHost and requireMember both
//   read req.trip. Get this backwards and you will see confusing 500s from
//   middleware dereferencing undefined rather than the 401 you expected.
//
// -----------------------------------------------------------------------------
// TWO CONVENTIONS WORTH ADOPTING NOW
// -----------------------------------------------------------------------------
//
// 1. Return the WHOLE trip state from every mutation, not just the changed row.
//    The client then never has to re-fetch and reconcile, and two people
//    editing at once converge instead of diverging. It costs one extra include
//    now and saves a synchronisation bug later.
//
// 2. POST /trips returns 201 with the tokens; every other route returns 200 and
//    NO tokens, ever. Make that impossible to get wrong by having the service
//    return tokens only from createTrip and joinTrip.
//
// -----------------------------------------------------------------------------
// NO try/catch IN HANDLERS
// -----------------------------------------------------------------------------
//   Express 5 forwards rejected promises to the error handler by itself. Write
//   `async (req, res) => { ... }` and let throws propagate. A try/catch that
//   re-throws, or worse builds its own error response, defeats the single error
//   contract from step 2.
//
// -----------------------------------------------------------------------------
// VERIFY THE WHOLE SLICE
// -----------------------------------------------------------------------------
//
//   # 1. create — note the shareCode and both tokens
//   curl -s -X POST localhost:5000/trips \
//     -H 'content-type: application/json' \
//     -d '{"title":"Goa Trip","currency":"INR","expiryHours":72}'
//
//   # 2. read it back (no token needed)
//   curl -s localhost:5000/trips/<shareCode>
//
//   # 3. join as someone else
//   curl -s -X POST localhost:5000/trips/<shareCode>/join \
//     -H 'content-type: application/json' -d '{"name":"Rahul"}'
//
//   Done = step 2 now lists two members. Then prove the failures:
//     unknown code            -> 404 TRIP_NOT_FOUND
//     expiresAt set to past   -> 410 TRIP_EXPIRED
//     same name twice         -> 409 MEMBER_NAME_TAKEN
//     PATCH with member token -> 403 NOT_HOST
//     empty title             -> 400 VALIDATION_ERROR
//     expiryHours: 99999      -> 400 VALIDATION_ERROR

export {};
