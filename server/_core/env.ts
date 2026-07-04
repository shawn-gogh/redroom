/**
 * Validated environment variable access.
 * Every field is read once at import time so missing/misconfigured
 * variables fail fast at startup instead of deep inside a request handler.
 */
import "dotenv/config";

function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

function required(name: string): string {
  const value = optional(name);
  if (!value) throw new Error(`[ENV] Missing required environment variable: ${name}`);
  return value;
}

export const ENV = {
  databaseUrl: optional("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  adminSecretKey: optional("ADMIN_SECRET_KEY"),

  forgeApiUrl: required("BUILT_IN_FORGE_API_URL"),
  forgeApiKey: required("BUILT_IN_FORGE_API_KEY"),

  aisApiKey: optional("AIS_API_KEY") ?? "",

  ownerOpenId: optional("OWNER_OPEN_ID"),
  ownerName: optional("OWNER_NAME"),
};
