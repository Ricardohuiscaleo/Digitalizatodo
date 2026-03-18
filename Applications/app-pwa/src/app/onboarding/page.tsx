"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, ArrowRight, Loader2, AlertCircle, RefreshCw, Sparkles, Building2, User, Globe, ShieldCheck } from "lucide-react";
import { registerTenant, getIndustries } from "@/lib/api";

export default function OnboardingPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingIndustries, setIsLoadingIndustries] = useState(true);
    const [industries, setIndustries] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [step, setStep] = useState(1); // 1: Negocio, 2: Admin
    const [acceptedTerms, setAcceptedTerms] = useState(false);
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
        if (step === 1) {
            setStep(2);
            return;
        }
        
        setIsLoading(true);
        setError(null);
        if (formData.password !== formData.password_confirmation) {
            setError("Las contraseñas no coinciden");
            setIsLoading(false);
            return;
        }
        try {
            const data = await registerTenant({
                ...formData,
                accepted_terms_at: new Date().toISOString(),
            }) as any;
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
                <div className="h-24 w-24 bg-indigo-600 rounded-full mx-auto flex items-center justify-center shadow-2xl shadow-indigo-500/20 relative">
                    <CheckCircle2 size={48} className="text-white" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none">¡Bienvenido al <br/> Futuro!</h1>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mt-4">Dashboard <span className="text-white">{formData.tenant_name}</span> creado.</p>
                </div>
                <button
                    onClick={() => window.location.href = `/`}
                    className="w-full h-16 bg-white text-zinc-950 font-black rounded-2xl uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
                >
                    Configurar mi Portal <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-zinc-950 font-sans">
            <div className="w-full max-w-[400px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                <header className="text-center space-y-3">
                    <div className="flex justify-center mb-2">
                         <div className="h-14 w-14 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center overflow-hidden">
                             <img src="/DLogo-v2.webp" className="w-8 h-8 object-contain opacity-80" alt="logo" />
                         </div>
                    </div>
                    <div className="inline-flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full text-indigo-600">
                        <Sparkles size={10} className="animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">Nuevo Dashboard</span>
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-zinc-900 leading-[0.85]">
                        Crea tu propio <br />
                        <span className="text-indigo-600">ecosistema SaaS</span>
                    </h1>
                </header>

                <div className="relative">
                    {/* Indicador de pasos */}
                    <div className="flex gap-2 mb-6 px-1">
                        <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-indigo-600' : 'bg-zinc-100'}`} />
                        <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-indigo-600' : 'bg-zinc-100'}`} />
                    </div>

                    <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm space-y-6 relative overflow-hidden transition-all duration-500">
                        {error && (
                            <div className="bg-rose-50 text-rose-600 text-[10px] font-black uppercase p-4 rounded-2xl border border-rose-100 animate-in shake-in duration-300">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            
                            {/* PASO 1: DATOS DEL NEGOCIO */}
                            {step === 1 && (
                                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center gap-3 text-zinc-400 mb-2">
                                        <Building2 size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest italic">Paso 1: Tu Negocio</span>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Nombre de Empresa</label>
                                            <input
                                                name="tenant_name"
                                                required
                                                value={formData.tenant_name}
                                                onChange={handleChange}
                                                placeholder="Ej: Dojo Master Arica"
                                                className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-6 font-bold text-sm text-zinc-900 focus:bg-white focus:ring-4 ring-zinc-50 outline-none transition-all"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Identificador Único (Slug)</label>
                                            <div className="relative">
                                                <input
                                                    name="tenant_slug"
                                                    required
                                                    value={formData.tenant_slug}
                                                    onChange={handleChange}
                                                    placeholder="dojo-master"
                                                    className="w-full h-14 bg-zinc-100/50 border-none rounded-2xl px-6 pl-12 font-black text-[11px] text-zinc-500 focus:bg-white focus:ring-4 ring-zinc-50 outline-none transition-all"
                                                />
                                                <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300" size={14} />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Rubro de Actividad</label>
                                            <select
                                                name="industry"
                                                required
                                                value={formData.industry}
                                                onChange={handleChange}
                                                disabled={isLoadingIndustries}
                                                className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-6 font-black text-[11px] uppercase text-zinc-900 focus:bg-white focus:ring-4 ring-zinc-50 outline-none appearance-none cursor-pointer disabled:opacity-50"
                                            >
                                                <option value="" disabled>{isLoadingIndustries ? 'Cargando...' : 'Seleccionar Rubro'}</option>
                                                {industries.map((ind: any) => (
                                                    <option key={ind.id} value={ind.id}>{ind.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* PASO 2: DATOS DEL ADMIN */}
                            {step === 2 && (
                                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center gap-3 text-zinc-400 mb-2">
                                        <ShieldCheck size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest italic">Paso 2: Acceso Admin</span>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Tu Nombre</label>
                                            <input name="user_name" required value={formData.user_name} onChange={handleChange} placeholder="Nombre Apellido" className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-6 font-bold text-sm text-zinc-900 focus:bg-white focus:ring-4 ring-zinc-50 outline-none transition-all" />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Email Maestro</label>
                                            <input name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="estemaestro@mail.com" className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-6 font-bold text-sm text-zinc-900 focus:bg-white focus:ring-4 ring-zinc-50 outline-none transition-all" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Clave</label>
                                                <input name="password" type="password" required value={formData.password} onChange={handleChange} placeholder="••••" className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-6 font-bold text-sm text-zinc-900 focus:bg-white focus:ring-4 ring-zinc-50 outline-none transition-all" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Repetir</label>
                                                <input name="password_confirmation" type="password" required value={formData.password_confirmation} onChange={handleChange} placeholder="••••" className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-6 font-bold text-sm text-zinc-900 focus:bg-white focus:ring-4 ring-zinc-50 outline-none transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 flex flex-col gap-3">
                                {step === 2 && (
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative mt-0.5 flex-shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={acceptedTerms}
                                                onChange={e => setAcceptedTerms(e.target.checked)}
                                                className="sr-only"
                                            />
                                            <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                                acceptedTerms ? 'bg-indigo-600 border-indigo-600' : 'border-zinc-300 bg-white group-hover:border-zinc-400'
                                            }`}>
                                                {acceptedTerms && <CheckCircle2 size={12} className="text-white" />}
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-zinc-500 leading-relaxed">
                                            He leído y acepto los{' '}
                                            <a
                                                href="https://digitalizatodo.cl/terminos"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 underline underline-offset-2 hover:text-indigo-800"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                Términos y Condiciones
                                            </a>{' '}y la{' '}
                                            <a
                                                href="https://digitalizatodo.cl/privacidad"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 underline underline-offset-2 hover:text-indigo-800"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                Política de Privacidad
                                            </a>
                                        </span>
                                    </label>
                                )}
                                <button
                                    type="submit"
                                    disabled={isLoading || (step === 2 && !acceptedTerms)}
                                    className="w-full h-16 bg-zinc-950 hover:bg-zinc-800 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 shadow-xl active:scale-[0.98] transition-all group disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : (
                                        <>
                                            {step === 1 ? 'Siguiente Paso' : 'Crear Dashboard'} 
                                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                                
                                {step === 2 && (
                                    <button 
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors py-2"
                                    >
                                        Volver al Paso 1
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                <footer className="text-center space-y-8 pb-10">
                    <p>
                        <a href="/" className="text-[10px] font-black text-zinc-300 uppercase tracking-widest hover:text-indigo-600 transition-colors">¿Ya tienes cuenta? Ir al Login</a>
                    </p>
                    <div className="flex flex-col items-center gap-3 opacity-20">
                        <p className="text-[7px] font-black text-zinc-500 uppercase tracking-[0.4em]">
                            Digitaliza Todo Engine &copy; 2026 &mdash; The Software Factory
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
