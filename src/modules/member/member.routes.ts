// =============================================================================
// STEP 4k — Member routes
// =============================================================================
//
// WHAT TO EXPORT
//
//   Two routers, because they mount at different prefixes:
//
//     export const tripMemberRoutes   // mounted at /trips, needs mergeParams
//     export const memberRoutes       // mounted at /members
//
//   In src/app.ts:
//     app.use("/trips",   tripMemberRoutes);
//     app.use("/members", memberRoutes);
//
//   tripMemberRoutes must be created with Router({ mergeParams: true }) or
//   req.params.code will be undefined inside it — a five-minute confusion the
//   first time it happens.
//
// -----------------------------------------------------------------------------
// THE ROUTES
// -----------------------------------------------------------------------------
//
//   POST  /:code/join        validate(params), resolveTrip, requireActive,
//                            validate(joinTripSchema, "body")
//                            -> 201 { member, memberToken }
//
//   GET   /:code/me          validate(params), resolveTrip, requireMember
//                            -> 200 { member }
//
//     ^ Small endpoint, disproportionately important. The frontend stores the
//       member token in localStorage keyed by shareCode; on load it calls this
//       to turn that token back into "you are Priya". It is also how the UI
//       detects a token that has stopped working (trip purged, pepper rotated)
//       and can clear it instead of failing on the first write.
//
//   PATCH  /members/:id      validate(params), requireMember via the member's
//                            trip, then authorise self-or-host
//                            -> 200
//
//   DELETE /members/:id      resolveTrip, requireHost
//                            -> 200 (deactivate, never hard delete)
//
//   The /members/:id routes have no :code in the path, so resolveTrip cannot
//   run from the URL. Two options — pick one and be consistent:
//
//     a) nest them under the trip:  PATCH /trips/:code/members/:id
//        Keeps one auth chain for everything. Slightly longer URLs.
//     b) load the member first, derive its tripId, then apply the same checks
//        manually.
//
//   (a) is the better default. Every route then reads the same way, and there
//   is no second hand-written authorisation path to keep in sync — which is
//   exactly where cross-trip access bugs come from.
//
// -----------------------------------------------------------------------------
// requireActive ON JOIN
// -----------------------------------------------------------------------------
//   Joining is a write, so it needs requireActive: nobody may join a LOCKED or
//   EXPIRED trip. Reading it (GET /trips/:code) stays open — someone who
//   receives the link late should see "this trip has ended", not a 403 with no
//   context.

export {};
