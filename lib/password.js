import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

// Stores as "scrypt$<saltHex>$<hashHex>" — no extra dependency needed,
// Node's crypto module already ships a slow, salted KDF suitable for
// passwords (courier/admin accounts only; not internet-facing signup).
const KEY_LEN = 64;

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LEN).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || typeof stored !== "string") return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hashHex] = parts;
  const hash = scryptSync(password, salt, KEY_LEN);
  const storedHash = Buffer.from(hashHex, "hex");
  if (hash.length !== storedHash.length) return false;
  return timingSafeEqual(hash, storedHash);
}
