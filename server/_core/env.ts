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

  // LLM provider — any OpenAI-compatible /chat/completions endpoint
  // (OpenAI itself, Azure OpenAI, or a compatible relay).
  llmApiUrl: optional("LLM_API_URL") ?? "https://api.openai.com/v1",
  llmApiKey: optional("LLM_API_KEY") ?? "",
  llmModel: optional("LLM_MODEL") ?? "gpt-4o-mini",

  // Direct S3 (or S3-compatible: R2, MinIO, Backblaze B2, ...) object storage.
  awsAccessKeyId: optional("AWS_ACCESS_KEY_ID") ?? "",
  awsSecretAccessKey: optional("AWS_SECRET_ACCESS_KEY") ?? "",
  awsRegion: optional("AWS_REGION") ?? "us-east-1",
  s3Bucket: optional("S3_BUCKET_NAME") ?? "",
  s3Endpoint: optional("S3_ENDPOINT"),
  s3PublicBaseUrl: optional("S3_PUBLIC_BASE_URL"),

  aisApiKey: optional("AIS_API_KEY") ?? "",

  ownerOpenId: optional("OWNER_OPEN_ID"),
  ownerName: optional("OWNER_NAME"),
};
