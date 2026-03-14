import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<any>;
  }
}

let echoInstance: Echo<any> | null = null;

export const getEcho = () => {
  if (typeof window === 'undefined') return null;
  
  if (echoInstance) return echoInstance;

  window.Pusher = Pusher;

  const key = process.env.NEXT_PUBLIC_REVERB_APP_KEY;
  const host = process.env.NEXT_PUBLIC_REVERB_HOST || 'localhost';
  const port = process.env.NEXT_PUBLIC_REVERB_PORT || '8080';
  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME || 'http';

  if (!key) return null;

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: key,
    wsHost: host,
    wsPort: parseInt(port),
    wssPort: parseInt(port),
    forceTLS: scheme === 'https',
    enabledTransports: ['ws', 'wss'],
  });

  return echoInstance;
};
