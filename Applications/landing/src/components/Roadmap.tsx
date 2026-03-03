import { useState, useEffect, useRef } from "react";
import { Search, Server, Code, Rocket } from "lucide-react";
import './Roadmap.css';

export function Roadmap() {
    const sectionRef = useRef<HTMLElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const roadmap = [
        {
            step: "01",
            title: "Requerimientos",
            desc: "Levantamiento de procesos y definición de lógica de negocio.",
            simple: "Entendemos tu problema.",
            icon: <Search size={22} className="text-white" />,
            color: "from-blue-500/80 to-indigo-500/80",
            shadow: "shadow-indigo-500/20"
        },
        {
            step: "02",
            title: "Arquitectura",
            desc: "Diseño de bases de datos y estructura del sistema.",
            simple: "Diseñamos los cimientos.",
            icon: <Server size={22} className="text-white" />,
            color: "from-indigo-500/80 to-purple-500/80",
            shadow: "shadow-purple-500/20"
        },
        {
            step: "03",
            title: "Desarrollo",
            desc: "Programación de interfaz (UI) y lógica (Backend).",
            simple: "Construimos el software.",
            icon: <Code size={22} className="text-white" />,
            color: "from-purple-500/80 to-pink-500/80",
            shadow: "shadow-pink-500/20"
        },
        {
            step: "04",
            title: "Despliegue",
            desc: "Puesta en producción y entrega final al cliente.",
            simple: "Tu sistema funcionando.",
            icon: <Rocket size={22} className="text-white" />,
            color: "from-pink-500/80 to-rose-500/80",
            shadow: "shadow-rose-500/20"
        }
    ];

    return (
        <section ref={sectionRef} className="py-24 px-4 max-w-6xl mx-auto relative z-10 font-sans overflow-hidden" id="roadmap">
            <div className={`roadmap-header-view text-center mb-16 ${isVisible ? 'is-visible' : ''}`}>
                <h2 className="text-sm font-mono text-indigo-400 font-bold uppercase tracking-widest mb-3">Flujo de Trabajo</h2>
                <h3 className="text-3xl md:text-5xl font-black text-white tracking-tight">Ciclo de Desarrollo</h3>
            </div>

            <div className="relative">
                {/* Line Connector (Desktop) */}
                <div className="hidden md:block absolute top-[2.25rem] left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-slate-700 to-transparent z-0"></div>

                {/* Line Connector (Mobile) */}
                <div className="md:hidden absolute top-0 left-8 w-[2px] h-full bg-gradient-to-b from-transparent via-slate-700 to-transparent z-0"></div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                    {roadmap.map((item, idx) => (
                        <div
                            key={idx}
                            className={`roadmap-item-view roadmap-delay-${idx} flex md:flex-col items-start md:items-center gap-6 md:gap-8 group ${isVisible ? 'is-visible' : ''}`}
                        >
                            {/* Step Circle - Glassmorphism */}
                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br ${item.color} backdrop-blur-md shadow-lg ${item.shadow} group-hover:scale-110 transition-all duration-300 relative z-10 shrink-0 border border-white/20 ring-4 ring-slate-950`}>
                                <div className="absolute -top-3 -right-3 w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center text-xs font-black border border-white/20 shadow-xl font-mono">
                                    {item.step}
                                </div>
                                {item.icon}
                            </div>

                            {/* Content Card - Glassmorphism */}
                            <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-xl flex-1 md:w-full md:text-center group-hover:border-indigo-500/50 transition-all duration-300 relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                                <h4 className="font-extrabold text-white mb-2 text-xl tracking-tight group-hover:text-indigo-400 transition-colors">{item.title}</h4>
                                <p className="text-sm text-slate-400 mb-4 leading-relaxed">{item.desc}</p>

                                <div className="text-xs font-bold text-slate-300 bg-white/5 px-3 py-2 rounded-lg inline-block border border-white/5 group-hover:bg-white/10 transition-colors">
                                    {item.simple}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
