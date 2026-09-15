// =============================================================================
// STEP 4i — Member validation schemas
// =============================================================================
//
// WHAT TO EXPORT
//
//   export const joinTripSchema
//   export const updateMemberSchema
//   export const memberIdParamSchema
//   export type JoinTripInput = z.infer<typeof joinTripSchema>
//
// -----------------------------------------------------------------------------
// joinTripSchema  (body of POST /trips/:code/join)
// -----------------------------------------------------------------------------
//
//   name   z.string().trim().min(1).max(40)
//
//   Three rules worth fixing now, because names are the primary way humans
//   identify each other in this app and there is no avatar or email to fall
//   back on:
//
//   1. .trim() BEFORE .min(1) — otherwise "   " is a valid name and the
//      members list shows a blank row nobody can identify.
//
//   2. Normalise internal whitespace too ("Rahul   Verma" -> "Rahul Verma")
//      with a .transform(). Otherwise the DB unique index treats those as
//      different people and two near-identical rows appear in the list.
//
//   3. Consider rejecting control characters and zero-width joiners. Names are
//      rendered straight into the UI, and a right-to-left override in a name
//      can visually scramble an entire balances table.
//
//   Deliberately NOT enforced: uniqueness. That is the database's job via
//   @@unique([tripId, name]) — see the service.
//
// -----------------------------------------------------------------------------
// updateMemberSchema  (body of PATCH /members/:id)
// -----------------------------------------------------------------------------
//
//   name   same rules, optional
//
// -----------------------------------------------------------------------------
// memberIdParamSchema
// -----------------------------------------------------------------------------
//
//   id   z.string().cuid()     // or .min(1) if the cuid matcher is fussy
//
//   Member ids ARE exposed to clients — the frontend needs them to render who
//   paid what. That is fine: they are opaque identifiers, not credentials. The
//   member TOKEN is the credential, and it never appears in a URL or a body.

export {};
