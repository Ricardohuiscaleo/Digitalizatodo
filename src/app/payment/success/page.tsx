"use client";

import { useBranding } from "@/context/BrandingContext";
import Link from "next/link";

export default function SuccessPage() {
    const { branding } = useBranding();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-background">
            <div className="relative mb-8">
                <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 text-background shadow-2xl shadow-emerald-500/40">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-foreground">¡Pago Exitoso!</h1>
            <p className="mt-4 max-w-xs text-foreground/50">Tu transacci&oacute;n ha sido procesada correctamente. En unos minutos ver&aacute;s tu saldo actualizado en el dashboard.</p>

            <Link
                href="/dashboard"
                className="mt-12 rounded-2xl bg-primary px-8 py-4 text-sm font-bold text-background shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
            >
                Volver al Dashboard
            </Link>

            <p className="mt-8 text-xs text-foreground/30">Gracias por confiar en {branding?.name}</p>
        </div>
    );
}
