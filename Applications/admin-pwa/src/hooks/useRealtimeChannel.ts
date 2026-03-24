import { useEffect, useRef } from 'react';
import { getEcho, reconnectEcho } from '../lib/echo';

export function useRealtimeChannel(channelName: string, handlers: Record<string, (data: any) => void>, enabled: boolean = true) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!enabled) return;
    
    const echo = getEcho();
    if (!echo) return;

    const channel = echo.channel(channelName);
    
    // Bind all provided handlers
    Object.entries(handlersRef.current).forEach(([eventName, handler]) => {
        // Ensure event name has a leading dot if not present (Laravel convention for custom names)
        const name = eventName.startsWith('.') ? eventName : `.${eventName}`;
        channel.listen(name, (data: any) => {
            console.log(`[WS] Event received: ${name} on ${channelName}`);
            handlersRef.current[eventName](data);
        });
    });

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        reconnectEcho();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      Object.keys(handlersRef.current).forEach(eventName => {
          const name = eventName.startsWith('.') ? eventName : `.${eventName}`;
          channel.stopListening(name);
      });
      echo.leaveChannel(channelName);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [channelName, enabled]);
}
