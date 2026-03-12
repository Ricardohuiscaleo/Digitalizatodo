import React from 'react';
import { Search, Zap, Github, Leaf } from 'lucide-react';

interface InsightCardProps {
    label: string;
    value: string;
    source: string;
    icon: React.ElementType;
    color: string;
}

const InsightCard = ({ label, value, source, icon: Icon, color }: InsightCardProps) => (
    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
        <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-2xl ${color} bg-opacity-10 transition-colors group-hover:bg-opacity-20`}>
                <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{source}</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
            </div>
        </div>
        <p className="text-sm font-bold text-slate-600 uppercase tracking-wider">{label}</p>
    </div>
);

const ModernInsights = () => {
    const insights: InsightCardProps[] = [
        {
            label: 'Puntaje SEO',
            value: '98/100',
            source: 'Google API',
            icon: Search,
            color: 'bg-brand-orange'
        },
        {
            label: 'Velocidad Web',
            value: '95/100',
            source: 'PageSpeed API',
            icon: Zap,
            color: 'bg-brand-blue'
        },
        {
            label: 'Módulos en Stack',
            value: '+221',
            source: 'GitHub API',
            icon: Github,
            color: 'bg-slate-900'
        },
        {
            label: 'Más limpios que el resto',
            value: '87%',
            source: 'Carbon API',
            icon: Leaf,
            color: 'bg-brand-green'
        }
    ];

    return (
        <section className="py-20 px-6 sm:px-10 relative z-10 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {insights.map((insight, i) => (
                        <InsightCard key={i} {...insight} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ModernInsights;
