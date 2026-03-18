import React, { useEffect, useRef, useState } from 'react';
import SectionBadge from './common/SectionBadge';
import { ArrowRight } from 'lucide-react';

const cards = [
    {
        title: 'App para tu equipo',
        desc: 'Tu staff registra asistencia, controla accesos e identifica clientes automáticamente — sin papel, sin errores, sin depender de ti.',
        src: '/recursosweb/signup-empresa.png',
        color: 'from-brand-blue/10 to-brand-blue/5',
        border: 'border-brand-blue/20',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-brand-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/>
            </svg>
        ),
    },
    {
        title: 'App para tus clientes',
        desc: 'Tus clientes ven su historial, pagos y novedades desde su celular — menos llamadas para ti, más confianza para ellos.',
        src: '/recursosweb/signup-cliente.png',
        color: 'from-brand-orange/10 to-brand-orange/5',
        border: 'border-brand-orange/20',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-brand-orange" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
        ),
    },
    {
        title: 'Dashboard central',
        desc: 'Ves ventas, inventario, asistencia y alertas en tiempo real desde donde estés — aunque no estés en el negocio.',
        src: '/recursosweb/dashboard-multiuso-poster.jpg',
        color: 'from-brand-green/10 to-brand-green/5',
        border: 'border-brand-green/20',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-brand-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
        ),
    },
];

const LazyCard = ({ card, index }: { card: typeof cards[0]; index: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
            { threshold: 0.15 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${index * 100}ms` }}
            className={`group relative flex-1 rounded-2xl border ${card.border} bg-gradient-to-b ${card.color} overflow-hidden transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
            <div className="relative overflow-hidden rounded-t-2xl h-56 bg-white">
                <img src={card.src} alt={card.title} loading="lazy" className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="p-5">
                <div className="flex items-center gap-2 mb-1.5">
                    {card.icon}
                    <p className="text-sm font-black text-slate-900">{card.title}</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{card.desc}</p>
            </div>
        </div>
    );
};

const ModernHero = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 80);
        return () => clearTimeout(timer);
    }, []);

    return (
        <section id="hero" className="relative overflow-x-hidden bg-white">
            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(to_bottom,white,transparent)] -z-10"></div>

            {/* Fold: 100vh centrado */}
            <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 text-center">
                <div className="max-w-4xl mx-auto flex flex-col items-center gap-8">

                    <div style={{ transitionDelay: '0ms' }} className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <SectionBadge text="Software Factory & Automatización" />
                    </div>

                    <div style={{ transitionDelay: '120ms' }} className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-slate-900 leading-[1.05] tracking-tighter">
                            Tu negocio,<br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-rose-500 italic pr-2">
                                controlado
                            </span><br/>
                            desde tu celular.
                        </h1>
                    </div>

                    <div style={{ transitionDelay: '240ms' }} className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <p className="text-base lg:text-xl text-slate-600 max-w-2xl leading-relaxed font-medium">
                            ¿Sigues usando Excel, WhatsApp o papel para gestionar tu negocio? Te construimos un{' '}
                            <span className="text-slate-900 font-bold border-b-2 border-orange-200">ecosistema digital a tu medida</span>
                            {' '}— con app para tu equipo, app para tus clientes y un dashboard donde ves todo en tiempo real.
                        </p>
                    </div>

                    <div style={{ transitionDelay: '360ms' }} className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} flex flex-col sm:flex-row gap-4 justify-center`}>
                        <a href="#contacto" className="bg-brand-orange text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all hover:-translate-y-1 shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 group">
                            Quiero ordenar mi negocio
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </a>
                        <a href="#proceso" className="bg-white text-slate-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all border border-slate-200 text-center shadow-sm hover:shadow-md">
                            Ver cómo funciona
                        </a>
                    </div>
                </div>


            </div>

            {/* Below fold: tarjetas con lazy reveal */}
            <div className="pb-20 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                        Lo que incluye tu ecosistema
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                        {cards.map((card, i) => <LazyCard key={card.title} card={card} index={i} />)}
                    </div>
                </div>
            </div>

            <div className="absolute top-1/4 right-0 w-64 h-64 bg-brand-orange/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>
        </section>
    );
};

export default ModernHero;
