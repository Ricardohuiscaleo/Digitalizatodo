import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowRight } from "lucide-react";
import { Typewriter } from "./Typewriter";
import './HeroSection.css';

export function HeroSection() {
    return (
        <section
            id="hero"
            className="relative overflow-hidden z-10 flex items-center justify-center px-4"
            style={{
                minHeight: '100vh',
                paddingTop: 'clamp(5rem, 12vh, 10rem)',
                paddingBottom: 'clamp(3rem, 8vh, 6rem)'
            }}
        >
            <div className="w-full max-w-7xl mx-auto text-center relative z-10 space-y-10">
                <div className="hero-animate-fade-in-up inline-flex items-center gap-2 mb-2 px-4 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-xl text-xs font-bold tracking-[0.2em] text-indigo-400 uppercase">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    Prototipos Funcionales en 48 Horas
                </div>

                <h1
                    className="hero-animate-fade-in-scale font-black text-white tracking-tight leading-[0.95]"
                    style={{ fontSize: 'clamp(2.5rem, 10vw, 9.5rem)' }}
                >
                    <span className="block text-slate-200">
                        Ingeniería en
                    </span>
                    <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-300 to-slate-400">
                        Software Factory
                    </span>
                </h1>

                <p
                    className="hero-animate-fade-in-up hero-delay-150 text-slate-400 max-w-2xl mx-auto leading-relaxed font-light"
                    style={{ fontSize: 'clamp(1.1rem, 2vw, 1.35rem)' }}
                >
                    No solo escribimos código. Diseñamos sistemas de <span className="text-white font-medium">clase mundial</span> que reducen los costos operacionales de tu <Typewriter
                        words={["Logística", "Gimnasio", "Academia", "Colegio", "Clínica", "Estudio de abogados"]}
                        typingSpeed={80}
                        deletingSpeed={40}
                        pauseTime={1500}
                    />
                </p>

                <div className="hero-animate-fade-in-up hero-delay-600 flex flex-col sm:flex-row gap-5 justify-center items-center pt-8">
                    <Button
                        size="lg"
                        className="group relative h-16 px-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all hover:scale-[1.02] active:scale-95 border border-white/10 gap-3 shadow-[0_20px_50px_rgba(79,70,229,0.3)]"
                        onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Iniciar Proyecto
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="lg"
                        className="h-16 px-10 rounded-xl text-slate-300 font-semibold hover:bg-white/5 transition-all border border-white/5"
                        onClick={() => window.location.href = 'https://app.digitalizatodo.cl/login'}
                    >
                        Acceso Clientes
                    </Button>
                </div>
            </div>
        </section>
    );
}
