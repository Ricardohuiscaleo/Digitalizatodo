const API = process.env.NEXT_PUBLIC_API_URL || 'https://admin.digitalizatodo.cl/api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export async function subscribeToPush(tenantSlug: string, token: string): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
        if (Notification.permission !== 'granted') return;

        const reg = await navigator.serviceWorker.ready;

        // Obtener clave pública VAPID del backend
        const res = await fetch(`${API}/${tenantSlug}/push/vapid-public-key`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const { key } = await res.json();

        const existing = await reg.pushManager.getSubscription();
        if (existing) await existing.unsubscribe();

        const subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(key),
        });

        const { endpoint, keys } = subscription.toJSON() as any;

        await fetch(`${API}/${tenantSlug}/push/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                endpoint,
                public_key: keys.p256dh,
                auth_token: keys.auth,
            }),
        });
    } catch (e) {
        console.warn('[Push] subscribe failed:', e);
    }
}
