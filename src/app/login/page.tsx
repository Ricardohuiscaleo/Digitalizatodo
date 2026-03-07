"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, Mail, Lock, Loader2, AlertCircle, ChevronRight } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useBranding } from "@/context/BrandingContext";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function LoginPage() {
    const { branding, isLoading: isBrandingLoading, setBranding } = useBranding();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Intentamos identificar el tenant por el dominio o parámetro (en un entorno real)
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, type: 'web' }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Credenciales inválidas");
            }

            // Redirección inteligente según el tipo de usuario
            if (data.user_type === 'staff') {
                localStorage.setItem("staff_token", data.token);
                window.location.href = "/dashboard";
            } else {
                localStorage.setItem("auth_token", data.token);
                window.location.href = "/dashboard/student";
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const currentBranding = branding || { name: "Academy", logo: null, primaryColor: "#a855f7" };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
            <div className="w-full max-w-[400px] relative">
                <div className="bg-[#111] border border-white/5 rounded-2xl p-8 shadow-xl relative">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div
                            className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 overflow-hidden"
                            style={{ backgroundColor: currentBranding.primaryColor + '10' }}
                        >
                            {currentBranding.logo ? (
                                <img src={currentBranding.logo} alt={currentBranding.name} className="w-full h-full object-cover" />
                            ) : (
                                <LogIn className="w-6 h-6" style={{ color: currentBranding.primaryColor }} />
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
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="correo@ejemplo.com"
                                    className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-white/20 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                    Contraseña
                                </label>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-white/20 transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full text-black font-bold h-14 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 mt-6"
                            style={{ backgroundColor: currentBranding.primaryColor }}
                        >
                            {isLoading ? (
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
            </div>
        </div>
    );
}
