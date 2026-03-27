"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, ArrowRight, Loader2, Sparkles, Building2, Globe, ShieldCheck, AlertTriangle } from "lucide-react";
import { registerTenant, getIndustries } from "@/lib/api";
import Grainient from "@/components/ui/Grainient/Grainient";

const RealTimeBadgeLogo = ({ formData, step }: { formData: any, step: number }) => {
    const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const step1Count = [formData.tenant_name.length >= 3, formData.industry !== ""].filter(Boolean).length;
    const step2Count = [formData.user_name.length >= 3, isEmailValid(formData.email), formData.password.length >= 6].filter(Boolean).length;
    
    let currentCount = 0;
    if (step === 1) currentCount = step1Count;
    else if (step === 2) currentCount = 2 + step2Count;
    else if (step === 3) currentCount = 2 + 3 + (formData.saas_plan_id ? 1 : 0);

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
    const [step, setStep] = useState(1); // 1: Negocio, 2: Admin, 3: Plan
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
    const [saasPlans, setSaasPlans] = useState<any[]>([]);
    const [isLoadingPlans, setIsLoadingPlans] = useState(true);

    const [formData, setFormData] = useState({
        tenant_name: "",
        tenant_slug: "",
        industry: "",
        user_name: "",
        email: "",
        password: "",
        password_confirmation: "",
        saas_plan_id: "",
        billing_interval: "monthly"
    });

    useEffect(() => {
        async function loadInitialData() {
            try {
                const [indData, planData] = await Promise.all([
                    getIndustries(),
                    import('@/lib/api').then(m => m.getSaasPlans())
                ]);
                setIndustries(indData);
                if (planData && planData.length > 0) {
                    setSaasPlans(planData);
                    // Auto-select the 'free' plan if available
                    const freePlan = planData.find((p: any) => p.slug === 'free' || p.price_monthly === '0.00');
                    if (freePlan) {
                        setFormData(prev => ({ ...prev, saas_plan_id: String(freePlan.id) }));
                    }
                } else {
                    // If plans fail to load, use plan id=1 (free) as fallback
                    setFormData(prev => ({ ...prev, saas_plan_id: '1' }));
                }
            } catch (err) {
                console.error("Error loading data:", err);
                // Fallback to free plan on error
                setFormData(prev => ({ ...prev, saas_plan_id: '1' }));
            } finally {
                setIsLoadingIndustries(false);
                setIsLoadingPlans(false);
            }
        }
        loadInitialData();
    }, []);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'tenant_name') {
                newData.tenant_slug = value.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-').replace(/^-+|-+$/g, '');
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
        if (name.includes('marcial') || name.includes('dojo') || name.includes('karate') || name.includes('boxeo')) return { target: "Alumnos y Apoderados", entity: "Dojo / Academia", icon: "🥋" };
        if (name.includes('gym') || name.includes('fitness') || name.includes('entrenamiento')) return { target: "Socios y Miembros", entity: "Gimnasio / Box", icon: "🏋️‍♂️" };
        if (name.includes('colegio') || name.includes('escuela') || name.includes('educa')) return { target: "Padres y Alumnos", entity: "Institución / Colegio", icon: "📚" };
        return { target: "Clientes y Usuarios", entity: "Negocio / Empresa", icon: "🚀" };
    };

    const labels = getDynamicLabels(formData.industry);

    const handleSubmit = async (e: any) => {
        if (e && e.preventDefault) e.preventDefault();
        
        if (step === 1) {
            setStep(2);
            return;
        }

        if (step === 2) {
            if (formData.password !== formData.password_confirmation) {
                setError("Las contraseñas no coinciden");
                return;
            }
            setStep(3);
            return;
        }

        if (step === 3) {
            if (!formData.saas_plan_id) {
                // Fallback to free plan if nothing selected
                setFormData(prev => ({ ...prev, saas_plan_id: '1' }));
            }
            
            setIsLoading(true);
            setError(null);
            
            try {
                const data = await registerTenant({
                    ...formData,
                    billing_interval: billingInterval,
                    accepted_terms_at: new Date().toISOString()
                    // No token here as it is a free demo onboarding
                }) as any;

                if (!data || data.status === 'error' || data.error) {
                    throw new Error(data?.message || data?.error || "Error al solicitar demo");
                }
                
                setSuccess(true);
            } catch (err: any) {
                setError(err.message || "Ocurrió un error inesperado al procesar tu solicitud");
            } finally {
                setIsLoading(false);
            }
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex flex-col md:flex-row bg-white overflow-hidden text-zinc-950 font-sans">
                <div className="w-full md:w-1/2 relative flex items-center justify-center p-8 md:p-24 overflow-hidden border-b md:border-b-0 md:border-r border-zinc-100">
                    <div className="absolute inset-0 z-0 text-white">
                        <Grainient color1="#4ade80" color2="#fb923c" color3="#3b82f6" timeSpeed={0.15} contrast={2.0} gamma={1.2} saturation={1.5} zoom={0.9} />
                    </div>
                    <div className="relative z-10 flex flex-col items-center">
                        <RealTimeBadgeLogo formData={formData} step={step} />
                        <div className="mt-4 px-4 py-1.5 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full flex items-center gap-2">
                             <div className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse" />
                             <span className="text-[9px] font-black uppercase text-white tracking-[0.2em]">Registro Exitoso</span>
                        </div>
                    </div>
                </div>
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
            <div className="w-full md:w-[60%] relative flex items-center justify-center p-5 md:p-12 lg:p-24 overflow-hidden border-b md:border-b-0 md:border-r border-zinc-100">
                <div className="absolute inset-0 z-0 animate-in fade-in duration-[20000ms] ease-out text-white">
                    <Grainient color1="#4ade80" color2="#fb923c" color3="#3b82f6" timeSpeed={0.3} contrast={2.0} gamma={1.2} saturation={1.5} zoom={0.9} />
                </div>
                <div className="relative z-10 max-w-[500px] w-full h-full flex flex-col justify-between py-8 md:py-20 lg:py-24 space-y-8 md:space-y-0">
                    <header className="text-center md:text-left hidden md:flex flex-col items-center md:items-start gap-4 md:gap-6">
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <RealTimeBadgeLogo formData={formData} step={step} />
                            <div className="flex flex-col items-center md:items-start">
                                <span className="text-lg md:text-xl font-black tracking-tighter italic uppercase text-zinc-800 leading-none">DigitalizaApp</span>
                                <div className="h-0.5 w-8 bg-blue-600 rounded-full mt-1 hidden md:block" />
                            </div>
                        </div>
                        <div className="space-y-3 md:space-y-5">
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-[0.8] italic animate-in slide-in-from-left-8 duration-700 text-zinc-800">
                                Tu propia <br/> <span className="text-blue-600">plataforma <br className="hidden md:block"/> digital</span>
                            </h1>
                            <p className="hidden md:block text-[10px] md:text-[11px] font-black text-zinc-600 leading-relaxed uppercase tracking-[0.4em] max-w-xs text-balance">
                                Digitaliza tu negocio con el motor más potente del mercado.
                            </p>
                        </div>
                    </header>
                    <footer className="hidden md:flex flex-col gap-6">
                        <div className="flex items-center gap-4 group">
                             <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg group-hover:bg-white group-hover:scale-110 transition-all duration-500">
                                <Building2 size={20} className="text-blue-600 group-hover:scale-110 transition-transform" />
                             </div>
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Plataforma</p>
                                <p className="text-xs font-bold text-zinc-800">App Usuarios</p>
                             </div>
                        </div>
                        <div className="flex items-center gap-4 group">
                             <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg group-hover:bg-white group-hover:scale-110 transition-all duration-500">
                                <div className="p-1.5"><Globe size={18} className="text-amber-600 group-hover:scale-110 transition-transform" /></div>
                             </div>
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Gestión</p>
                                <p className="text-xs font-bold text-zinc-800">App Operativa</p>
                             </div>
                        </div>
                        <div className="flex items-center gap-4 group">
                             <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg group-hover:bg-white group-hover:scale-110 transition-all duration-500">
                                <ShieldCheck size={18} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                             </div>
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Control</p>
                                <p className="text-xs font-bold text-zinc-800">Panel Adm.</p>
                             </div>
                        </div>
                    </footer>
                    {/* Badge for Mobile explicitly */}
                    <div className="md:hidden flex flex-col items-center animate-in zoom-in duration-500">
                         <RealTimeBadgeLogo formData={formData} step={step} />
                    </div>
                </div>
            </div>

            <div className="w-full md:w-[40%] flex flex-col h-full bg-white relative z-10 overflow-y-auto">
                <div className="flex-1 flex flex-col justify-center p-6 md:p-10 lg:p-16 py-12 md:py-20">
                    <div className="max-w-sm w-full mx-auto space-y-10">
                        <div className="space-y-2">
                             <div className="flex items-center gap-2">
                                <span className={`h-1 w-6 bg-blue-600 rounded-full`} />
                                <span className={`h-1 w-3 rounded-full transition-all ${step >= 2 ? 'bg-blue-600 w-6' : 'bg-zinc-100'}`} />
                                <span className={`h-1 w-3 rounded-full transition-all ${step >= 3 ? 'bg-blue-600 w-6' : 'bg-zinc-100'}`} />
                             </div>
                             <h2 className="text-2xl font-black italic uppercase tracking-tighter text-zinc-900">
                                {step === 1 ? 'Tu Negocio' : step === 2 ? 'Administrador' : 'Activa tu Demo'}
                             </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {error && (
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center gap-3 text-rose-600">
                                        <AlertTriangle size={18} />
                                        <p className="text-[11px] font-black uppercase tracking-widest italic">{error}</p>
                                    </div>
                                </div>
                            )}

                            {step === 1 && (
                                <div className="space-y-5 md:space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Nombre Comercial</label>
                                        <input name="tenant_name" required value={formData.tenant_name} onChange={handleChange} placeholder="Ej: Dojo Arica" className="w-full h-14 md:h-18 bg-zinc-50 border-2 border-transparent rounded-[1.5rem] px-8 font-bold text-base text-zinc-900 focus:bg-white focus:border-blue-600/20 focus:ring-4 ring-blue-50 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Categoría</label>
                                        <select name="industry" required value={formData.industry} onChange={handleChange} className="w-full h-14 md:h-18 bg-zinc-50 border-2 border-transparent rounded-[1.5rem] px-8 font-bold text-base text-zinc-900 focus:bg-white focus:border-blue-600/20 focus:ring-4 ring-blue-50 outline-none transition-all appearance-none">
                                            <option value="">Selecciona...</option>
                                            {industries.map(ind => <option key={ind.id} value={ind.id}>{ind.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

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
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Clave de Acceso</label>
                                            <input 
                                                name="password" 
                                                type="password" 
                                                required 
                                                value={formData.password} 
                                                onChange={handleChange} 
                                                placeholder="Mínimo 6 caracteres"
                                                className="w-full h-14 md:h-18 bg-zinc-50 border-2 border-transparent rounded-[1.5rem] px-8 font-bold text-base text-zinc-900 focus:bg-white focus:border-blue-600/20 focus:ring-4 ring-blue-50 outline-none transition-all" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Repetir Clave</label>
                                            <div className="relative">
                                                <input 
                                                    name="password_confirmation" 
                                                    type="password" 
                                                    required 
                                                    value={formData.password_confirmation} 
                                                    onChange={handleChange} 
                                                    placeholder="Confirma tu clave"
                                                    className={`w-full h-14 md:h-18 bg-zinc-50 border-2 border-transparent rounded-[1.5rem] px-8 font-bold text-base text-zinc-900 focus:bg-white focus:ring-4 ring-blue-50 outline-none transition-all ${formData.password_confirmation && formData.password === formData.password_confirmation ? 'border-emerald-500/20' : ''}`} 
                                                />
                                                {formData.password_confirmation && formData.password === formData.password_confirmation && (
                                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-500 animate-in zoom-in duration-300">
                                                        <CheckCircle2 size={20} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center justify-between bg-zinc-50 p-1.5 rounded-2xl border border-zinc-100">
                                        <button type="button" onClick={() => setBillingInterval('monthly')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${billingInterval === 'monthly' ? 'bg-white shadow-sm text-blue-600' : 'text-zinc-400'}`}>Estimado Mensual</button>
                                        <button type="button" onClick={() => setBillingInterval('yearly')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${billingInterval === 'yearly' ? 'bg-white shadow-sm text-emerald-600' : 'text-zinc-400'}`}>Estimado Anual</button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        {saasPlans.map((plan) => (
                                            <div 
                                                key={plan.id}
                                                onClick={() => setFormData({...formData, saas_plan_id: plan.id.toString()})}
                                                className={`cursor-pointer p-6 rounded-[2rem] border-2 transition-all relative overflow-hidden ${formData.saas_plan_id === plan.id.toString() ? 'border-blue-600 bg-blue-50/20 shadow-lg shadow-blue-500/5' : 'border-zinc-100 hover:border-zinc-200'}`}
                                            >
                                                <div className="flex items-center justify-between relative z-10">
                                                    <div>
                                                        <h4 className="text-sm font-black uppercase italic text-zinc-900">{plan.name}</h4>
                                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Digitaliza Core</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xl font-black tracking-tighter text-zinc-900 leading-none">
                                                            ${(billingInterval === 'monthly' ? parseInt(plan.price_monthly) : parseInt(plan.price_yearly)).toLocaleString()}
                                                        </p>
                                                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Valor Referencial</p>
                                                    </div>
                                                </div>
                                                {billingInterval === 'yearly' && (() => {
                                                    const savings = parseInt(plan.price_monthly) * 12 - parseInt(plan.price_yearly);
                                                    return savings > 0 ? (
                                                        <div className="mt-3 relative z-10">
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest">
                                                                🎉 Ahorras ${savings.toLocaleString()} al año
                                                            </span>
                                                        </div>
                                                    ) : null;
                                                })()}
                                                {formData.saas_plan_id === plan.id.toString() && (
                                                    <div className="absolute top-2 right-2">
                                                        <CheckCircle2 size={18} className="text-blue-600 fill-white" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 bg-zinc-900 rounded-[1.5rem] flex items-center gap-4 text-white">
                                         <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                                            <ShieldCheck size={20} className="text-green-400" />
                                         </div>
                                         <p className="text-[10px] font-black uppercase tracking-widest italic">Demo Gratis por 7 días</p>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex flex-col gap-4">
                                {step === 2 && (
                                    <div className="flex items-start gap-4 cursor-pointer group py-2">
                                        <input type="checkbox" id="terms" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="h-6 w-6 mt-0.5 rounded-xl bg-zinc-50 border-2 border-zinc-200 text-blue-600 focus:ring-blue-500/20 transition-all cursor-pointer" />
                                        <label htmlFor="terms" className="text-[11px] font-bold text-zinc-500 leading-tight select-none cursor-pointer">
                                            He leído y acepto los <a href="https://digitalizatodo.cl/terminos/" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-black transition-colors">términos</a> y <a href="https://digitalizatodo.cl/privacidad/" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-black transition-colors">privacidad</a> de digitalizatodo.cl y autorizo la creación de mi demo.
                                        </label>
                                    </div>
                                )}
                                
                                <button type="submit" disabled={isLoading || (step === 2 && !acceptedTerms) || (step === 3 && !formData.saas_plan_id)} className="w-full h-18 md:h-22 bg-blue-600 hover:bg-black text-white font-black rounded-[1.5rem] md:rounded-[2rem] uppercase tracking-[0.3em] text-[11px] md:text-[12px] flex items-center justify-center gap-4 shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-40">
                                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : (step === 1 ? 'Continuar' : (step === 2 ? 'Explorar Planes' : 'Activar mi Demo Gratis'))}
                                    {step < 3 && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                                </button>

                                {step > 1 && (
                                    <button type="button" onClick={() => setStep(step - 1)} className="text-[10px] font-black uppercase tracking-widest text-zinc-400 py-2 hover:text-zinc-600 transition-colors text-center">Volver al paso anterior</button>
                                )}
                            </div>
                        </form>
                        
                        <div className="pt-10 flex flex-col gap-2 items-center text-center opacity-30">
                             <p suppressHydrationWarning className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-900 leading-tight">
                                IP: 190.161.x.x · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · SSL SECURE <br/>
                                © 2026 SOLUCIONES EN INTELIGENCIA ARTIFICIAL SPA <br/>
                                78109539-7 · CHILE
                             </p>
                             <div className="flex gap-4">
                                <a href="https://digitalizatodo.cl/legal/" target="_blank" rel="noopener noreferrer" className="text-[7px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 border-b border-zinc-200">Legal</a>
                                <a href="https://digitalizatodo.cl/terminos/" target="_blank" rel="noopener noreferrer" className="text-[7px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 border-b border-zinc-200">Términos</a>
                                <a href="https://digitalizatodo.cl/privacidad/" target="_blank" rel="noopener noreferrer" className="text-[7px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 border-b border-zinc-200">Privacidad</a>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx global>{`
                input::placeholder { color: #a1a1aa; font-weight: 500; font-style: italic; opacity: 0.5; }
                select option { font-weight: bold; background: white; color: black; }
            `}</style>
        </div>
    );
}
