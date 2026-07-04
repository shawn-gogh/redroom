import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./env";

const secretKey = new TextEncoder().encode(ENV.jwtSecret);

export interface SessionPayload {
  openId: string;
  name: string;
}

export const sdk = {
  /** Signs a session JWT for the given user, valid for `expiresInMs`. */
  async createSessionToken(openId: string, opts: { name: string; expiresInMs: number }): Promise<string> {
    const expiresAt = Math.floor((Date.now() + opts.expiresInMs) / 1000);
    return new SignJWT({ openId, name: opts.name })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(expiresAt)
      .sign(secretKey);
  },

  /** Verifies a session JWT, returning its payload or null if invalid/expired. */
  async verifySessionToken(token: string): Promise<SessionPayload | null> {
    try {
      const { payload } = await jwtVerify(token, secretKey);
      if (typeof payload.openId !== "string") return null;
      return { openId: payload.openId, name: typeof payload.name === "string" ? payload.name : "" };
    } catch {
      return null;
    }
  },
};
