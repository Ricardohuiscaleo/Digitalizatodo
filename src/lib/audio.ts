// Singleton AudioContext — se desbloquea en el primer gesto del usuario
let ctx: AudioContext | null = null;
let unlocked = false;

function getCtx(): AudioContext {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    return ctx;
}

// Llamar en el primer click/scroll para desbloquear el contexto
export function unlockAudio() {
    if (unlocked || typeof window === 'undefined') return;
    try {
        const c = getCtx();
        const buf = c.createBuffer(1, 1, 22050);
        const src = c.createBufferSource();
        src.buffer = buf;
        src.connect(c.destination);
        src.start(0);
        if (c.state === 'suspended') c.resume();
        unlocked = true;
    } catch {}
}

// Reproducir notification.wav usando AudioContext
export async function playNotificationSound() {
    if (typeof window === 'undefined') return;
    try {
        const c = getCtx();
        if (c.state === 'suspended') await c.resume();
        const res = await fetch('/notification.wav');
        const buf = await res.arrayBuffer();
        const decoded = await c.decodeAudioData(buf);
        const src = c.createBufferSource();
        src.buffer = decoded;
        src.connect(c.destination);
        src.start(0);
    } catch {}
}

// App Badging API — muestra contador en el ícono de la PWA instalada
// En iOS debe ir via Service Worker; en Android funciona directo desde la página
export function setAppBadge(count: number) {
    if (typeof navigator === 'undefined') return;

    // Intentar via Service Worker primero (requerido por iOS)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SET_BADGE', count });
    }

    // Fallback directo para Android Chrome
    if ('setAppBadge' in navigator) {
        count > 0
            ? (navigator as any).setAppBadge(count).catch(() => {})
            : (navigator as any).clearAppBadge().catch(() => {});
    }
}
