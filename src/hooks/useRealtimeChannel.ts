import { useEffect, useRef } from 'react';
import { getEcho, reconnect } from '@/lib/echo';

type EventHandlers = Record<string, (ev: any) => void>;

/**
 * Suscribe a un canal de Reverb y escucha eventos.
 * Patrón: evento WS = señal → handler hace fetch HTTP para obtener datos frescos.
 *
 * @param channelName  Nombre del canal (ej: `attendance.${slug}`)
 * @param handlers     Mapa evento → callback (ej: { 'schedule.updated': () => fetchSchedules() })
 * @param enabled      Si false, no suscribe (útil cuando slug/id aún no está disponible)
 *
 * @example
 * useRealtimeChannel(`attendance.${slug}`, {
 *   'schedule.updated': () => getSchedules(slug, tk).then(setSchedules),
 *   'student.checked-in': () => refreshData(),
 * }, !!slug);
 */
export function useRealtimeChannel(
    channelName: string,
    handlers: EventHandlers,
    enabled = true
) {
    // Mantener handlers en ref para evitar re-suscripciones por cambios de closure
    const handlersRef = useRef<EventHandlers>(handlers);
    handlersRef.current = handlers;

    useEffect(() => {
        if (!enabled || !channelName) return;
        const echo = getEcho();
        if (!echo) return;

        const channel = echo.channel(channelName);

        const stableHandlers: EventHandlers = {};
        Object.keys(handlersRef.current).forEach(event => {
            const eventName = event.startsWith('.') ? event : `.${event}`;
            stableHandlers[eventName] = (ev: any) => handlersRef.current[event]?.(ev);
            channel.listen(eventName, stableHandlers[eventName]);
        });

        return () => {
            Object.keys(stableHandlers).forEach(event => {
                channel.stopListening(event);
            });
            echo.leaveChannel(channelName);
        };
    }, [channelName, enabled]);
}

/**
 * Reconecta WS cuando la app vuelve del background.
 * Usar una sola vez en el componente raíz del dashboard.
 */
export function useRealtimeVisibility(onVisible?: () => void) {
    const onVisibleRef = useRef(onVisible);
    onVisibleRef.current = onVisible;

    useEffect(() => {
        const handle = () => {
            if (document.visibilityState === 'visible') {
                reconnect();
                onVisibleRef.current?.();
            }
        };
        document.addEventListener('visibilitychange', handle);
        return () => document.removeEventListener('visibilitychange', handle);
    }, []);
}
