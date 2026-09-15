import type { Member, Trip } from "../generated/prisma/client.js";

declare global {
  namespace Express {
    interface Request {
      /** Set by resolveTrip. */
      trip?: Trip;
      /** Set by requireMember, and by requireHost (the HOST member row). */
      member?: Member;
      /** Set by requireHost. */
      isHost?: boolean;
      /**
       * Set by validate(schema, "query").
       *
       * Express 5 makes req.query a getter with no setter, so validated query
       * values cannot be written back in place the way body and params are.
       */
      validatedQuery?: unknown;
    }
  }
}

export {};
