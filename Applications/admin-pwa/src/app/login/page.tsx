"use client";

import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Loader2, Lock, Mail, Terminal } from 'lucide-react';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        setTimeout(() => {
            if (email === "info@digitalizatodo.cl" && password === "admin8447") {
                localStorage.setItem('super_admin_token', 'mock_token_123');

                window.location.href = "/";
            } else {
                setError("ACCESO DENEGADO: CREDENCIALES INVÁLIDAS");
                setIsLoading(false);
            }
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans relative overflow-hidden selection:bg-cyan-500/30">
            {/* Animated Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/20 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('/noise.svg')] opacity-20 brightness-150 contrast-150" />

            </div>

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            <div className="w-full max-w-[440px] space-y-8 relative z-10">
                
                <header className="text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-cyan-500/20 rounded-full blur-xl group-hover:bg-cyan-500/40 transition-all duration-500" />
                            <div className="relative h-20 w-20 rounded-[2rem] bg-zinc-900 border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl">
                                <ShieldCheck size={40} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500/80">Núcleo Central v2.0</span>
                        </div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-white leading-none">
                            Super <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Admin</span>
                        </h1>
                        <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest max-w-[280px] mx-auto leading-relaxed">
                            Acceso de nivel 0 a la infraestructura de Digitaliza Todo
                        </p>
                    </div>
                </header>

                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-b from-white/10 to-transparent rounded-[2.5rem] blur-sm opacity-50" />
                    <div className="relative bg-zinc-900/80 border border-white/10 backdrop-blur-2xl rounded-[2.5rem] p-10 shadow-3xl space-y-8">
                        
                        {error && (
                            <div className="bg-red-500/10 text-red-400 text-[10px] font-bold uppercase p-4 rounded-2xl border border-red-500/20 text-center flex items-center justify-center gap-2 animate-in zoom-in-95 duration-200">
                                <Terminal size={14} /> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Protocolo Email</label>
                                    <div className="relative group/input">
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="info@digitalizatodo.cl"

                                            className="w-full h-16 bg-white/5 border border-white/5 rounded-2xl px-6 pl-14 font-bold text-sm text-white placeholder:text-zinc-600 focus:bg-white/10 focus:border-cyan-500/50 outline-none transition-all duration-300"
                                        />
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/input:text-cyan-400 transition-colors" size={20} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Clave de Encriptación</label>
                                    <div className="relative group/input">
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full h-16 bg-white/5 border border-white/5 rounded-2xl px-6 pl-14 font-bold text-sm text-white placeholder:text-zinc-600 focus:bg-white/10 focus:border-cyan-500/50 outline-none transition-all duration-300"
                                        />
                                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/input:text-cyan-400 transition-colors" size={20} />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-18 bg-white text-black font-black rounded-2xl uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group disabled:opacity-40"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>AUTENTICANDO...</span>
                                    </div>
                                ) : (
                                    <>
                                        INICIAR CONEXIÓN <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                <footer className="text-center space-y-4">
                    <div className="flex justify-center gap-6 opacity-30">
                        <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-white" />
                        <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-white" />
                    </div>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.5em] leading-relaxed">
                        Digitaliza Todo Engine &copy; 2026 <br />
                        <span className="text-zinc-600">Secure Industrial Connection &mdash; The Software Factory</span>
                    </p>
                </footer>
            </div>

            {/* Subtle Vignette */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
        </div>
    );
}
