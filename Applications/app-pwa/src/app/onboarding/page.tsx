"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, ArrowRight, Loader2, AlertCircle, RefreshCw, Trophy } from "lucide-react";
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

            // Si cambia el nombre de la empresa, actualizamos el slug automáticamente
            if (name === 'tenant_name') {
                newData.tenant_slug = value
                    .toLowerCase()
                    .trim()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
                    .replace(/[^a-z0-9\s-]/g, '')    // Remover caracteres especiales
                    .replace(/[\s-]+/g, '-')         // Espacios a guiones
                    .replace(/^-+|-+$/g, '');        // Guiones al inicio/final
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
            if (!data) {
                throw new Error("El servidor no respondió correctamente");
            }
            if (data.errors) {
                const errorKey = Object.keys(data.errors)[0];
                const errorMessage = data.errors[errorKey][0];
                throw new Error(errorMessage);
            }
            if (data.message && !data.tenant) {
                // Si hay mensaje pero no hay tenant, probablemente es un error
                throw new Error(data.message);
            }
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Error al registrar");
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
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Empresa <span className="text-zinc-900">{formData.tenant_name}</span> lista.</p>
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
                <div className="text-center space-y-3">
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-zinc-900 leading-none">Prueba nuestro software de gestión</h1>
                    <p className="text-[11px] font-black text-rose-500 uppercase tracking-[0.3em]">Agregamos funciones a tu medida</p>
                    <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl mt-4">
                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed uppercase tracking-wider">
                            Estás por probar un software base profesional que podemos <strong>adaptar y escalar</strong> según las necesidades específicas de tu negocio.
                        </p>
                    </div>
                </div>

                <div className="bg-white border border-zinc-100 rounded-[3rem] p-10 shadow-[0_30px_70px_rgba(0,0,0,0.04)] space-y-8 relative overflow-hidden">
                    {error && (
                        <div className="bg-rose-50 text-rose-600 text-[10px] font-black uppercase p-4 rounded-2xl border border-rose-100 flex items-center gap-3 animate-in fade-in zoom-in-95">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-4 italic">¿Como se llama tú Empresa o Servicio?</label>
                            <input name="tenant_name" required value={formData.tenant_name} onChange={handleChange} placeholder="Ej: Mi Negocio Spa" className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-6 font-bold text-zinc-950 focus:ring-2 ring-black transition-all outline-none" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-4">URL (Auto-generada)</label>
                            <div className="relative">
                                <input name="tenant_slug" required value={formData.tenant_slug} onChange={handleChange} placeholder="slug-automatico" className="w-full h-14 bg-zinc-100 border-none rounded-2xl px-6 font-black text-zinc-400 focus:ring-2 ring-black transition-all outline-none" />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <RefreshCw size={14} className="text-zinc-300" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-4 italic">Rubro o Especialización</label>
                            <div className="relative">
                                <select
                                    name="industry"
                                    required
                                    value={formData.industry}
                                    onChange={handleChange}
                                    disabled={isLoadingIndustries}
                                    className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-6 font-black text-[11px] uppercase text-zinc-950 focus:ring-2 ring-black transition-all outline-none appearance-none cursor-pointer disabled:opacity-50"
                                >
                                    <option value="" disabled>{isLoadingIndustries ? 'Cargando Rubros...' : 'Seleccionar Rubro'}</option>
                                    {industries.map((ind: any) => (
                                        <option key={ind.id} value={ind.id}>{ind.name}</option>
                                    ))}
                                </select>
                                {isLoadingIndustries && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <Loader2 size={14} className="animate-spin text-zinc-400" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-4 italic">Nombre de quien administrará este software</label>
                            <input name="user_name" required value={formData.user_name} onChange={handleChange} placeholder="Tu Nombre Completo" className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-6 font-bold text-zinc-950 focus:ring-2 ring-black transition-all outline-none" />
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
                <p className="text-center text-[9px] text-zinc-300 uppercase tracking-widest">
                    Digitaliza Todo &copy; {new Date().getFullYear()} &mdash; The Software Factory
                </p>
            </div>
        </div>
    );
}
