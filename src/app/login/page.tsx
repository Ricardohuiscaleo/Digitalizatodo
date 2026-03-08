"use client";

import React, { useState } from "react";
import { LogIn, Mail, Lock, Loader2, AlertCircle, ArrowRight, RefreshCw } from "lucide-react";
import { useBranding } from "@/context/BrandingContext";
import { identifyTenant, login } from "@/lib/api";

export default function LoginPage() {
    const { branding, setBranding } = useBranding();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isIdentifying, setIsIdentifying] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleEmailBlur = async () => {
        if (!email || !email.includes("@")) return;
        setIsIdentifying(true);
        const data = await identifyTenant(email);
        setIsIdentifying(false);
        if (data && data.found && data.tenants.length > 0) {
            const tenant = data.tenants[0];
            setBranding({
                id: tenant.id,
                name: tenant.name,
                industry: tenant.industry,
                logo: tenant.logo,
                primaryColor: tenant.primary_color
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!branding) await handleEmailBlur();
        if (!branding) { setError("Email no reconocido"); return; }
        setIsLoggingIn(true); setError(null);
        try {
            const result = await login(branding.id, { email, password });
            if (result.token) {
                localStorage.setItem(result.user_type === 'staff' ? "staff_token" : "auth_token", result.token);
                localStorage.setItem("tenant_id", branding.id);
                window.location.href = result.user_type === 'staff' ? "/dashboard" : "/dashboard/student";
            } else throw new Error("Credenciales inválidas");
        } catch (err: any) { setError(err.message); } finally { setIsLoggingIn(false); }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-zinc-950 font-sans">
            <div className="w-full max-w-[380px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-4">
                    <div className="h-20 w-20 bg-black rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl relative overflow-hidden group">
                        {branding?.logo ? (
                            <img src={branding.logo} className="h-10 w-10 invert object-contain z-10" />
                        ) : (
                            <LogIn className="text-white z-10" size={32} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-zinc-900">{branding?.name || 'Digitaliza Todo'}</h1>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] mt-1">Acceso Profesional</p>
                    </div>
                </div>

                <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] space-y-8 relative overflow-hidden">
                    {error && (
                        <div className="bg-rose-50 text-rose-600 text-[10px] font-black uppercase p-4 rounded-2xl border border-rose-100 flex items-center gap-3 animate-in fade-in zoom-in-95">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-4">Tu Email</label>
                            <div className="relative">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    onBlur={handleEmailBlur}
                                    placeholder="nombre@academia.com"
                                    className="w-full h-16 bg-zinc-50 border-none rounded-2xl pl-14 pr-6 font-bold text-zinc-950 placeholder:text-zinc-300 focus:ring-2 ring-black transition-all outline-none"
                                />
                                {isIdentifying && <RefreshCw className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-zinc-400" size={16} />}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-4">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full h-16 bg-zinc-50 border-none rounded-2xl pl-14 pr-6 font-bold text-zinc-950 placeholder:text-zinc-300 focus:ring-2 ring-black transition-all outline-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full h-16 bg-zinc-950 hover:bg-zinc-800 text-white font-black rounded-2xl uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-zinc-100 active:scale-95 transition-all mt-4"
                        >
                            {isLoggingIn ? <Loader2 className="animate-spin" size={20} /> : (
                                <>Entrar al Staff <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center">
                    <a href="/register" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-black transition-colors">¿No tienes cuenta? Registrar Academia</a>
                </p>
            </div>
        </div>
    );
}
