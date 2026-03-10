"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, ArrowRight, Loader2, AlertCircle, RefreshCw, Sparkles, Building2, User, Mail, Lock, Briefcase } from "lucide-react";
import { registerTenant, getIndustries } from "@/lib/api";

export default function OnboardingPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingIndustries, setIsLoadingIndustries] = useState(true);
    const [industries, setIndustries] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        tenant_name: "",
        tenant_slug: "",
        industry: "",
        user_name: "",
        email: "",
        password: "",
        password_confirmation: ""
    });

    useEffect(() => {
        async function loadIndustries() {
            try {
                const data = await getIndustries();
                setIndustries(data);
            } catch (err) {
                console.error("Error loading industries:", err);
            } finally {
                setIsLoadingIndustries(false);
            }
        }
        loadIndustries();
    }, []);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            if (name === 'tenant_name') {
                newData.tenant_slug = value
                    .toLowerCase()
                    .trim()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/[\s-]+/g, '-')
                    .replace(/^-+|-+$/g, '');
            }

            if (name === 'tenant_slug') {
                newData.tenant_slug = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
            }

            return newData;
        });
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        if (formData.password !== formData.password_confirmation) {
            setError("Las contraseñas no coinciden");
            setIsLoading(false);
            return;
        }
        try {
            const data = await registerTenant(formData) as any;
            if (!data) throw new Error("El servidor no respondió correctamente");
            if (data.errors) {
                const errorKey = Object.keys(data.errors)[0];
                const errorMessage = data.errors[errorKey][0];
                throw new Error(errorMessage);
            }
            if (data.message && !data.tenant) throw new Error(data.message);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Error al registrar");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-white font-sans">
            <div className="text-center space-y-8 max-w-sm animate-in fade-in zoom-in duration-500">
                <div className="h-24 w-24 bg-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl shadow-indigo-500/20 relative">
                    <CheckCircle2 size={48} className="text-white" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-4xl font-black uppercase tracking-tighter italic">¡Éxito Total!</h1>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Empresa <span className="text-white">{formData.tenant_name}</span> lista.</p>
                </div>
                <button
                    onClick={() => window.location.href = `/login`}
                    className="w-full h-16 bg-white text-zinc-950 font-black rounded-2xl uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
                >
                    Entrar Ahora <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 md:p-6 text-zinc-950 font-sans selection:bg-indigo-100">
            <div className="w-full max-w-lg space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                <header className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full text-indigo-600 mb-2">
                        <Sparkles size={12} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Potenciando Negocios</span>
                    </div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-zinc-900 leading-[0.9]">
                        Prueba nuestra <br />
                        <span className="text-indigo-600">plataforma</span>
                    </h1>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mt-1">
                        SaaS adaptado a tu medida
                    </p>
                </header>

                <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-6 md:p-10 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] space-y-6 relative overflow-hidden">
                    {error && (
                        <div className="bg-rose-50 text-rose-600 text-[10px] font-black uppercase p-4 rounded-2xl border border-rose-100 flex items-center gap-3 animate-in fade-in zoom-in-95">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Sección Empresa */}
                            <div className="space-y-4 md:border-r border-zinc-50 md:pr-4">
                                <label className="text-[10px] font-black text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                                    <Building2 size={12} /> Datos del Negocio
                                </label>

                                <div className="space-y-3">
                                    <div className="relative">
                                        <input
                                            name="tenant_name"
                                            required
                                            value={formData.tenant_name}
                                            onChange={handleChange}
                                            placeholder="Nombre de Empresa"
                                            className="w-full h-12 bg-zinc-50 border-none rounded-2xl px-5 font-bold text-sm text-zinc-950 focus:ring-2 ring-indigo-500 transition-all outline-none"
                                        />
                                    </div>

                                    <div className="relative">
                                        <input
                                            name="tenant_slug"
                                            required
                                            value={formData.tenant_slug}
                                            onChange={handleChange}
                                            placeholder="slug-url"
                                            className="w-full h-12 bg-zinc-100 border-none rounded-2xl px-5 font-black text-[11px] text-zinc-400 focus:ring-2 ring-indigo-500 transition-all outline-none"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
                                            <RefreshCw size={12} />
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <select
                                            name="industry"
                                            required
                                            value={formData.industry}
                                            onChange={handleChange}
                                            disabled={isLoadingIndustries}
                                            className="w-full h-12 bg-zinc-50 border-none rounded-2xl px-5 font-black text-[11px] uppercase text-zinc-950 focus:ring-2 ring-indigo-500 transition-all outline-none appearance-none cursor-pointer disabled:opacity-50"
                                        >
                                            <option value="" disabled>{isLoadingIndustries ? 'Cargando Rubros...' : 'Seleccionar Rubro'}</option>
                                            {industries.map((ind: any) => (
                                                <option key={ind.id} value={ind.id}>{ind.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Sección Usuario */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                                    <User size={12} /> Administrador
                                </label>

                                <div className="space-y-3">
                                    <input name="user_name" required value={formData.user_name} onChange={handleChange} placeholder="Tu Nombre Completo" className="w-full h-12 bg-zinc-50 border-none rounded-2xl px-5 font-bold text-sm text-zinc-950 focus:ring-2 ring-indigo-500 transition-all outline-none" />
                                    <input name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="Email corporativo" className="w-full h-12 bg-zinc-50 border-none rounded-2xl px-5 font-bold text-sm text-zinc-950 focus:ring-2 ring-indigo-500 transition-all outline-none" />

                                    <div className="grid grid-cols-2 gap-2">
                                        <input name="password" type="password" required value={formData.password} onChange={handleChange} placeholder="Clave" className="w-full h-12 bg-zinc-50 border-none rounded-2xl px-5 font-bold text-sm text-zinc-950 focus:ring-2 ring-indigo-500 transition-all outline-none" />
                                        <input name="password_confirmation" type="password" required value={formData.password_confirmation} onChange={handleChange} placeholder="Confirmar" className="w-full h-12 bg-zinc-50 border-none rounded-2xl px-5 font-bold text-sm text-zinc-950 focus:ring-2 ring-indigo-500 transition-all outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 text-center">
                            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mb-4 px-8">
                                Al registrarte, aceptas que adaptemos esta plataforma <span className="text-zinc-900">exclusivamente</span> para tus necesidades.
                            </p>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-16 bg-zinc-950 hover:bg-zinc-800 text-white font-black rounded-2xl uppercase tracking-[0.25em] text-[10px] flex items-center justify-center gap-4 shadow-2xl shadow-zinc-200 transition-all active:scale-95 group"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={18} /> : (
                                    <>Comenzar Despliegue <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <footer className="flex flex-col items-center gap-6">
                    <p>
                        <a href="/login" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">¿Ya tienes cuenta? Volver</a>
                    </p>
                    <div className="flex items-center gap-3 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                        <img src="/pwa-icon.webp" className="w-8" alt="Logo" />
                        <div className="h-4 w-px bg-zinc-200" />
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.3em]">
                            Digitaliza Todo &copy; 2026 &mdash; The Software Factory
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
