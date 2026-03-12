import React from 'react';
import { ExternalLink, ArrowUpRight } from 'lucide-react';

interface ProjectCardProps {
    title: string;
    category: string;
    image: string;
    tags: string[];
    link: string;
    delay: number;
}

const ProjectCard = ({ title, category, image, tags, link, delay }: ProjectCardProps) => (
    <div 
        className="group relative rounded-[32px] overflow-hidden bg-white border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-700 animate-in fade-in zoom-in-95 fill-mode-both h-full flex flex-col"
        style={{ animationDelay: `${delay}ms` }}
    >
        {/* Project Image */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden">
            <img 
                src={`/proyectos/${image}`} 
                alt={title} 
                className="w-full h-full object-cover object-top transition-all duration-1000 group-hover:scale-110 group-hover:rotate-1"
                loading="lazy"
                decoding="async"
            />
            {/* Premium Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
            
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="bg-white/90 backdrop-blur-md p-5 rounded-full shadow-2xl transform translate-y-8 group-hover:translate-y-0 transition-transform duration-700">
                    <ArrowUpRight className="w-8 h-8 text-brand-orange" />
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 flex-grow flex flex-col justify-between">
            <div className="space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-brand-orange text-[10px] font-black uppercase tracking-[0.2em] mb-2">{category}</p>
                        <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{title}</h4>
                    </div>
                    <a href={link} target="_blank" className="p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:text-brand-orange hover:shadow-lg transition-all transform hover:-translate-y-1">
                        <ExternalLink className="w-5 h-5" />
                    </a>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag: string, i: number) => (
                        <span key={i} className="px-3 py-1.5 rounded-xl bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-100 group-hover:border-brand-orange/20 transition-colors">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
            
            <div className="pt-6 mt-auto border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-y-4 group-hover:translate-y-0">
                <p className="text-xs text-slate-500 font-medium italic">Transformando procesos con ingeniería de software.</p>
            </div>
        </div>
    </div>
);

const ModernPortfolio = () => {
    const projects = [
        {
            title: 'La Ruta 11',
            category: 'SAAS FOODTRUCK',
            image: 'app.laruta11.cl.webp',
            tags: ['React', 'Next.js', 'PostgreSQL'],
            link: 'https://app.laruta11.cl',
            delay: 0
        },
        {
            title: 'Pocos Click',
            category: 'SaaS Gastronomía',
            image: 'pocos.click.webp',
            tags: ['Astro', 'QR Menu', 'KDS'],
            link: 'https://pocos.click',
            delay: 100
        },
        {
            title: 'Agente RAG',
            category: 'Inteligencia Artificial',
            image: 'agenterag.com.webp',
            tags: ['Python', 'LLM', 'FastAPI'],
            link: 'https://agenterag.com',
            delay: 200
        },
        {
            title: 'Matemágica',
            category: 'EdTech & IA',
            image: 'matemagica.agenterag.com.webp',
            tags: ['PWA', 'Learning', 'IA'],
            link: 'https://matemagica.agenterag.com',
            delay: 300
        },
        {
            title: 'Colegio Agente RAG',
            category: 'Coporativo EdTech',
            image: 'colegio.agenterag.com.webp',
            tags: ['Web Design', 'SEO', 'Automation'],
            link: 'https://colegio.agenterag.com',
            delay: 400
        },
        {
            title: 'Automotora Online',
            category: 'E-commerce Auto',
            image: 'demo.automotora.online.webp',
            tags: ['Sales', 'WhatsApp API'],
            link: 'https://demo.automotora.online',
            delay: 500
        }
    ];

    return (
        <section id="proyectos" className="py-24 px-6 bg-slate-50/50 relative overflow-hidden">
            {/* Engineering Grid */}
            <div className="absolute inset-x-0 top-0 h-px bg-slate-200"></div>
            
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                    <div className="space-y-4">
                        <h2 className="text-brand-orange font-black tracking-widest uppercase text-sm">Nuestro Portafolio</h2>
                        <h3 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter leading-[1.1]">Casos de <br /> <span className="text-brand-blue">Ingeniería Real.</span></h3>
                    </div>
                    <p className="text-slate-600 font-medium max-w-sm border-l-4 border-brand-orange pl-6 mb-2">
                        Hecho con pasión en Chile. Soluciones que ya están procesando miles de datos por segundo.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
                    {projects.map((project, index) => (
                        <ProjectCard key={index} {...project} />
                    ))}
                </div>
                
                <div className="mt-16 text-center">
                    <a 
                        href="#contacto"
                        className="inline-block px-8 py-4 rounded-full bg-white border-2 border-slate-100 text-slate-900 font-black text-lg hover:border-brand-orange hover:text-brand-orange transition-all shadow-sm"
                    >
                        Quiero un Sistema Así
                    </a>
                </div>
            </div>
        </section>
    );
};

export default ModernPortfolio;
