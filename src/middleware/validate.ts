import type { RequestHandler } from "express";
import type { ZodType } from "zod";

import { badRequest } from "../utils/httpError.js";

type Source = "body" | "params" | "query";

/**
 * Validate one part of the request against a zod schema.
 *
 * On success the PARSED value replaces the raw one, so downstream code sees
 * coercions and defaults applied. That write-back is the part people skip:
 * validate without it and `expiryHours` is still the string "72".
 */
export const validate =
  <T>(schema: ZodType<T>, source: Source = "body"): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(source === "query" ? req.query : req[source]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || "(root)",
        message: issue.message,
      }));

      next(badRequest("VALIDATION_ERROR", "Request validation failed", details));
      return;
    }

    if (source === "body") {
      req.body = result.data;
    } else if (source === "params") {
      // Mutate in place: req.params is typed as a string dictionary, so a
      // whole-object assignment fights the types for no benefit.
      Object.assign(req.params, result.data);
    } else {
      // req.query is getter-only in Express 5 — see src/types/express.d.ts.
      req.validatedQuery = result.data;
    }

    next();
  };
