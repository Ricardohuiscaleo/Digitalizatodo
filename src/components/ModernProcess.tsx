import React from 'react';
import { Search, Code2, Rocket, HeartHandshake } from 'lucide-react';

const ProcessStep = ({ number, title, description, icon: Icon, delay }) => (
    <div 
        className="relative flex flex-col items-center text-center space-y-4 animate-in fade-in slide-in-from-bottom-8 fill-mode-both"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-white border-2 border-slate-100 shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 relative z-10">
                <Icon className="w-8 h-8 text-brand-blue" />
            </div>
            <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center text-xs font-black shadow-lg z-20">
                {number}
            </div>
            <div className="absolute inset-0 bg-brand-blue/10 blur-2xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
        <h4 className="text-xl font-black text-slate-900 mt-2">{title}</h4>
        <p className="text-slate-500 text-sm leading-relaxed max-w-[200px]">
            {description}
        </p>
    </div>
);

const ModernProcess = () => {
    const steps = [
        {
            number: '01',
            title: 'Diagnóstico',
            simple: 'Ingeniería de Requerimientos',
            description: 'Levantamiento de procesos y auditoría de lógica de negocio para tu solución.',
            icon: Search,
            delay: 0
        },
        {
            number: '02',
            title: 'Arquitectura',
            simple: 'Diseño de Sistemas',
            description: 'Diseño sistémico de bases de datos y planificación de escalabilidad absoluta.',
            icon: Code2,
            delay: 150
        },
        {
            number: '03',
            title: 'Desarrollo',
            simple: 'Software Construction',
            description: 'Implementación ágil de interfaz (UI/UX) y Core Backend de alto rendimiento.',
            icon: Rocket,
            delay: 300
        },
        {
            number: '04',
            title: 'Soporte & UX',
            simple: 'Producción & Escala',
            description: 'Puesta en producción, monitoreo y mejora continua del sistema desplegado.',
            icon: HeartHandshake,
            delay: 450
        }
    ];

    return (
        <section id="proceso" className="py-24 px-6 bg-white relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-dot-slate-200 [mask-image:radial-gradient(ellipse_at_center,black,transparent)] opacity-50 -z-10"></div>
            
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20 space-y-4">
                    <h2 className="text-brand-orange font-black tracking-widest uppercase text-sm">Metodología de Ingeniería</h2>
                    <h3 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">Hacemos lo complejo <br /> <span className="text-brand-blue">extremadamente simple.</span></h3>
                </div>

                <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                    {/* Connection Line (Desktop) */}
                    <div className="hidden lg:block absolute top-10 left-32 right-32 h-0.5 border-t-2 border-dashed border-slate-100 -z-10"></div>
                    
                    {steps.map((step, index) => (
                        <div 
                            key={index}
                            className="relative flex flex-col items-center text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 fill-mode-both group"
                            style={{ animationDelay: `${step.delay}ms` }}
                        >
                            <div className="relative">
                                <div className="w-20 h-20 rounded-3xl bg-white border-2 border-slate-100 shadow-xl flex items-center justify-center group-hover:scale-110 group-hover:border-brand-orange transition-all duration-500 relative z-10">
                                    <step.icon className="w-8 h-8 text-brand-blue group-hover:text-brand-orange transition-colors" />
                                </div>
                                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center text-xs font-black shadow-lg z-20 font-mono">
                                    {step.number}
                                </div>
                                <div className="absolute inset-0 bg-brand-orange/10 blur-2xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            
                            <div className="space-y-3 px-4">
                                <h4 className="text-xl font-black text-slate-900 tracking-tight">{step.title}</h4>
                                <div className="inline-block px-3 py-1 rounded-lg bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
                                    {step.simple}
                                </div>
                                <p className="text-slate-500 text-sm leading-relaxed max-w-[240px]">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ModernProcess;
