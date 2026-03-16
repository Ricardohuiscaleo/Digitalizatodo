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
        // Reproducir silencio de 0.001s para desbloquear
        const buf = c.createBuffer(1, 1, 22050);
        const src = c.createBufferSource();
        src.buffer = buf;
        src.connect(c.destination);
        src.start(0);
        if (c.state === 'suspended') c.resume();
        unlocked = true;
    } catch {}
}

// Reproducir notification.wav usando AudioContext (no se bloquea si ya está desbloqueado)
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
