import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Smartphone, Globe, BarChart, Code, Settings, Lightbulb, ArrowUpRight, MessageCircle, Mail } from "lucide-react";
import './ServicesGrid.css';

export function ServicesGrid() {
    const [selectedService, setSelectedService] = useState<any>(null);
    const [clientName, setClientName] = useState("");
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

    const services = [
        {
            title: "Apps Web",
            description: "Desarrollo de aplicaciones escalables. Foco en rendimiento.",
            icon: <Smartphone className="w-6 h-6" />,
            colorClass: "rose",
            price: "$449.890",
            tags: ["React", "TypeScript", "PHP", "MySQL"],
            link: "/servicios/apps-web"
        },
        {
            title: "Páginas Web",
            description: "Sitios profesionales. Carga rápida y diseño premium responsivo.",
            icon: <Globe className="w-6 h-6" />,
            colorClass: "emerald",
            price: "$149.890",
            tags: ["Astro", "SEO", "Tailwind", "CMS"],
            link: "/servicios/paginas-web"
        },
        {
            title: "Marketing Digital",
            description: "Estrategias de crecimiento y posicionamiento de marca.",
            icon: <BarChart className="w-6 h-6" />,
            colorClass: "amber",
            price: "$30.000/h",
            tags: ["Google Ads", "Social Media", "Analytics", "SEO"],
            link: "/servicios/marketing-digital"
        },
        {
            title: "Software a Medida",
            description: "Arquitectura robusta para procesos complejos de tu negocio.",
            icon: <Code className="w-6 h-6" />,
            colorClass: "violet",
            price: "$124.890/mes",
            tags: ["Python", "FastAPI", "PostgreSQL", "Docker"],
            link: "/servicios/software-a-medida"
        },
        {
            title: "Soluciones Digitales",
            description: "Automatización de flujos de trabajo e integración de sistemas.",
            icon: <Settings className="w-6 h-6" />,
            colorClass: "cyan",
            price: "$124.890/mes",
            tags: ["PWA", "React", "Service Workers", "Offline-First"],
            link: "/servicios/soluciones-digitales"
        },
        {
            title: "Asesoría Automatización",
            description: "Análisis costo-beneficio para PyMEs. Soluciones óptimas.",
            icon: <Lightbulb className="w-6 h-6" />,
            colorClass: "pink",
            price: "$19.890",
            tags: ["IA", "Consultoría", "ROI", "Procesos"],
            link: "/servicios/asesoria-automatizacion"
        }
    ];

    const getColorConfig = (color: string) => {
        const config: Record<string, string> = {
            rose: "border-rose-500/20 shadow-rose-500/10 text-rose-400 bg-rose-500/10",
            emerald: "border-emerald-500/20 shadow-emerald-500/10 text-emerald-400 bg-emerald-500/10",
            amber: "border-amber-500/20 shadow-amber-500/10 text-amber-400 bg-amber-500/10",
            violet: "border-violet-500/20 shadow-violet-500/10 text-violet-400 bg-violet-500/10",
            cyan: "border-cyan-500/20 shadow-cyan-500/10 text-cyan-400 bg-cyan-500/10",
            pink: "border-pink-500/20 shadow-pink-500/10 text-pink-400 bg-pink-500/10",
        };
        return config[color] || config["rose"];
    };

    const handleWhatsAppQuote = () => {
        if (!clientName) return alert("Ingresa tu nombre para cotizar");
        const text = `Hola, soy ${clientName}. Quiero cotizar el servicio: ${selectedService?.title} - ${selectedService?.price}`;
        window.open(`https://wa.me/56945392581?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleEmailQuote = () => {
        if (!clientName) return alert("Ingresa tu nombre para cotizar");
        const subject = `Cotización ${selectedService?.title} - ${clientName}`;
        const body = `Hola, soy ${clientName}.\n\nQuiero cotizar: ${selectedService?.title}\nPrecio listado: ${selectedService?.price}`;
        window.open(`mailto:info@digitalizatodo.cl?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    };

    return (
        <section id="servicios" ref={sectionRef} className="py-24 px-4 relative z-10 font-sans overflow-hidden">
            <div className="max-w-6xl mx-auto">
                <div className={`services-title-view flex items-center gap-4 mb-14 ${isVisible ? 'is-visible' : ''}`}>
                    <div className="h-px bg-slate-800 flex-1"></div>
                    <h2 className="text-sm md:text-base font-bold text-slate-400 uppercase tracking-widest font-mono">
                        Servicios & Cotizaciones
                    </h2>
                    <div className="h-px bg-slate-800 flex-1"></div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((s, i) => {
                        const colors = getColorConfig(s.colorClass).split(" ");
                        return (
                            <div key={i} className={`service-card-view delay-${i} ${isVisible ? 'is-visible' : ''}`}>
                                <Card className={`flex flex-col h-full relative overflow-hidden group hover:-translate-y-2 transition-all duration-300 border backdrop-blur-xl bg-slate-900/40 shadow-xl hover:shadow-2xl ${colors[0]} ${colors[1]}`}>
                                    <div className={`absolute top-0 right-0 w-32 h-32 blur-[50px] rounded-full mix-blend-screen opacity-20 transition-opacity group-hover:opacity-40 pointer-events-none ${colors[4]}`}></div>

                                    <a href={s.link} className="absolute inset-0 z-0"><span className="sr-only">Ver {s.title}</span></a>

                                    <CardHeader className="pb-4 pt-8 px-8 relative z-10 pointer-events-none">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`p-4 rounded-xl border border-white/5 shadow-inner backdrop-blur-md ${colors[2]} ${colors[4]}`}>
                                                {s.icon}
                                            </div>
                                            <a href={s.link} className="text-xs font-semibold text-slate-500 hover:text-white transition-colors pointer-events-auto z-20">
                                                ver detalle →
                                            </a>
                                        </div>
                                        <CardTitle className="text-2xl font-bold text-white leading-tight">
                                            {s.title}
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent className="px-8 pb-8 flex-1 flex flex-col pointer-events-none relative z-10">
                                        <p className="text-sm leading-relaxed text-slate-400 mb-6 flex-1 min-h-[50px]">
                                            {s.description}
                                        </p>
                                        <div className="flex flex-wrap gap-2 mb-8 pointer-events-auto">
                                            {s.tags.map((tag, j) => (
                                                <Badge variant="outline" key={j} className="text-xs font-mono py-1 font-semibold border-white/10 text-slate-300 bg-white/5 pointer-events-none">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                        <div className="pt-6 border-t border-dashed border-white/10 flex items-center justify-between pointer-events-auto">
                                            <span className="text-xl font-bold text-white font-mono tracking-tight">
                                                {s.price}
                                            </span>

                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="sm" className={`gap-2 group/btn hover:bg-transparent px-0 font-bold z-20 ${colors[2]}`} onClick={() => setSelectedService(s)}>
                                                        <span className="text-xs uppercase tracking-wider">COTIZAR</span>
                                                        <div className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-colors ${colors[2]} group-hover/btn:scale-110 group-hover/btn:text-white group-hover/btn:bg-indigo-600`}>
                                                            <ArrowUpRight className="w-4 h-4" />
                                                        </div>
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-md bg-slate-950/70 backdrop-blur-2xl border border-white/10 shadow-2xl text-white z-[9999]">
                                                    <DialogHeader>
                                                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">Cotizar {selectedService?.title}</DialogTitle>
                                                        <DialogDescription className="text-lg font-mono text-emerald-400 font-bold">
                                                            {selectedService?.price}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="flex items-center space-x-2 my-4">
                                                        <div className="grid flex-1 gap-4">
                                                            <label htmlFor="name" className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                                                                Tu Nombre completo
                                                            </label>
                                                            <Input
                                                                id="name"
                                                                value={clientName}
                                                                onChange={(e) => setClientName(e.target.value)}
                                                                className="bg-white/5 border-white/10 text-white h-12 backdrop-blur-md focus-visible:ring-indigo-500"
                                                                placeholder="Ej: Juan Pérez"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-3 sm:flex-row mt-2">
                                                        <Button onClick={handleWhatsAppQuote} className="flex-1 h-12 bg-green-500 hover:bg-green-600 font-bold text-white group">
                                                            <MessageCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" /> WhatsApp
                                                        </Button>
                                                        <Button onClick={handleEmailQuote} className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 font-bold text-white group">
                                                            <Mail className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" /> Email
                                                        </Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
