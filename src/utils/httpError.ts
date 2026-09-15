export type ErrorCode =
  // validation
  | "VALIDATION_ERROR"
  // trip lifecycle
  | "TRIP_NOT_FOUND"
  | "TRIP_EXPIRED"
  | "TRIP_LOCKED"
  | "TRIP_FULL"
  // members
  | "MEMBER_NOT_FOUND"
  | "MEMBER_NAME_TAKEN"
  | "MEMBER_INACTIVE"
  // auth
  | "INVALID_TOKEN"
  | "NOT_HOST"
  // generic
  | "NOT_FOUND"
  | "ROUTE_NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export class HttpError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
    // Always assigned. The class-field declaration defines the property either
    // way under useDefineForClassFields, and JSON.stringify drops undefined,
    // so `details` never reaches a response body unless it was supplied.
    this.details = details;

    // Start the stack at the throw site, not inside this constructor.
    Error.captureStackTrace?.(this, HttpError);
  }

  static isHttpError(error: unknown): error is HttpError {
    return error instanceof HttpError;
  }
}

/* -------------------------------------------------------------------------- */
/* Factories                                                                  */
/*                                                                            */
/* These keep each status/code pairing in one place, so call sites read as    */
/* intent ("this trip is gone") rather than as protocol ("410").              */
/* -------------------------------------------------------------------------- */

export const badRequest = (
  code: ErrorCode,
  message = "Invalid request",
  details?: unknown,
): HttpError => new HttpError(400, code, message, details);

export const unauthorized = (
  code: ErrorCode = "INVALID_TOKEN",
  message = "Authentication required",
): HttpError => new HttpError(401, code, message);

export const forbidden = (
  code: ErrorCode,
  message = "You do not have permission to do that",
): HttpError => new HttpError(403, code, message);

export const notFound = (code: ErrorCode, message = "Not found"): HttpError =>
  new HttpError(404, code, message);

export const conflict = (
  code: ErrorCode,
  message = "That conflicts with the current state",
): HttpError => new HttpError(409, code, message);

/**
 * 410, not 404 — the difference between the UI saying "this trip has ended"
 * and "check your link". That distinction cannot be recovered after the fact
 * if both cases return 404.
 */
export const gone = (
  code: ErrorCode = "TRIP_EXPIRED",
  message = "This trip has expired and its data has been deleted",
): HttpError => new HttpError(410, code, message);

export const tooManyRequests = (
  code: ErrorCode = "RATE_LIMITED",
  message = "Too many requests, please slow down",
): HttpError => new HttpError(429, code, message);
