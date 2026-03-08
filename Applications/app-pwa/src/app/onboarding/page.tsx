"use client";

import React, { useState } from "react";
import { Building2, User, Mail, Lock, Globe, Loader2, AlertCircle, CheckCircle2, ChevronRight, Briefcase, Zap, Check, ArrowRight } from "lucide-react";
import { registerTenant } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
            <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-[480px] text-center space-y-10"
                >
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-[3rem] bg-zinc-950 text-emerald-400 mb-4 shadow-2xl shadow-zinc-200 p-6">
                        <CheckCircle2 className="w-full h-full" strokeWidth={3} />
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">¡Configurado!</h1>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Tu academia <span className="text-zinc-950">{formData.tenant_name}</span> está lista.</p>
                    </div>
                    <Card className="bg-white border-none rounded-[3rem] p-10 shadow-bento text-left space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <Zap size={100} className="fill-zinc-950 text-zinc-950" />
                        </div>
                        <p className="text-slate-500 text-xs font-bold leading-relaxed relative z-10">
                            Te hemos enviado un correo de bienvenida. Tu panel de gestión profesional ya está activo en:
                        </p>
                        <div className="p-5 bg-slate-50 rounded-[1.5rem] border-none font-black text-zinc-950 break-all text-center select-all cursor-pointer hover:bg-slate-100 transition-all text-sm relative z-10">
                            app.digitalizatodo.cl/{formData.tenant_slug}
                        </div>
                        <Button
                            onClick={() => window.location.href = `/${formData.tenant_slug}`}
                            className="w-full h-16 bg-zinc-950 hover:bg-zinc-800 text-white font-black rounded-[1.8rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-zinc-200 active:scale-95 relative z-10"
                        >
                            <span className="uppercase tracking-[0.2em] text-[11px]">Entrar a mi Academia</span>
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 lg:p-12 font-sans">
            <div className="w-full max-w-[1240px] grid lg:grid-cols-[0.7fr_1.3fr] gap-16 lg:gap-24 items-center">

                {/* Visual Side - Premium Bento Style */}
                <div className="hidden lg:flex flex-col space-y-12">
                    <div className="flex flex-col space-y-4">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-[1.8rem] bg-zinc-950 text-white font-black text-3xl shadow-2xl shadow-zinc-200">D</div>
                        <h2 className="text-6xl font-black text-slate-900 leading-[1] tracking-tighter uppercase">
                            Gestiona tu <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Academia Pro</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { title: "PWA NATIVA", desc: "Instalable en iOS/Android" },
                            { title: "PAGOS", desc: "Cuentas al día siempre" },
                            { title: "ASISTENCIA", desc: "Control en tiempo real" },
                            { title: "7 DÍAS GRATIS", desc: "Sin tarjetas de crédito" }
                        ].map((item, i) => (
                            <Card key={i} className="bg-white/60 backdrop-blur-md border-none p-6 rounded-[2rem] shadow-sm">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-3" />
                                <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-widest">{item.title}</h3>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{item.desc}</p>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Form Side */}
                <div className="w-full flex justify-center">
                    <Card className="w-full max-w-[580px] bg-white border-none rounded-[3rem] p-10 lg:p-14 shadow-bento relative overflow-hidden">
                        <div className="mb-10 text-center lg:text-left">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-3">Únete hoy</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Crea tu cuenta profesional</p>
                        </div>

                        {error && (
                            <div className="mb-8 bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3 text-rose-500 text-[10px] font-black uppercase tracking-wider">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Institución</label>
                                    <Input
                                        name="tenant_name"
                                        required
                                        value={formData.tenant_name}
                                        onChange={handleChange}
                                        placeholder="Nombre"
                                        className="h-14 bg-slate-50 border-none rounded-2xl pl-5 font-bold text-sm focus-visible:ring-zinc-950 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Link / Slug</label>
                                    <Input
                                        name="tenant_slug"
                                        required
                                        value={formData.tenant_slug}
                                        onChange={handleChange}
                                        placeholder="mi-academia"
                                        className="h-14 bg-slate-50 border-none rounded-2xl pl-5 font-black text-sm focus-visible:ring-zinc-950 transition-all lowercase"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Especialización</label>
                                <select
                                    name="industry"
                                    required
                                    value={formData.industry}
                                    onChange={(e: any) => handleChange(e)}
                                    className="w-full h-14 bg-slate-50 border-none rounded-2xl px-5 font-black text-xs uppercase text-slate-900 focus:ring-2 ring-zinc-950 transition-all outline-none appearance-none"
                                >
                                    <option value="" disabled>Seleccionar Rubro</option>
                                    <option value="academy">Artes Marciales / Deportes</option>
                                    <option value="clinic">Clínica / Salud / Estética</option>
                                    <option value="music_school">Escuela de Música / Arte</option>
                                    <option value="other">Otro Negocio</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Nombre del Director</label>
                                <Input
                                    name="user_name"
                                    required
                                    value={formData.user_name}
                                    onChange={handleChange}
                                    placeholder="Nombre Completo"
                                    className="h-14 bg-slate-50 border-none rounded-2xl pl-5 font-bold text-sm focus-visible:ring-zinc-950 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Email de Acceso</label>
                                <Input
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="hola@academia.com"
                                    className="h-14 bg-slate-50 border-none rounded-2xl pl-5 font-bold text-sm focus-visible:ring-zinc-950 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Contraseña</label>
                                    <Input
                                        name="password"
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="h-14 bg-slate-50 border-none rounded-2xl pl-5 font-bold text-sm focus-visible:ring-zinc-950 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Repetir</label>
                                    <Input
                                        name="password_confirmation"
                                        type="password"
                                        required
                                        value={formData.password_confirmation}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="h-14 bg-slate-50 border-none rounded-2xl pl-5 font-bold text-sm focus-visible:ring-zinc-950 transition-all"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-18 bg-zinc-950 hover:bg-zinc-800 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all mt-8 shadow-2xl shadow-zinc-200 active:scale-95 disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        <span className="uppercase tracking-[0.2em] text-[11px]">Crear Academia Pro</span>
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </Button>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
