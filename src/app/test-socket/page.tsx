'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useSocketContext } from '@/contexts/SocketContext';

export default function TestSocket() {
  const { data: session, status } = useSession();
  const { isConnected, socket } = useSocketContext();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  useEffect(() => {
    if (status === 'authenticated') {
      addLog(`Logged in as ${session.user.name}`);
    } else if (status === 'unauthenticated') {
      addLog('Not authenticated');
    }
  }, [status, session]);

  useEffect(() => {
    addLog(`Socket status: ${isConnected ? 'Connected' : 'Disconnected'}`);
  }, [isConnected]);

  useEffect(() => {
    if (socket) {
      socket.on('connect', () => addLog('Socket connected event received'));
      socket.on('disconnect', () => addLog('Socket disconnected event received'));
      socket.on('connect_error', (error) => addLog(`Socket error: ${error.message}`));

      return () => {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
      };
    }
  }, [socket]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>WebSocket Connection Test</h1>

      <div style={{ marginBottom: '20px' }}>
        {status === 'authenticated' ? (
          <div>
            <p>Signed in as {session.user.name}</p>
            <button onClick={() => signOut()}>Sign out</button>
          </div>
        ) : (
          <button onClick={() => signIn()}>Sign in</button>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Connection Status</h2>
        <p style={{ color: isConnected ? 'green' : 'red' }}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </p>
      </div>

      <div>
        <h2>Logs</h2>
        <div
          style={{
            border: '1px solid #ccc',
            padding: '10px',
            height: '300px',
            overflowY: 'auto',
            backgroundColor: '#f5f5f5'
          }}
        >
          {logs.map((log, index) => (
            <div key={index} style={{ marginBottom: '5px' }}>
              {log}
            </div>
          ))}
        </div>
        <button onClick={() => setLogs([])} style={{ marginTop: '10px' }}>
          Clear Logs
        </button>
      </div>
    </div>
  );
}