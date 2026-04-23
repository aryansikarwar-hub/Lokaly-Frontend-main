import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

let socket = null;

export function getSocket() {
  if (socket) return socket;
  const token = useAuthStore.getState().token;
  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    auth: { token: token || undefined },
    transports: ['websocket', 'polling'],
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}
