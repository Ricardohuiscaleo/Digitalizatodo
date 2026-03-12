import React, { useState, useEffect } from 'react';
import SectionBadge from './common/SectionBadge';
import { ArrowRight } from 'lucide-react';

const CodeIllustration = () => {
    const [blink, setBlink] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => setBlink(b => !b), 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full max-w-2xl mx-auto lg:mx-0 perspective-1000">
            {/* Background Glow/Aura */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/40 via-brand-blue/30 to-brand-green/20 blur-3xl transform rotate-6 scale-125 rounded-3xl animate-pulse"></div>
            
            {/* Main Window */}
            <div className="relative bg-[#ffffff] rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden transform -rotate-3 transition-all duration-700 hover:rotate-0 hover:scale-[1.02] hover:-translate-y-4 group">
                {/* Window Header */}
                <div className="bg-slate-50/80 backdrop-blur-sm px-4 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex gap-2">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#FF5F57] shadow-inner"></div>
                        <div className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E] shadow-inner"></div>
                        <div className="w-3.5 h-3.5 rounded-full bg-[#28C840] shadow-inner"></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-brand-orange animate-pulse"></div>
                        <div className="text-[11px] font-mono text-slate-500 font-bold tracking-widest uppercase">src/digitalize.ts — digitalizatodo</div>
                    </div>
                    <div className="w-8"></div>
                </div>

                {/* Code Content */}
                <div className="p-8 md:p-12 font-mono text-sm md:text-base leading-relaxed bg-white/50 backdrop-blur-[2px]">
                    <div className="flex gap-6 mb-1">
                        <span className="text-slate-200 text-right select-none w-6 font-bold">01</span>
                        <p><span className="text-purple-600 font-bold italic">import</span> {'{'} <span className="text-amber-600 font-bold">Future</span> {'}'} <span className="text-purple-600 font-bold italic">from</span> <span className="text-emerald-600 font-bold">'@client/success'</span>;</p>
                    </div>
                    <div className="flex gap-6 mb-1">
                        <span className="text-slate-200 text-right select-none w-6 font-bold">02</span>
                        <p>&nbsp;</p>
                    </div>
                    <div className="flex gap-6 mb-1">
                        <span className="text-slate-200 text-right select-none w-6 font-bold">03</span>
                        <p><span className="text-blue-600 font-bold italic">const</span> <span className="text-slate-900 font-extrabold underline decoration-blue-200 underline-offset-4">partner</span> = <span className="text-blue-600 font-bold italic">new</span> <span className="text-amber-600 font-bold">Future</span>();</p>
                    </div>
                    <div className="flex gap-6 mb-1">
                        <span className="text-slate-200 text-right select-none w-6 font-bold">04</span>
                        <p>&nbsp;</p>
                    </div>
                    <div className="flex gap-6 mb-1">
                        <span className="text-slate-200 text-right select-none w-6 font-bold">05</span>
                        <p><span className="text-slate-900 font-extrabold">partner</span>.<span className="text-blue-700 font-black">deploy</span>({'{'}</p>
                    </div>
                    <div className="flex gap-6 mb-1">
                        <span className="text-slate-200 text-right select-none w-6 font-bold">06</span>
                        <p>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-600 font-bold">scalability</span>: <span className="text-emerald-600 font-bold">'Infinity'</span>,</p>
                    </div>
                    <div className="flex gap-6 mb-1">
                        <span className="text-slate-200 text-right select-none w-6 font-bold">07</span>
                        <p>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-600 font-bold">efficiency</span>: <span className="text-emerald-600 font-bold">'Automated'</span>,</p>
                    </div>
                    <div className="flex gap-6 mb-1">
                        <span className="text-slate-200 text-right select-none w-6 font-bold">08</span>
                        <p>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-600 font-bold">innovation</span>: <span className="text-blue-600 font-bold italic">true</span></p>
                    </div>
                    <div className="flex gap-6">
                        <span className="text-slate-200 text-right select-none w-6 font-bold">09</span>
                        <p>{'}'});</p>
                    </div>
                </div>

                {/* Footer / Status Bar (VS Code Style) */}
                <div className="bg-slate-900 px-6 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-white uppercase tracking-tighter">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                            main*
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold tracking-tighter uppercase">UTF-8</div>
                    </div>
                    <span className="text-[10px] font-mono font-black text-slate-300 italic flex items-center gap-2">
                        <span className="text-brand-orange animate-pulse">●</span> 
                        _Compilando el éxito<span className={blink ? 'opacity-100' : 'opacity-0'}>...</span>
                    </span>
                </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 transform rotate-6 transition-transform group-hover:rotate-0 duration-500 hidden sm:block">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                        <div className="w-4 h-4 bg-brand-green rounded-sm"></div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Build Status</p>
                        <p className="text-xs font-black text-slate-900">Success: 100%</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ModernHero = () => {
    return (
        <section id="hero" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-[5px] sm:px-6 overflow-x-hidden bg-white">
            {/* Background Engineering Grids */}
            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(to_bottom,white,transparent)] -z-10"></div>
            
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative">
                {/* Left Column: Content */}
                <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000 text-center lg:text-left">
                    <div className="flex justify-center lg:justify-start">
                        <SectionBadge text="Software Factory & Automatización" />
                    </div>
                    
                    <h1 className="text-3xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-slate-900 leading-[1.05] tracking-tighter">
                        Transformamos <br className="hidden lg:block"/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-rose-500 italic pr-2">
                            ideas
                        </span> 
                        en <br className="hidden lg:block"/>
                        soluciones digitales.
                    </h1>
                    
                    <p className="text-lg lg:text-xl text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                        No somos una agencia más. Somos tu <span className="text-slate-900 font-bold border-b-2 border-orange-200">laboratorio de innovación en Arica y para todo Chile</span>. Desarrollamos software de alto rendimiento que redefine industrias.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                        <a 
                            href="#contacto" 
                            className="bg-brand-orange text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all hover:-translate-y-1 shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 group"
                        >
                            Agendar Consultoría
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </a>
                        <a 
                            href="#servicios" 
                            className="bg-white text-slate-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all border border-slate-200 text-center shadow-sm hover:shadow-md"
                        >
                            Explorar Capacidad
                        </a>
                    </div>

                    <div className="flex items-center gap-8 pt-8 border-t border-slate-100">
                        <div className="space-y-1">
                            <p className="text-3xl font-black text-slate-900 tracking-tighter">100%</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enfoque en Calidad</p>
                        </div>
                        <div className="w-px h-10 bg-slate-100"></div>
                        <div className="space-y-1">
                            <p className="text-3xl font-black text-slate-900 tracking-tighter">+50</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sistemas Activos</p>
                        </div>
                        <div className="w-px h-10 bg-slate-100"></div>
                        <div className="flex -space-x-3">
                            <div className="w-12 h-12 rounded-full bg-brand-blue border-4 border-white flex items-center justify-center text-white text-[10px] font-black shadow-lg">JS</div>
                            <div className="w-12 h-12 rounded-full bg-brand-green border-4 border-white flex items-center justify-center text-white text-[10px] font-black shadow-lg">TS</div>
                            <div className="w-12 h-12 rounded-full bg-brand-orange border-4 border-white flex items-center justify-center text-white text-[10px] font-black shadow-lg">IA</div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Illustration */}
                <div className="animate-in fade-in slide-in-from-right-8 duration-1000 delay-300 relative lg:block">
                    <div className="scale-75 sm:scale-90 lg:scale-100 origin-center sm:origin-right transition-transform">
                        <CodeIllustration />
                    </div>
                </div>
            </div>
            
            {/* Floating geometric elements */}
            <div className="absolute top-1/4 right-0 w-64 h-64 bg-brand-orange/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>
        </section>
    );
};

export default ModernHero;
