# Real-Time Messaging — Socket.IO Integration Guide

## Overview

Messages in this app are delivered in real-time using **Socket.IO** over a WebSocket
connection. When a user sends a message, it travels this path:

```
Sender App
  │
  │  emit('msgToServer', { message, userTo })
  ▼
NestJS Gateway (port 8000)
  │
  ├── Verifies JWT from auth.token
  ├── Looks up recipient socket ID in Redis
  ├── Saves message to PostgreSQL
  │
  └──▶ emit('msgToClient', { from, message })
              │
              ▼
        Recipient App (if online)
```

If the recipient is **offline**, the message is still saved to the database and
delivered the next time they load their chat history via the REST API.

---

## Authentication Flow

The socket connection uses the same JWT token as the REST API. The token is read
from secure storage and passed in the `auth` object when connecting — the server
decodes it server-side to identify the user. **Never pass the userId directly.**

```
SecureStore("auth_token")  ──▶  io({ auth: { token } })  ──▶  Server decodes JWT
                                                               extracts userId
                                                               stores in Redis
```

---

## Connection Details

| Property        | Value                                          |
|-----------------|------------------------------------------------|
| URL (local)     | `http://localhost:8000`                        |
| URL (prod)      | `https://match-backend-jz3n.onrender.com`      |
| Transport       | `websocket` only (polling disabled)            |
| Auth field      | `auth: { token: "<JWT>" }`                     |
| Send event      | `msgToServer`                                  |
| Receive event   | `msgToClient`                                  |

---

## Events Reference

### Sending a message → `msgToServer`

Emit this event to send a message to another user.

**Payload:**
```typescript
{
  message: string;   // the message text
  userTo: string;    // recipient's userId (UUID)
}
```

**Example:**
```typescript
socket.emit('msgToServer', {
  message: 'Hello!',
  userTo: 'ebbbbf9e-6474-4358-b168-94b33fafbda3',
});
```

**Server response (ACK):**
```typescript
// Message delivered to online recipient:
{ delivered: true }

// Recipient offline — message saved to DB only:
{ delivered: false }

// Something went wrong:
{ error: 'Sender is not authenticated.' }
{ error: 'Invalid payload. Expected { message, userTo }.' }
{ error: 'Failed to save message.' }
```

---

### Receiving a message ← `msgToClient`

Listen for this event to receive messages from other users in real time.

**Payload:**
```typescript
{
  from: string;      // sender's userId (UUID)
  message: string;   // the message text
}
```

**Example:**
```typescript
socket.on('msgToClient', (data) => {
  console.log(`Message from ${data.from}: ${data.message}`);
});
```

---

## Socket Service

Create `services/socket.ts`:

```typescript
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
```

---

## useSocket Hook

Create `services/useSocket.ts`:

```typescript
import { useEffect, useRef, useState, useCallback } from 'react';
import { connectSocket, disconnectSocket, getSocket } from './socket';
import { getAuthToken } from './secureStorage';   // already exists in project

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

      // Sync initial state in case already connected
      setIsConnected(s.connected);
    }

    init();

    return () => {
      mounted = false;
      disconnectSocket();
    };
  }, []);

  const sendMessage = useCallback((userTo: string, message: string) => {
    const s = socketRef.current;
    if (!s?.connected) {
      console.warn('[Socket] Cannot send — not connected');
      return;
    }
    s.emit('msgToServer', { message, userTo });
  }, []);

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
```

---

## Usage in a Chat Screen

This plugs directly into the existing `ChatBubble` and `ChatInput` components:

```typescript
import { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useSocket, IncomingMessage } from '@/services/useSocket';
import ChatBubble from '@/components/ChatBubble';
import ChatInput from '@/components/ChatInput';

type Message = {
  id: string;
  text: string;
  isMe: boolean;
  time: string;
};

type Props = {
  recipientId: string;
  recipientName: string;
  recipientAvatar: string;
};

export default function ChatScreen({ recipientId, recipientName, recipientAvatar }: Props) {
  const { isConnected, sendMessage, onMessage } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);

  // Listen for incoming messages
  useEffect(() => {
    const cleanup = onMessage((msg: IncomingMessage) => {
      if (msg.from !== recipientId) return; // ignore messages from other chats

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          text: msg.message,
          isMe: false,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    });

    return cleanup;
  }, [recipientId]);

  function handleSend(text: string) {
    if (!text.trim()) return;

    // Optimistic update — show message immediately
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        text,
        isMe: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    sendMessage(recipientId, text);
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Optional: show connection status */}
      {!isConnected && (
        <View style={{ backgroundColor: '#ff4444', padding: 4, alignItems: 'center' }}>
          {/* <Text>Reconnecting...</Text> */}
        </View>
      )}

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatBubble
            message={item.text}
            isMe={item.isMe}
            name={item.isMe ? 'You' : recipientName}
            avatar={item.isMe ? undefined : recipientAvatar}
            time={item.time}
          />
        )}
      />

      <ChatInput onSend={handleSend} />
    </View>
  );
}
```

---

## Connection Lifecycle

```
App launches
    │
    ▼
useSocket() mounts
    │
    ▼
getAuthToken() from SecureStore
    │
    ├── token found ──▶ connectSocket(token) ──▶ isConnected = true
    │
    └── no token ──▶ skip (user not logged in)

User logs out
    │
    ▼
disconnectSocket() ──▶ isConnected = false ──▶ Redis keys cleaned up by server
```

---

## Error States

| Scenario | What happens | What to show user |
|---|---|---|
| No token | Socket never connects | Nothing (user not logged in) |
| Expired JWT | Server calls `client.disconnect()` | "Session expired, please log in again" |
| Recipient offline | `{ delivered: false }` returned | Message shows as sent (not delivered) |
| DB error | `{ error: 'Failed to save message.' }` | "Message failed to send, try again" |
| Network drop | `disconnect` event fires | "Reconnecting..." indicator |

---

## Install

```bash
npx expo install socket.io-client
```
