import React from 'react';
import { Monitor, Layout, Cpu, Smartphone, BarChart, Lightbulb, ArrowUpRight } from 'lucide-react';
import SectionBadge from './common/SectionBadge';
import { useLazyReveal, revealClass, revealStyle } from '../hooks/useLazyReveal';

interface ServiceCardProps {
    title: string; description: string; icon: React.ComponentType<{ className?: string }>;
    color: string; bg: string; delay: number; price: string; tags: string[];
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, icon: Icon, color, bg, delay, price, tags }) => {
    const { ref, visible } = useLazyReveal();
    return (
        <div ref={ref} style={revealStyle(delay)}
            className={`${revealClass(visible)} group p-5 sm:p-8 rounded-[32px] bg-white border border-slate-100 hover:border-transparent hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] transition-all duration-500 relative overflow-hidden`}>
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${bg}`}></div>
            <div className={`w-16 h-16 rounded-2xl ${bg} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                <Icon className={`w-8 h-8 ${color}`} />
            </div>
            <h4 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{title}</h4>
            <p className="text-slate-500 leading-relaxed mb-6 font-medium text-sm">{description}</p>
            <div className="flex flex-wrap gap-2 mb-8">
                {tags?.map((tag, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-100">{tag}</span>
                ))}
            </div>
            <div className="pt-6 border-t border-slate-50 flex items-center justify-between mt-auto">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inversión</span>
                    <span className="text-lg font-black text-slate-900 font-mono tracking-tighter">{price}</span>
                </div>
                <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center transition-all group-hover:bg-brand-orange group-hover:text-white group-hover:rotate-45`}>
                    <ArrowUpRight className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
};

const ModernServices = () => {
    const { ref: titleRef, visible: titleVisible } = useLazyReveal(0.1);
    const services = [
        { title: 'Apps Web Escalables',  description: 'Sistemas complejos con arquitecturas de alto rendimiento y seguridad robusta de nivel empresarial.', icon: Monitor,    color: 'text-rose-500',   bg: 'bg-rose-50',    price: 'Desde $449.890',     tags: ['React', 'TypeScript', 'Node.js', 'API'], delay: 0   },
        { title: 'Sitios Web Premium',   description: 'Presencia digital de alto impacto con optimización SEO extrema y carga instantánea.',  icon: Layout,     color: 'text-emerald-500',bg: 'bg-emerald-50', price: 'Desde $149.890',     tags: ['Astro', 'SEO', 'Tailwind', 'UX/UI'],    delay: 100 },
        { title: 'Software a Medida',    description: 'Soluciones críticas diseñadas específicamente para optimizar tu lógica de negocio.',   icon: Cpu,        color: 'text-violet-500', bg: 'bg-violet-50',  price: 'Desde $124.890/mes', tags: ['Python', 'FastAPI', 'Postgres', 'Docker'],delay: 200 },
        { title: 'Soluciones Digitales', description: 'Implementación de PWA, sistemas offline-first y digitalización de flujos operativos.', icon: Smartphone, color: 'text-cyan-500',   bg: 'bg-cyan-50',    price: 'Desde $124.890/mes', tags: ['PWA', 'React', 'Service Workers'],       delay: 0   },
        { title: 'Marketing & SEO',      description: 'Estrategias de crecimiento basadas en datos para posicionar tu marca.',                icon: BarChart,   color: 'text-amber-500',  bg: 'bg-amber-50',   price: 'Desde $30.000/h',    tags: ['Ads', 'Analytics', 'Growth'],            delay: 100 },
        { title: 'Asesoría Técnica',     description: 'Consultoría estratégica en automatización e inteligencia artificial para PyMEs.',      icon: Lightbulb,  color: 'text-pink-500',   bg: 'bg-pink-50',    price: 'Desde $19.890',      tags: ['IA', 'ROI', 'Consultoría'],              delay: 200 },
    ];

    return (
        <section id="servicios" className="py-24 px-[5px] sm:px-6 bg-white">
            <div className="max-w-7xl mx-auto">
                <div ref={titleRef} style={revealStyle(0)} className={`${revealClass(titleVisible)} flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8`}>
                    <div className="space-y-4">
                        <SectionBadge text="Nuestras Capacidades" />
                        <h3 className="text-3xl lg:text-6xl font-black text-slate-900 tracking-tighter">Soluciones de <br /> <span className="text-brand-blue">Siguiente Generación.</span></h3>
                    </div>
                    <p className="text-slate-500 font-medium max-w-sm border-l-4 border-brand-orange pl-6 mb-2">
                        Ingeniería de precisión aplicada a cada píxel y línea de código. Precios transparentes diseñados para escalar tu negocio.
                    </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service, index) => <ServiceCard key={index} {...service} />)}
                </div>
            </div>
        </section>
    );
};

export default ModernServices;
