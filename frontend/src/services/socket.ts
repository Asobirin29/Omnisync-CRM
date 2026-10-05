import { io, Socket } from 'socket.io-client';

// Use same origin with proxy or fallback to port 5000
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('⚡ [Socket] Terhubung ke real-time server:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('🔌 [Socket] Terputus dari real-time server');
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ [Socket Connection Error]:', err.message);
    });
  }

  return socket;
}
