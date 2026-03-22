"use client";

import React from 'react';
import { 
    Users, CheckCircle2, RefreshCw, XCircle, 
    CalendarCheck, ChevronLeft, ChevronRight, Clock, User,
    ArrowRight
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
    vocab?: any;
    setActiveTab?: (tab: string) => void;
}

export default function OverviewSection(props: OverviewSectionProps) {
    const {
        allStudents, attendance, attendanceHistory,
        historyMonth, setHistoryMonth, historyYear, setHistoryYear,
        historyPage, setHistoryPage, branding, now, 
        setSelectedHistoryDate, schedulesList, feesSummary,
        vocab, setActiveTab
    } = props;

    const totalStudents = allStudents.length;
    const paidStudents = allStudents.filter(s => s.payerStatus === 'paid').length;
    const isTreasury = branding?.industry === 'school_treasury';

    // Aquellos estudiantes marcados presentes hoy
    const presentStudents = allStudents.filter(s => attendance.has(String(s.id)));
    const maxBubbles = 6;
    const displayBubbles = presentStudents.slice(0, maxBubbles);
    const extraCount = presentStudents.length - maxBubbles;

    return (
        <div className="space-y-6 text-zinc-950">
            {/* Dashboard Summary Horizontal Grid — 4 Columns on Mobile */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-4">
                {(feesSummary ? [
                    { icon: <Users style={{ color: branding?.primaryColor || '#6366f1' }} size={18} className="sm:w-12 sm:h-12" strokeWidth={3} />, label: 'Total', value: feesSummary.total, colorClass: 'text-zinc-950', bgClass: 'bg-white' },
                    { icon: <CheckCircle2 className="text-emerald-600 w-4.5 h-4.5 sm:w-12 sm:h-12" size={18} strokeWidth={3} />, label: 'Al Día', value: feesSummary.al_dia, colorClass: 'text-emerald-700', bgClass: 'bg-emerald-50/40 border-emerald-100/60' },
                    { icon: <RefreshCw className="text-amber-600 animate-spin-slow w-4.5 h-4.5 sm:w-12 sm:h-12" size={18} strokeWidth={3} />, label: 'Revisión', value: feesSummary.en_revision, colorClass: 'text-amber-700', bgClass: 'bg-amber-50/40 border-amber-100/60' },
                    { icon: <XCircle className="text-rose-600 w-4.5 h-4.5 sm:w-12 sm:h-12" size={18} strokeWidth={3} />, label: 'Morosos', value: feesSummary.morosos, colorClass: 'text-rose-700', bgClass: 'bg-rose-50/40 border-rose-100/60' }
                ] : [
                    { icon: <Users style={{ color: branding?.primaryColor || '#6366f1' }} size={18} className="sm:w-12 sm:h-12" strokeWidth={3} />, label: 'Total', value: totalStudents, colorClass: 'text-zinc-950', bgClass: 'bg-white' },
                    { icon: <CheckCircle2 className="text-emerald-600 w-4.5 h-4.5 sm:w-12 sm:h-12" size={18} strokeWidth={3} />, label: 'Pagados', value: paidStudents, colorClass: 'text-emerald-700', bgClass: 'bg-emerald-50/40 border-emerald-100/60' },
                    { icon: <RefreshCw className="text-amber-600 animate-spin-slow w-4.5 h-4.5 sm:w-12 sm:h-12" size={18} strokeWidth={3} />, label: 'Revisión', value: allStudents.filter(s => s.payerStatus === 'review').length, colorClass: 'text-amber-700', bgClass: 'bg-amber-50/40 border-amber-100/60' },
                    { icon: <XCircle className="text-rose-600 w-4.5 h-4.5 sm:w-12 sm:h-12" size={18} strokeWidth={3} />, label: 'Deuda', value: allStudents.filter(s => s.payerStatus === 'pending').length, colorClass: 'text-rose-700', bgClass: 'bg-rose-50/40 border-rose-100/60' }
                ]).map((card, i) => (
                    <div 
                        key={i} 
                        className={`${card.bgClass} rounded-2xl sm:rounded-[3rem] px-2 sm:px-8 py-3.5 sm:py-10 border border-zinc-100 shadow-sm flex flex-col justify-between aspect-square`}
                    >
                        {/* Top: Icon (50%) + Number (50%) */}
                        <div className="grid grid-cols-2 items-center gap-1 sm:gap-2">
                            <div className="flex justify-start items-center">
                                {card.icon}
                            </div>
                            <div className="flex justify-end items-center">
                                <p className={`text-xl sm:text-5xl font-black ${card.colorClass} tracking-tighter leading-none truncate`}>
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
                <div className="space-y-4">
                    <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-zinc-100">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2 uppercase tracking-tighter">
                                    <CalendarCheck style={{ color: branding?.primaryColor || '#6366f1' }} size={20} />
                                    {vocab?.attendance || 'Asistencia'} Hoy
                                </h3>
                                <p className="text-[10px] text-zinc-400 font-bold mt-0.5 uppercase tracking-widest">
                                    {now.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' })}
                                </p>
                            </div>
                            <button 
                                onClick={() => setActiveTab?.('attendance')}
                                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors"
                            >
                                Ver Todo
                                <ChevronRight size={14} />
                            </button>
                        </div>

                        {/*Globos de Asistencia */}
                        <div className="flex items-center gap-2">
                            {presentStudents.length > 0 ? (
                                <div className="flex -space-x-3 overflow-hidden p-1">
                                    {displayBubbles.map((student, i) => (
                                        <div 
                                            key={student.id} 
                                            className="inline-block h-12 w-12 rounded-full ring-4 ring-white shadow-md relative group overflow-hidden bg-zinc-100"
                                            style={{ zIndex: displayBubbles.length - i }}
                                        >
                                            {student.photo ? (
                                                <img src={student.photo} className="h-full w-full object-cover" alt={student.name} />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-zinc-300">
                                                    <User size={18} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {extraCount > 0 && (
                                        <div className="inline-block h-12 w-12 rounded-full ring-4 ring-white shadow-md bg-zinc-900 flex items-center justify-center z-0">
                                            <span className="text-[10px] font-black text-white">+{extraCount}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 py-4 px-6 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-100 flex items-center justify-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Nadie en el {vocab?.attendance || 'Tatami'} aún</p>
                                </div>
                            )}
                            {presentStudents.length > 0 && (
                                <div className="ml-4 flex flex-col">
                                    <span className="text-[18px] font-black text-zinc-900 leading-none">{presentStudents.length}</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mt-0.5">Presentes</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* CLASES DE HOY — Ocultar si NO es tesorería y no hay nada */}
            {isTreasury && (
                <TodaySchedule schedules={schedulesList} primaryColor={branding?.primaryColor} />
            )}
        </div>
    );
}
