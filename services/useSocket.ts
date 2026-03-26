import { useEffect, useRef, useState, useCallback } from 'react';
import { connectSocket, disconnectSocket, getSocket } from './socket';
import { getAuthToken } from './secureStorage';

export type IncomingMessage = {
  from: string;
  message: string;
};

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(getSocket());

  useEffect(() => {
    let mounted = true;

    async function init() {
      const token = await getAuthToken();
      if (!token) {
        console.warn('[Socket] No auth token found — user not logged in');
        return;
      }

      const s = connectSocket(token);
      socketRef.current = s;

      s.on('connect', () => mounted && setIsConnected(true));
      s.on('disconnect', () => mounted && setIsConnected(false));

      setIsConnected(s.connected);
    }

    init();

    return () => {
      mounted = false;
      disconnectSocket();
    };
  }, []);

  const sendMessage = useCallback(
    (userTo: string, message: string): Promise<{ delivered?: boolean; error?: string }> => {
      return new Promise((resolve) => {
        const s = socketRef.current;
        if (!s?.connected) {
          console.warn('[Socket] Cannot send — not connected');
          resolve({ error: 'Not connected' });
          return;
        }
        s.emit('msgToServer', { message, userTo }, (ack: { delivered?: boolean; error?: string }) => {
          resolve(ack ?? {});
        });
      });
    },
    []
  );

  const onMessage = useCallback(
    (callback: (msg: IncomingMessage) => void) => {
      const s = socketRef.current;
      s?.on('msgToClient', callback);
      return () => s?.off('msgToClient', callback);
    },
    []
  );

  return { isConnected, sendMessage, onMessage };
}
