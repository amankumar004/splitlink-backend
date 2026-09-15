import * as z from "zod";
import { env } from "../../config/env.js";

const SUPPORTED_CURRENCIES = ["INR", "USD"] as const;

const createTripSchema = z.object({
  hostName: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(80),
  currency: z.enum(SUPPORTED_CURRENCIES),
  expiryHours: z.coerce
    .number()
    .int()
    .positive()
    .max(env.TRIP_TTL_MAX_HOURS)
    .default(env.TRIP_TTL_DEFAULT_HOURS),

  maxMembers: z.coerce
    .number()
    .int()
    .positive()
    .max(env.MAX_MEMBERS_PER_TRIP)
    .default(env.MAX_MEMBERS_PER_TRIP),
});

const tripCodeParamSchema = z.object({
  code: z
    .string()
    .length(env.SHARE_CODE_LENGTH)
    .regex(/^[A-Za-z0-9_-]+$/),
});

const updateTripSchema = z
  .object({
    title: z.string().trim().min(1).max(80).optional(),
    expiryHours: z.coerce
      .number()
      .int()
      .positive()
      .max(env.TRIP_TTL_MAX_HOURS)
      .optional(),
    maxMembers: z.coerce
      .number()
      .int()
      .positive()
      .max(env.MAX_MEMBERS_PER_TRIP)
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;

export { createTripSchema, tripCodeParamSchema, updateTripSchema };
