'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface WsContextValue {
  socket: Socket | null;
  connected: boolean;
}

const WsContext = createContext<WsContextValue>({ socket: null, connected: false });

export function useWs() {
  return useContext(WsContext);
}

interface ProviderProps {
  children: ReactNode;
  backendUrl?: string;
}

export function WsProvider({ children, backendUrl = 'http://localhost:3001' }: ProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const wsUrl = backendUrl.replace('http', 'ws') + '/ws';
    const socket = io(wsUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[WS] Connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[WS] Disconnected');
      setConnected(false);
    });

    socket.on('error', (error) => {
      console.error('[WS] Error:', error);
    });

    setSocket(socket);

    return () => {
      socket.disconnect();
    };
  }, [backendUrl]);

  return (
    <WsContext.Provider value={{ socket, connected }}>
      {children}
    </WsContext.Provider>
  );
}