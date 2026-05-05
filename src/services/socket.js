import { io } from "socket.io-client";
import { useAuthStore } from "../store/authStore";

let socket = null;

export function getSocket() {
  const token = useAuthStore.getState().token;

  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token: token || undefined },
      transports: ["websocket"],
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
