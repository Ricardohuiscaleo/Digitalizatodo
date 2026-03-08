"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { useBranding } from "@/context/BrandingContext";
import { identifyTenant, login } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
    const { branding, setBranding } = useBranding();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isIdentifying, setIsIdentifying] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleEmailBlur = async () => {
        if (!email || !email.includes("@")) return;
        setIsIdentifying(true);
        const data = await identifyTenant(email);
        setIsIdentifying(false);
        if (data && data.found && data.tenants.length > 0) {
            const tenant = data.tenants[0];
            setBranding({ id: tenant.id, name: tenant.name, industry: tenant.industry, logo: tenant.logo, primaryColor: tenant.primary_color });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!branding) await handleEmailBlur();
        if (!branding) { setError("Email no reconocido"); return; }
        setIsLoggingIn(true); setError(null);
        try {
            const result = await login(branding.id, { email, password });
            if (result.token) {
                localStorage.setItem(result.user_type === 'staff' ? "staff_token" : "auth_token", result.token);
                localStorage.setItem("tenant_id", branding.id);
                window.location.href = result.user_type === 'staff' ? "/dashboard" : "/dashboard/student";
            } else throw new Error("Credenciales inválidas");
        } catch (err: any) { setError(err.message); } finally { setIsLoggingIn(false); }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-zinc-950 font-sans">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[380px] space-y-8">
                <div className="text-center space-y-4">
                    <div className="h-16 w-16 bg-black rounded-2xl mx-auto flex items-center justify-center shadow-xl">
                        {branding?.logo ? <img src={branding.logo} className="h-8 w-8 invert object-contain" /> : <LogIn className="text-white" size={32} />}
                    </div>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter">{branding?.name || 'Digitaliza Todo'}</h1>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Acceso Profesional</p>
                    </div>
                </div>

                <Card className="bg-white border border-zinc-200 rounded-[2rem] p-8 shadow-sm space-y-6">
                    {error && <div className="bg-rose-50 text-rose-600 text-[10px] font-black uppercase p-3 rounded-xl border border-rose-100 flex items-center gap-2"><AlertCircle size={14} /> {error}</div>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-2">Email</label>
                            <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} onBlur={handleEmailBlur} className="h-12 bg-white border-zinc-200 rounded-xl px-4 font-bold text-zinc-950 focus:ring-black" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-2">Contraseña</label>
                            <Input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="h-12 bg-white border-zinc-200 rounded-xl px-4 font-bold text-zinc-950 focus:ring-black" />
                        </div>
                        <Button type="submit" disabled={isLoggingIn} className="w-full h-14 bg-black hover:bg-zinc-800 text-white font-black rounded-xl uppercase tracking-widest text-xs mt-4">
                            {isLoggingIn ? <Loader2 className="animate-spin" /> : <span className="flex items-center gap-2">Entrar <ArrowRight size={16} /></span>}
                        </Button>
                    </form>
                </Card>

                <p className="text-center"><a href="/register" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-black">Registrar Academia</a></p>
            </motion.div>
        </div>
    );
}
