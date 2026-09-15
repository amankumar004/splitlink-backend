import "dotenv/config";
import * as z from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  DATABASE_URL: z.string().url(),
  CLIENT_URL: z.string().url(),

  TOKEN_PEPPER: z.string().min(32),

  SHARE_CODE_LENGTH: z.coerce.number().int().min(8).max(32).default(12),
  TRIP_TTL_DEFAULT_HOURS: z.coerce.number().int().positive().default(72),
  TRIP_TTL_MAX_HOURS: z.coerce.number().int().positive().default(720),
  PURGE_GRACE_HOURS: z.coerce.number().int().nonnegative().default(24),
  MAX_MEMBERS_PER_TRIP: z.coerce.number().int().positive().default(25),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
});

export type Env = z.infer<typeof envSchema>;

// Step 3 — parse once, and report EVERY problem at once.
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues.map(
    (issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`,
  );

  console.error(
    [
      "",
      `Invalid environment configuration — ${problems.length} problem(s):`,
      "",
      ...problems,
      "",
      "Check .env against .env.example.",
      "",
    ].join("\n"),
  );

  process.exit(1);
}

// Step 4 — frozen so nothing downstream can mutate config at runtime.
export const env = Object.freeze(parsed.data);
