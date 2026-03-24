"use client";

import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Loader2, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        // Simulación de login Super Admin
        setTimeout(() => {
            if (email === "admin@digitalizatodo.cl" && password === "admin123") {
                localStorage.setItem('super_admin_token', 'mock_token_123');
                window.location.href = "/";
            } else {
                setError("Credenciales de Super Admin inválidas");
                setIsLoading(false);
            }
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-[400px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                <header className="text-center space-y-4">
                    <div className="flex justify-center mb-2">
                        <div className="h-16 w-16 rounded-3xl bg-zinc-950 flex items-center justify-center shadow-2xl rotate-3">
                            <ShieldCheck size={32} className="text-white" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-zinc-900 leading-none">
                            Central <br />
                            <span className="text-indigo-600">Super Admin</span>
                        </h1>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-3 italic">
                            Acceso restringido al Núcleo SaaS
                        </p>
                    </div>
                </header>

                <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-xl shadow-zinc-200/50 space-y-6 relative overflow-hidden">
                    {error && (
                        <div className="bg-rose-50 text-rose-600 text-[10px] font-black uppercase p-4 rounded-2xl border border-rose-100 animate-in shake-in duration-300">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Email Maestro</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="admin@digitalizatodo.cl"
                                        className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-6 pl-12 font-bold text-sm text-zinc-900 focus:bg-white focus:ring-4 ring-zinc-50 outline-none transition-all"
                                    />
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Clave de Acceso</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full h-14 bg-zinc-50 border-none rounded-2xl px-6 pl-12 font-bold text-sm text-zinc-900 focus:bg-white focus:ring-4 ring-zinc-50 outline-none transition-all"
                                    />
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-16 bg-zinc-950 hover:bg-zinc-800 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-all group disabled:opacity-40"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={18} /> : (
                                <>
                                    Entrar al Dashboard <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <footer className="text-center">
                    <p className="text-[8px] font-black text-zinc-300 uppercase tracking-[0.4em]">
                        Digitaliza Todo Engine &copy; 2026 &mdash; The Software Factory
                    </p>
                </footer>
            </div>
        </div>
    );
}
