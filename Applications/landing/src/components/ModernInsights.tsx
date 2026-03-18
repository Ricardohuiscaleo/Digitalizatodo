import React, { useState, useEffect } from 'react';
import { Search, Zap, Github, Leaf, Loader2 } from 'lucide-react';

interface InsightCardProps {
    label: string;
    value: string | number;
    source: string;
    icon: React.ElementType;
    color: string;
    loading?: boolean;
}

const AnimatedCounter = ({ value, duration = 2000 }: { value: string | number, duration?: number }) => {
    const [count, setCount] = useState(0);
    
    // Si el valor contiene un "/", solo animamos el primer número
    const isScore = typeof value === 'string' && value.includes('/');
    const cleanValue = typeof value === 'string' ? value.split('/')[0] : value;
    
    const target = typeof cleanValue === 'number' ? cleanValue : parseInt(String(cleanValue).replace(/[^0-9]/g, '')) || 0;
    const suffix = isScore ? '/100' : (typeof value === 'string' ? value.replace(/[0-9]/g, '') : '');

    useEffect(() => {
        let start = 0;
        const end = target;
        if (end === 0) {
            setCount(0);
            return;
        }

        const incrementTime = 20;
        const totalSteps = duration / incrementTime;
        const stepSize = end / totalSteps;
        
        const timer = setInterval(() => {
            start += stepSize;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, incrementTime);

        return () => clearInterval(timer);
    }, [target, duration]);

    return <span>{count}{suffix}</span>;
};

const InsightCard = ({ label, value, source, icon: Icon, color, loading }: InsightCardProps) => (
    <div className="bg-white p-4 sm:p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden aspect-square flex flex-col justify-center text-center">
        {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        )}
        <div className="flex flex-col items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
            <div className={`p-3 rounded-2xl ${color as string} bg-opacity-10 transition-colors group-hover:bg-opacity-20`}>
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${(color as string).replace('bg-', 'text-')}`} />
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

const ModernInsights = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const API_BASE = import.meta.env.PUBLIC_API_URL || 'https://admin.digitalizatodo.cl';
                const response = await fetch(`${API_BASE}/api/w/github-stats`);
                if (response.ok) {
                    const json = await response.json();
                    setData(json);
                }
            } catch (e) {
                console.error('Error fetching insights:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const insights = [
        {
            label: 'Puntaje SEO',
            value: data?.seo_score ? `${data.seo_score}/100` : '',
            source: 'Google API',
            icon: Search,
            color: 'bg-brand-orange'
        },
        {
            label: 'Velocidad Web',
            value: data?.pagespeed_score ? `${data.pagespeed_score}/100` : '',
            source: 'PageSpeed API',
            icon: Zap,
            color: 'bg-brand-blue'
        },
        {
            label: 'Repositorios Activos',
            value: data?.total_repositories || '',
            source: 'GitHub API',
            icon: Github,
            color: 'bg-slate-900'
        },
        {
            label: 'Código Limpio',
            value: data?.clean_code_rating ? `${data.clean_code_rating}%` : '',
            source: 'Carbon API',
            icon: Leaf,
            color: 'bg-brand-green'
        }
    ].filter(i => i.value !== '');

    if (loading || insights.length === 0) {
        if (!loading && insights.length === 0) return null;
        return (
            <div className="py-20 flex justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-slate-200" />
            </div>
        );
    }

    return (
        <section className="py-20 px-4 sm:px-10 relative z-10 bg-white">
            <div className="max-w-7xl mx-auto">
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
                                ></div>
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
                                    }`}></div>
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
