import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'https://match-backend-jz3n.onrender.com';

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    auth: { token },
  });

  socket.on('connect', () =>
    console.log('[Socket] Connected:', socket?.id)
  );
  socket.on('connect_error', (err) =>
    console.error('[Socket] Connection error:', err.message)
  );
  socket.on('disconnect', (reason) =>
    console.log('[Socket] Disconnected:', reason)
  );

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
