import type { CookieOptions, Request } from "express";

/** Session cookie options, adapted to whether the request arrived over TLS. */
export function getSessionCookieOptions(req: Request): CookieOptions {
  const isHttps = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https";
  return {
    httpOnly: true,
    sameSite: isHttps ? "none" : "lax",
    secure: isHttps,
    path: "/",
  };
}
