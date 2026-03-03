import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MousePointer2, Layers } from "lucide-react";

export function Portfolio() {
    const projects = [
        {
            title: "La Ruta 11",
            category: "Punto de Venta",
            image: "/proyectos/app.laruta11.cl.webp",
            url: "https://app.laruta11.cl",
            stack: "Astro • React • MySQL",
            color: "rgba(59, 130, 246, 0.1)", // blue
            description: "Sistema de punto de venta para restaurante con gestión de pedidos, inventario y reportes en tiempo real."
        },
        {
            title: "Matemágica",
            category: "EdTech & IA",
            image: "/proyectos/matemagica.agenterag.com.webp",
            url: "https://matemagica.agenterag.com",
            stack: "PWA • IA • Supabase",
            color: "rgba(168, 85, 247, 0.1)", // purple
            description: "Plataforma educativa con IA para enseñanza de matemáticas, con ejercicios interactivos y seguimiento de progreso."
        },
        {
            title: "Agente RAG",
            category: "Inteligencia Artificial",
            image: "/proyectos/agenterag.com.webp",
            url: "https://agenterag.com",
            stack: "Python • LLM • React",
            color: "rgba(20, 184, 166, 0.1)", // teal
            description: "Agente de IA con Retrieval-Augmented Generation para búsqueda y análisis inteligente de información."
        },
        {
            title: "Estudio Jurídico",
            category: "Sitio Corporativo",
            image: "/proyectos/patriciosepulveda.cl.webp",
            url: "https://patriciosepulveda.cl",
            stack: "Astro • SEO • UX/UI",
            color: "rgba(148, 163, 184, 0.1)", // slate
            description: "Sitio web profesional para estudio jurídico con optimización SEO y diseño corporativo moderno."
        },
        {
            title: "Automotora Demo",
            category: "Catálogo Autos",
            image: "/proyectos/demo.automotora.online.webp",
            url: "https://demo.automotora.online",
            stack: "Astro • Filtros • WhatsApp",
            color: "rgba(239, 68, 68, 0.1)", // red
            description: "Plataforma de venta de vehículos con catálogo filtrable, búsqueda avanzada e integración WhatsApp."
        },
        {
            title: "Pocos Click",
            category: "SaaS Restaurantes",
            image: "/proyectos/pocos.click.webp",
            url: "https://pocos.click",
            stack: "Astro • QR • KDS • Maps",
            color: "rgba(249, 115, 22, 0.1)", // orange
            description: "Sistema completo para restaurantes con carta QR, punto de venta, monitor de cocina e integración Google Maps."
        }
    ];

    return (
        <section id="proyectos" className="py-24 px-4 relative z-10 font-sans">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex justify-between items-end mb-14"
                >
                    <div className="w-full">
                        <div className="text-sm font-mono text-indigo-400 font-bold mb-3 tracking-widest uppercase">
                            PORTAFOLIO
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                            Últimos Proyectos Desplegados
                        </h2>
                    </div>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8">
                    {projects.map((p, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="h-full"
                        >
                            <a href={p.url} target="_blank" rel="noreferrer" className="block h-full outline-none group">
                                <Card
                                    className="h-full overflow-hidden rounded-3xl border border-white/10 backdrop-blur-xl bg-slate-900/50 transition-all duration-500 hover:shadow-[0_0_40px_-15px_rgba(99,102,241,0.5)] group-hover:-translate-y-2 group-hover:border-indigo-500/50 relative"
                                    style={{ backgroundColor: p.color }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/80 z-0 pointer-events-none"></div>
                                    <div className="flex flex-col sm:flex-row h-full relative z-10">
                                        <div className="sm:w-2/5 md:w-5/12 h-48 sm:h-auto shrink-0 overflow-hidden relative border-b sm:border-b-0 sm:border-r border-white/10">
                                            <div className="absolute inset-0 bg-indigo-500/20 mix-blend-overlay z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                            <img
                                                src={p.image}
                                                alt={p.title}
                                                width="662"
                                                height="372"
                                                loading="lazy"
                                                className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-transform duration-700 ease-out"
                                            />
                                        </div>
                                        <CardContent className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <Badge variant="outline" className="text-xs font-mono font-bold tracking-wider bg-white/5 border-white/10 text-slate-300">
                                                        {p.category}
                                                    </Badge>
                                                    <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-colors group-hover:bg-indigo-600 group-hover:border-indigo-500 text-slate-400 group-hover:text-white">
                                                        <MousePointer2 className="w-4 h-4" />
                                                    </div>
                                                </div>
                                                <h3 className="text-2xl font-black text-white mb-3 tracking-tight group-hover:text-indigo-400 transition-colors">{p.title}</h3>
                                                <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">{p.description}</p>
                                            </div>

                                            <div className="pt-6 mt-6 border-t border-white/10 border-dashed flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500 group-hover:text-slate-300 transition-colors">
                                                    <Layers className="w-4 h-4" />
                                                    {p.stack}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </div>
                                </Card>
                            </a>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
