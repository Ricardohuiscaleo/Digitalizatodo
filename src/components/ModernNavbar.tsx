import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const ModernNavbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        { name: 'Inicio', href: '#hero' },
        { name: 'Servicios', href: '#servicios' },
        { name: 'Portafolio', href: '#proyectos' },
        { name: 'Contacto', href: '#contacto' }
    ];

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-4 ${
                isScrolled ? 'bg-white/90 backdrop-blur-xl shadow-lg border-b border-slate-100' : 'bg-transparent'
            }`}>
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img 
                            src="/DLogo-v2.webp" 
                            alt="Digitaliza Todo" 
                            className="h-10 w-10 object-contain"
                            fetchPriority="high"
                        />
                        <div className="leading-none">
                            <span className="font-black text-xl tracking-tighter text-slate-900">DIGITALIZA</span>
                            <span className="font-black text-xl tracking-tighter text-brand-orange block sm:inline sm:ml-1">TODO</span>
                        </div>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden lg:flex items-center gap-10">
                        {navItems.map((item) => (
                            <a 
                                key={item.name} 
                                href={item.href} 
                                className="text-slate-600 hover:text-brand-orange font-black text-xs uppercase tracking-[0.2em] transition-all relative group"
                            >
                                {item.name}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-orange transition-all group-hover:w-full"></span>
                            </a>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <a 
                            href="https://app.digitalizatodo.cl/login" 
                            className="text-slate-900 font-black text-xs uppercase tracking-widest hover:text-brand-orange transition-colors hidden sm:block mr-4"
                        >
                            Ingresar
                        </a>
                        <a 
                            href="#contacto" 
                            className="bg-brand-orange text-white px-8 py-3 rounded-full font-black text-sm uppercase tracking-widest hover:bg-orange-600 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-orange-500/20 hidden md:block"
                        >
                            Empezar
                        </a>

                        {/* Hamburger Button */}
                        <button 
                            className="lg:hidden p-2 text-slate-900 hover:text-brand-orange transition-colors"
                            onClick={() => setIsOpen(true)}
                        >
                            <Menu className="w-8 h-8" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Overlay Menu */}
            <div className={`fixed inset-0 z-[100] bg-white transition-all duration-500 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-8 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-16">
                        <div className="flex items-center gap-3">
                            <img src="/DLogo-v2.webp" alt="Digitaliza Todo" className="h-10 w-10" loading="lazy" />
                            <span className="font-black text-xl tracking-tighter text-slate-900">DIGITALIZA <span className="text-brand-orange">TODO</span></span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2">
                            <X className="w-8 h-8 text-slate-900" />
                        </button>
                    </div>

                    <div className="flex flex-col gap-8">
                        {navItems.map((item) => (
                            <a 
                                key={item.name} 
                                href={item.href} 
                                onClick={() => setIsOpen(false)}
                                className="text-4xl font-black text-slate-900 tracking-tighter hover:text-brand-orange transition-colors"
                            >
                                {item.name}
                            </a>
                        ))}
                    </div>

                    <div className="mt-auto py-8 border-t border-slate-100">
                        <a 
                            href="#contacto" 
                            onClick={() => setIsOpen(false)}
                            className="block w-full text-center bg-brand-orange text-white py-5 rounded-3xl font-black text-xl shadow-xl shadow-orange-500/30"
                        >
                            Agendar Consultoría
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ModernNavbar;
