import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

import { env } from "../config/env.js";
import { Prisma } from "../generated/prisma/client.js";
import { HttpError, type ErrorCode } from "../utils/httpError.js";

interface Mapped {
  statusCode: number;
  code: ErrorCode;
  message: string;
  details?: unknown;
}

/** Unmatched route. Register after all routes, before errorHandler. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(
    new HttpError(
      404,
      "ROUTE_NOT_FOUND",
      `Cannot ${req.method} ${req.path}`,
    ),
  );
};

function mapPrismaError(error: Prisma.PrismaClientKnownRequestError): Mapped {
  // meta.target names the constraint that was violated, which is how a generic
  // unique violation becomes a message a user can act on.
  const target = Array.isArray(error.meta?.["target"])
    ? (error.meta["target"] as string[]).join(",")
    : String(error.meta?.["target"] ?? "");

  switch (error.code) {
    case "P2002":
      if (target.includes("name") && target.includes("tripId")) {
        return {
          statusCode: 409,
          code: "MEMBER_NAME_TAKEN",
          message: "Someone on this trip already uses that name",
        };
      }
      return {
        statusCode: 409,
        code: "CONFLICT",
        message: "That value is already taken",
      };

    case "P2003":
      return {
        statusCode: 409,
        code: "CONFLICT",
        message: "That record is still referenced by something else",
      };

    case "P2025":
      return { statusCode: 404, code: "NOT_FOUND", message: "Not found" };

    default:
      return {
        statusCode: 500,
        code: "INTERNAL_ERROR",
        message: "Something went wrong",
      };
  }
}

function mapError(error: unknown): Mapped {
  if (HttpError.isHttpError(error)) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  // A ZodError reaching here means a schema was parsed outside validate().
  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: error.issues.map((issue) => ({
        field: issue.path.join(".") || "(root)",
        message: issue.message,
      })),
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return mapPrismaError(error);
  }

  // Anything unrecognised is a bug. The real error is logged; the client gets
  // a fixed message, because err.message here can carry SQL and credentials.
  return {
    statusCode: 500,
    code: "INTERNAL_ERROR",
    message: "Something went wrong",
  };
}

/**
 * The single place a failure becomes a response.
 *
 * Must declare all four parameters — Express identifies an error handler by
 * arity, and with three it silently becomes ordinary middleware that never runs.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const mapped = mapError(err);
  const where = `${req.method} ${req.originalUrl}`;

  if (mapped.statusCode >= 500) {
    console.error(`[500] ${where}`, err);
  } else {
    console.warn(`[${mapped.statusCode}] ${where} — ${mapped.code}`);
  }

  res.status(mapped.statusCode).json({
    success: false,
    error: {
      code: mapped.code,
      message: mapped.message,
      ...(mapped.details === undefined ? {} : { details: mapped.details }),
      ...(env.NODE_ENV === "development" && mapped.statusCode >= 500
        ? { stack: err instanceof Error ? err.stack : undefined }
        : {}),
    },
  });
};
