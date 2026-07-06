/**
 * Periodic reminders: video consult start times and unvisited telemetry rooms.
 */
import { patients as telemetryPatients, roomPresence } from "../telemetry/store.js";
import {
  notifyRoomVisitReminder,
  notifyVideoReminder,
} from "./notifications.js";

const sentVideoReminders = new Set<string>();
const sentRoomReminders = new Set<string>();

interface VideoAppointmentLike {
  id: string;
  patientId: string;
  patientName: string;
  hospitalId: string;
  date: string;
  time: string;
  status: string;
}

function parseAppointmentDateTime(date: string, time: string): Date | null {
  const normalized = `${date}T${time.length === 5 ? time : time.slice(0, 5)}:00`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function startReminderScheduler(
  getVideoAppointments: () => VideoAppointmentLike[] | Promise<VideoAppointmentLike[]>
) {
  setInterval(() => {
    void (async () => {
    const now = Date.now();
    const appointments = await Promise.resolve(getVideoAppointments());
    for (const apt of appointments) {
      if (apt.status !== "accepted" && apt.status !== "pending") continue;
      const when = parseAppointmentDateTime(apt.date, apt.time);
      if (!when) continue;
      const diffMin = Math.round((when.getTime() - now) / 60000);
      if (diffMin in { 15: 1, 5: 1, 1: 1 }) {
        const key = `${apt.id}-${diffMin}`;
        if (sentVideoReminders.has(key)) continue;
        sentVideoReminders.add(key);
        notifyVideoReminder({
          id: apt.id,
          patientId: apt.patientId,
          patientName: apt.patientName,
          hospitalId: apt.hospitalId,
          date: apt.date,
          time: apt.time,
          minutesUntil: diffMin,
        });
      }
    }

    for (const patient of telemetryPatients) {
      const visit = roomPresence.find(
        (v) => v.patientId === patient.patientId && v.hospitalId === patient.hospitalId,
      );
      const lastVisitAt = visit?.enteredAt
        ? new Date(visit.enteredAt).getTime()
        : now - 45 * 60000;
      const minutesSince = Math.round((now - lastVisitAt) / 60000);
      if (minutesSince >= 30) {
        const key = `${patient.patientId}-${Math.floor(minutesSince / 30)}`;
        if (sentRoomReminders.has(key)) continue;
        sentRoomReminders.add(key);
        notifyRoomVisitReminder({
          patientId: patient.patientId,
          fullName: patient.fullName,
          hospitalId: patient.hospitalId,
          room: patient.room,
          minutesSinceVisit: minutesSince,
        });
      }
    }
    })();
  }, 60_000);
}
