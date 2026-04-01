"use client";

import React from "react";
import { 
    Zap, 
    ShieldCheck, 
    Check, 
    ArrowRight,
    User,
    Baby,
    Users,
    Star,
    TrendingUp
} from "lucide-react";

interface PlanUpgradeGridProps {
    plans: any[];
    students: any[];
    selectedStudentId: string;
    onSelectStudent: (id: string) => void;
    onSelectPlan: (plan: any) => void;
    currentPlanId?: string;
    primaryColor: string;
}

export function PlanUpgradeGrid({
    plans,
    students,
    selectedStudentId,
    onSelectStudent,
    onSelectPlan,
    currentPlanId,
    primaryColor
}: PlanUpgradeGridProps) {
    const categories = ['adults', 'kids', '1-1'];
    const [activeTab, setActiveTab] = React.useState('adults');

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Student Selector (Better UI) */}
            <div className="flex bg-white/40 backdrop-blur-xl border border-white/60 p-2 rounded-[2rem] gap-2 overflow-x-auto no-scrollbar">
                {students.map(s => (
                    <button 
                        key={s.id}
                        onClick={() => onSelectStudent(s.id)}
                        className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-300 min-w-fit ${
                            selectedStudentId === s.id 
                            ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-200' 
                            : 'bg-white border border-zinc-100 text-zinc-400 hover:border-zinc-300'
                        }`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${
                            selectedStudentId === s.id ? 'border-white/20 bg-white/10' : 'border-zinc-100 bg-zinc-50'
                        }`}>
                            <User size={14} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{s.name}</span>
                    </button>
                ))}
            </div>

            {/* Category Switcher */}
            <div className="flex bg-zinc-100/50 p-1 rounded-2xl gap-1">
                {categories.map(cat => (
                    <button 
                        key={cat} 
                        onClick={() => setActiveTab(cat)}
                        className={`flex-1 py-3 text-[9px] font-black uppercase rounded-xl transition-all duration-300 ${
                            activeTab === cat ? 'bg-white text-zinc-950 shadow-sm border border-zinc-100' : 'text-zinc-400'
                        }`}
                    >
                        {cat === 'adults' ? 'Adultos' : cat === 'kids' ? 'Kids' : 'Personalizado'}
                    </button>
                ))}
            </div>

            {/* Plans List */}
            <div className="grid grid-cols-1 gap-6">
                {plans.filter(p => {
                    if (!p.active) return false;
                    if (activeTab === 'adults') return p.target_audience === 'adults';
                    if (activeTab === 'kids') return p.target_audience === 'kids';
                    if (activeTab === '1-1') return p.category === 'vip' || p.target_audience === 'all';
                    return false;
                }).map(plan => {
                    const isCurrent = Number(plan.id) === Number(currentPlanId);
                    const isVIP = plan.category === 'vip' || Number(plan.price) > 100000;

                    return (
                        <div 
                            key={plan.id}
                            className={`group relative rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden ${
                                isCurrent 
                                ? 'bg-emerald-50/50 border-emerald-500 shadow-xl shadow-emerald-500/10' 
                                : 'bg-white border-zinc-100 hover:border-zinc-300 h-fit hover:translate-y-[-4px]'
                            }`}
                        >
                            {/* Decorative Background Gradient for Premium Plans */}
                            {isVIP && <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-400/10 rounded-full blur-3xl group-hover:bg-orange-400/20 transition-all duration-700"></div>}

                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg border ${
                                                isVIP ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-zinc-50 text-zinc-500 border-zinc-100'
                                            }`}>
                                                {plan.billing_cycle || 'Mensual'}
                                            </span>
                                            {isVIP && <span className="text-[8px] font-black uppercase text-amber-500 flex items-center gap-1"><Star size={8} fill="currentColor" /> Recomendado</span>}
                                        </div>
                                        <h4 className="text-xl font-black text-zinc-900 leading-tight">{plan.name}</h4>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-2xl font-black text-zinc-900">${Number(plan.price).toLocaleString('es-CL')}</span>
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">CLP</span>
                                    </div>
                                </div>

                                {plan.description && (
                                    <div className="flex items-center gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 mb-8 animate-in zoom-in-95 duration-500">
                                        <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-100">
                                            <TrendingUp size={12} strokeWidth={3} />
                                        </div>
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{plan.description}</p>
                                    </div>
                                )}

                                <button 
                                    disabled={isCurrent}
                                    onClick={() => onSelectPlan(plan)}
                                    className={`w-full h-14 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                                        isCurrent 
                                        ? 'bg-emerald-500 text-white cursor-not-allowed border border-emerald-600' 
                                        : 'bg-zinc-950 text-white shadow-xl shadow-zinc-200 hover:scale-[1.02] active:scale-95'
                                    }`}
                                >
                                    {isCurrent ? 'Plan Actual' : 'Seleccionar Plan'}
                                    {!isCurrent && <ArrowRight size={14} />}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
