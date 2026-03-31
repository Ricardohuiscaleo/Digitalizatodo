"use client";

import React from 'react';
import { 
    Users, CheckCircle2, RefreshCw, XCircle
} from 'lucide-react';
import TodaySchedule from '../../TodaySchedule';

interface OverviewTreasuryProps {
    branding: any;
    schedulesList: any[];
    feesSummary: { total: number; al_dia: number; en_revision: number; morosos: number } | null;
    isDark?: boolean;
}

/**
 * Vista de Resumen especializada para Colegios (School Treasury)
 * Enfocada 100% en finanzas, sin sección de asistencia.
 */
export default function OverviewTreasury({ branding, schedulesList, feesSummary, isDark }: OverviewTreasuryProps) {
    if (!feesSummary) return null;

    const cards = [
        { icon: <Users style={{ color: branding?.primaryColor || '#6366f1' }} size={24} className="sm:w-16 sm:h-16" strokeWidth={3} />, label: 'Total Alumnos', value: feesSummary.total, colorClass: 'text-zinc-950', bgClass: 'bg-white' },
        { icon: <CheckCircle2 className="text-emerald-600 w-6 h-6 sm:w-16 sm:h-16" strokeWidth={3} />, label: 'Al Día', value: feesSummary.al_dia, colorClass: 'text-emerald-700', bgClass: 'bg-emerald-50/40 border-emerald-100/60' },
        { icon: <RefreshCw className="text-amber-600 animate-spin-slow w-6 h-6 sm:w-16 sm:h-16" strokeWidth={3} />, label: 'En Revisión', value: feesSummary.en_revision, colorClass: 'text-amber-700', bgClass: 'bg-amber-50/40 border-amber-100/60' },
        { icon: <XCircle className="text-rose-600 w-6 h-6 sm:w-16 sm:h-16" strokeWidth={3} />, label: 'Morosos', value: feesSummary.morosos, colorClass: 'text-rose-700', bgClass: 'bg-rose-50/40 border-rose-100/60' }
    ];

    return (
        <div className="space-y-6 text-zinc-950">
            {/* Grid de Métricas Financieras (Hidden on PC, moved to sidebar) */}
            <div className="grid grid-cols-4 md:hidden gap-1.5 sm:gap-4">
                {cards.map((card, i) => (
                    <div 
                        key={i} 
                        className={`${card.bgClass} rounded-2xl sm:rounded-[3rem] px-2.5 sm:px-8 py-4 sm:py-10 border border-zinc-100 shadow-sm flex flex-col justify-between aspect-square`}
                    >
                        <div className="grid grid-cols-2 items-center gap-1 sm:gap-2">
                            <div className="flex justify-start">
                                {card.icon}
                            </div>
                            <div className="flex justify-end">
                                <p className={`text-2xl sm:text-7xl font-black ${card.colorClass} tracking-tighter leading-none truncate`}>
                                    {card.value}
                                </p>
                            </div>
                        </div>
                        <div className="mt-auto">
                            <p className="text-[9px] sm:text-[18px] font-black uppercase tracking-[0.15em] leading-none text-zinc-400 opacity-80 truncate">
                                {card.label}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
