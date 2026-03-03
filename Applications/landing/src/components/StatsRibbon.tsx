import { motion } from 'framer-motion';

export function StatsRibbon() {
    const textContent = "💰 $457M en ahorros generados • ⚡ +5.000 APIs desarrolladas • 🚀 +50 proyectos completados • 💻 Digitalizando negocios • 🎯 Soluciones escalables • ";

    return (
        <div className="bg-slate-950 dark:bg-black border-y-4 border-indigo-500/50 dark:border-indigo-900 py-4 font-mono overflow-hidden relative z-10 shadow-2xl">
            <div className="flex w-full overflow-hidden whitespace-nowrap">
                {/* Utilizamos dos bloques idénticos y animamos ambos hacia la izquierda para un loop perfecto */}
                <motion.div
                    className="flex whitespace-nowrap min-w-full items-center will-change-transform"
                    animate={{ x: ["0%", "-100%"] }}
                    style={{ backfaceVisibility: "hidden" }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 40, // Slightly slower for better perception of smoothness
                    }}
                >
                    <span className="text-sm md:text-lg font-bold text-emerald-400 px-4 md:px-8 tracking-wider uppercase">
                        {textContent}
                    </span>
                    <span className="text-sm md:text-lg font-bold text-emerald-400 px-4 md:px-8 tracking-wider uppercase">
                        {textContent}
                    </span>
                </motion.div>
            </div>
        </div>
    );
}
