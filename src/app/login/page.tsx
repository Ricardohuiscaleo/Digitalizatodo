"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, Mail, Lock, Loader2, AlertCircle, ChevronRight, ArrowRight } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useBranding } from "@/context/BrandingContext";
import { identifyTenant, login } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

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
        if (!branding || !email || !password) {
            if (!branding) await handleEmailBlur();
            if (!branding) {
                setError("No pudimos identificar tu academia. Verifica tu correo.");
                return;
            }
        }

        setIsLoggingIn(true);
        setError(null);

        try {
            const result = await login(branding.id, { email, password });

            if (result.token) {
                if (result.user_type === 'staff') {
                    localStorage.setItem("staff_token", result.token);
                    localStorage.setItem("tenant_id", branding.id);
                    window.location.href = "/dashboard";
                } else {
                    localStorage.setItem("auth_token", result.token);
                    localStorage.setItem("tenant_id", branding.id);
                    window.location.href = "/dashboard/student";
                }
            } else {
                throw new Error(result.message || "Credenciales inválidas");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoggingIn(false);
        }
    };

    const currentBranding = branding || { name: "Digitaliza Todo", logo: null, primaryColor: "#09090b" };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[420px] space-y-8"
            >
                {/* Branding / Header */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-20 w-20 bg-zinc-950 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-zinc-200 p-4 transition-transform hover:scale-105">
                        {currentBranding.logo ? (
                            <img src={currentBranding.logo} alt={currentBranding.name} className="h-full object-contain invert" />
                        ) : (
                            <LogIn className="w-10 h-10 text-white" />
                        )}
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                            {currentBranding.name}
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Acceso Seguro</p>
                    </div>
                </div>

                <Card className="border-none shadow-bento rounded-[2.5rem] p-8 lg:p-10 bg-white relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 opacity-50"></div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-8 bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3 text-rose-500 text-[10px] font-black uppercase tracking-wider"
                        >
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">
                                Correo del Staff
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-zinc-950 transition-colors" />
                                <Input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onBlur={handleEmailBlur}
                                    placeholder="hola@academia.com"
                                    className={cn(
                                        "h-14 bg-white border border-slate-100 rounded-[1.2rem] pl-12 font-bold text-sm placeholder:text-slate-300 focus-visible:ring-zinc-950 transition-all",
                                        isIdentifying && "animate-pulse"
                                    )}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-3">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    Contraseña
                                </label>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-zinc-950 transition-colors" />
                                <Input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="h-14 bg-white border border-slate-100 rounded-[1.2rem] pl-12 font-bold text-sm placeholder:text-slate-300 focus-visible:ring-zinc-950 transition-all"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoggingIn || isIdentifying}
                            className="w-full h-16 bg-zinc-950 hover:bg-zinc-800 text-white font-black rounded-[1.5rem] flex items-center justify-center gap-3 shadow-2xl shadow-zinc-200 transition-all active:scale-95 disabled:opacity-50 mt-10"
                        >
                            {isLoggingIn ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span className="uppercase tracking-[0.2em] text-[11px]">Iniciar Sesión</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </Button>
                    </form>
                </Card>

                <div className="text-center space-y-4">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        ¿No tienes una cuenta?
                    </p>
                    <a
                        href="/register"
                        className="inline-block bg-white border border-slate-100 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm"
                    >
                        Registrar mi Academia
                    </a>
                </div>
            </motion.div>
        </div>
    );
}
