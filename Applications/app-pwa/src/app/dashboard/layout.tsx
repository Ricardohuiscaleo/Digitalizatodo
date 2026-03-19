"use client";

import { useEffect, useState } from "react";
import { useBranding } from "@/context/BrandingContext";
import { getProfile } from "@/lib/api";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { branding, setBranding } = useBranding();
    const [updateReady, setUpdateReady] = useState(false);
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
        const tenantSlug = localStorage.getItem("tenant_slug");

        if (!token) {
            window.location.href = "/login";
            return;
        }

        const verifySession = async () => {
            try {
                if (tenantSlug) {
                    const profile = await getProfile(tenantSlug, token);
                    if (!profile || profile.message === 'Unauthenticated.') {
                        localStorage.clear();
                        window.location.href = "/login";
                        return;
                    }
                    if (profile.tenant) {
                        setBranding({
                            id: profile.tenant.id,
                            slug: profile.tenant.slug,
                            name: profile.tenant.name,
                            logo: profile.tenant.logo,
                            primaryColor: profile.tenant.primary_color
                        });
                    }
                }
            } catch (error) {
                console.error("Session verification failed", error);
            }
        };

        verifySession();
    }, []);

    // Detectar nuevo SW esperando
    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

        navigator.serviceWorker.ready.then(reg => {
            if (reg.waiting) {
                setWaitingWorker(reg.waiting);
                setUpdateReady(true);
            }
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker?.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        setWaitingWorker(newWorker);
                        setUpdateReady(true);
                    }
                });
            });
        });

        // Recargar cuando el nuevo SW tome control
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
    }, []);

    const handleUpdate = () => {
        waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-white/10">
            {updateReady && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white text-sm flex items-center justify-between px-4 py-2">
                    <span>Nueva versión disponible</span>
                    <button
                        onClick={handleUpdate}
                        className="bg-white text-blue-600 font-semibold text-xs px-3 py-1 rounded-full"
                    >
                        Actualizar
                    </button>
                </div>
            )}
            {children}
        </div>
    );
}
