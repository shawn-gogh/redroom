import { ENV } from "./env";
import { createNotification } from "../db";

export interface NotifyOwnerParams {
  title: string;
  content: string;
}

/**
 * Notifies the platform owner of an important event. Always records an
 * in-app notification; also logs to the console since there is no
 * configured external channel (email/push) in the open-source build.
 */
export async function notifyOwner(params: NotifyOwnerParams): Promise<void> {
  if (!ENV.ownerOpenId) {
    console.warn("[notifyOwner] OWNER_OPEN_ID is not configured; skipping owner notification.");
  }
  console.log(`[notifyOwner] ${params.title}\n${params.content}`);
  await createNotification({
    type: "owner_alert",
    title: params.title,
    message: params.content,
    severity: "info",
  });
}
