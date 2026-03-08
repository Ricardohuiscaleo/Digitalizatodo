"use client";

import React, { useState } from "react";
import { Building2, User, Mail, Lock, Globe, Loader2, AlertCircle, CheckCircle2, ArrowRight, Briefcase } from "lucide-react";
import { registerTenant } from "@/lib/api";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function OnboardingPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({ tenant_name: "", tenant_slug: "", industry: "", user_name: "", email: "", password: "", password_confirmation: "" });

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'tenant_slug' ? value.toLowerCase().replace(/[^a-z0-9-]/g, '') : value }));
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault(); setIsLoading(true); setError(null);
        if (formData.password !== formData.password_confirmation) { setError("Contraseñas no coinciden"); setIsLoading(false); return; }
        try {
            const data = await registerTenant(formData);
            if (data.errors) throw new Error(Object.values(data.errors)[0][0] as string);
            setSuccess(true);
        } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
    };

    if (success) return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 text-zinc-950">
            <div className="text-center space-y-6 max-w-sm">
                <div className="h-20 w-20 bg-emerald-500 text-white rounded-3xl mx-auto flex items-center justify-center shadow-xl"><CheckCircle2 size={40} /></div>
                <h1 className="text-3xl font-black uppercase tracking-tighter">¡Listo!</h1>
                <p className="text-sm font-bold text-zinc-500 uppercase">Tu academia <span className="text-black">{formData.tenant_name}</span> ha sido creada.</p>
                <Button onClick={() => window.location.href = `/${formData.tenant_slug}`} className="w-full h-14 bg-black text-white font-black rounded-xl uppercase tracking-widest text-xs">Entrar ahora <ArrowRight className="ml-2" size={16} /></Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-zinc-950 font-sans">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Nueva Academia</h1>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Empieza a gestionar hoy</p>
                </div>

                <Card className="bg-white border border-zinc-200 rounded-[2rem] p-8 shadow-sm space-y-6">
                    {error && <div className="bg-rose-50 text-rose-600 text-[10px] font-black uppercase p-3 rounded-xl border border-rose-100 flex items-center gap-2"><AlertCircle size={14} /> {error}</div>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2"><label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Institución</label><Input name="tenant_name" required value={formData.tenant_name} onChange={handleChange} className="h-12 bg-white border-zinc-200 rounded-xl px-4 font-bold text-zinc-950" /></div>
                        <div className="space-y-2"><label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Slug (URL)</label><Input name="tenant_slug" required value={formData.tenant_slug} onChange={handleChange} className="h-12 bg-white border-zinc-200 rounded-xl px-4 font-black text-zinc-950" /></div>
                        <div className="space-y-2"><label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Especialización</label><select name="industry" required value={formData.industry} onChange={handleChange} className="w-full h-12 bg-white border border-zinc-200 rounded-xl px-4 font-bold text-xs uppercase text-zinc-950 outline-none"><option value="">Seleccionar</option><option value="academy">Artes Marciales</option><option value="clinic">Salud / Estética</option><option value="other">Otros</option></select></div>
                        <div className="space-y-2"><label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Director</label><Input name="user_name" required value={formData.user_name} onChange={handleChange} className="h-12 bg-white border-zinc-200 rounded-xl px-4 font-bold text-zinc-950" /></div>
                        <div className="space-y-2"><label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Email</label><Input name="email" type="email" required value={formData.email} onChange={handleChange} className="h-12 bg-white border-zinc-200 rounded-xl px-4 font-bold text-zinc-950" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Clave</label><Input name="password" type="password" required value={formData.password} onChange={handleChange} className="h-12 bg-white border-zinc-200 rounded-xl px-4 font-bold text-zinc-950" /></div>
                            <div className="space-y-2"><label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Repetir</label><Input name="password_confirmation" type="password" required value={formData.password_confirmation} onChange={handleChange} className="h-12 bg-white border-zinc-200 rounded-xl px-4 font-bold text-zinc-950" /></div>
                        </div>
                        <Button type="submit" disabled={isLoading} className="w-full h-14 bg-black hover:bg-zinc-800 text-white font-black rounded-xl uppercase tracking-widest text-xs mt-4">{isLoading ? <Loader2 className="animate-spin" /> : <span className="flex items-center gap-2">Crear Pro <ArrowRight size={16} /></span>}</Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
