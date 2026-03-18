import React from 'react';
import { Search, Code2, Rocket, HeartHandshake } from 'lucide-react';
import { useLazyReveal, revealClass, revealStyle } from '../hooks/useLazyReveal';

const ModernProcess = () => {
    const { ref: titleRef, visible: titleVisible } = useLazyReveal(0.1);
    const steps = [
        { number: '01', title: 'Diagnóstico',  simple: 'Ingeniería de Requerimientos', description: 'Levantamiento de procesos y auditoría de lógica de negocio para tu solución.', icon: Search,        delay: 0   },
        { number: '02', title: 'Arquitectura', simple: 'Diseño de Sistemas',           description: 'Diseño sistémico de bases de datos y planificación de arquitectura escalable en la nube.', icon: Code2,         delay: 100 },
        { number: '03', title: 'Desarrollo',   simple: 'Software Construction',        description: 'Implementación ágil de interfaz (UI/UX) y Core Backend de alto rendimiento.',  icon: Rocket,        delay: 200 },
        { number: '04', title: 'Soporte & UX', simple: 'Producción & Escala',          description: 'Puesta en producción, monitoreo y mejora continua del sistema desplegado.',     icon: HeartHandshake,delay: 300 },
    ];

    return (
        <section id="proceso" className="py-24 px-[5px] sm:px-6 bg-white relative overflow-hidden">
            <div className="absolute inset-0 bg-dot-slate-200 [mask-image:radial-gradient(ellipse_at_center,black,transparent)] opacity-50 -z-10"></div>
            <div className="max-w-7xl mx-auto">
                <div ref={titleRef} style={revealStyle(0)} className={`${revealClass(titleVisible)} text-center mb-20 space-y-4`}>
                    <h2 className="text-brand-orange font-black tracking-widest uppercase text-sm">Metodología de Ingeniería</h2>
                    <h3 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">Hacemos lo complejo <br /> <span className="text-brand-blue">extremadamente simple.</span></h3>
                </div>
                <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                    <div className="hidden lg:block absolute top-10 left-32 right-32 h-0.5 border-t-2 border-dashed border-slate-100 -z-10"></div>
                    {steps.map((step, index) => {
                        const { ref, visible } = useLazyReveal();
                        return (
                            <div key={index} ref={ref} style={revealStyle(step.delay)}
                                className={`${revealClass(visible)} relative flex flex-col items-center text-center space-y-6 group`}>
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-3xl bg-white border-2 border-slate-100 shadow-xl flex items-center justify-center group-hover:scale-110 group-hover:border-brand-orange transition-all duration-500 relative z-10">
                                        <step.icon className="w-8 h-8 text-brand-blue group-hover:text-brand-orange transition-colors" />
                                    </div>
                                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center text-xs font-black shadow-lg z-20 font-mono">{step.number}</div>
                                    <div className="absolute inset-0 bg-brand-orange/10 blur-2xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                                <div className="space-y-3 px-4">
                                    <h4 className="text-xl font-black text-slate-900 tracking-tight">{step.title}</h4>
                                    <div className="inline-block px-3 py-1 rounded-lg bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">{step.simple}</div>
                                    <p className="text-slate-500 text-sm leading-relaxed max-w-[240px]">{step.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default ModernProcess;
