import React, { useState, useEffect } from 'react';
import { 
  Menu, X, ArrowRight, Code2, Rocket, HeartHandshake, 
  Search, PanelsTopLeft, Monitor, Smartphone, BarChart3, 
  Lightbulb, ExternalLink, TrendingUp, Bot, Users, Leaf, 
  Mail, Instagram, Linkedin, ChevronDown 
} from 'lucide-react';

// --- COMPONENTE REUTILIZABLE PARA LOS MEGA MENÚS ---
const MegaMenu = ({ title, items, footerText, footerIcon: FooterIcon, href }: { title: string, items: any[], footerText?: string, footerIcon?: any, href: string }) => (
  <div className="relative group">
    <a href={href} className="text-slate-600 hover:text-slate-900 font-bold text-[11px] uppercase tracking-widest px-5 py-2.5 rounded-full hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer">
      {title} <ChevronDown className="w-3 h-3 group-hover:rotate-180 transition-transform duration-300" />
    </a>
    
    {/* Panel Desplegable (Hover Bridge & Content) */}
    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-4 group-hover:translate-y-0 transition-all duration-300 ease-out z-[80]">
      <div className="w-[600px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-100 p-6 grid grid-cols-2 gap-4">
        
        {items.map((item, idx) => (
          <a key={idx} href={item.href} className="p-4 rounded-2xl hover:bg-slate-50 transition-colors group/card block text-left bg-white border border-slate-100/50 shadow-sm">
            <div className={`p-3 rounded-2xl bg-white border border-slate-50 flex items-center justify-center transition-transform duration-500 group-hover/card:scale-110 shadow-sm`}>
              <item.icon className={`w-6 h-6 ${item.iconColorClass}`} />
            </div>
            <h5 className="font-bold text-slate-900 text-sm mb-1">{item.title}</h5>
            <p className="text-xs text-slate-500 line-clamp-2">{item.desc}</p>
          </a>
        ))}

        {footerText && FooterIcon && (
          <div className="col-span-2 mt-2 bg-slate-900 rounded-2xl p-5 flex items-center justify-between group/insight cursor-pointer hover:bg-slate-800 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden p-1.5 border border-slate-100">
                <img src="/DLogo-v2.webp" alt="D" className="w-full h-full object-contain" />
              </div>
              <div className="leading-none text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Insight de Valor</p>
                <p className="text-sm font-bold text-white mt-0.5">{footerText}</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover/insight:bg-orange-500 transition-colors text-white">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

// --- COMPONENTE PRINCIPAL DEL NAVBAR ---
const ModernNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  const navLinks = [
    { name: 'Inicio', href: '#hero' },
    { name: 'Servicios', href: '#servicios' },
    { name: 'Portafolio', href: '#proyectos' },
    { name: 'Contacto', href: '#contacto' }
  ];

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-[70] transition-all duration-500 flex justify-center px-4 ${isScrolled || isMobileMenuOpen ? 'pt-4' : 'pt-6'}`}>
        <div className={`w-full max-w-6xl flex items-center justify-between px-6 py-3 rounded-full transition-all duration-500 ${
          isMobileMenuOpen 
            ? 'bg-transparent border-transparent shadow-none' 
            : isScrolled 
              ? 'bg-white/85 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/50' 
              : 'bg-white/60 backdrop-blur-md shadow-sm border border-slate-200/30'
        }`}>
          
          <div className="flex items-center gap-3 cursor-pointer z-[71]">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:rotate-12 overflow-hidden p-1.5">
               <img src="/DLogo-v2.webp" alt="D" className="w-full h-full object-contain" />
            </div>
            <div className="leading-none hidden sm:block">
              <span className={`font-black text-xl tracking-tighter transition-colors ${isMobileMenuOpen ? 'text-white' : 'text-slate-900'}`}>DIGITALIZA</span>
              <span className="font-black text-xl tracking-tighter text-orange-500 ml-1">TODO</span>
            </div>
          </div>
          
          {/* NAVEGACIÓN DESKTOP */}
          <div className="hidden lg:flex items-center gap-1">
            <a href="#hero" className="text-slate-600 hover:text-slate-900 font-bold text-[11px] uppercase tracking-widest px-5 py-2.5 rounded-full hover:bg-slate-100 transition-all">
              Inicio
            </a>

            <MegaMenu 
              title="Servicios" href="#servicios"
              items={[
                { title: "Apps Web Escalables", desc: "Sistemas complejos con arquitecturas de alto rendimiento.", icon: Code2, colorClass: "bg-orange-50", iconColorClass: "text-orange-500", href: "#servicios" },
                { title: "Sitios Web Premium", desc: "Presencia digital de alto impacto con optimización SEO extrema.", icon: PanelsTopLeft, colorClass: "bg-blue-50", iconColorClass: "text-blue-500", href: "#servicios" },
                { title: "Software a Medida", desc: "Soluciones críticas diseñadas para optimizar tu lógica de negocio.", icon: Smartphone, colorClass: "bg-emerald-50", iconColorClass: "text-emerald-500", href: "#servicios" },
                { title: "Asesoría Técnica", desc: "Consultoría estratégica en automatización e inteligencia artificial.", icon: Lightbulb, colorClass: "bg-violet-50", iconColorClass: "text-violet-500", href: "#servicios" }
              ]}
              footerText="Transparencia total con precios claros desde el primer día."
              footerIcon={TrendingUp}
            />

            <MegaMenu 
              title="Portafolio" href="#proyectos"
              items={[
                { title: "Sistemas SaaS", desc: "La Ruta 11 y Pocos Click (Gastronomía).", icon: Monitor, colorClass: "bg-rose-50", iconColorClass: "text-rose-500", href: "#proyectos" },
                { title: "Integraciones IA", desc: "Agente RAG basado en LLMs y Python.", icon: Bot, colorClass: "bg-cyan-50", iconColorClass: "text-cyan-500", href: "#proyectos" },
                { title: "E-Commerce Auto", desc: "Automotora Online con WhatsApp API.", icon: Smartphone, colorClass: "bg-amber-50", iconColorClass: "text-amber-500", href: "#proyectos" },
                { title: "EdTech Corporativo", desc: "Matemágica y Colegio Agente RAG.", icon: PanelsTopLeft, colorClass: "bg-emerald-50", iconColorClass: "text-emerald-500", href: "#proyectos" }
              ]}
              footerText="Sistemas reales operando en todo Chile."
              footerIcon={ExternalLink}
            />

            <MegaMenu 
              title="Nosotros" href="#footer"
              items={[
                { title: "Software Factory", desc: "Laboratorio de innovación en Arica.", icon: Code2, colorClass: "bg-pink-50", iconColorClass: "text-pink-500", href: "#footer" },
                { title: "Enfoque en ROI", desc: "Desarrollamos con el éxito en mente.", icon: TrendingUp, colorClass: "bg-blue-50", iconColorClass: "text-blue-500", href: "#footer" },
                { title: "Agilidad", desc: "Entregas rápidas y transparentes.", icon: Rocket, colorClass: "bg-orange-50", iconColorClass: "text-orange-500", href: "#footer" },
                { title: "Soporte Dedicado", desc: "Monitoreo y mejora continua del sistema.", icon: HeartHandshake, colorClass: "bg-green-50", iconColorClass: "text-green-500", href: "#contacto" }
              ]}
              footerText="Transformamos ideas en soluciones extremadamente simples."
              footerIcon={Search}
            />
          </div>

          {/* BOTONES DERECHA */}
          <div className="flex items-center gap-3 z-[71]">
            <a href="https://app.digitalizatodo.cl/login" className={`font-bold text-xs uppercase tracking-widest transition-colors hidden sm:block mr-2 px-4 py-2 rounded-full ${isMobileMenuOpen ? 'text-slate-300 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>Ingresar</a>
            <a href="#contacto" className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-orange-500 transition-all shadow-md hover:shadow-orange-500/20 hidden md:block">Contactar</a>
            <button 
              className={`lg:hidden p-2 rounded-full transition-colors ${isMobileMenuOpen ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900'}`} 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* --- MENÚ MÓVIL INMERSIVO --- */}
      <div className={`fixed inset-0 z-[60] transition-all duration-500 ease-in-out lg:hidden ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl"></div>
        
        <div className={`relative h-full flex flex-col justify-center px-8 sm:px-12 transition-transform duration-700 delay-100 ${isMobileMenuOpen ? 'translate-y-0' : 'translate-y-12'}`}>
          <div className="flex flex-col gap-8">
            {navLinks.map((item, index) => (
              <a 
                key={item.name} 
                href={item.href} 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="text-4xl sm:text-5xl font-black text-slate-300 tracking-tighter hover:text-white transition-colors flex items-center group"
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <span className="w-0 group-hover:w-8 h-1 bg-orange-500 mr-0 group-hover:mr-6 transition-all duration-300 rounded-full"></span>
                {item.name}
              </a>
            ))}
            <a 
              href="#contacto" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="text-4xl sm:text-5xl font-black text-orange-500 tracking-tighter hover:text-orange-400 transition-colors mt-4 line-height-1"
              style={{ transitionDelay: `${navLinks.length * 50}ms` }}
            >
              Contactar
            </a>
          </div>

          <div className={`mt-20 border-t border-slate-800 pt-8 transition-opacity duration-1000 delay-500 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Síguenos</p>
            <div className="flex gap-4">
              <a href="#" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-orange-500 transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-orange-500 transition-colors"><Linkedin className="w-5 h-5" /></a>
            </div>
            <p className="text-slate-400 font-medium mt-8 flex items-center gap-2">
              <Mail className="w-4 h-4 text-orange-500" /> contacto@digitalizatodo.cl
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModernNavbar;
