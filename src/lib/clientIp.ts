import { createHash } from "node:crypto";

import { env } from "../config/env.js";

/**
 * Expand an IPv6 address and keep the first four hextets — the /64 prefix.
 *
 * ISPs hand out a /64 (or larger) per customer, so one household has 2^64
 * addresses. Hashing the full address makes per-source limits useless for
 * IPv6 users: they get a fresh "identity" for free, forever.
 */
function ipv6Prefix64(address: string): string {
  const [head = "", tail = ""] = address.split("::");
  const headParts = head ? head.split(":") : [];
  const tailParts = tail ? tail.split(":") : [];
  const fill = Array(
    Math.max(0, 8 - headParts.length - tailParts.length),
  ).fill("0");

  return [...headParts, ...fill, ...tailParts]
    .slice(0, 4)
    .map((hextet) => hextet.padStart(4, "0"))
    .join(":");
}

function normalizeIp(ip: string): string {
  // Node reports IPv4 over a dual-stack socket as "::ffff:1.2.3.4".
  const clean = ip.startsWith("::ffff:") ? ip.slice(7) : ip;

  return clean.includes(":") ? `${ipv6Prefix64(clean)}::/64` : clean;
}

/**
 * Hash a client IP for storage in Trip.createdByIpHash.
 *
 * The pepper is load-bearing here, far more than it is for tokens. IPv4 is only
 * 2^32 addresses — an unpeppered hash can be reversed by exhaustive search in
 * seconds, so it would be an IP log wearing a disguise. With a secret pepper it
 * is a stable opaque key you can count against but cannot turn back into an IP.
 *
 * The "ip:" prefix is domain separation, so an IP hash can never be confused
 * with a token hash produced by lib/tokens.ts.
 */
export function hashIp(ip: string | undefined): string | null {
  if (!ip) return null;

  return createHash("sha256")
    .update(`ip:${normalizeIp(ip)}:${env.TOKEN_PEPPER}`)
    .digest("hex");
}
