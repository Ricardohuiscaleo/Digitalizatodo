import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<any> | undefined;
  }
}

let echoInstance: Echo<any> | null = null;

export const getEcho = (): Echo<any> | null => {
  if (typeof window === 'undefined') return null;
  if (echoInstance) return echoInstance;

  window.Pusher = Pusher;

  const key = process.env.NEXT_PUBLIC_REVERB_APP_KEY;
  const host = process.env.NEXT_PUBLIC_REVERB_HOST || 'localhost';
  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME || 'http';
  const port = process.env.NEXT_PUBLIC_REVERB_PORT || '8080';

  if (!key) {
    console.warn('Realtime key missing');
    return null;
  }

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key,
    wsHost: host,
    wsPort: parseInt(port),
    wssPort: 443,

    forceTLS: scheme === 'https',
    enabledTransports: ['ws', 'wss'],
    activityTimeout: 30000,
    pongTimeout: 10000,
  });

  const pusher = (echoInstance.connector as any)?.pusher;
  if (pusher) {
    pusher.connection.bind('connected', () => console.log('[WS] ✅ Connected to Reverb'));
    pusher.connection.bind('disconnected', () => console.log('[WS] ❌ Disconnected from Reverb'));
    pusher.connection.bind('error', (err: any) => console.error('[WS] Reverb Error:', err));
  }

  return echoInstance;
};

export const reconnectEcho = () => {
    if (!echoInstance) return;
    const pusher = (echoInstance.connector as any)?.pusher;
    if (pusher?.connection?.state !== 'connected') {
      pusher?.connect();
    }
};
