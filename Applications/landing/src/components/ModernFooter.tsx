import React, { useEffect, useState } from 'react';
import { Linkedin, Mail } from 'lucide-react';

const ModernFooter = () => {
    const [uptime, setUptime] = useState<number | null>(null);
    const [status, setStatus] = useState<'up' | 'down' | 'loading'>('loading');
    const [dailyRatios, setDailyRatios] = useState<number[]>([]);

    useEffect(() => {
        const API_BASE = (import.meta as any).env?.PUBLIC_API_URL || 'https://admin.digitalizatodo.cl';
        fetch(`${API_BASE}/api/w/github-stats`)
            .then((r) => r.json())
            .then((data) => {
                const ratio = data?.uptime_percent ?? 100;
                setUptime(ratio);
                setStatus(ratio >= 99 ? 'up' : 'down');
                // Barras estáticas — todas verdes si uptime >= 99
                setDailyRatios(Array(48).fill(ratio >= 99 ? 100 : 0));
            })
            .catch(() => setStatus('down'));
    }, []);

    const dotColor = status === 'loading' ? 'bg-slate-500' : status === 'up' ? 'bg-emerald-400' : 'bg-red-500';
    const label = status === 'loading' ? 'Verificando...' : status === 'up' ? `Todos los sistemas operativos` : 'Servicio degradado';

    return (
        <footer id="footer" className="bg-slate-950 pt-20 pb-10 px-5 sm:px-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[120px] -z-0"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-brand-blue/5 rounded-full blur-[100px] -z-0"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid lg:grid-cols-12 gap-10 mb-14">

                    {/* Brand */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center shadow-2xl overflow-hidden p-2">
                                <img src="/DLogo-v2.webp" alt="Digitaliza Todo" className="h-full w-full object-contain" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">digitalizatodo.cl</span>
                                <h2 className="font-black text-base tracking-tighter text-white leading-none">Digitaliza Todo</h2>
                            </div>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed font-medium max-w-sm">
                            Laboratorio de ingeniería de software enfocado en transformar la complejidad técnica en <span className="text-white">ventaja competitiva</span> sostenible.
                        </p>
                        <p className="text-slate-600 text-[11px] leading-relaxed max-w-sm">
                            Digitaliza Todo es una marca y producto de <span className="text-slate-500 font-semibold">Soluciones en Inteligencia Artificial SpA</span>.
                        </p>
                        <div className="flex gap-3">
                            <a href="https://wa.me/56945392581" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-green-500/20 transition-all hover:-translate-y-1">
                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-green-400"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            </a>
                            <a href="https://t.me/+56922504275" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-blue-500/20 transition-all hover:-translate-y-1">
                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-blue-400"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                            </a>
                            <a href="https://www.linkedin.com/in/rhuiscaleo/" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-blue-700/20 transition-all hover:-translate-y-1">
                                <Linkedin className="w-5 h-5 text-blue-500" />
                            </a>
                            <a href="mailto:info@digitalizatodo.cl" className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-orange-500/20 transition-all hover:-translate-y-1">
                                <Mail className="w-5 h-5 text-orange-400" />
                            </a>
                        </div>
                    </div>

                    {/* Links */}
                    <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
                        <div className="space-y-5">
                            <h4 className="text-white font-black uppercase tracking-[0.2em] text-[10px]">Soluciones</h4>
                            <ul className="space-y-3">
                                {['Software Factory', 'E-commerce Pro', 'Automatización IA', 'SaaS Development'].map((item) => (
                                    <li key={item}>
                                        <a href="#" className="text-slate-400 hover:text-brand-orange transition-all flex items-center group text-sm">
                                            <span className="w-0 group-hover:w-2 h-0.5 bg-brand-orange mr-0 group-hover:mr-2 transition-all"></span>
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-5">
                            <h4 className="text-white font-black uppercase tracking-[0.2em] text-[10px]">Compañía</h4>
                            <ul className="space-y-3">
                                {['Nuestro Método', 'Casos de Éxito', 'Blog Tech', 'Contacto'].map((item) => (
                                    <li key={item}>
                                        <a href="#" className="text-slate-400 hover:text-brand-orange transition-all flex items-center group text-sm">
                                            <span className="w-0 group-hover:w-2 h-0.5 bg-brand-orange mr-0 group-hover:mr-2 transition-all"></span>
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-5 col-span-2 sm:col-span-1">
                            <h4 className="text-white font-black uppercase tracking-[0.2em] text-[10px]">Ubicación</h4>
                            <div className="space-y-3">
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest block mb-0.5">Representante</span>
                                    Arica, Chile
                                </p>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest block mb-0.5">Oficina</span>
                                    Sta. Magdalena 75, Of. 304<br />
                                    Providencia, Chile
                                </p>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                    <p className="text-white text-xs font-black tracking-widest uppercase">¿Listo para empezar?</p>
                                    <a href="mailto:info@digitalizatodo.cl" className="text-brand-orange text-xs font-bold hover:underline transition-all">
                                        info@digitalizatodo.cl
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="pt-8 border-t border-white/5 flex flex-col lg:flex-row lg:items-end gap-4">

                    {/* Izquierda: copyright + links */}
                    <div className="flex flex-col gap-2">
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
                            © 2026 SOLUCIONES EN INTELIGENCIA ARTIFICIAL SpA · 78109539-7
                        </p>
                        <div className="flex items-center gap-4 flex-wrap">
                            <a href="/legal" className="text-slate-600 hover:text-slate-400 text-[10px] font-black uppercase tracking-widest transition-colors">Legal</a>
                            <a href="/terminos" className="text-slate-600 hover:text-slate-400 text-[10px] font-black uppercase tracking-widest transition-colors">Términos</a>
                            <a href="/privacidad" className="text-slate-600 hover:text-slate-400 text-[10px] font-black uppercase tracking-widest transition-colors">Privacidad</a>
                        </div>
                    </div>

                    {/* Derecha: uptime bar */}
                    <div className="lg:ml-auto space-y-1.5 lg:min-w-[340px]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse`}></span>
                                <span className="text-white text-[9px] font-black uppercase tracking-widest">{label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {uptime !== null && (
                                    <span className="text-emerald-400 text-[9px] font-black">{uptime.toFixed(2)}%</span>
                                )}
                                <a href="https://stats.uptimerobot.com/aFB0Ubdoys/802579675" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors text-[9px] font-bold">
                                    Verificar
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
                                </a>
                            </div>
                        </div>
                        <div className="flex gap-[2px] w-full">
                            {(dailyRatios.length > 0 ? dailyRatios : Array(48).fill(null)).map((v, i) => (
                                <div
                                    key={i}
                                    className={`flex-1 h-4 lg:h-5 rounded-[2px] ${
                                        v === null ? 'bg-slate-800 animate-pulse' :
                                        v === 100 ? 'bg-emerald-500' : 'bg-red-500'
                                    }`}
                                />
                            ))}
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600 text-[9px] font-bold">48h atrás</span>
                            <span className="text-slate-600 text-[9px] font-bold">Ahora</span>
                        </div>
                    </div>

                </div>
            </div>
        </footer>
    );
};

export default ModernFooter;
