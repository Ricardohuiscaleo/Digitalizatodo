"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, Mail, Lock, Loader2, AlertCircle, ChevronRight } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useBranding } from "@/context/BrandingContext";
import { identifyTenant, login } from "@/lib/api";

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

    const currentBranding = branding || { name: "Academy", logo: null, primaryColor: "#a855f7" };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
            <div className="w-full max-w-[400px] relative">
                <div className="bg-[#111] border border-white/5 rounded-2xl p-8 shadow-xl relative">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-auto h-12 mb-4 overflow-hidden">
                            {currentBranding.logo ? (
                                <img src={currentBranding.logo} alt={currentBranding.name} className="h-full object-contain" />
                            ) : (
                                <LogIn className="w-8 h-8" style={{ color: currentBranding.primaryColor }} />
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
                            {currentBranding.name}
                        </h1>
                        <p className="text-gray-500 text-sm">Identifícate para continuar</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-500 text-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                                Email
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onBlur={handleEmailBlur}
                                    placeholder="correo@ejemplo.com"
                                    className={cn(
                                        "w-full bg-white/[0.03] border border-white/[0.05] rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-white/20 transition-all",
                                        isIdentifying && "animate-pulse border-indigo-500/50"
                                    )}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between ml-1 text-[10px] font-bold uppercase tracking-widest">
                                <label className="text-gray-500">
                                    Contraseña
                                </label>
                                {branding && (
                                    <span className="text-gray-700 font-medium normal-case flex items-center gap-1">
                                        para <span className="text-white italic">"{branding.name}"</span>
                                    </span>
                                )}
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-white/20 transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoggingIn || isIdentifying}
                            className="w-full text-black font-bold h-14 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 mt-6"
                            style={{ backgroundColor: currentBranding.primaryColor }}
                        >
                            {isLoggingIn ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Entrar
                                    <ChevronRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-6 text-center text-gray-600 text-xs">
                    <a href="/register" className="hover:text-white transition-all underline underline-offset-4 decoration-gray-800 hover:decoration-white">
                        ¿No tienes cuenta? Regístrate
                    </a>
                </p>
            </div >
        </div >
    );
}
