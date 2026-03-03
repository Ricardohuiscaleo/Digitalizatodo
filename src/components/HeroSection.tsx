import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowRight } from "lucide-react";

export function HeroSection() {
    return (
        <section id="hero" className="min-h-[90vh] relative overflow-hidden z-10 flex items-center justify-center px-4 pt-32 pb-16">
            <div className="max-w-7xl mx-auto text-center relative z-10 space-y-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="inline-block mb-4 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md text-xs md:text-sm font-semibold tracking-wide text-indigo-600 dark:text-indigo-400"
                >
                    Bienvenido al futuro de tu negocio
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1.1]"
                >
                    <span className="block whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-b from-slate-200 via-slate-400 to-slate-800">
                        Transformamos Ideas en
                    </span>
                    <span className="relative inline-block mt-4 whitespace-nowrap">
                        <span className="absolute -inset-1 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 opacity-40 blur-xl animate-pulse"></span>
                        <motion.span
                            className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 pr-2 pb-1"
                            animate={{
                                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                            }}
                            transition={{
                                duration: 5,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            style={{ backgroundSize: '200% auto' }}
                        >
                            Soluciones Digitales
                        </motion.span>
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-lg md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium"
                >
                    Desarrollo de software y páginas web con lógica de negocio, automatización de procesos y estrategias digitales que <strong className="text-emerald-500">reducen costos</strong>.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                    className="flex flex-col sm:flex-row gap-8 justify-center items-center pt-8"
                >
                    <Button
                        size="lg"
                        className="group relative w-[85%] sm:w-auto text-xl h-16 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-400 text-white font-black transition-all hover:scale-105 active:scale-95 border-2 border-[#7c6d64] hover:border-indigo-400 gap-3 overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.6)]"
                        onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        {/* Glowing Background Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 opacity-100 group-hover:opacity-90 transition-opacity"></div>

                        {/* Refined Shine Effect Animation */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                            animate={{ x: ["-200%", "200%"] }}
                            transition={{
                                repeat: Infinity,
                                duration: 2.5,
                                ease: "easeInOut",
                                repeatDelay: 1.5
                            }}
                        />
                        <span className="relative z-10 flex items-center gap-3">
                            Hablemos
                            <motion.div
                                animate={{
                                    y: [0, -4, 0],
                                    rotate: [0, 10, -10, 0]
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 2,
                                    ease: "easeInOut"
                                }}
                            >
                                <MessageCircle className="w-6 h-6 fill-white/10" />
                            </motion.div>
                        </span>

                        {/* Outer Glow */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity -z-10 animate-pulse"></div>
                    </Button>
                    <Button
                        variant="ghost"
                        size="lg"
                        className="group w-full sm:w-auto text-xl h-16 px-6 text-[#92817a] dark:text-[#92817a] font-extrabold hover:bg-transparent transition-all gap-3 relative"
                        onClick={() => document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        <span className="relative">
                            Explorar Servicios
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#92817a] transition-all group-hover:w-full"></span>
                        </span>
                        <motion.div
                            whileHover={{ x: 8 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <ArrowRight className="w-7 h-7 text-[#92817a]" />
                        </motion.div>
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}
