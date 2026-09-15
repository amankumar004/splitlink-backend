import { nanoid } from "nanoid";
import { createHash } from "node:crypto";
import { env } from "../config/env.js";

const TOKEN_PEPPER = env.TOKEN_PEPPER;
const SHARE_CODE_LENGTH = env.SHARE_CODE_LENGTH;

export function generateToken(): string {
  return nanoid(32);
}

export function hashToken(token: string): string {
  return createHash("sha256")
    .update(token + TOKEN_PEPPER)
    .digest("hex");
}

export function generateShareCode(): string {
  return nanoid(SHARE_CODE_LENGTH);
}
