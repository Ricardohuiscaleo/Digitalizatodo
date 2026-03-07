"use client";

import React, { useState } from "react";
import { Building2, User, Mail, Lock, Globe, Loader2, AlertCircle, CheckCircle2, ChevronRight, Briefcase } from "lucide-react";
import { registerTenant } from "@/lib/api";

export default function OnboardingPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        tenant_name: "",
        tenant_slug: "",
        industry: "",
        user_name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'tenant_slug') {
            // Auto-format slug: lowercase, alphanumeric and hyphens only
            const formatted = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
            setFormData(prev => ({ ...prev, [name]: formatted }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (formData.password !== formData.password_confirmation) {
            setError("Las contraseñas no coinciden");
            setIsLoading(false);
            return;
        }

        try {
            const data = await registerTenant(formData);

            if (data.errors || data.message && data.message.includes('Error')) {
                if (data.errors) {
                    const firstError = Object.values(data.errors)[0] as string[];
                    throw new Error(firstError[0]);
                }
                throw new Error(data.message || "Error al registrar la empresa");
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
                <div className="w-full max-w-[480px] text-center space-y-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 text-green-500 mb-4 shadow-2xl shadow-green-500/20">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-white tracking-tight">¡Misión Cumplida!</h1>
                        <p className="text-gray-400 text-lg">Tu empresa <span className="text-white font-bold">{formData.tenant_name}</span> ha sido creada.</p>
                    </div>
                    <div className="bg-[#111] border border-white/5 rounded-3xl p-8 text-left space-y-6">
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Te hemos enviado un correo con los pasos a seguir. Ya puedes acceder a tu panel de administración privado:
                        </p>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 font-mono text-indigo-400 break-all text-center select-all cursor-pointer hover:bg-white/10 transition-colors">
                            https://app.digitalizatodo.cl/{formData.tenant_slug}
                        </div>
                        <button
                            onClick={() => window.location.href = `https://app.digitalizatodo.cl/${formData.tenant_slug}`}
                            className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                        >
                            Ir a mi App de Gestión <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 lg:p-12">
            <div className="w-full max-w-[1100px] grid lg:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-20 items-center">
                {/* Visual Side */}
                <div className="hidden lg:flex flex-col space-y-6">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 font-bold text-2xl">D</div>
                    <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
                        Transforma tu negocio en <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Software Inteligente</span>
                    </h2>
                    <ul className="space-y-4 pt-4">
                        {[
                            "PWA personalizada para tus clientes",
                            "Control total de asistencias y pagos",
                            "Notificaciones automáticas vía Telegram",
                            "Prueba gratuita de 7 días sin tarjetas"
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-gray-400">
                                <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Form Side */}
                <div className="w-full">
                    <div className="bg-[#111] border border-white/5 rounded-[2rem] p-8 lg:p-10 shadow-2xl relative overflow-hidden">
                        <div className="mb-8">
                            <h1 className="text-3xl font-black text-white mb-2">Empieza Ahora</h1>
                            <p className="text-gray-500 text-sm">Prueba tu software de gestión en menos de 1 minuto.</p>
                        </div>

                        {error && (
                            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-500 text-sm">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Empresa</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                        <input
                                            name="tenant_name"
                                            required
                                            value={formData.tenant_name}
                                            onChange={handleChange}
                                            placeholder="Nombre"
                                            className="w-full h-12 bg-white/[0.03] border border-white/[0.05] rounded-xl py-2 pl-11 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Subdominio</label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                        <input
                                            name="tenant_slug"
                                            required
                                            value={formData.tenant_slug}
                                            onChange={handleChange}
                                            placeholder="mi-negocio"
                                            className="w-full h-12 bg-white/[0.03] border border-white/[0.05] rounded-xl py-2 pl-11 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-indigo-500/50 transition-all text-sm font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Nicho de Negocio</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                    <select
                                        name="industry"
                                        required
                                        value={formData.industry}
                                        onChange={(e: any) => handleChange(e)}
                                        className="w-full h-12 bg-white/[0.03] border border-white/[0.05] rounded-xl py-2 pl-11 pr-4 text-white appearance-none focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
                                    >
                                        <option value="" disabled className="bg-[#111]">Seleccionar Nicho</option>
                                        <option value="academy" className="bg-[#111]">Dojo / Academia de Artes Marciales</option>
                                        <option value="clinic" className="bg-[#111]">Clínica / Estética / Salud</option>
                                        <option value="law" className="bg-[#111]">Estudio de Abogados / Consultoría</option>
                                        <option value="gym" className="bg-[#111]">Gimnasio / Centro Deportivo</option>
                                        <option value="other" className="bg-[#111]">Otro tipo de negocio</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">
                                        <ChevronRight className="w-4 h-4 rotate-90" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Tu Nombre Completo</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                    <input
                                        name="user_name"
                                        required
                                        value={formData.user_name}
                                        onChange={handleChange}
                                        placeholder="Juan Pérez"
                                        className="w-full h-12 bg-white/[0.03] border border-white/[0.05] rounded-xl py-2 pl-11 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email Profesional</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="juan@ejemplo.com"
                                        className="w-full h-12 bg-white/[0.03] border border-white/[0.05] rounded-xl py-2 pl-11 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Contraseña</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                        <input
                                            name="password"
                                            type="password"
                                            required
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            className="w-full h-12 bg-white/[0.03] border border-white/[0.05] rounded-xl py-2 pl-11 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Confirmar</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                        <input
                                            name="password_confirmation"
                                            type="password"
                                            required
                                            value={formData.password_confirmation}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            className="w-full h-12 bg-white/[0.03] border border-white/[0.05] rounded-xl py-2 pl-11 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all mt-6 shadow-xl shadow-indigo-600/10 active:scale-95 disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Crear mi Cuenta Gratis"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
