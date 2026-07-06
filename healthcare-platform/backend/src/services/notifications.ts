/**
 * App-wide in-memory notifications for web + Android.
 * Role-targeted alerts for appointments, telemetry, pharmacy, blood bank, video, etc.
 */

import { sendPushForNotification } from "./fcmPush.js";
export type NotificationType =
  | "appointment_request"
  | "appointment_accepted"
  | "appointment_rejected"
  | "video_request"
  | "video_accepted"
  | "video_reminder"
  | "telemetry_critical"
  | "room_visit_reminder"
  | "queue_pending"
  | "medicine_order"
  | "restock_request"
  | "restock_approved"
  | "blood_request"
  | "blood_approved"
  | "prescription_verify"
  | "policy_update"
  | "system";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Roles that should receive this notification */
  targetRoles: string[];
  hospitalId?: string;
  patientId?: string;
  room?: string;
  /** Deep-link route for Android / web */
  route: string;
  entityId?: string;
  read: boolean;
  createdAt: string;
}

const MAX = 500;
const notifications: AppNotification[] = [];
let nextId = 1;

function id() {
  return `ntf-${nextId++}-${Date.now()}`;
}

export function addNotification(input: Omit<AppNotification, "id" | "read" | "createdAt">): AppNotification {
  if (input.type === "room_visit_reminder" && input.patientId) {
    const recent = notifications.find(
      (n) =>
        n.type === "room_visit_reminder" &&
        n.patientId === input.patientId &&
        Date.now() - new Date(n.createdAt).getTime() < 30 * 60_000,
    );
    if (recent) return recent;
  }
  if (input.type === "telemetry_critical" && input.patientId) {
    const recent = notifications.find(
      (n) =>
        n.type === "telemetry_critical" &&
        n.patientId === input.patientId &&
        Date.now() - new Date(n.createdAt).getTime() < 5 * 60_000,
    );
    if (recent) return recent;
  }
  const row: AppNotification = {
    ...input,
    id: id(),
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifications.unshift(row);
  while (notifications.length > MAX) notifications.pop();
  void sendPushForNotification(row).catch((err) => {
    console.warn("[notifications] push dispatch failed:", err?.message || err);
  });
  return row;
}

export function listNotifications(filters: {
  role?: string | null;
  hospitalId?: string | null;
  patientId?: string | null;
  unreadOnly?: boolean;
}): AppNotification[] {
  const { role, hospitalId, patientId, unreadOnly } = filters;
  let rows = notifications.filter((n) => {
    if (unreadOnly && n.read) return false;
    if (role && !n.targetRoles.includes(role) && !n.targetRoles.includes("all")) return false;
    if (hospitalId && n.hospitalId && n.hospitalId !== hospitalId) return false;
    if (role === "patient" && patientId && n.patientId && n.patientId !== patientId) return false;
    return true;
  });
  // One unread critical alert per patient (latest only)
  const seenCritical = new Set<string>();
  rows = rows.filter((n) => {
    if (n.type !== "telemetry_critical" || !n.patientId) return true;
    if (seenCritical.has(n.patientId)) return false;
    seenCritical.add(n.patientId);
    return true;
  });
  return rows;
}

export function markRead(notificationId: string): AppNotification | null {
  const row = notifications.find((n) => n.id === notificationId);
  if (!row) return null;
  row.read = true;
  return row;
}

export function markAllRead(role: string | null, hospitalId: string | null, patientId: string | null): number {
  let count = 0;
  for (const n of listNotifications({ role, hospitalId, patientId, unreadOnly: true })) {
    n.read = true;
    count++;
  }
  return count;
}

/** Convenience builders */
export function notifyAppointmentRequest(appointment: {
  id: string;
  patientName: string;
  hospitalId: string;
  date: string;
  time: string;
}) {
  addNotification({
    type: "appointment_request",
    title: "New appointment request",
    body: `${appointment.patientName} requested ${appointment.date} at ${appointment.time}`,
    targetRoles: ["doctor", "hospital_admin", "super_admin"],
    hospitalId: appointment.hospitalId,
    route: "queue",
    entityId: appointment.id,
  });
}

export function notifyAppointmentStatus(
  status: "Accepted" | "Rejected",
  appointment: { id: string; patientId: string; hospitalId: string; date: string; time: string },
) {
  addNotification({
    type: status === "Accepted" ? "appointment_accepted" : "appointment_rejected",
    title: status === "Accepted" ? "Appointment accepted" : "Appointment declined",
    body: `Your appointment on ${appointment.date} at ${appointment.time} was ${status.toLowerCase()}.`,
    targetRoles: ["patient"],
    hospitalId: appointment.hospitalId,
    patientId: appointment.patientId,
    route: "appointments",
    entityId: appointment.id,
  });
}

export function notifyVideoRequest(apt: {
  id: string;
  patientName: string;
  hospitalId: string;
  date: string;
  time: string;
}) {
  addNotification({
    type: "video_request",
    title: "Video consult requested",
    body: `${apt.patientName} requested a video consult on ${apt.date} at ${apt.time}`,
    targetRoles: ["doctor", "nurse", "hospital_admin"],
    hospitalId: apt.hospitalId,
    route: "video_meet",
    entityId: apt.id,
  });
}

export function notifyVideoAccepted(apt: {
  id: string;
  patientId: string;
  hospitalId: string;
  date: string;
  time: string;
  roomName?: string;
}) {
  addNotification({
    type: "video_accepted",
    title: "Video consult accepted",
    body: `Your video consult on ${apt.date} at ${apt.time} is ready to join.`,
    targetRoles: ["patient"],
    hospitalId: apt.hospitalId,
    patientId: apt.patientId,
    route: "video_meet",
    entityId: apt.id,
  });
}

export function notifyVideoReminder(apt: {
  id: string;
  patientId: string;
  patientName: string;
  hospitalId: string;
  date: string;
  time: string;
  minutesUntil: number;
}) {
  const forPatient = {
    type: "video_reminder" as const,
    title: "Video consult starting soon",
    body: `Your video consult starts in ${apt.minutesUntil} minutes (${apt.time}).`,
    targetRoles: ["patient"],
    hospitalId: apt.hospitalId,
    patientId: apt.patientId,
    route: "video_meet",
    entityId: apt.id,
  };
  addNotification(forPatient);
  addNotification({
    ...forPatient,
    title: "Upcoming video consult",
    body: `Video with ${apt.patientName} in ${apt.minutesUntil} minutes (${apt.time}).`,
    targetRoles: ["doctor", "nurse", "hospital_admin"],
    patientId: undefined,
  });
}

export function notifyTelemetryCritical(payload: {
  patientId: string;
  fullName: string;
  hospitalId: string;
  room: string;
  vitals?: Record<string, unknown>;
}) {
  addNotification({
    type: "telemetry_critical",
    title: "Critical vitals alert",
    body: `${payload.fullName} in room ${payload.room} has critical vitals. Tap to view.`,
    targetRoles: ["doctor", "nurse", "hospital_admin"],
    hospitalId: payload.hospitalId,
    patientId: payload.patientId,
    room: payload.room,
    route: "telemetry_room",
    entityId: payload.patientId,
  });
}

export function notifyRoomVisitReminder(payload: {
  patientId: string;
  fullName: string;
  hospitalId: string;
  room: string;
  minutesSinceVisit: number;
}) {
  addNotification({
    type: "room_visit_reminder",
    title: "Patient room check overdue",
    body: `${payload.fullName} (room ${payload.room}) has not been visited for ${payload.minutesSinceVisit}+ minutes.`,
    targetRoles: ["doctor", "nurse", "hospital_admin"],
    hospitalId: payload.hospitalId,
    patientId: payload.patientId,
    room: payload.room,
    route: "telemetry_room",
    entityId: payload.patientId,
  });
}

export function notifyMedicineOrder(order: {
  id: string;
  medication: string;
  patientName: string;
  hospitalId?: string;
}) {
  addNotification({
    type: "medicine_order",
    title: "New medicine order",
    body: `${order.patientName} ordered ${order.medication}`,
    targetRoles: ["medical_vendor", "hospital_admin", "super_admin"],
    hospitalId: order.hospitalId,
    route: "medicine_orders",
    entityId: order.id,
  });
}

export function notifyRestockRequest(req: {
  id: string;
  medicine: string;
  hospitalId?: string;
  requestedBy?: string;
}) {
  addNotification({
    type: "restock_request",
    title: "Restock request",
    body: `${req.requestedBy || "Hospital"} requested restock of ${req.medicine}`,
    targetRoles: ["medical_vendor", "super_admin"],
    hospitalId: req.hospitalId,
    route: "restock",
    entityId: req.id,
  });
}

export function notifyRestockApproved(req: { id: string; medicine: string; hospitalId?: string }) {
  addNotification({
    type: "restock_approved",
    title: "Restock approved",
    body: `Restock for ${req.medicine} was approved.`,
    targetRoles: ["hospital_admin", "doctor"],
    hospitalId: req.hospitalId,
    route: "restock",
    entityId: req.id,
  });
}

export function notifyBloodRequest(req: {
  id: string;
  bloodType: string;
  units: number;
  hospitalId?: string;
  urgency?: string;
}) {
  addNotification({
    type: "blood_request",
    title: "Blood request",
    body: `${req.units} units of ${req.bloodType} requested (${req.urgency || "standard"})`,
    targetRoles: ["bloodbank_admin", "super_admin"],
    hospitalId: req.hospitalId,
    route: "blood_requests",
    entityId: req.id,
  });
}

export function notifyBloodApproved(req: { id: string; bloodType: string; hospitalId?: string }) {
  addNotification({
    type: "blood_approved",
    title: "Blood request approved",
    body: `Your ${req.bloodType} blood request was approved.`,
    targetRoles: ["hospital_admin", "doctor", "patient"],
    hospitalId: req.hospitalId,
    route: "request_blood",
    entityId: req.id,
  });
}
