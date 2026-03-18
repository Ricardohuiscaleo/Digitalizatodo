import React, { useEffect, useRef } from 'react';
import SectionBadge from './common/SectionBadge';
import { ArrowRight } from 'lucide-react';

const cards = [
    {
        title: 'App para tu equipo',
        desc: 'Tu staff registra asistencia, controla accesos e identifica clientes automáticamente — sin papel, sin errores, sin depender de ti.',
        media: { type: 'img' as const, src: '/recursosweb/signup-empresa.png' },
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
        media: { type: 'img' as const, src: '/recursosweb/signup-cliente.png' },
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
        media: { type: 'video' as const, src: '/recursosweb/dashboard-multiuso.mp4', poster: '/recursosweb/dashboard-multiuso-poster.jpg' },
        color: 'from-brand-green/10 to-brand-green/5',
        border: 'border-brand-green/20',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-brand-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
        ),
    },
];

const EcosystemCards = () => (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
        {cards.map((card) => (
            <div
                key={card.title}
                className={`group relative flex-1 rounded-2xl border ${card.border} bg-gradient-to-b ${card.color} overflow-hidden`}
            >
                <div className="relative overflow-hidden rounded-t-2xl h-40 bg-white">
                    {card.media.type === 'video' ? (
                        <video
                            src={card.media.src}
                            poster={card.media.poster}
                            autoPlay loop muted playsInline
                            preload="auto"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <img
                            src={card.media.src}
                            alt={card.title}
                            className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                        />
                    )}
                </div>
                <div className="p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                        {card.icon}
                        <p className="text-sm font-black text-slate-900">{card.title}</p>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{card.desc}</p>
                </div>
            </div>
        ))}
    </div>
);

const ModernHero = () => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    video.play();
                } else {
                    video.pause();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(video);
        return () => observer.disconnect();
    }, []);
    return (
        <section id="hero" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 overflow-x-hidden bg-white">
            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(to_bottom,white,transparent)] -z-10"></div>

            <div className="max-w-7xl mx-auto space-y-16 relative">
                {/* Top: texto + CTA */}
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8 text-center lg:text-left">
                        <div className="flex justify-center lg:justify-start">
                            <SectionBadge text="Software Factory & Automatización" />
                        </div>

                        <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-slate-900 leading-[1.05] tracking-tighter">
                            Tu negocio,<br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-rose-500 italic pr-2">
                                controlado
                            </span><br/>
                            desde tu celular.
                        </h1>

                        <p className="text-base lg:text-xl text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                            ¿Sigues usando Excel, WhatsApp o papel para gestionar tu negocio? Te construimos un <span className="text-slate-900 font-bold border-b-2 border-orange-200">ecosistema digital a tu medida</span> — con app para tu equipo, app para tus clientes y un dashboard donde ves todo en tiempo real.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                            <a
                                href="#contacto"
                                className="bg-brand-orange text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all hover:-translate-y-1 shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 group"
                            >
                                Quiero ordenar mi negocio
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </a>
                            <a
                                href="#proceso"
                                className="bg-white text-slate-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all border border-slate-200 text-center shadow-sm hover:shadow-md"
                            >
                                Ver cómo funciona
                            </a>
                        </div>
                    </div>

                    {/* App colorida */}
                    <div className="relative flex justify-center lg:justify-end">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/30 via-brand-blue/20 to-brand-green/20 blur-3xl transform rotate-6 scale-125 rounded-3xl animate-pulse"></div>
                        <video
                            ref={videoRef}
                            src="/recursosweb/app-colorida.mp4"
                            poster="/recursosweb/app-colorida-poster.jpg"
                            autoPlay loop muted playsInline
                            preload="auto"
                            className="relative w-full mix-blend-multiply"
                        />
                    </div>
                </div>

                {/* Bottom: 3 tarjetas ecosistema */}
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                        Lo que incluye tu ecosistema
                    </p>
                    <EcosystemCards />
                </div>
            </div>

            <div className="absolute top-1/4 right-0 w-64 h-64 bg-brand-orange/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>
        </section>
    );
};

export default ModernHero;
