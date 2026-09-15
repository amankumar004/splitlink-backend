// =============================================================================
// STEP 4j — Member service
// =============================================================================
//
// WHAT TO EXPORT
//
//   export async function joinTrip(trip: Trip, input: JoinTripInput)
//   export async function renameMember(memberId: string, name: string)
//   export async function deactivateMember(memberId: string)
//
// -----------------------------------------------------------------------------
// joinTrip — the second half of the identity model
// -----------------------------------------------------------------------------
//
// 1. Capacity check:
//
//      const count = await prisma.member.count({ where: { tripId: trip.id } });
//      if (count >= trip.maxMembers) throw conflict("TRIP_FULL");
//
//    Strictly this is a check-then-act race — two simultaneous joins can both
//    see count = 24. Accept it. The consequence is 26 members instead of 25 on
//    a cap that exists for abuse control, not correctness. Do not reach for a
//    transaction or an advisory lock here; it is the wrong complexity for the
//    stakes.
//
// 2. Generate the member token and hash it.
//
// 3. Insert, and let the DATABASE enforce name uniqueness:
//
//      try { await prisma.member.create({ ... }) }
//      catch (e) { if (P2002 on tripId_name) throw conflict("MEMBER_NAME_TAKEN") }
//
//    Do NOT do findFirst-then-create. Two people typing "Rahul" at the same
//    moment both see "free" and both insert; one gets a raw 500. The
//    @@unique([tripId, name]) index makes this correct at any concurrency, and
//    catching P2002 is how you turn it into a friendly 409. This is the single
//    most common concurrency bug in apps like this.
//
// 4. Return the member AND the plaintext token: { member, memberToken }.
//    Shown once, never recoverable.
//
// 5. Role is always GUEST here. The only HOST is created inside createTrip, and
//    the partial unique index would reject a second one anyway.
//
// -----------------------------------------------------------------------------
// renameMember
// -----------------------------------------------------------------------------
//
//   Same P2002 handling. Permission belongs in the route/service boundary:
//   a member may rename THEMSELVES; the host may rename anyone. Check
//   req.member.id === targetId || req.isHost.
//
// -----------------------------------------------------------------------------
// deactivateMember — read this before writing it
// -----------------------------------------------------------------------------
//
//   There is no hard delete. Set isActive = false.
//
//   The database will not let you delete a member who appears in any expense,
//   split or settlement: those FKs are NO ACTION (deferred). That is
//   deliberate — deleting them would silently corrupt every historical balance
//   the trip has ever shown.
//
//   So:
//     - if the member has NO references, a hard delete would work, but do not
//       special-case it. Two code paths for "remove" is how the two drift.
//     - deactivated members: excluded from NEW expense splits, still shown in
//       historical ones, still counted in balances they are part of.
//     - refuse to deactivate the HOST. A trip with no host cannot be
//       administered and there is no login to recover it with.
//
//   Excluding them from new splits is a SERVICE rule — the database has no
//   opinion on isActive. Write it in the expense service and test it, or
//   deactivated members will quietly keep accruing debt.

export {};
