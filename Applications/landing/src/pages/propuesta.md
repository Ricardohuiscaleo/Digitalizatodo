import React, { useState } from 'react';
import { 
  Menu, X, ArrowRight, Zap, Smartphone, Globe, 
  BarChart, Video, Settings, Code, Mail, 
  Linkedin, Instagram, Github, ArrowUpRight,
  LayoutGrid, MousePointer2, Layers,
  GitBranch, Database, LayoutTemplate, CheckCircle2,
  Search, PenTool, Server, Rocket
} from 'lucide-react';

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const services = [
    {
      title: "Apps Web",
      price: "$449.890",
      desc: "Desarrollo de aplicaciones escalables. Foco en rendimiento.",
      tags: ["React", "SaaS"],
      color: "bg-rose-50 border-rose-200 text-rose-700",
      iconColor: "text-rose-500",
      icon: <Smartphone size={24} />
    },
    {
      title: "Páginas Web",
      price: "$149.890",
      desc: "Sitios corporativos optimizados. Carga rápida y diseño responsivo.",
      tags: ["SEO", "Landing"],
      color: "bg-emerald-50 border-emerald-200 text-emerald-700",
      iconColor: "text-emerald-500",
      icon: <Globe size={24} />
    },
    {
      title: "Marketing Digital",
      price: "$30.000 / h",
      desc: "Estrategias de crecimiento y posicionamiento de marca.",
      tags: ["Ads", "Strategy"],
      color: "bg-amber-50 border-amber-200 text-amber-700",
      iconColor: "text-amber-500",
      icon: <BarChart size={24} />
    },
    {
      title: "Software a Medida",
      price: "$124.890 / mes",
      desc: "Arquitectura robusta para procesos complejos de tu negocio.",
      tags: ["API", "Cloud"],
      color: "bg-violet-50 border-violet-200 text-violet-700",
      iconColor: "text-violet-500",
      icon: <Code size={24} />
    },
    {
      title: "Soluciones Digitales",
      price: "$124.890 / mes",
      desc: "Automatización de flujos de trabajo e integración de sistemas.",
      tags: ["Auto", "Integración"],
      color: "bg-cyan-50 border-cyan-200 text-cyan-700",
      iconColor: "text-cyan-500",
      icon: <Settings size={24} />
    },
    {
      title: "Contenido RSS",
      price: "$19.890",
      desc: "Creación de contenido visual y audiovisual profesional.",
      tags: ["Foto", "Video"],
      color: "bg-pink-50 border-pink-200 text-pink-700",
      iconColor: "text-pink-500",
      icon: <Video size={24} />
    }
  ];

  const projects = [
    {
      name: "La Ruta 11",
      category: "Punto de Venta",
      stack: "Astro • React • MySQL",
      theme: "bg-blue-50 border-blue-200"
    },
    {
      name: "Matemágica",
      category: "EdTech & IA",
      stack: "PWA • IA • Supabase",
      theme: "bg-purple-50 border-purple-200"
    },
    {
      name: "Agente RAG",
      category: "Inteligencia Artificial",
      stack: "Python • LLM • React",
      theme: "bg-teal-50 border-teal-200"
    },
    {
      name: "Estudio Jurídico",
      category: "Sitio Corporativo",
      stack: "Astro • SEO • UX/UI",
      theme: "bg-slate-50 border-slate-200"
    }
  ];

  // Nuevo Roadmap: Unificado y Profesional
  const roadmap = [
    {
      step: "01",
      title: "Requerimientos",
      desc: "Levantamiento de procesos y definición de lógica de negocio.",
      simple: "Entendemos tu problema.",
      icon: <Search size={20} />,
    },
    {
      step: "02",
      title: "Arquitectura",
      desc: "Diseño de bases de datos y estructura del sistema.",
      simple: "Diseñamos los cimientos.",
      icon: <Server size={20} />,
    },
    {
      step: "03",
      title: "Desarrollo",
      desc: "Programación de interfaz (UI) y lógica (Backend).",
      simple: "Construimos el software.",
      icon: <Code size={20} />,
    },
    {
      step: "04",
      title: "Despliegue",
      desc: "Puesta en producción y entrega final al cliente.",
      simple: "Tu sistema funcionando.",
      icon: <Rocket size={20} />,
    }
  ];

  return (
    // FONDO TIPO DOT GRID (Papel milimétrico)
    <div className="font-sans text-slate-600 min-h-screen selection:bg-indigo-100 selection:text-indigo-900 bg-[#fafafa] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px]">
      
      {/* --- HEADER FLOTANTE --- */}
      <div className="fixed top-6 left-0 w-full z-50 px-4 md:px-6">
        <header className="max-w-5xl mx-auto bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-sm h-16 px-6 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollTo('hero')}>
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold transform -rotate-3">D</div>
              <span className="font-bold text-slate-800 tracking-tight">Digitaliza<span className="font-normal text-slate-400">Todo</span></span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {['Servicios', 'Proyectos', 'Nosotros'].map(item => (
                <button 
                  key={item} 
                  onClick={() => scrollTo(item.toLowerCase())}
                  className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                >
                  {item}
                </button>
              ))}
              <div className="w-px h-6 bg-slate-200 mx-2"></div>
              <button 
                onClick={() => scrollTo('contacto')}
                className="bg-slate-900 text-white px-5 py-2 text-sm font-medium rounded-lg hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-200"
              >
                Hablemos
              </button>
            </nav>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden text-slate-800 p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
        </header>

         {/* Mobile Menu Dropdown */}
         {isMenuOpen && (
          <div className="absolute top-20 left-4 right-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xl md:hidden z-50">
            {['Servicios', 'Proyectos', 'Nosotros', 'Contacto'].map(item => (
              <button 
                key={item} 
                onClick={() => scrollTo(item.toLowerCase())}
                className="w-full text-left text-lg font-medium text-slate-600 py-3 border-b border-slate-50 last:border-0 hover:text-indigo-600"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* --- HERO SECTION --- */}
      <section id="hero" className="pt-40 pb-20 px-6 relative overflow-hidden">
        {/* Decorative Grid Lines */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-slate-200 to-transparent dashed opacity-50"></div>
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dashed opacity-50"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-mono font-semibold mb-8">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            STATUS: DISPONIBLE v2.0
          </div>
          
          <h1 className="text-4xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight leading-[1.1]">
            Transformamos Ideas en <br />
            <span className="relative inline-block">
               <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Potencia Digital</span>
               <svg className="absolute w-full h-3 -bottom-1 left-0 text-indigo-200 z-0" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
            </span>
          </h1>
          
          <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Desarrollo de software a medida, automatización con IA y estrategias digitales que generan resultados medibles. Liderados por expertos, diseñados para escalar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => scrollTo('proyectos')}
              className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all w-full sm:w-auto shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2 group"
            >
              <LayoutGrid size={18} className="text-slate-400 group-hover:text-white transition-colors"/>
              Ver Portafolio
            </button>
            <button 
              onClick={() => scrollTo('servicios')}
              className="px-8 py-4 bg-white text-slate-700 border-2 border-slate-100 rounded-xl font-bold hover:border-indigo-200 hover:text-indigo-600 transition-all w-full sm:w-auto flex items-center justify-center gap-2"
            >
              Explorar Servicios
            </button>
          </div>
        </div>
      </section>

      {/* --- STATS (Technical Cards) --- */}
      <section className="max-w-6xl mx-auto px-6 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Ahorro", val: "$457M", color: "bg-green-50 border-green-200 text-green-700" },
            { label: "APIs", val: "+5k", color: "bg-blue-50 border-blue-200 text-blue-700" },
            { label: "Entregas", val: "+50", color: "bg-purple-50 border-purple-200 text-purple-700" },
            { label: "Exp.", val: "14 Años", color: "bg-orange-50 border-orange-200 text-orange-700" }
          ].map((stat, i) => (
            <div key={i} className={`p-4 rounded-xl border-2 ${stat.color} text-center transition-transform hover:-translate-y-1`}>
              <div className="text-2xl md:text-3xl font-bold mb-1 tracking-tight">{stat.val}</div>
              <div className="text-xs font-mono uppercase tracking-widest opacity-80">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* --- PROCESS TIMELINE (Unified Flow) --- */}
      <section className="py-12 px-6 max-w-6xl mx-auto mb-20">
        <div className="text-center mb-10">
           <h3 className="text-sm font-mono text-slate-400 font-bold uppercase tracking-wider mb-2">Flujo de Trabajo</h3>
           <h2 className="text-2xl font-bold text-slate-800">Ciclo de Desarrollo</h2>
        </div>
        
        <div className="relative">
           {/* Line Connector (Desktop) */}
           <div className="hidden md:block absolute top-8 left-0 w-full h-0.5 bg-slate-200 z-0"></div>
           {/* Line Connector (Mobile) */}
           <div className="md:hidden absolute top-0 left-8 w-0.5 h-full bg-slate-200 z-0"></div>

           <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
              {roadmap.map((item, idx) => (
                <div key={idx} className="flex md:flex-col items-start md:items-center gap-4 md:gap-6 group">
                   
                   {/* Step Circle - Monochrome/Indigo Theme */}
                   <div className="w-16 h-16 rounded-full flex items-center justify-center border-4 border-white bg-indigo-50 text-indigo-600 shadow-md group-hover:bg-indigo-600 group-hover:text-white transition-colors relative z-10 shrink-0">
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white">
                        {item.step}
                      </div>
                      {item.icon}
                   </div>

                   {/* Content Card */}
                   <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex-1 md:w-full md:text-center hover:border-indigo-200 transition-all">
                      <h4 className="font-bold text-slate-900 mb-1 text-lg">{item.title}</h4>
                      <p className="text-xs font-mono text-slate-400 mb-3">{item.desc}</p>
                      
                      {/* Human-readable simple text (Neutral Color, styled as a highlight) */}
                      <div className="text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg inline-block border border-slate-100">
                        {item.simple}
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* --- SERVICES (Colorful Pastel Grid) --- */}
      <section id="servicios" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-px bg-slate-300 flex-1"></div>
            <h2 className="text-2xl font-bold text-slate-400 uppercase tracking-widest font-mono">Servicios & Costos</h2>
            <div className="h-px bg-slate-300 flex-1"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, idx) => (
              <div 
                key={idx} 
                className={`p-8 rounded-2xl border ${service.color} hover:shadow-lg transition-all duration-300 group hover:-translate-y-1 bg-white relative overflow-hidden`}
              >
                {/* Corner Decoration */}
                <div className="absolute top-0 right-0 p-4 opacity-50">
                    <div className={`w-16 h-16 rounded-full bg-current opacity-5 blur-xl ${service.iconColor}`}></div>
                </div>

                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className={`p-3 rounded-xl bg-white border shadow-sm ${service.iconColor} border-slate-100`}>
                    {service.icon}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold bg-white border shadow-sm ${service.color.split(' ')[2]}`}>
                    {service.tags[0]}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-2 relative z-10">
                  {service.title}
                </h3>
                
                <p className="text-slate-500 mb-6 text-sm leading-relaxed min-h-[40px] relative z-10">
                  {service.desc}
                </p>

                <div className="pt-6 border-t border-dashed border-slate-200 flex items-center justify-between relative z-10">
                  <span className="text-lg font-bold text-slate-800 font-mono tracking-tight">{service.price}</span>
                  <button className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-indigo-600 transition-colors">
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- PROJECTS (Construction Blueprints) --- */}
      <section id="proyectos" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
               <div className="text-sm font-mono text-indigo-500 font-bold mb-2">PORTAFOLIO v2024</div>
               <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Proyectos Desplegados</h2>
            </div>
            <a href="#" className="hidden md:flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium">
              Ver todos <ArrowRight size={16} />
            </a>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {projects.map((project, idx) => (
              <div 
                key={idx} 
                className={`group p-1 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-xl hover:shadow-indigo-100/50 cursor-pointer`}
              >
                <div className={`h-full p-6 rounded-xl ${project.theme} bg-opacity-30 flex flex-col justify-between`}>
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-bold uppercase tracking-wider bg-white/80 px-2 py-1 rounded text-slate-500 backdrop-blur-sm">
                                {project.category}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                                <MousePointer2 size={16} />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">{project.name}</h3>
                    </div>
                    
                    <div className="mt-8 pt-4 border-t border-slate-200/50 border-dashed flex items-center justify-between">
                         <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
                             <Layers size={14} />
                             {project.stack}
                         </div>
                         <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- ABOUT (Blueprint Style) --- */}
      <section id="nosotros" className="py-24 px-6 bg-white border-y border-slate-100 relative overflow-hidden">
         {/* Fondo decorativo sutil */}
         <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:30px_30px] opacity-50"></div>
         
         <div className="max-w-5xl mx-auto relative z-10">
            <div className="bg-white/80 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-slate-200 shadow-xl text-center">
               <div className="inline-block p-3 rounded-2xl bg-indigo-50 text-indigo-600 mb-6">
                  <Zap size={32} />
               </div>
               
               <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">
                 Ingeniería + Negocios
               </h2>
               
               <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                 "No solo escribimos código. Diseñamos sistemas que generan rentabilidad. Liderados por <strong>Ricardo Huiscaleo</strong>, Ingeniero con certificación <strong>Lean Six Sigma Black Belt</strong>."
               </p>

               <div className="flex flex-wrap justify-center gap-4">
                  <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 font-mono">
                     Misión: Digitalizar Chile
                  </div>
                  <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 font-mono">
                     Visión: Acceso Universal
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- CONTACT (Clean Workspace) --- */}
      <section id="contacto" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
             <h2 className="text-3xl font-bold text-slate-900 mb-2">Mesa de Ayuda & Cotizaciones</h2>
             <p className="text-slate-500">Completa la ficha técnica de tu proyecto.</p>
          </div>

          <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-xl">
             <form className="bg-slate-50/50 p-6 md:p-10 rounded-[1.2rem] border border-slate-100">
                 <div className="grid md:grid-cols-2 gap-6 mb-6">
                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase text-slate-400 tracking-wider ml-1">Cliente</label>
                     <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" placeholder="Nombre completo" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase text-slate-400 tracking-wider ml-1">Contacto</label>
                     <input type="email" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" placeholder="correo@empresa.cl" />
                   </div>
                 </div>
                 <div className="space-y-2 mb-8">
                   <label className="text-xs font-bold uppercase text-slate-400 tracking-wider ml-1">Requerimiento</label>
                   <textarea rows="4" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none resize-none" placeholder="Detalles del sistema o sitio web a desarrollar..."></textarea>
                 </div>
                 
                 <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
                   <Mail size={20} /> Enviar Solicitud
                 </button>
             </form>
          </div>

          <div className="mt-12 flex justify-center gap-8 opacity-60 hover:opacity-100 transition-opacity">
             <Linkedin className="cursor-pointer hover:text-indigo-600 transition-colors" />
             <Instagram className="cursor-pointer hover:text-pink-600 transition-colors" />
             <Github className="cursor-pointer hover:text-slate-900 transition-colors" />
          </div>
          <div className="text-center mt-8 text-xs font-mono text-slate-400">
             © 2024 DIGITALIZA TODO SPA • RM, CHILE
          </div>
        </div>
      </section>

    </div>
  );
};

export default App;