// Single-use auth tokens (password reset, email verification).
import { randomBytes } from "crypto";
import { db } from "@/lib/db";

export type TokenKind = "reset" | "verify";

export async function createAuthToken(userId: string, kind: TokenKind, ttlMs: number): Promise<string> {
  const token = randomBytes(24).toString("base64url");
  await db.authToken.create({ data: { token, userId, kind, expiresAt: new Date(Date.now() + ttlMs) } });
  return token;
}

/** Validate + consume (delete) a token. Returns the userId or null. */
export async function consumeAuthToken(token: string, kind: TokenKind): Promise<string | null> {
  if (!token) return null;
  const row = await db.authToken.findUnique({ where: { token } });
  if (!row || row.kind !== kind || row.expiresAt.getTime() < Date.now()) return null;
  await db.authToken.delete({ where: { token } }).catch(() => {});
  return row.userId;
}
