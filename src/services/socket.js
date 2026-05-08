import { io } from "socket.io-client";
import { useAuthStore } from "../store/authStore";

let socket = null;

export function getSocket() {
  const token = useAuthStore.getState().token;

  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token: token || undefined },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
    socket.on("connect_error", () => {
      // no-op: caller UI handles state via fetch fallback
    });
  } else {
    socket.auth = { token: token || undefined };
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function bindSocketEvent(eventName, handler) {
  const s = getSocket();
  s.off(eventName, handler);
  s.on(eventName, handler);
  return () => s.off(eventName, handler);
}
