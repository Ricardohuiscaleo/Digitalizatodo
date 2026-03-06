"use client";

import { useBranding } from "@/context/BrandingContext";
import Link from "next/link";

export default function FailurePage() {
    const { branding } = useBranding();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-background">
            <div className="relative mb-8">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-500 text-background shadow-2xl shadow-red-500/40">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </div>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-foreground">Punto de Control</h1>
            <p className="mt-4 max-w-xs text-foreground/50">Hubo un problema al procesar tu pago. No te preocupes, no se ha realizado ning&uacute;n cargo.</p>

            <div className="mt-12 flex flex-col gap-4 w-full max-w-xs">
                <Link
                    href="/dashboard"
                    className="rounded-2xl bg-primary px-8 py-4 text-sm font-bold text-background shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
                >
                    Reintentar Pago
                </Link>
                <Link
                    href="/dashboard"
                    className="rounded-2xl bg-white/5 px-8 py-4 text-sm font-bold text-foreground/60 hover:bg-white/10 active:scale-95 transition-all"
                >
                    Ir al Dashboard
                </Link>
            </div>

            <p className="mt-12 text-xs text-foreground/30">Si el problema persiste, contacta al soporte de {branding?.name}</p>
        </div>
    );
}
