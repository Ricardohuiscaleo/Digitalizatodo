"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPassword } from "@/lib/api";
import { Loader2, CheckCircle2, Lock, ShieldAlert, Eye, EyeOff } from "lucide-react";
import "../../landing.css";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    const tenantParam = searchParams.get("tenant");

    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const getTenantSlug = () => {
        if (tenantParam) return tenantParam;
        if (typeof window !== 'undefined') {
            const host = window.location.host;
            const parts = host.split('.');
            if (parts.length >= 3) return parts[0];
        }
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const tenantSlug = getTenantSlug();

        if (!tenantSlug || !token || !email) {
            setError("Error: Parámetros de seguridad faltantes. Intenta solicitar un nuevo enlace.");
            return;
        }

        if (password.length < 8) {
            setError("La contraseña debe tener al menos 8 caracteres.");
            return;
        }

        if (password !== passwordConfirm) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await resetPassword(tenantSlug, {
                token,
                email,
                password,
                password_confirmation: passwordConfirm
            });
            setIsLoading(false);
            
            if (res && res.message && !res.errors) {
                setMessage(res.message);
            } else {
                setError(res?.message || "Enlace expirado o inválido. Solicita uno nuevo.");
            }
        } catch (err) {
            setIsLoading(false);
            setError("Error de conexión con el servidor.");
        }
    };

    if (!token || !email) {
        return (
            <div className="landing-scope min-h-screen bg-white flex flex-col items-center justify-center p-6 text-zinc-900">
                <div className="flex flex-col items-center gap-4 text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="p-4 bg-red-50 rounded-full">
                        <ShieldAlert className="text-red-500" size={32} />
                    </div>
                    <h1 className="text-xl font-black">Enlace Inválido</h1>
                    <p className="text-sm text-zinc-500 max-w-[280px]">Este enlace de recuperación no es válido o está incompleto. Por favor, solicita uno nuevo.</p>
                    <button onClick={() => router.push("/")} className="mt-4 px-6 py-2 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95">
                        Volver al inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="landing-scope min-h-screen bg-white flex flex-col items-center justify-center p-6 text-zinc-900">
            <div className="w-full max-w-[360px] space-y-8 animate-in fade-in duration-500">
                
                <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 shadow-sm">
                        <Lock className="text-zinc-400" size={24} />
                    </div>
                    <div className="text-center mt-2">
                        <h1 className="text-xl font-black tracking-tight">Nueva Contraseña</h1>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] pt-1">
                            Asegura tu cuenta ahora
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
                                <p className="text-sm font-bold text-zinc-900">¡Actualización Exitosa!</p>
                                <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                                    {message}
                                </p>
                            </div>
                            <button
                                onClick={() => router.push("/")}
                                className="w-full h-12 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95"
                            >
                                Iniciar Sesión Ahora
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
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Nueva Contraseña</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full h-14 bg-zinc-50 rounded-2xl px-6 text-sm font-medium text-zinc-900 placeholder:text-zinc-300 focus:bg-white focus:ring-4 ring-zinc-100 outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-900 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Confirmar Contraseña</label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={passwordConfirm}
                                    onChange={e => setPasswordConfirm(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full h-14 bg-zinc-50 rounded-2xl px-6 text-sm font-medium text-zinc-900 placeholder:text-zinc-300 focus:bg-white focus:ring-4 ring-zinc-100 outline-none transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-14 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-zinc-200 transition-all active:scale-[0.98] disabled:opacity-40"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={16} /> : "Actualizar Contraseña"}
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
