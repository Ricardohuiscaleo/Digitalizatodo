"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, ArrowRight, Loader2, Sparkles, Building2, Globe, ShieldCheck } from "lucide-react";
import { registerTenant, getIndustries } from "@/lib/api";
import Grainient from "@/components/ui/Grainient/Grainient";

const RealTimeBadgeLogo = ({ formData, step }: { formData: any, step: number }) => {
    const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    const step1Count = [
        formData.tenant_name.length >= 3,
        formData.industry !== ""
    ].filter(Boolean).length;

    const step2Count = [
        formData.user_name.length >= 3,
        isEmailValid(formData.email),
        formData.password.length >= 6
    ].filter(Boolean).length;

    const currentCount = step === 1 ? step1Count : (2 + step2Count);

    return (
        <div className="flex flex-col items-center gap-0.5 md:gap-1">
            <div className="relative group transition-all duration-500 hover:scale-105">
                 <img src="/DLogo-v2.webp" className="h-14 w-14 md:h-16 md:w-16 object-contain rounded-[22.5%] shadow-sm" alt="logo" />
                 {currentCount > 0 && (
                    <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 h-5 w-5 bg-rose-600 rounded-full flex items-center justify-center text-white text-[9px] font-black shadow-lg shadow-rose-500/20 animate-in zoom-in slide-in-from-bottom-2 duration-300">
                        {currentCount}
                    </div>
                 )}
            </div>
            <div className="text-center">
                <span className="text-[10px] md:text-[11px] font-medium text-zinc-700 leading-none">DigitalizaApp</span>
            </div>
        </div>
    );
};

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

    const getDynamicLabels = (industryId: string) => {
        const industry = industries.find(ind => ind.id?.toString() === industryId || ind.name === industryId);
        if (!industry) return { target: "Clientes y Usuarios", entity: "Negocio / Empresa", icon: "🚀" };

        const name = industry.name.toLowerCase();
        if (name.includes('marcial') || name.includes('dojo') || name.includes('karate') || name.includes('boxeo')) {
            return { target: "Alumnos y Apoderados", entity: "Dojo / Academia", icon: "🥋" };
        }
        if (name.includes('gym') || name.includes('fitness') || name.includes('entrenamiento')) {
            return { target: "Socios y Miembros", entity: "Gimnasio / Box", icon: "🏋️‍♂️" };
        }
        if (name.includes('colegio') || name.includes('escuela') || name.includes('educa')) {
            return { target: "Padres y Alumnos", entity: "Institución / Colegio", icon: "📚" };
        }
        
        return { target: "Clientes y Usuarios", entity: "Negocio / Empresa", icon: "🚀" };
    };

    const labels = getDynamicLabels(formData.industry);

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
            
            if (data.status === 'error') {
                throw new Error(data.message);
            }
            
            if (data.errors) {
                const errorKey = Object.keys(data.errors)[0];
                const errorMessage = data.errors[errorKey][0] || "Error en los datos";
                throw new Error(errorMessage);
            }
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Ocurrió un error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex flex-col md:flex-row bg-white overflow-hidden text-zinc-950 font-sans">
                {/* LADO IZQUIERDO: Branding Gradiente */}
                <div className="w-full md:w-1/2 relative flex items-center justify-center p-8 md:p-24 overflow-hidden border-b md:border-b-0 md:border-r border-zinc-100">
                    <div className="absolute inset-0 z-0">
                        <Grainient
                            color1="#4ade80"
                            color2="#fb923c"
                            color3="#3b82f6"
                            timeSpeed={0.05}
                            contrast={2.0}
                            gamma={1.2}
                            saturation={1.5}
                            zoom={0.9}
                        />
                    </div>
                    <div className="relative z-10">
                        <RealTimeBadgeLogo formData={formData} step={step} />
                    </div>
                </div>

                {/* LADO DERECHO: Mensaje de Éxito */}
                <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-24 bg-white relative z-10">
                    <div className="max-w-md w-full p-10 rounded-[3rem] text-center space-y-10 animate-in fade-in slide-in-from-right-12 duration-1000">
                        <div className="h-24 w-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/40">
                            <Sparkles className="text-white w-12 h-12 animate-pulse" />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-zinc-900 leading-none">¡Solicitud <br/> <span className="text-blue-600">Recibida!</span></h2>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100">
                                <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Estado: Revisión Pendiente</span>
                            </div>
                            <p className="text-zinc-500 font-medium text-xs leading-relaxed uppercase tracking-widest pt-4">Tu academia está siendo activada por nuestro equipo. <br/> Recibirás un mail de acceso a <span className="text-zinc-900 font-bold">{formData.email}</span> muy pronto.</p>
                        </div>
                        <button onClick={() => window.location.href = '/'} className="w-full h-18 bg-zinc-900 text-white font-black rounded-2xl uppercase tracking-[0.3em] text-[10px] hover:bg-black transition-all shadow-xl shadow-zinc-200">Volver al Inicio</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white overflow-hidden text-zinc-950 font-sans selection:bg-blue-100">
            
            {/* LADO IZQUIERDO: BRANDING & GRADIENTE */}
            <div className="w-full md:w-[60%] relative flex items-center justify-center p-5 md:p-12 lg:p-24 overflow-hidden border-b md:border-b-0 md:border-r border-zinc-100">
                {/* GRADIENT LAYER RESTRICTED TO THIS HALF */}
                <div className="absolute inset-0 z-0 animate-in fade-in duration-[20000ms] ease-out">
                    <Grainient
                        color1="#4ade80"
                        color2="#fb923c"
                        color3="#3b82f6"
                        timeSpeed={0.15}
                        contrast={2.0}
                        gamma={1.2}
                        saturation={1.5}
                        zoom={0.9}
                    />
                </div>

                <div className="relative z-10 max-w-[500px] w-full h-full flex flex-col justify-between py-8 md:py-20 lg:py-24 space-y-8 md:space-y-0">
                    <header className="text-center md:text-left flex flex-col items-center md:items-start gap-4 md:gap-6">
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <RealTimeBadgeLogo formData={formData} step={step} />
                            <div className="flex flex-col items-center md:items-start">
                                <span className="text-lg md:text-xl font-black tracking-tighter italic uppercase text-zinc-900 leading-none">DigitalizaApp</span>
                                <div className="h-0.5 w-8 bg-blue-600 rounded-full mt-1 hidden md:block" />
                            </div>
                        </div>
                        
                        <div className="space-y-3 md:space-y-5">
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-zinc-900 leading-[0.8] italic animate-in slide-in-from-left-8 duration-700">
                                Tu propia <br/> <span className="text-blue-600">plataforma <br className="hidden md:block"/> digital</span>
                            </h1>
                            <p className="hidden md:block text-[10px] md:text-[11px] font-black text-zinc-400 leading-relaxed uppercase tracking-[0.4em] max-w-xs">
                                Digitaliza tu negocio con el motor más potente del mercado.
                            </p>
                        </div>
                    </header>

                    <div className="grid grid-cols-3 md:grid-cols-1 gap-3 md:gap-4 w-full animate-in slide-in-from-bottom-8 duration-1000 delay-300">
                        {/* Tarjeta 1: Usuarios */}
                        <div className="bg-white/[0.01] backdrop-blur-2xl border border-zinc-200/50 md:border-zinc-200/30 rounded-[1.5rem] md:rounded-[2rem] p-3 md:p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center md:flex-row md:items-center md:gap-6 group">
                            <div className="h-10 w-10 md:h-14 md:w-14 bg-transparent md:bg-white rounded-xl md:rounded-2xl shrink-0 flex items-center justify-center md:shadow-lg md:shadow-zinc-200/40 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                <span className="text-xl md:text-2xl">{labels.icon}</span>
                            </div>
                            <div className="mt-2 md:mt-0 space-y-1 md:space-y-1.5 text-center md:text-left">
                                <h3 className="text-[8px] md:text-[9px] font-black uppercase tracking-widest md:tracking-[0.3em] text-zinc-400 pointer-events-none truncate w-full group-hover:text-blue-600 transition-colors">Usuarios</h3>
                                <p className="text-[10px] md:text-xl font-black text-zinc-900 uppercase tracking-tighter italic leading-none hidden md:block">
                                    {labels.target}
                                </p>
                            </div>
                        </div>

                        {/* Tarjeta 2: Operaciones */}
                        <div className="bg-white/[0.01] backdrop-blur-2xl border border-zinc-200/50 md:border-zinc-200/30 rounded-[1.5rem] md:rounded-[2rem] p-3 md:p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center md:flex-row md:items-center md:gap-6 group">
                            <div className="h-10 w-10 md:h-14 md:w-14 bg-transparent md:bg-white rounded-xl md:rounded-2xl shrink-0 flex items-center justify-center md:shadow-lg md:shadow-zinc-200/40 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                <Building2 className="w-5 h-5 md:w-7 md:h-7" />
                            </div>
                            <div className="mt-2 md:mt-0 space-y-1 md:space-y-1.5 text-center md:text-left">
                                <h3 className="text-[8px] md:text-[9px] font-black uppercase tracking-widest md:tracking-[0.3em] text-zinc-500 pointer-events-none truncate w-full group-hover:text-blue-600 transition-colors">Operaciones</h3>
                                <p className="text-[10px] md:text-xl font-black text-zinc-900 uppercase tracking-tighter italic leading-none hidden md:block">
                                    {labels.entity}
                                </p>
                            </div>
                        </div>

                        {/* Tarjeta 3: Administración */}
                        <div className="bg-white/[0.01] backdrop-blur-2xl border border-zinc-200/50 md:border-zinc-200/30 rounded-[1.5rem] md:rounded-[2rem] p-3 md:p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center md:flex-row md:items-center md:gap-6 group">
                            <div className="h-10 w-10 md:h-14 md:w-14 bg-transparent md:bg-white rounded-xl md:rounded-2xl shrink-0 flex items-center justify-center md:shadow-lg md:shadow-zinc-200/40 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                <Globe className="w-5 h-5 md:w-7 md:h-7" />
                            </div>
                            <div className="mt-2 md:mt-0 space-y-1 md:space-y-1.5 text-center md:text-left">
                                <h3 className="text-[8px] md:text-[9px] font-black uppercase tracking-widest md:tracking-[0.3em] text-zinc-500 pointer-events-none truncate w-full group-hover:text-blue-600 transition-colors">Administración</h3>
                                <p className="text-[10px] md:text-xl font-black text-zinc-900 uppercase tracking-tighter italic leading-none hidden md:block">
                                    GESTIÓN
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* LADO DERECHO: FORMULARIO (FONDO BLANCO) */}
            <div className="w-full md:w-[40%] flex items-center justify-center p-6 md:p-12 lg:p-24 bg-white relative z-20 shadow-[-100px_0_100px_rgba(255,255,255,0.8)]">
                <div className="w-full max-w-[440px] space-y-6 md:space-y-12 animate-in fade-in slide-in-from-right-12 duration-1000">
                    <div className="text-center opacity-40">
                         <span className="text-[11px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.5em]">Configuración de Acceso</span>
                    </div>

                    <div className="bg-white border border-zinc-100 rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-14 shadow-2xl shadow-zinc-200/50 space-y-6 md:space-y-10 relative overflow-hidden transition-all hover:border-zinc-200">
                        {error && (
                            <div className="bg-rose-50 text-rose-600 text-[10px] font-black uppercase p-4 rounded-2xl border border-rose-100 animate-in shake-in duration-300">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                            {/* PASO 1 */}
                            {step === 1 && (
                                <div className="space-y-5 md:space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Nombre de Empresa</label>
                                        <input name="tenant_name" required value={formData.tenant_name} onChange={handleChange} placeholder="Ej: Dojo Master Arica" className="w-full h-14 md:h-18 bg-zinc-50 border-2 border-transparent rounded-[1.5rem] px-8 font-bold text-base text-zinc-900 focus:bg-white focus:border-blue-600/20 focus:ring-4 ring-blue-50 outline-none transition-all placeholder:text-zinc-300" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Rubro de Actividad</label>
                                        <div className="relative">
                                            <select name="industry" required value={formData.industry} onChange={handleChange} disabled={isLoadingIndustries} className="w-full h-14 md:h-18 bg-zinc-50 border-2 border-transparent rounded-[1.5rem] px-8 font-black text-[12px] uppercase text-zinc-900 focus:bg-white focus:border-blue-600/20 focus:ring-4 ring-blue-50 outline-none appearance-none cursor-pointer disabled:opacity-50">
                                                <option value="" disabled className="bg-white">{isLoadingIndustries ? 'Cargando...' : 'Seleccionar Rubro'}</option>
                                                {industries.map((ind: any) => (<option key={ind.id} value={ind.id} className="bg-white">{ind.name}</option>))}
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                                                <ArrowRight size={18} className="rotate-90 md:rotate-0" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* PASO 2 */}
                            {step === 2 && (
                                <div className="space-y-5 md:space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Tu Nombre</label>
                                        <input name="user_name" required value={formData.user_name} onChange={handleChange} className="w-full h-14 md:h-18 bg-zinc-50 border-2 border-transparent rounded-[1.5rem] px-8 font-bold text-base text-zinc-900 focus:bg-white focus:border-blue-600/20 focus:ring-4 ring-blue-50 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Email Profesional</label>
                                        <input name="email" type="email" required value={formData.email} onChange={handleChange} className="w-full h-14 md:h-18 bg-zinc-50 border-2 border-transparent rounded-[1.5rem] px-8 font-bold text-base text-zinc-900 focus:bg-white focus:border-blue-600/20 focus:ring-4 ring-blue-50 outline-none transition-all" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input name="password" type="password" required value={formData.password} onChange={handleChange} placeholder="Clave" className="w-full h-14 md:h-18 bg-zinc-50 border-2 border-transparent rounded-[1.5rem] px-8 font-bold text-base text-zinc-900 focus:bg-white focus:border-blue-600/20" />
                                        <input name="password_confirmation" type="password" required value={formData.password_confirmation} onChange={handleChange} placeholder="Repetir" className="w-full h-14 md:h-18 bg-zinc-50 border-2 border-transparent rounded-[1.5rem] px-8 font-bold text-base text-zinc-900 focus:bg-white focus:border-blue-600/20" />
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex flex-col gap-4">
                                {step === 2 && (
                                    <label className="flex items-center gap-4 cursor-pointer group py-2">
                                        <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="sr-only" />
                                        <div className={`h-6 w-6 rounded-lg border-2 shrink-0 flex items-center justify-center transition-all ${acceptedTerms ? 'bg-blue-600 border-blue-600' : 'border-zinc-200 bg-white group-hover:border-zinc-300'}`}>
                                            {acceptedTerms && <CheckCircle2 size={14} className="text-white" />}
                                        </div>
                                        <span className="text-[10px] md:text-[11px] font-bold text-zinc-400 leading-tight">He leído y acepto los <a href="https://digitalizatodo.cl/terminos/" target="_blank" className="underline hover:text-blue-600">Términos</a> y <a href="https://digitalizatodo.cl/privacidad/" target="_blank" className="underline hover:text-blue-600">Privacidad</a> de Digitaliza Todo</span>
                                    </label>
                                )}
                                <button type="submit" disabled={isLoading || (step === 2 && !acceptedTerms)} className="w-full h-16 md:h-22 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl md:rounded-[1.5rem] uppercase tracking-[0.2em] text-[11px] md:text-[12px] flex items-center justify-center gap-4 shadow-2xl shadow-blue-500/30 active:scale-[0.98] transition-all disabled:opacity-40">
                                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : (step === 1 ? 'Siguiente Paso' : 'Iniciar Ecosistema')}
                                </button>
                                {step === 2 && (
                                    <button type="button" onClick={() => setStep(1)} className="text-[10px] font-black uppercase tracking-widest text-zinc-400 py-2 hover:text-zinc-600 transition-colors">Volver a Negocio</button>
                                )}
                            </div>

                            <div className="pt-4 flex items-center justify-center gap-2 opacity-30 group cursor-default">
                                <ShieldCheck size={12} className="text-zinc-400 group-hover:text-blue-600 transition-colors" />
                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest group-hover:text-zinc-600">Su dirección IP es 152.173.213.244</span>
                            </div>
                        </form>
                    </div>
                    
                    <footer className="w-full pt-10 mt-auto">
                        <div className="flex flex-col items-center gap-6">
                            <div className="flex items-center gap-6 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                                <a href="https://digitalizatodo.cl/legal/" target="_blank" className="hover:text-blue-600 transition-colors">Legal</a>
                                <a href="https://digitalizatodo.cl/legal/" target="_blank" className="hover:text-blue-600 transition-colors">Términos</a>
                                <a href="https://digitalizatodo.cl/privacidad/" target="_blank" className="hover:text-blue-600 transition-colors">Privacidad</a>
                            </div>
                            
                            <div className="text-center space-y-1">
                                <p className="text-[8px] md:text-[9px] font-black text-zinc-300 uppercase tracking-[0.1em]">
                                    © 2026 SOLUCIONES EN INTELIGENCIA ARTIFICIAL SPA · 78109539-7
                                </p>
                                <p className="text-[7px] font-black text-zinc-200 uppercase tracking-[0.4em]">
                                    Digitaliza Todo ®
                                </p>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}
