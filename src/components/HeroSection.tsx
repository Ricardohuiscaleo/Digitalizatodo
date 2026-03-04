import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowRight } from "lucide-react";
import './HeroSection.css';

export function HeroSection() {
    return (
        <section
            id="hero"
            className="relative overflow-hidden z-10 flex items-center justify-center px-4"
            style={{
                minHeight: '90vh',
                paddingTop: 'clamp(6rem, 15vh, 12rem)',
                paddingBottom: 'clamp(4rem, 10vh, 8rem)'
            }}
        >
            <div className="w-full max-w-7xl xl:max-w-[1450px] 2xl:max-w-[1650px] 3xl:max-w-[1850px] 4xl:max-w-[2100px] mx-auto text-center relative z-10 space-y-8">
                <div className="hero-animate-fade-in-up inline-block mb-4 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md text-xs md:text-sm font-semibold tracking-wide text-indigo-600 dark:text-indigo-400">
                    Bienvenido al futuro de tu negocio
                </div>

                <h1
                    className="hero-animate-fade-in-scale font-black text-slate-900 dark:text-white tracking-tighter leading-[1.1]"
                    style={{ fontSize: 'clamp(1.25rem, 8vw, 8rem)' }}
                >
                    <span className="block md:whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-b from-slate-200 via-slate-400 to-slate-800">
                        Transformamos Ideas en
                    </span>
                    <span className="relative inline-block mt-4 md:whitespace-nowrap">
                        <span
                            className="hero-gradient-text relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 pr-2 pb-1"
                            style={{ filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.15))' }}
                        >
                            Soluciones Digitales
                        </span>
                    </span>
                </h1>

                <p
                    className="hero-animate-fade-in-up hero-delay-150 text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium"
                    style={{ fontSize: 'clamp(1rem, 2.5vw, 1.5rem)' }}
                >
                    Desarrollo de software y páginas web con lógica de negocio, automatización de procesos y estrategias digitales que <strong className="text-emerald-500">reducen costos</strong>.
                </p>

                <div className="hero-animate-fade-in-up hero-delay-600 flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center items-center pt-6">
                    <Button
                        size="lg"
                        className="group relative w-[85%] sm:w-auto text-xl h-16 px-10 mx-auto sm:mx-0 rounded-2xl bg-indigo-600 hover:bg-indigo-400 text-white font-black transition-all hover:scale-105 active:scale-95 border-2 border-[#7c6d64] hover:border-indigo-400 gap-3 overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.6)]"
                        onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        {/* Glowing Background Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 opacity-100 group-hover:opacity-90 transition-opacity"></div>

                        {/* Refined Shine Effect Animation (CSS-only) */}
                        <div className="hero-btn-shine" />

                        <span className="relative z-10 flex items-center gap-3">
                            Hablemos
                            <div className="hero-icon-float">
                                <MessageCircle className="w-6 h-6 fill-white/10" />
                            </div>
                        </span>

                        {/* Outer Glow */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity -z-10 animate-pulse"></div>
                    </Button>
                    <Button
                        variant="ghost"
                        size="lg"
                        className="group w-[85%] sm:w-auto text-xl h-16 px-6 mx-auto sm:mx-0 text-[#92817a] dark:text-[#92817a] font-extrabold hover:bg-transparent transition-all gap-3 relative"
                        onClick={() => document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        <span className="relative">
                            Explorar Servicios
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#92817a] transition-all group-hover:w-full"></span>
                        </span>
                        <div className="transition-transform group-hover:translate-x-2">
                            <ArrowRight className="w-7 h-7 text-[#92817a]" />
                        </div>
                    </Button>
                </div>
            </div>
        </section>
    );
}
