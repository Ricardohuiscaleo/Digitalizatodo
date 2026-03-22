"use client";

import React from 'react';
import { 
    Users, CheckCircle2, RefreshCw, XCircle, 
    CalendarCheck, ChevronLeft, ChevronRight, Clock
} from 'lucide-react';
import TodaySchedule from './TodaySchedule';

interface OverviewSectionProps {
    allStudents: any[];
    attendance: Set<string>;
    attendanceHistory: any[];
    historyMonth: number;
    setHistoryMonth: React.Dispatch<React.SetStateAction<number>>;
    historyYear: number;
    setHistoryYear: React.Dispatch<React.SetStateAction<number>>;
    historyPage: number;
    setHistoryPage: React.Dispatch<React.SetStateAction<number>>;
    branding: any;
    now: Date;
    setSelectedHistoryDate: (d: string | null) => void;
    schedulesList: any[];
    feesSummary?: { total: number; al_dia: number; en_revision: number; morosos: number } | null;
}

export default function OverviewSection(props: OverviewSectionProps) {
    const {
        allStudents, attendance, attendanceHistory,
        historyMonth, setHistoryMonth, historyYear, setHistoryYear,
        historyPage, setHistoryPage, branding, now, 
        setSelectedHistoryDate, schedulesList, feesSummary
    } = props;

    const totalStudents = allStudents.length;
    const paidStudents = allStudents.filter(s => s.payerStatus === 'paid').length;
    const presentToday = attendance.size;
    const isTreasury = branding?.industry === 'school_treasury';

    return (
        <div className="space-y-6 text-zinc-950">
            {/* Dashboard Summary Horizontal Grid — 4 Columns on Mobile */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-4">
                {(feesSummary ? [
                    { icon: <Users style={{ color: branding?.primaryColor || '#6366f1' }} size={24} className="sm:w-16 sm:h-16" strokeWidth={3} />, label: 'Total', value: feesSummary.total, colorClass: 'text-zinc-950', bgClass: 'bg-white' },
                    { icon: <CheckCircle2 className="text-emerald-600 w-6 h-6 sm:w-16 sm:h-16" strokeWidth={3} />, label: 'Al Día', value: feesSummary.al_dia, colorClass: 'text-emerald-700', bgClass: 'bg-emerald-50/40 border-emerald-100/60' },
                    { icon: <RefreshCw className="text-amber-600 animate-spin-slow w-6 h-6 sm:w-16 sm:h-16" strokeWidth={3} />, label: 'Revisión', value: feesSummary.en_revision, colorClass: 'text-amber-700', bgClass: 'bg-amber-50/40 border-amber-100/60' },
                    { icon: <XCircle className="text-rose-600 w-6 h-6 sm:w-16 sm:h-16" strokeWidth={3} />, label: 'Morosos', value: feesSummary.morosos, colorClass: 'text-rose-700', bgClass: 'bg-rose-50/40 border-rose-100/60' }
                ] : [
                    { icon: <Users style={{ color: branding?.primaryColor || '#6366f1' }} size={24} className="sm:w-16 sm:h-16" strokeWidth={3} />, label: 'Total', value: totalStudents, colorClass: 'text-zinc-950', bgClass: 'bg-white' },
                    { icon: <CheckCircle2 className="text-emerald-600 w-6 h-6 sm:w-12 sm:h-16" strokeWidth={3} />, label: 'Pagados', value: paidStudents, colorClass: 'text-emerald-700', bgClass: 'bg-emerald-50/40 border-emerald-100/60' },
                    { icon: <RefreshCw className="text-amber-600 animate-spin-slow w-6 h-6 sm:w-16 sm:h-16" strokeWidth={3} />, label: 'Revisión', value: allStudents.filter(s => s.payerStatus === 'review').length, colorClass: 'text-amber-700', bgClass: 'bg-amber-50/40 border-amber-100/60' },
                    { icon: <XCircle className="text-rose-600 w-6 h-6 sm:w-16 sm:h-16" strokeWidth={3} />, label: 'Deuda', value: allStudents.filter(s => s.payerStatus === 'pending').length, colorClass: 'text-rose-700', bgClass: 'bg-rose-50/40 border-rose-100/60' }
                ]).map((card, i) => (
                    <div 
                        key={i} 
                        className={`${card.bgClass} rounded-2xl sm:rounded-[3rem] px-2.5 sm:px-8 py-4 sm:py-10 border border-zinc-100 shadow-sm flex flex-col justify-between aspect-square`}
                    >
                        {/* Top: Icon (50%) + Number (50%) */}
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
                        
                        {/* Bottom: Label */}
                        <div className="mt-auto">
                            <p className="text-[9px] sm:text-[18px] font-black uppercase tracking-[0.15em] leading-none text-zinc-400 opacity-80 truncate">
                                {card.label}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* SECCIÓN INFERIOR — Oculta si es tesorería */}
            {!isTreasury && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-sm font-black text-zinc-800 flex items-center gap-2 uppercase tracking-tighter">
                                    <CalendarCheck style={{ color: branding?.primaryColor || '#6366f1' }} size={18} />
                                    Asistencia Hoy
                                </h3>
                                <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase tracking-widest">
                                    {now.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CLASES DE HOY — Siempre habilitado según última instrucción */}
            <TodaySchedule schedules={schedulesList} primaryColor={branding?.primaryColor} />
        </div>
    );
}
