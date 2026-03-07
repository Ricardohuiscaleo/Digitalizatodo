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

            // Guardar token y branding recibido del backend
            localStorage.setItem("auth_token", data.token);
            if (data.tenant) {
                setBranding({
                    id: data.tenant.id,
                    name: data.tenant.name,
                    logo: data.tenant.logo,
                    primaryColor: data.tenant.primary_color,
                });
            }

            window.location.href = "/dashboard";
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const currentBranding = branding || { name: "Academy", logo: null, primaryColor: "#a855f7" };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 selection:bg-purple-500/30">
            {/* Background Glow */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full opacity-20 transition-all duration-1000"
                    style={{ backgroundColor: currentBranding.primaryColor }}
                />
                <div
                    className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full opacity-10 transition-all duration-1000"
                    style={{ backgroundColor: currentBranding.primaryColor }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-[420px] relative"
            >
                {/* Glass Card */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl overflow-hidden relative">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-lg overflow-hidden transition-all duration-500"
                            style={{
                                backgroundColor: currentBranding.primaryColor + '20',
                                boxShadow: `0 10px 15px -3px ${currentBranding.primaryColor}30`
                            }}
                        >
                            {currentBranding.logo ? (
                                <img src={currentBranding.logo} alt={currentBranding.name} className="w-full h-full object-cover" />
                            ) : (
                                <LogIn className="w-8 h-8" style={{ color: currentBranding.primaryColor }} />
                            )}
                        </motion.div>
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                            {currentBranding.name}
                        </h1>
                        <p className="text-gray-400 text-sm">Ingresa a tu cuenta para continuar</p>
                    </div>

                    {/* Error Message */}
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 overflow-hidden"
                            >
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-500 text-sm">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <p>{error}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">
                                Email
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="ejemplo@correo.com"
                                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 focus:ring-4 focus:ring-white/5 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Contraseña
                                </label>
                                <a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 focus:ring-4 focus:ring-white/5 transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 group mt-8 shadow-xl shadow-black/20"
                            style={{ backgroundColor: currentBranding.primaryColor }}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Iniciar Sesión
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Subtle decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
                </div>

                {/* Footer info */}
                <p className="mt-8 text-center text-gray-500 text-sm">
                    ¿No tienes una cuenta?{" "}
                    <a href="/register" className="text-white hover:underline transition-all">
                        Regístrate ahora
                    </a>
                </p>
            </motion.div>
        </div>
    );
}
