// Storage helpers for Redroom — direct S3 (or S3-compatible) file storage.
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (!ENV.awsAccessKeyId || !ENV.awsSecretAccessKey || !ENV.s3Bucket) {
    throw new Error(
      "Storage is not configured: set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and S3_BUCKET_NAME",
    );
  }
  if (!_client) {
    _client = new S3Client({
      region: ENV.awsRegion,
      endpoint: ENV.s3Endpoint,
      // S3-compatible providers (R2, MinIO, ...) typically need path-style addressing.
      forcePathStyle: Boolean(ENV.s3Endpoint),
      credentials: {
        accessKeyId: ENV.awsAccessKeyId,
        secretAccessKey: ENV.awsSecretAccessKey,
      },
    });
  }
  return _client;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function publicUrlFor(key: string): string {
  if (ENV.s3PublicBaseUrl) {
    return `${ENV.s3PublicBaseUrl.replace(/\/+$/, "")}/${key}`;
  }
  if (ENV.s3Endpoint) {
    return `${ENV.s3Endpoint.replace(/\/+$/, "")}/${ENV.s3Bucket}/${key}`;
  }
  return `https://${ENV.s3Bucket}.s3.${ENV.awsRegion}.amazonaws.com/${key}`;
}

/** Uploads bytes to the configured bucket. The bucket is expected to allow public read on uploaded objects. */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  await getClient().send(
    new PutObjectCommand({
      Bucket: ENV.s3Bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
    }),
  );
  return { key, url: publicUrlFor(key) };
}

/** Generates a presigned GET URL for a private object, valid for `expiresIn` seconds (default 1 hour). */
export async function storageGet(
  relKey: string,
  expiresIn = 3600,
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const url = await getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: ENV.s3Bucket, Key: key }),
    { expiresIn },
  );
  return { key, url };
}
