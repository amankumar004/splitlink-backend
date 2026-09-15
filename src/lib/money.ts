// =============================================================================
// STEP 5 — Money: splits, rounding, debt simplification
// =============================================================================
//
// BUILD THIS BEFORE ANY EXPENSE ROUTE EXISTS.
//
//   This is the only genuinely tricky logic in the app, and the only part with
//   no I/O — no Prisma, no Express, no HTTP, just arrays in and arrays out.
//   That makes it the one place where tests are fast and total.
//
//   Write it after the expense route and you will be debugging arithmetic
//   through curl, which is exactly how the "server and client disagree by one
//   rupee" bug ships.
//
//   Add vitest here:  pnpm add -D vitest   ->   "test": "vitest"
//
// -----------------------------------------------------------------------------
// WHAT TO EXPORT
// -----------------------------------------------------------------------------
//
//   export function resolveSplits(
//     totalMinor: number,
//     splitType: SplitType,
//     participants: Array<{ memberId: string; value?: number }>,
//   ): Array<{ memberId: string; amountMinor: number; shareBps?: number; shareWeight?: number }>
//
//   export function computeBalances(
//     expenses: ...,
//     settlements: ...,
//   ): Array<{ memberId: string; netMinor: number }>
//
//   export function simplifyDebts(
//     balances: Array<{ memberId: string; netMinor: number }>,
//   ): Array<{ fromMemberId: string; toMemberId: string; amountMinor: number }>
//
//   export function formatMinor(amountMinor: number, currency: string, minorUnits: number): string
//
// -----------------------------------------------------------------------------
// 1. resolveSplits — one invariant above all
// -----------------------------------------------------------------------------
//
//   sum(result.amountMinor) === totalMinor        ALWAYS, for every split type.
//
//   Assert it before returning and throw if it fails. No CHECK constraint can
//   see across rows, so this function is the only thing standing between you
//   and a trip whose balances never reconcile.
//
//   EQUAL       divide evenly, distribute the remainder (below)
//   EXACT       values are already minor units; verify they sum to totalMinor,
//               throw 400 if not — do NOT silently adjust
//   PERCENTAGE  values are basis points; verify they sum to 10000, then compute
//               floor(totalMinor * bps / 10000) and distribute the remainder.
//               Store the original bps in shareBps so the edit form can be
//               rebuilt
//   SHARES      weights; amount = floor(totalMinor * weight / totalWeight),
//               then distribute. Store weight in shareWeight
//
// -----------------------------------------------------------------------------
// 2. Remainder distribution — largest remainder, deterministic ties
// -----------------------------------------------------------------------------
//
//   ₹100 across 3 people = 3333 + 3333 + 3334. Someone takes the extra paisa.
//
//   Algorithm:
//     a. give everyone floor(their exact share)
//     b. remainder = totalMinor - sum(floors)      // always 0 <= r < n
//     c. sort by fractional part DESCENDING, and break ties by memberId
//        ASCENDING
//     d. add 1 minor unit to the first `remainder` entries
//
//   Step (c)'s tiebreak is the whole point. Without it, JS sort stability and
//   the order rows come back from Postgres decide who pays the extra paisa —
//   so the same expense splits differently after an edit, balances shift by a
//   rupee for no visible reason, and users stop trusting the app.
//
//   Rotating the payer "for fairness" is tempting. Do not: it makes the split
//   non-reproducible, which is far worse than one person being a paisa down.
//
//   THE SERVER OWNS ALL MONEY MATHS. It returns resolved integers; the client
//   only formats them. If both round independently they will disagree.
//
// -----------------------------------------------------------------------------
// 3. computeBalances
// -----------------------------------------------------------------------------
//
//   For each member:  net = (what they paid) - (their share) + (settlements
//   received) - (settlements paid), counting only CONFIRMED settlements.
//
//   Positive net = owed money. Negative = owes money.
//
//   sum(all nets) must be exactly 0. Assert it in a test — a non-zero sum means
//   resolveSplits leaked a unit somewhere, and this is the cheapest place to
//   catch it.
//
// -----------------------------------------------------------------------------
// 4. simplifyDebts
// -----------------------------------------------------------------------------
//
//   Greedy is correct and sufficient: repeatedly match the largest creditor
//   with the largest debtor, settle min(|a|, |b|), remove whoever hits zero.
//   Produces at most n-1 transfers for n members.
//
//   This is NOT the theoretically minimal set (that problem is NP-hard), but
//   the difference only shows up in contrived cases and nobody splitting a trip
//   will ever notice. Do not build anything cleverer.
//
//   Output is COMPUTED ON READ and never persisted. The Settlement table holds
//   only real payments — see the schema comment. Suggestions are invalidated by
//   every new expense, so storing them means invalidating them, and that is a
//   cache-coherency problem you can simply not have.
//
// -----------------------------------------------------------------------------
// 5. formatMinor
// -----------------------------------------------------------------------------
//
//   Use trip.currencyMinorUnits, never a hardcoded 100. ¥1200 with 0 minor
//   units is ¥1,200; with an assumed 2 it renders as ¥12.
//
// -----------------------------------------------------------------------------
// TESTS TO WRITE FIRST
// -----------------------------------------------------------------------------
//
//   - 100_00 EQUAL across 3    -> [3333, 3333, 3334], sums to 10000
//   - same input twice          -> identical assignment (determinism)
//   - reordered participants    -> SAME member still gets the extra unit
//   - PERCENTAGE summing to 9999 bps -> throws
//   - EXACT not summing to total     -> throws
//   - 1 minor unit across 3 people   -> [1, 0, 0], never negative
//   - balances over a realistic trip -> nets sum to exactly 0
//   - simplifyDebts              -> every member's net reaches 0, transfers <= n-1

export {};
