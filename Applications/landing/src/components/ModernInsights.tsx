import React, { useState, useEffect } from 'react';
import { Zap, Activity, ShieldCheck, Code2, Loader2 } from 'lucide-react';
import { siPhp, siLaravel, siNextdotjs, siReact, siTypescript, siAstro, siTailwindcss, siMysql } from 'simple-icons';
import { useLazyReveal, revealClass, revealStyle } from '../hooks/useLazyReveal';

const PAGESPEED_URL = 'https://pagespeed.web.dev/analysis/https-digitalizatodo-cl/itiat2dknj?form_factor=desktop';

const AnimatedCounter = ({ value, duration = 2000 }: { value: number, duration?: number }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (value === 0) { setCount(0); return; }
        let start = 0;
        const stepSize = value / (duration / 20);
        const timer = setInterval(() => {
            start += stepSize;
            if (start >= value) { setCount(value); clearInterval(timer); }
            else setCount(Math.floor(start * 10) / 10);
        }, 20);
        return () => clearInterval(timer);
    }, [value, duration]);
    return <>{count}</>;
};

interface CardProps { label: string; value: number; suffix: string; source: string; icon: React.ComponentType<{ className?: string }>; color: string; href?: string; loading?: boolean; delay?: number; }

const InsightCard = ({ label, value, suffix, source, icon: Icon, color, href, loading, delay = 0 }: CardProps) => {
    const { ref, visible } = useLazyReveal();
    const inner = (
        <div ref={ref} style={revealStyle(delay)} className={`${revealClass(visible)} bg-white p-4 sm:p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden aspect-square flex flex-col justify-center text-center ${href ? 'cursor-pointer hover:-translate-y-1' : ''}`}>
            {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
            )}
            <div className="flex flex-col items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
                <div className={`p-3 rounded-2xl ${color} bg-opacity-10 group-hover:bg-opacity-20 transition-colors`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color.replace('bg-', 'text-')}`} />
                </div>
                <div>
                    <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{source}</p>
                    <p className="text-xl sm:text-3xl font-black text-slate-900 tracking-tighter">
                        {loading ? '--' : <><AnimatedCounter value={value} />{suffix}</>}
                    </p>
                </div>
            </div>
            <p className="text-[10px] sm:text-sm font-bold text-slate-600 uppercase tracking-wider">{label}</p>
        </div>
    );
    if (href) return <a href={href} target="_blank" rel="noopener noreferrer">{inner}</a>;
    return inner;
};

const ModernInsights = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { ref: sectionRef, visible: sectionVisible } = useLazyReveal(0.05);
    const { ref: stackRef, visible: stackVisible } = useLazyReveal();

    useEffect(() => {
        const fetch_ = async () => {
            try {
                const API_BASE = import.meta.env.PUBLIC_API_URL || 'https://admin.digitalizatodo.cl';
                const res = await fetch(`${API_BASE}/api/w/github-stats`);
                if (res.ok) setData(await res.json());
            } catch (e) {} finally { setLoading(false); }
        };
        fetch_();
    }, []);

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const perf = isMobile ? (data?.pagespeed_mobile    ?? 95)  : (data?.pagespeed_desktop    ?? 100);
    const seo  = isMobile ? (data?.seo_mobile          ?? 100) : (data?.seo_desktop          ?? 100);
    const a11y = isMobile ? (data?.accessibility_mobile ?? 90) : (data?.accessibility_desktop ?? 90);
    const contributions = data?.contributions_last_year ?? 824;

    const cards: CardProps[] = [
        { label: 'Rendimiento',        value: perf,          suffix: '/100', source: 'PageSpeed API', icon: Zap,         color: 'bg-brand-blue',   href: PAGESPEED_URL, delay: 0   },
        { label: 'SEO',                value: seo,           suffix: '/100', source: 'PageSpeed API', icon: Activity,    color: 'bg-brand-orange', href: PAGESPEED_URL, delay: 100 },
        { label: 'Accesibilidad',      value: a11y,          suffix: '/100', source: 'PageSpeed API', icon: ShieldCheck, color: 'bg-brand-green',  href: PAGESPEED_URL, delay: 200 },
        { label: 'Contributions / año',value: contributions, suffix: '',     source: 'GitHub API',    icon: Code2,       color: 'bg-slate-900',                         delay: 300 },
    ];

    return (
        <section className="py-20 px-4 sm:px-10 relative z-10 bg-white">
            <div className="max-w-7xl mx-auto">
                <div ref={sectionRef} style={revealStyle(0)} className={`${revealClass(sectionVisible)} mb-10 text-center`}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Métricas reales</p>
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter">Números que respaldan el trabajo</h2>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {cards.map((card, i) => <InsightCard key={i} {...card} loading={loading} />)}
                </div>

                <div ref={stackRef} style={revealStyle(100)} className={`${revealClass(stackVisible)} mt-12 p-8 bg-slate-50 rounded-[32px] border border-slate-100`}>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-brand-orange animate-pulse"></div>
                        Stack Tecnológico
                    </h4>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-8">
                        {([
                            { name: 'PHP',        version: '8.5',  si: siPhp,         bg: '#777BB4' },
                            { name: 'Laravel',    version: '12',   si: siLaravel,     bg: '#FF2D20' },
                            { name: 'Next.js',    version: '16',   si: siNextdotjs,   bg: '#000000' },
                            { name: 'React',      version: '19',   si: siReact,       bg: '#61DAFB' },
                            { name: 'TypeScript', version: '5',    si: siTypescript,  bg: '#3178C6' },
                            { name: 'Astro',      version: '4',    si: siAstro,       bg: '#BC52EE' },
                            { name: 'Tailwind',   version: '3.4',  si: siTailwindcss, bg: '#06B6D4' },
                            { name: 'MySQL',      version: '9.6',  si: siMysql,       bg: '#4479A1' },
                        ] as { name: string; version: string; si: { path: string }; bg: string }[]).map((tech) => (
                            <div key={tech.name} className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border aspect-square"
                                style={{ backgroundColor: tech.bg + '12', borderColor: tech.bg + '30' }}>
                                <svg viewBox="0 0 24 24" className="w-6 h-6 flex-shrink-0" fill={tech.bg === '#000000' ? '#1e293b' : tech.bg}>
                                    <path d={tech.si.path} />
                                </svg>
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-slate-700 leading-none">{tech.name}</p>
                                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">{tech.version}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {data?.top_languages && (
                        <>
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-3">Distribución de código</p>
                            <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-200">
                                {data.top_languages.map((lang: any, idx: number) => (
                                    <div key={idx} style={{ width: `${lang.percentage}%` }}
                                        className={`h-full ${idx === 0 ? 'bg-brand-blue' : idx === 1 ? 'bg-brand-orange' : idx === 2 ? 'bg-brand-green' : idx === 3 ? 'bg-slate-900' : 'bg-slate-400'}`}
                                        title={`${lang.name}: ${lang.percentage}%`} />
                                ))}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-4">
                                {data.top_languages.map((lang: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-1.5">
                                        <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-brand-blue' : idx === 1 ? 'bg-brand-orange' : idx === 2 ? 'bg-brand-green' : idx === 3 ? 'bg-slate-900' : 'bg-slate-400'}`} />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{lang.name}</span>
                                        <span className="text-[10px] font-black text-slate-400">{lang.percentage}%</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ModernInsights;
