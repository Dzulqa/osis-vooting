import "server-only";
import { z } from "zod";

const bool = z
  .string()
  .optional()
  .transform((v) => v === "true" || v === "1");

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  SCHOOL_API_URL: z.string().url().optional(),
  SCHOOL_API_KEY: z.string().optional(),
  SCHOOL_API_SECRET: z.string().optional(),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(12),
  BOOTH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(3),
  AUTH_COOKIE_SECURE: bool,
  APP_ORIGIN: z.string().url().default("http://localhost:3000"),
  UPLOAD_DIR: z.string().default("./.uploads"),
  // First-run accounts (only read when the User table is empty) and optional HMAC key for booth tokens
  SEED_SUPERADMIN_USERNAME: z.string().optional(),
  SEED_SUPERADMIN_PASSWORD: z.string().optional(),
  SEED_KETUA_PASSWORD: z.string().optional(),
  SESSION_SECRET: z.string().optional(),
});

let cached;

/** Validated server env. Parsed lazily so `next build` does not need runtime secrets. */
export function getEnv() {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const fields = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
      throw new Error(`Invalid or missing environment variables: ${fields}`);
    }
    cached = parsed.data;
  }
  return cached;
}
