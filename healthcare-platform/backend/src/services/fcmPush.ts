import axios from "axios";
import type { AppNotification } from "./notifications.js";
import { tokensForNotification } from "./pushTokens.js";

const FCM_URL = "https://fcm.googleapis.com/fcm/send";

/** Legacy FCM server key — set FCM_SERVER_KEY on AWS for instant push when app is closed. */
function serverKey(): string | null {
  const key = process.env.FCM_SERVER_KEY?.trim();
  return key || null;
}

export async function sendPushForNotification(notification: AppNotification): Promise<number> {
  const key = serverKey();
  if (!key) return 0;

  const targets = await tokensForNotification({
    targetRoles: notification.targetRoles,
    hospitalId: notification.hospitalId,
    patientId: notification.patientId,
  });
  if (targets.length === 0) return 0;

  const uniqueTokens = [...new Set(targets.map((t) => t.token))];
  let sent = 0;

  for (const token of uniqueTokens) {
    try {
      await axios.post(
        FCM_URL,
        {
          to: token,
          priority: notification.type === "telemetry_critical" ? "high" : "normal",
          notification: {
            title: notification.title,
            body: notification.body,
          },
          data: {
            route: notification.route,
            type: notification.type,
            patientId: notification.patientId ?? "",
            room: notification.room ?? "",
            entityId: notification.entityId ?? "",
            notificationId: notification.id,
          },
        },
        {
          headers: {
            Authorization: `key=${key}`,
            "Content-Type": "application/json",
          },
          timeout: 10_000,
        },
      );
      sent++;
    } catch (err) {
      console.warn("[fcm] push failed:", (err as Error).message);
    }
  }

  return sent;
}

export function pushConfigured(): boolean {
  return !!serverKey();
}
