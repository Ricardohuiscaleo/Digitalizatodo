import React, { useState, useEffect } from 'react';
import { Search, Zap, Github, Leaf, Loader2, Monitor, Smartphone } from 'lucide-react';

const PAGESPEED_URL = 'https://pagespeed.web.dev/analysis/https-digitalizatodo-cl/itiat2dknj';

interface InsightCardProps {
    label: string;
    value: string | number;
    source: string;
    icon: React.ElementType;
    color: string;
    loading?: boolean;
    href?: string;
}

const AnimatedCounter = ({ value, duration = 2000 }: { value: string | number, duration?: number }) => {
    const [count, setCount] = useState(0);
    const isScore = typeof value === 'string' && value.includes('/');
    const cleanValue = typeof value === 'string' ? value.split('/')[0] : value;
    const target = typeof cleanValue === 'number' ? cleanValue : parseInt(String(cleanValue).replace(/[^0-9]/g, '')) || 0;
    const suffix = isScore ? '/100' : (typeof value === 'string' ? value.replace(/[0-9]/g, '') : '');

    useEffect(() => {
        let start = 0;
        if (target === 0) { setCount(0); return; }
        const incrementTime = 20;
        const stepSize = target / (2000 / incrementTime);
        const timer = setInterval(() => {
            start += stepSize;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, incrementTime);
        return () => clearInterval(timer);
    }, [target]);

    return <span>{count}{suffix}</span>;
};

const InsightCard = ({ label, value, source, icon: Icon, color, loading, href }: InsightCardProps) => {
    const inner = (
        <div className={`bg-white p-4 sm:p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden aspect-square flex flex-col justify-center text-center ${href ? 'cursor-pointer hover:-translate-y-1' : ''}`}>
            {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
            )}
            <div className="flex flex-col items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
                <div className={`p-3 rounded-2xl ${color} bg-opacity-10 transition-colors group-hover:bg-opacity-20`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color.replace('bg-', 'text-')}`} />
                </div>
                <div>
                    <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{source}</p>
                    <p className="text-xl sm:text-3xl font-black text-slate-900 tracking-tighter">
                        {loading ? '--' : <AnimatedCounter value={value} />}
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
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
        const fetchStats = async () => {
            try {
                const API_BASE = import.meta.env.PUBLIC_API_URL || 'https://admin.digitalizatodo.cl';
                const res = await fetch(`${API_BASE}/api/w/github-stats`);
                if (res.ok) setData(await res.json());
            } catch (e) {
                console.error('Error fetching insights:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const ps  = isMobile ? data?.pagespeed_mobile  : data?.pagespeed_desktop;
    const seo = isMobile ? data?.seo_mobile        : data?.seo_desktop;
    const formFactor = isMobile ? 'mobile' : 'desktop';

    const insights = [
        {
            label: 'Puntaje SEO',
            value: seo != null ? `${seo}/100` : '',
            source: 'Google API',
            icon: Search,
            color: 'bg-brand-orange',
            href: `${PAGESPEED_URL}?form_factor=${formFactor}`,
        },
        {
            label: 'Velocidad Web',
            value: ps != null ? `${ps}/100` : '',
            source: 'PageSpeed API',
            icon: Zap,
            color: 'bg-brand-blue',
            href: `${PAGESPEED_URL}?form_factor=${formFactor}`,
        },
        {
            label: 'Repositorios Activos',
            value: data?.total_repositories || '',
            source: 'GitHub API',
            icon: Github,
            color: 'bg-slate-900',
        },
        {
            label: 'Código Limpio',
            value: data?.clean_code_rating ? `${data.clean_code_rating}%` : '',
            source: 'Carbon API',
            icon: Leaf,
            color: 'bg-brand-green',
        },
    ].filter(i => i.value !== '');

    if (loading || insights.length === 0) {
        if (!loading && insights.length === 0) return null;
        return <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-200" /></div>;
    }

    return (
        <section className="py-20 px-4 sm:px-10 relative z-10 bg-white">
            <div className="max-w-7xl mx-auto">
                {/* Toggle desktop/mobile */}
                <div className="flex justify-end mb-6">
                    <div className="inline-flex items-center gap-1 bg-slate-100 rounded-full p-1">
                        <button
                            onClick={() => setIsMobile(false)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                !isMobile ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <Monitor className="w-3.5 h-3.5" /> Desktop
                        </button>
                        <button
                            onClick={() => setIsMobile(true)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                isMobile ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <Smartphone className="w-3.5 h-3.5" /> Mobile
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {insights.map((insight, i) => (
                        <InsightCard key={i} {...insight} loading={loading} />
                    ))}
                </div>

                {data?.top_languages && (
                    <div className="mt-12 p-8 bg-slate-50 rounded-[32px] border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-1000 hidden sm:block">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-brand-orange animate-pulse"></div>
                            Stack Tecnológico Real-time
                        </h4>
                        <div className="grid h-4 w-full grid-cols-100 gap-1 rounded-full overflow-hidden bg-slate-200">
                            {data.top_languages.map((lang: any, idx: number) => (
                                <div
                                    key={idx}
                                    style={{ width: `${lang.percentage}%` }}
                                    className={`h-full ${
                                        idx === 0 ? 'bg-brand-blue' :
                                        idx === 1 ? 'bg-brand-orange' :
                                        idx === 2 ? 'bg-brand-green' :
                                        idx === 3 ? 'bg-slate-900' : 'bg-slate-400'
                                    }`}
                                    title={`${lang.name}: ${lang.percentage}%`}
                                />
                            ))}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-6">
                            {data.top_languages.map((lang: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${
                                        idx === 0 ? 'bg-brand-blue' :
                                        idx === 1 ? 'bg-brand-orange' :
                                        idx === 2 ? 'bg-brand-green' :
                                        idx === 3 ? 'bg-slate-900' : 'bg-slate-400'
                                    }`} />
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{lang.name}</span>
                                    <span className="text-xs font-black text-brand-orange">{lang.percentage}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default ModernInsights;
