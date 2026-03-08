"use client";

import React, { useState } from "react";
import { CheckCircle2, ArrowRight, Loader2, AlertCircle, RefreshCw, Trophy } from "lucide-react";
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
        password_confirmation: ""
    });

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'tenant_slug' ? value.toLowerCase().replace(/[^a-z0-9-]/g, '') : value
        }));
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
            const data = await registerTenant(formData);
            if (data.errors) throw new Error(Object.values(data.errors)[0][0] as string);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (success) return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 text-zinc-950 font-sans">
            <div className="text-center space-y-8 max-w-sm animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="h-24 w-24 bg-emerald-500 text-white rounded-[2.5rem] mx-auto flex items-center justify-center shadow-2xl shadow-emerald-100 relative">
                    <CheckCircle2 size={48} />
                    <div className="absolute inset-0 bg-white/20 rounded-[2.5rem] animate-ping opacity-20" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-4xl font-black uppercase tracking-tighter">¡Éxito Total!</h1>
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Academia <span className="text-zinc-900">{formData.tenant_name}</span> lista.</p>
                </div>
                <button
                    onClick={() => window.location.href = `/login`}
                    className="w-full h-18 bg-zinc-950 text-white font-black rounded-2xl uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
                >
                    Entrar Ahora <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-zinc-950 font-sans">
            <div className="w-full max-w-md space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-zinc-900">Nueva Academia</h1>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] ml-1">Lanza tu plataforma profesional</p>
                </div>

                <div className="bg-white border border-zinc-100 rounded-[3rem] p-10 shadow-[0_30px_70px_rgba(0,0,0,0.04)] space-y-8 relative overflow-hidden">
                    {error && (
                        <div className="bg-rose-50 text-rose-600 text-[10px] font-black uppercase p-4 rounded-2xl border border-rose-100 flex items-center gap-3 animate-in fade-in zoom-in-95">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-4">Nombre</label>
                                <input name="tenant_name" required value={formData.tenant_name} onChange={handleChange} className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-6 font-bold text-zinc-950 focus:ring-2 ring-black transition-all outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-4">URL (Slug)</label>
                                <input name="tenant_slug" required value={formData.tenant_slug} onChange={handleChange} placeholder="mi-academia" className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-6 font-black text-zinc-950 focus:ring-2 ring-black transition-all outline-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-4">Especialización</label>
                            <select
                                name="industry"
                                required
                                value={formData.industry}
                                onChange={handleChange}
                                className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-6 font-black text-[10px] uppercase text-zinc-950 focus:ring-2 ring-black transition-all outline-none appearance-none"
                            >
                                <option value="">Seleccionar Rubro</option>
                                <option value="academy">Artes Marciales - Deportes</option>
                                <option value="clinic">Salud - Estética</option>
                                <option value="other">Otros Negocios</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-4">Director / Dueño</label>
                            <input name="user_name" required value={formData.user_name} onChange={handleChange} className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-6 font-bold text-zinc-950 focus:ring-2 ring-black transition-all outline-none" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-4">Email Principal</label>
                            <input name="email" type="email" required value={formData.email} onChange={handleChange} className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-6 font-bold text-zinc-950 focus:ring-2 ring-black transition-all outline-none" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-4">Clave</label>
                                <input name="password" type="password" required value={formData.password} onChange={handleChange} className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-6 font-bold text-zinc-950 focus:ring-2 ring-black transition-all outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-4">Repetir</label>
                                <input name="password_confirmation" type="password" required value={formData.password_confirmation} onChange={handleChange} className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-6 font-bold text-zinc-950 focus:ring-2 ring-black transition-all outline-none" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-18 bg-zinc-950 hover:bg-zinc-800 text-white font-black rounded-2xl uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 mt-4"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                                <>Comenzar Ahora <ArrowRight size={20} /></>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center">
                    <a href="/login" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-black transition-colors">Volver al Acceso</a>
                </p>
            </div>
        </div>
    );
}
