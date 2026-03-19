import React from 'react';
import { CheckCircle2, TrendingUp, Users, ShieldCheck, Clock } from 'lucide-react';

const BentoCard = ({ title, value, description, icon: Icon, className }: { title: string, value: string, description: string, icon: React.ComponentType<{ className?: string }>, className?: string }) => (
    <div className={`p-8 rounded-[24px] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
        <div className="flex flex-col h-full justify-between">
            <div>
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-brand-orange" />
                </div>
                <h4 className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">{title}</h4>
                <div className="text-4xl font-black text-slate-900 mb-2">{value}</div>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
        </div>
    </div>
);

const WhyChooseUs = () => {
    const benefits = [
        'Transparencia total en cada etapa del desarrollo.',
        'Metodologías ágiles para entregas rápidas.',
        'Soporte técnico dedicado y mantenimiento proactivo.',
        'Enfoque en ROI y optimización de costos.'
    ];

    return (
        <section id="nosotros" className="py-24 px-[5px] sm:px-6 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left: Content */}
                    <div className="space-y-8">
                        <h2 className="text-brand-orange font-bold tracking-widest uppercase text-sm">¿Por qué elegirnos?</h2>
                        <h3 className="text-4xl lg:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight">
                            Desarrollamos con el <br />
                            <span className="text-brand-blue">Éxito en Mente.</span>
                        </h3>
                        <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                            No solo entregamos software; entregamos soluciones que transforman negocios. Nuestro enfoque combina ingeniería de alta precisión con una visión clara de rentabilidad.
                        </p>
                        
                        <div className="space-y-4">
                            {benefits.map((benefit, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="mt-1">
                                        <CheckCircle2 className="w-5 h-5 text-brand-green" />
                                    </div>
                                    <p className="text-slate-700 font-medium">{benefit}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Bento Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <BentoCard 
                            title="Proyectos" 
                            value="+120" 
                            description="Sistemas implementados con éxito en diversas industrias."
                            icon={TrendingUp}
                            className="col-span-2 sm:col-span-1"
                        />
                        <BentoCard 
                            title="Eficiencia" 
                            value="98%" 
                            description="De procesos automatizados que reducen costos operativos."
                            icon={ShieldCheck}
                            className="col-span-2 sm:col-span-1"
                        />
                        <BentoCard 
                            title="Clientes" 
                            value="+50" 
                            description="Empresas que confían su transformación digital con nosotros."
                            icon={Users}
                            className="col-span-2"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default WhyChooseUs;
