import './StatsRibbon.css';

export function StatsRibbon() {
    const textContent = "💰 $457M en ahorros generados • ⚡ +5.000 APIs desarrolladas • 🚀 +50 proyectos completados • 💻 Digitalizando negocios • 🎯 Soluciones escalables • ";

    return (
        <div className="bg-slate-950 dark:bg-black border-y-4 border-indigo-500/50 dark:border-indigo-900 py-4 font-mono overflow-hidden relative z-10 shadow-2xl">
            <div className="stats-ribbon-container">
                <div className="stats-ribbon-track">
                    {/* Render twice for the infinite loop effect with -50% translation */}
                    <div className="stats-ribbon-item">
                        <span className="text-sm md:text-lg font-bold text-emerald-400 px-4 md:px-8 tracking-wider uppercase">
                            {textContent}
                        </span>
                    </div>
                    <div className="stats-ribbon-item">
                        <span className="text-sm md:text-lg font-bold text-emerald-400 px-4 md:px-8 tracking-wider uppercase">
                            {textContent}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

