import './StatsRibbon.css';

export function StatsRibbon() {
    const textContent = "💰 $457M en ahorros generados • ⚡ +5.000 APIs desarrolladas • 🚀 +50 proyectos completados • 💻 Digitalizando negocios • 🎯 Soluciones escalables • ";

    return (
        <div className="bg-slate-950 border-y border-white/5 py-3 font-mono overflow-hidden relative z-10 shadow-2xl">
            <div className="stats-ribbon-container">
                <div className="stats-ribbon-track text-white/40">
                    <div className="stats-ribbon-item">
                        <span className="text-sm font-semibold px-4 tracking-[0.3em] uppercase">
                            {textContent}
                        </span>
                    </div>
                    <div className="stats-ribbon-item">
                        <span className="text-sm font-semibold px-4 tracking-[0.3em] uppercase">
                            {textContent}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

