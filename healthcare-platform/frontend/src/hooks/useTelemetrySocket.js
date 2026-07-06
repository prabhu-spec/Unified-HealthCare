import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getSocketUrl } from '@/lib/telemetryApi';

const OFFLINE_AFTER_MS = 20_000;

/**
 * Socket.IO hook for IoMT-style `rpm` events (vitals, critical_alert, room_presence, assignment).
 */
export function useTelemetrySocket(user, { enabled = true, onMessage } = {}) {
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!enabled || !user) {
      setConnected(false);
      return undefined;
    }

    const socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      auth: {
        role: user.role,
        hospitalId: user.hospitalId || undefined,
        userId: user.id,
        patientId: user.patientId || undefined,
        email: user.email,
      },
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));
    socket.on('rpm', (msg) => {
      onMessageRef.current?.(msg);
    });

    return () => {
      socket.disconnect();
    };
  }, [enabled, user?.role, user?.hospitalId, user?.id, user?.patientId, user?.email]);

  return { connected, OFFLINE_AFTER_MS };
}
