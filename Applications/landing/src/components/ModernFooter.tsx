import React from 'react';
import { Instagram, Linkedin, Twitter } from 'lucide-react';

const ModernFooter = () => {
    return (
        <footer className="bg-slate-950 pt-32 pb-12 px-[5px] sm:px-6 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[120px] -z-0"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-brand-blue/5 rounded-full blur-[100px] -z-0"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-16 mb-24">
                    {/* Brand Section */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center shadow-2xl overflow-hidden p-2">
                                <img src="/DLogo-v2.webp" alt="Digitaliza Todo" className="h-full w-full object-contain" />
                            </div>
                            <div>
                                <h2 className="font-black text-2xl tracking-tighter text-white leading-none">DIGITALIZA</h2>
                                <h2 className="font-black text-2xl tracking-tighter text-brand-orange leading-none">TODO</h2>
                            </div>
                        </div>
                        <p className="text-slate-400 text-lg leading-relaxed font-medium max-w-sm">
                            Laboratorio de ingeniería de software enfocado en transformar la complejidad técnica en <span className="text-white">ventaja competitiva</span> sostenible.
                        </p>
                        <div className="flex gap-4">
                            {[Instagram, Linkedin, Twitter].map((Icon, i) => (
                                <a key={i} href="#" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-brand-orange hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all transform hover:-translate-y-1 group">
                                    <Icon className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links Group */}
                    <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-12">
                        <div className="space-y-8">
                            <h4 className="text-white font-black uppercase tracking-[0.2em] text-[10px]">Soluciones</h4>
                            <ul className="space-y-4">
                                {['Software Factory', 'E-commerce Pro', 'Automatización IA', 'SaaS Development'].map((item) => (
                                    <li key={item}>
                                        <a href="#" className="text-slate-400 hover:text-brand-orange transition-all flex items-center group">
                                            <span className="w-0 group-hover:w-2 h-0.5 bg-brand-orange mr-0 group-hover:mr-2 transition-all"></span>
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-8">
                            <h4 className="text-white font-black uppercase tracking-[0.2em] text-[10px]">Compañía</h4>
                            <ul className="space-y-4">
                                {['Nuestro Método', 'Casos de Éxito', 'Blog Tech', 'Contacto'].map((item) => (
                                    <li key={item}>
                                        <a href="#" className="text-slate-400 hover:text-brand-orange transition-all flex items-center group">
                                            <span className="w-0 group-hover:w-2 h-0.5 bg-brand-orange mr-0 group-hover:mr-2 transition-all"></span>
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-8 col-span-2 sm:col-span-1">
                            <h4 className="text-white font-black uppercase tracking-[0.2em] text-[10px]">Ubicación</h4>
                            <div className="space-y-4">
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Santiago, Chile <br />
                                    <span className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Horario: Lu-Vi / 9:00 - 18:00</span>
                                </p>
                                <div className="p-4 rounded-3xl bg-white/5 border border-white/5 space-y-2">
                                    <p className="text-white text-xs font-black tracking-widest uppercase">¿Listo para empezar?</p>
                                    <p className="text-brand-orange text-xs font-bold hover:underline transition-all">
                                        <a href="mailto:contacto@digitalizatodo.cl">contacto@digitalizatodo.cl</a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6">
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
                            © 2026 Digitaliza Todo SpA
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-8">
                        {['Términos', 'Privacidad', 'Seguridad'].map((item) => (
                            <a key={item} href="#" className="text-slate-600 hover:text-slate-400 text-[10px] font-black uppercase tracking-widest transition-colors">
                                {item}
                            </a>
                        ))}
                        <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
                            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Systems: Operational</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default ModernFooter;
