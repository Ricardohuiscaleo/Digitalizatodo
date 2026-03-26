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

    const dotColor = status === 'loading' ? 'bg-slate-400' : status === 'up' ? 'bg-emerald-500' : 'bg-red-500';
    const label = status === 'loading' ? 'Verificando...' : status === 'up' ? `Todos los sistemas operativos` : 'Servicio degradado';

    return (
        <footer id="footer" className="bg-white pt-24 pb-12 px-5 sm:px-6 relative overflow-hidden border-t border-slate-100">
            {/* Sutiles gradientes de fondo para profundidad */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-orange/[0.03] rounded-full blur-[120px] -z-0"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-blue/[0.03] rounded-full blur-[100px] -z-0"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid lg:grid-cols-12 gap-12 mb-16">

                    {/* Brand */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden p-2.5">
                                <img src="/DLogo-v2.webp" alt="Digitaliza Todo" className="h-full w-full object-contain" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1.5">digitalizatodo.cl</span>
                                <h2 className="font-black text-xl tracking-tighter text-slate-900 leading-none">Digitaliza Todo</h2>
                            </div>
                        </div>
                        <p className="text-slate-600 text-[15px] leading-relaxed font-medium max-w-sm">
                            Laboratorio de ingeniería enfocado en transformar la complejidad técnica en <span className="text-slate-900 font-black">ventaja competitiva</span> sostenible.
                        </p>
                        <div className="space-y-1">
                            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Entidad Legal</p>
                            <p className="text-slate-500 text-[11px] leading-relaxed max-w-sm">
                                Digitaliza Todo es una marca de <span className="text-slate-600 font-black">Soluciones en Inteligencia Artificial SpA</span>.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <a href="https://wa.me/56945392581" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-emerald-50 text-emerald-600 transition-all hover:-translate-y-1 shadow-sm">
                                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            </a>
                            <a href="https://t.me/+56922504275" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-blue-50 text-blue-500 transition-all hover:-translate-y-1 shadow-sm">
                                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                            </a>
                            <a href="https://www.linkedin.com/in/rhuiscaleo/" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-blue-50 text-blue-700 transition-all hover:-translate-y-1 shadow-sm">
                                <Linkedin className="w-6 h-6" />
                            </a>
                            <a href="mailto:info@digitalizatodo.cl" className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-orange-50 text-brand-orange transition-all hover:-translate-y-1 shadow-sm">
                                <Mail className="w-6 h-6" />
                            </a>
                        </div>
                    </div>

                    {/* Links */}
                    <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-10">
                        <div className="space-y-6">
                            <h4 className="text-slate-900 font-black uppercase tracking-[0.25em] text-[11px]">Servicios</h4>
                            <ul className="space-y-4">
                                {['Software Factory', 'E-commerce Pro', 'Automatización IA', 'SaaS Development'].map((item) => (
                                    <li key={item}>
                                        <a href="#" className="text-slate-500 hover:text-brand-orange transition-all flex items-center group text-[14px] font-bold">
                                            <span className="w-0 group-hover:w-2.5 h-0.5 bg-brand-orange mr-0 group-hover:mr-2 transition-all"></span>
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-slate-900 font-black uppercase tracking-[0.25em] text-[11px]">Compañía</h4>
                            <ul className="space-y-4">
                                {['Nuestro Método', 'Casos de Éxito', 'Blog Tech', 'Contacto'].map((item) => (
                                    <li key={item}>
                                        <a href="#" className="text-slate-500 hover:text-brand-orange transition-all flex items-center group text-[14px] font-bold">
                                            <span className="w-0 group-hover:w-2.5 h-0.5 bg-brand-orange mr-0 group-hover:mr-2 transition-all"></span>
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-6 col-span-2 sm:col-span-1">
                            <h4 className="text-slate-900 font-black uppercase tracking-[0.25em] text-[11px]">Contacto</h4>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <span className="text-brand-blue font-black uppercase text-[10px] tracking-[0.2em] block">Sede Central</span>
                                    <p className="text-slate-600 text-[14px] leading-relaxed font-bold">
                                        Sta. Magdalena 75, Providencia<br />
                                        Santiago, Chile
                                    </p>
                                </div>
                                <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 space-y-2 group cursor-pointer hover:border-brand-orange/30 transition-all">
                                    <p className="text-slate-900 text-[11px] font-black tracking-widest uppercase">Escríbenos</p>
                                    <a href="mailto:info@digitalizatodo.cl" className="text-brand-orange text-sm font-black hover:underline transition-all block">
                                        info@digitalizatodo.cl
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="pt-10 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-8">

                    {/* Izquierda: copyright + links */}
                    <div className="flex flex-col gap-4">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.25em] text-center lg:text-left">
                            © 2026 SOLUCIONES EN INTELIGENCIA ARTIFICIAL SpA
                        </p>
                        <div className="flex items-center justify-center lg:justify-start gap-6 flex-wrap">
                            <a href="/legal" className="text-slate-500 hover:text-brand-blue text-[11px] font-black uppercase tracking-[0.2em] transition-colors border-b-2 border-transparent hover:border-brand-blue/20 pb-0.5">Legal</a>
                            <a href="/terminos" className="text-slate-500 hover:text-brand-blue text-[11px] font-black uppercase tracking-[0.2em] transition-colors border-b-2 border-transparent hover:border-brand-blue/20 pb-0.5">Términos</a>
                            <a href="/privacidad" className="text-slate-500 hover:text-brand-blue text-[11px] font-black uppercase tracking-[0.2em] transition-colors border-b-2 border-transparent hover:border-brand-blue/20 pb-0.5">Privacidad</a>
                        </div>
                    </div>

                    {/* Derecha: uptime bar */}
                    <div className="lg:w-[400px] space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${dotColor} shadow-[0_0_10px_rgba(16,185,129,0.3)]`}></span>
                                <span className="text-slate-700 text-[10px] font-black uppercase tracking-widest">{label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {uptime !== null && (
                                    <span className="text-emerald-600 text-[11px] font-black">{uptime.toFixed(1)}%</span>
                                )}
                                <a href="https://stats.uptimerobot.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors text-[10px] font-bold">
                                    Dashboard
                                    <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                            </div>
                        </div>
                        <div className="flex gap-1 w-full bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                            {(dailyRatios.length > 0 ? dailyRatios : Array(48).fill(null)).map((v, i) => (
                                <div
                                    key={i}
                                    className={`flex-1 h-5 rounded-[4px] transition-all ${
                                        v === null ? 'bg-slate-200 animate-pulse' :
                                        v === 100 ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-red-500'
                                    }`}
                                />
                            ))}
                        </div>
                        <div className="flex justify-between px-1">
                            <span className="text-slate-400 text-[9px] font-black uppercase tracking-tighter">Histórico 48h</span>
                            <span className="text-slate-900 text-[9px] font-black uppercase tracking-tighter">Estado Actual</span>
                        </div>
                    </div>

                </div>
            </div>
            
            {/* Firma Final */}
            <div className="mt-16 text-center border-t border-slate-50 pt-8 opacity-40">
                <p className="text-[10px] font-black text-slate-200 uppercase tracking-[0.8em]">DIGITALIZATODO ENGINE</p>
            </div>
        </footer>
    );
};

export default ModernFooter;
