import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<any>;
  }
}

let echoInstance: Echo<any> | null = null;

export const getEcho = (): Echo<any> | null => {
  if (typeof window === 'undefined') return null;
  if (echoInstance) return echoInstance;

  window.Pusher = Pusher;

  const key = process.env.NEXT_PUBLIC_REVERB_APP_KEY;
  const host = process.env.NEXT_PUBLIC_REVERB_HOST || 'localhost';
  const port = process.env.NEXT_PUBLIC_REVERB_PORT || 443;
  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME || 'http';

  if (!key) return null;

  // Pusher-js handles reconnection automatically with these defaults:
  // - activityTimeout: 120s (send ping if no activity)
  // - pongTimeout: 30s (disconnect if no pong)
  // - On disconnect: exponential backoff reconnect
  echoInstance = new Echo({
    broadcaster: 'reverb',
    key,
    wsHost: host,
    wsPort: Number(port),
    wssPort: Number(port),
    forceTLS: scheme === 'https',
    enabledTransports: ['ws', 'wss'],
    // Aggressive reconnection for mobile networks
    activityTimeout: 30000,   // ping every 30s (default 120s is too slow for mobile)
    pongTimeout: 10000,       // 10s to respond (default 30s)
  });

  // Connection state logging
  const pusher = (echoInstance.connector as any)?.pusher;
  if (pusher) {
    pusher.connection.bind('connected', () => console.log('[WS] ✅ Connected'));
    pusher.connection.bind('disconnected', () => console.log('[WS] ❌ Disconnected — will auto-reconnect'));
    pusher.connection.bind('connecting', () => console.log('[WS] 🔄 Connecting...'));
    pusher.connection.bind('unavailable', () => console.log('[WS] ⚠️ Unavailable — retrying...'));
    pusher.connection.bind('error', (err: any) => console.log('[WS] Error:', err));
  }

  return echoInstance;
};

/** Get current Pusher connection state: 'connected' | 'connecting' | 'disconnected' | 'unavailable' */
export const getConnectionState = (): string => {
  if (!echoInstance) return 'disconnected';
  const pusher = (echoInstance.connector as any)?.pusher;
  return pusher?.connection?.state || 'disconnected';
};

/** Force reconnect (e.g. after app comes back from background) */
export const reconnect = () => {
  if (!echoInstance) return;
  const pusher = (echoInstance.connector as any)?.pusher;
  if (pusher?.connection?.state !== 'connected') {
    pusher?.connect();
  }
};
