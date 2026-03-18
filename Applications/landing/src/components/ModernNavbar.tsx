import React, { useState, useEffect } from 'react';
import { 
  Menu, X, ArrowRight, Code2, Rocket, HeartHandshake, 
  Search, PanelsTopLeft, Monitor, Smartphone,
  Lightbulb, ExternalLink, TrendingUp, Bot,
  Mail, Linkedin, ChevronDown 
} from 'lucide-react';

const MegaMenu = ({ title, items, footerText, footerIcon: FooterIcon, href }: { title: string, items: any[], footerText?: string, footerIcon?: any, href: string }) => (
  <div className="relative group">
    <a href={href} className="text-slate-600 hover:text-slate-900 font-bold text-[11px] uppercase tracking-widest px-5 py-2.5 rounded-full hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer">
      {title} <ChevronDown className="w-3 h-3 group-hover:rotate-180 transition-transform duration-300" />
    </a>
    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-4 group-hover:translate-y-0 transition-all duration-300 ease-out z-[80]">
      <div className="w-[600px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 grid grid-cols-2 gap-4">
        {items.map((item, idx) => (
          <a key={idx} href={item.href} className="p-4 rounded-2xl hover:bg-slate-50 transition-colors group/card block text-left bg-white border border-slate-100/50 shadow-sm">
            <div className="p-3 rounded-2xl bg-white border border-slate-50 flex items-center justify-center transition-transform duration-500 group-hover/card:scale-110 shadow-sm">
              <item.icon className={`w-6 h-6 ${item.iconColorClass}`} />
            </div>
            <h5 className="font-bold text-slate-900 text-sm mb-1">{item.title}</h5>
            <p className="text-xs text-slate-500 line-clamp-2">{item.desc}</p>
          </a>
        ))}
        {footerText && FooterIcon && (
          <div className="col-span-2 mt-2 bg-slate-900 rounded-2xl p-5 flex items-center justify-between group/insight cursor-pointer hover:bg-slate-800 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center shadow-lg overflow-hidden p-1.5">
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

const ModernNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Inicio', href: '#hero' },
    { name: 'Servicios', href: '#servicios' },
    { name: 'Portafolio', href: '#proyectos' },
    { name: 'Contacto', href: '#contacto' },
  ];

  return (
    <>
    <header className={`fixed top-0 left-0 right-0 z-[70] transition-all duration-500 flex justify-center px-4 ${isScrolled || isMobileMenuOpen ? 'pt-4' : 'pt-6'}`}>
      <div className={`w-full max-w-6xl transition-all duration-200 ${
        isMobileMenuOpen
          ? 'bg-slate-950/90 backdrop-blur-xl border border-slate-800 shadow-2xl rounded-3xl'
          : isScrolled
            ? 'bg-white/85 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/50 rounded-full'
            : 'bg-white/60 backdrop-blur-md shadow-sm border border-slate-200/30 rounded-full'
      }`}>

        {/* FILA PRINCIPAL */}
        <div className="flex items-center justify-between px-6 py-3">

          {/* LOGO */}
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:rotate-12 overflow-hidden p-1.5">
              <img src="/DLogo-v2.webp" alt="D" className="w-full h-full object-contain" />
            </div>
            <div className="leading-none flex flex-row items-center sm:block">
              <span className={`font-black text-[13px] sm:text-lg tracking-tighter transition-colors ${isMobileMenuOpen ? 'text-white' : 'text-slate-900'}`}>DIGITALIZA</span>
              <span className="font-black text-[13px] sm:text-lg tracking-tighter text-orange-500 ml-1">TODO</span>
            </div>
          </div>

          {/* NAV DESKTOP */}
          <div className="hidden lg:flex items-center gap-1">
            <a href="#hero" className="text-slate-600 hover:text-slate-900 font-bold text-[11px] uppercase tracking-widest px-5 py-2.5 rounded-full hover:bg-slate-100 transition-all">
              Inicio
            </a>
            <MegaMenu
              title="Servicios" href="#servicios"
              items={[
                { title: "Apps Web Escalables", desc: "Sistemas complejos con arquitecturas de alto rendimiento.", icon: Code2, iconColorClass: "text-orange-500", href: "#servicios" },
                { title: "Sitios Web Premium", desc: "Presencia digital de alto impacto con optimización SEO extrema.", icon: PanelsTopLeft, iconColorClass: "text-blue-500", href: "#servicios" },
                { title: "Software a Medida", desc: "Soluciones críticas diseñadas para optimizar tu lógica de negocio.", icon: Smartphone, iconColorClass: "text-emerald-500", href: "#servicios" },
                { title: "Asesoría Técnica", desc: "Consultoría estratégica en automatización e inteligencia artificial.", icon: Lightbulb, iconColorClass: "text-violet-500", href: "#servicios" },
              ]}
              footerText="Transparencia total con precios claros desde el primer día."
              footerIcon={TrendingUp}
            />
            <MegaMenu
              title="Portafolio" href="#proyectos"
              items={[
                { title: "Sistemas SaaS", desc: "La Ruta 11 y Pocos Click (Gastronomía).", icon: Monitor, iconColorClass: "text-rose-500", href: "#proyectos" },
                { title: "Integraciones IA", desc: "Agente RAG basado en LLMs y Python.", icon: Bot, iconColorClass: "text-cyan-500", href: "#proyectos" },
                { title: "E-Commerce Auto", desc: "Automotora Online con WhatsApp API.", icon: Smartphone, iconColorClass: "text-amber-500", href: "#proyectos" },
                { title: "EdTech Corporativo", desc: "Matemágica y Colegio Agente RAG.", icon: PanelsTopLeft, iconColorClass: "text-emerald-500", href: "#proyectos" },
              ]}
              footerText="Sistemas reales operando en todo Chile."
              footerIcon={ExternalLink}
            />
            <MegaMenu
              title="Nosotros" href="#footer"
              items={[
                { title: "Software Factory", desc: "Laboratorio de innovación en Arica.", icon: Code2, iconColorClass: "text-pink-500", href: "#footer" },
                { title: "Enfoque en ROI", desc: "Desarrollamos con el éxito en mente.", icon: TrendingUp, iconColorClass: "text-blue-500", href: "#footer" },
                { title: "Agilidad", desc: "Entregas rápidas y transparentes.", icon: Rocket, iconColorClass: "text-orange-500", href: "#footer" },
                { title: "Soporte Dedicado", desc: "Monitoreo y mejora continua del sistema.", icon: HeartHandshake, iconColorClass: "text-green-500", href: "#contacto" },
              ]}
              footerText="Transformamos ideas en soluciones extremadamente simples."
              footerIcon={Search}
            />
          </div>

          {/* BOTONES DERECHA */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a href="https://app.digitalizatodo.cl" target="_blank" rel="noopener noreferrer"
              className={`font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all px-3 sm:px-4 py-2 rounded-full border ${isMobileMenuOpen ? 'text-white border-white/20 hover:bg-white/10' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
              Ingresar
            </a>
            <a href="#contacto" className="bg-slate-900 text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-[10px] sm:text-xs uppercase tracking-widest hover:bg-orange-500 transition-all shadow-md hover:shadow-orange-500/20 hidden xs:block">
              Contactar
            </a>
            <button
              className={`lg:hidden p-2 rounded-full transition-colors ${isMobileMenuOpen ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900'}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* MENÚ MÓVIL EXPANDIBLE */}
        <div className={`lg:hidden overflow-hidden transition-all duration-200 ease-out ${isMobileMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-6 pb-6 flex flex-col gap-1">
            {navLinks.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between py-3.5 border-b border-slate-800 group"
              >
                <span className="text-lg font-black text-slate-300 tracking-tight group-hover:text-white transition-colors">{item.name}</span>
                <ChevronDown className="w-4 h-4 text-slate-600 -rotate-90 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
              </a>
            ))}
            <a
              href="https://app.digitalizatodo.cl"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between py-3.5 border-b border-slate-800 group"
            >
              <span className="text-lg font-black text-yellow-400 tracking-tight">Ingresar a mi App</span>
              <ChevronDown className="w-4 h-4 text-slate-600 -rotate-90 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
            </a>

            <div className="pt-4 flex flex-col gap-3">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Hablemos</p>
              <div className="flex items-center justify-between w-full">
                <a href="https://wa.me/56945392581" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center hover:bg-green-500/20 transition-colors">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-green-400"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </div>
                  <span className="font-bold text-xs hidden sm:block">WhatsApp</span>
                </a>
                <a href="https://t.me/+56922504275" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center hover:bg-blue-500/20 transition-colors">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-blue-400"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  </div>
                  <span className="font-bold text-xs hidden sm:block">Telegram</span>
                </a>
                <a href="https://www.linkedin.com/in/rhuiscaleo/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                  <div className="w-10 h-10 rounded-full bg-blue-700/10 flex items-center justify-center hover:bg-blue-700/20 transition-colors">
                    <Linkedin className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="font-bold text-xs hidden sm:block">LinkedIn</span>
                </a>
                <a href="mailto:info@digitalizatodo.cl" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center hover:bg-orange-500/20 transition-colors">
                    <Mail className="w-5 h-5 text-orange-400" />
                  </div>
                  <span className="font-bold text-xs hidden sm:block">Correo</span>
                </a>
              </div>

            </div>
          </div>
        </div>

      </div>
    </header>

    {/* OVERLAY BLUR FONDO */}
    <div
      className={`fixed inset-0 z-[60] backdrop-blur-sm bg-slate-900/40 transition-all duration-200 lg:hidden ${
        isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => setIsMobileMenuOpen(false)}
    />
    </>
  );
};

export default ModernNavbar;
