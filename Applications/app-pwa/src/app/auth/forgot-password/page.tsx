"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { sendResetLink } from "@/lib/api";
import { Loader2, ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import "../../landing.css";

export default function ForgotPasswordPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tenantSlug = searchParams.get("tenant");
    const initialEmail = searchParams.get("email") || "";

    const [email, setEmail] = useState(initialEmail);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenantSlug) {
            setError("Error: No se detectó la institución. Vuelve al login e intenta de nuevo.");
            return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            const res = await sendResetLink(tenantSlug, email);
            setIsLoading(false);
            if (res) {
                setMessage(res.message || "Se ha enviado un correo con las instrucciones.");
            } else {
                setError("Ocurrió un error inesperado. Por favor intenta de nuevo.");
            }
        } catch (err) {
            setIsLoading(false);
            setError("Error de conexión. Revisa tu internet.");
        }
    };

    return (
        <div className="landing-scope min-h-screen bg-white flex flex-col items-center justify-center p-6 text-zinc-900">
            <div className="w-full max-w-[360px] space-y-8 animate-in fade-in duration-500">
                
                <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 shadow-sm">
                        <Send className="text-zinc-400" size={24} />
                    </div>
                    <div className="text-center mt-2">
                        <h1 className="text-xl font-black tracking-tight">Recuperar Acceso</h1>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] pt-1">
                            Enviaremos un enlace a tu correo
                        </p>
                    </div>
                </div>

                <div className="border border-zinc-100 rounded-[2.5rem] p-8 space-y-6 shadow-sm bg-white">
                    {message ? (
                        <div className="space-y-6 text-center animate-in zoom-in-95 duration-500">
                            <div className="flex justify-center">
                                <div className="h-16 w-16 bg-green-50 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="text-green-500" size={32} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-bold text-zinc-900">¡Correo Enviado!</p>
                                <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                                    {message}
                                </p>
                            </div>
                            <button
                                onClick={() => router.push("/")}
                                className="w-full h-12 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95"
                            >
                                Volver al Inicio
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="text-[11px] font-bold text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                                    {error}
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Correo Electrónico</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="mi@correo.com"
                                    className="w-full h-14 bg-zinc-50 rounded-2xl px-6 text-sm font-medium text-zinc-900 placeholder:text-zinc-300 focus:bg-white focus:ring-4 ring-zinc-100 outline-none transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-14 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-zinc-200 transition-all active:scale-[0.98] disabled:opacity-40"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={16} /> : "Enviar Enlace"}
                            </button>

                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-all py-1"
                            >
                                <ArrowLeft size={12} /> Volver
                            </button>
                        </form>
                    )}
                </div>

                <div className="text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-200">Digitalizatodo Engine © 2026</p>
                </div>
            </div>
        </div>
    );
}
