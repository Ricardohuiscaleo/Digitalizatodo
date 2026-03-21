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
    const pendingStudents = totalStudents - paidStudents;
    const presentToday = attendance.size;

    // Agrupar historial por fecha, filtrado por mes seleccionado
    const historyByDate: Record<string, any[]> = {};
    attendanceHistory.forEach((r: any) => {
        const d = r.date || r.created_at?.split('T')[0] || 'Sin fecha';
        const dateObj = new Date(d + 'T12:00:00');
        if (dateObj.getMonth() === historyMonth && dateObj.getFullYear() === historyYear) {
            if (!historyByDate[d]) historyByDate[d] = [];
            historyByDate[d].push(r);
        }
    });
    const historyDates = Object.keys(historyByDate).sort((a, b) => b.localeCompare(a));

    return (
        <div className="space-y-6 text-zinc-950">
            {/* Dashboard Summary Horizontal Grid — 4 Columns on Mobile */}
            <div className="grid grid-cols-4 gap-1 sm:gap-2">
                {feesSummary ? (
                    <>
                        {/* Total Students */}
                        <div className="bg-white rounded-xl sm:rounded-2xl px-1.5 sm:px-3 py-2 sm:py-3 border border-zinc-100 shadow-sm flex items-center justify-between min-h-[60px] sm:min-h-[70px]">
                            <p className="text-base sm:text-2xl font-black text-zinc-950 tracking-tighter leading-none">{feesSummary.total}</p>
                            <div className="flex flex-col items-end gap-0.5 sm:gap-1 shrink-0">
                                <Users style={{ color: branding?.primaryColor || '#6366f1' }} size={14} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                                <p className="text-[5px] sm:text-[7px] font-black text-zinc-400 uppercase tracking-tighter leading-none">Total</p>
                            </div>
                        </div>
                        {/* Al Día */}
                        <div className="bg-emerald-50/40 rounded-xl sm:rounded-2xl px-1.5 sm:px-3 py-2 sm:py-3 border border-emerald-100/60 shadow-sm flex items-center justify-between min-h-[60px] sm:min-h-[70px]">
                            <p className="text-base sm:text-2xl font-black text-emerald-700 tracking-tighter leading-none">{feesSummary.al_dia}</p>
                            <div className="flex flex-col items-end gap-0.5 sm:gap-1 shrink-0">
                                <CheckCircle2 className="text-emerald-600 w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                                <p className="text-[5px] sm:text-[7px] font-black text-emerald-600/60 uppercase tracking-tighter leading-none">Al Día</p>
                            </div>
                        </div>
                        {/* Revisión */}
                        <div className="bg-amber-50/40 rounded-xl sm:rounded-2xl px-1.5 sm:px-3 py-2 sm:py-3 border border-amber-100/60 shadow-sm flex items-center justify-between min-h-[60px] sm:min-h-[70px]">
                            <p className="text-base sm:text-2xl font-black text-amber-700 tracking-tighter leading-none">{feesSummary.en_revision}</p>
                            <div className="flex flex-col items-end gap-0.5 sm:gap-1 shrink-0">
                                <RefreshCw className="text-amber-600 animate-spin-slow w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                                <p className="text-[5px] sm:text-[7px] font-black text-amber-600/60 uppercase tracking-tighter leading-none">Revisión</p>
                            </div>
                        </div>
                        {/* Morosos */}
                        <div className="bg-rose-50/40 rounded-xl sm:rounded-2xl px-1.5 sm:px-3 py-2 sm:py-3 border border-rose-100/60 shadow-sm flex items-center justify-between min-h-[60px] sm:min-h-[70px]">
                            <p className="text-base sm:text-2xl font-black text-rose-700 tracking-tighter leading-none">{feesSummary.morosos}</p>
                            <div className="flex flex-col items-end gap-0.5 sm:gap-1 shrink-0">
                                <XCircle className="text-rose-600 w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                                <p className="text-[5px] sm:text-[7px] font-black text-rose-600/60 uppercase tracking-tighter leading-none">Morosos</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Total Students (Default) */}
                        <div className="bg-white rounded-xl sm:rounded-2xl px-1.5 sm:px-3 py-2 sm:py-3 border border-zinc-100 shadow-sm flex items-center justify-between min-h-[60px] sm:min-h-[70px]">
                            <p className="text-base sm:text-2xl font-black text-zinc-950 tracking-tighter leading-none">{totalStudents}</p>
                            <div className="flex flex-col items-end gap-0.5 sm:gap-1 shrink-0">
                                <Users style={{ color: branding?.primaryColor || '#6366f1' }} size={14} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                                <p className="text-[5px] sm:text-[7px] font-black text-zinc-400 uppercase tracking-tighter leading-none">Total</p>
                            </div>
                        </div>
                        {/* Pagados (Default) */}
                        <div className="bg-emerald-50/40 rounded-xl sm:rounded-2xl px-1.5 sm:px-3 py-2 sm:py-3 border border-emerald-100/60 shadow-sm flex items-center justify-between min-h-[60px] sm:min-h-[70px]">
                            <p className="text-base sm:text-2xl font-black text-emerald-700 tracking-tighter leading-none">{paidStudents}</p>
                            <div className="flex flex-col items-end gap-0.5 sm:gap-1 shrink-0">
                                <CheckCircle2 className="text-emerald-600 w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                                <p className="text-[5px] sm:text-[7px] font-black text-emerald-600/60 uppercase tracking-tighter leading-none">Pagados</p>
                            </div>
                        </div>
                        {/* Revisión (Default) */}
                        <div className="bg-amber-50/40 rounded-xl sm:rounded-2xl px-1.5 sm:px-3 py-2 sm:py-3 border border-amber-100/60 shadow-sm flex items-center justify-between min-h-[60px] sm:min-h-[70px]">
                            <p className="text-base sm:text-2xl font-black text-amber-700 tracking-tighter leading-none">{allStudents.filter(s => s.payerStatus === 'review').length}</p>
                            <div className="flex flex-col items-end gap-0.5 sm:gap-1 shrink-0">
                                <RefreshCw className="text-amber-600 animate-spin-slow w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                                <p className="text-[5px] sm:text-[7px] font-black text-amber-600/60 uppercase tracking-tighter leading-none">Revisión</p>
                            </div>
                        </div>
                        {/* Deuda (Default) */}
                        <div className="bg-rose-50/40 rounded-xl sm:rounded-2xl px-1.5 sm:px-3 py-2 sm:py-3 border border-rose-100/60 shadow-sm flex items-center justify-between min-h-[60px] sm:min-h-[70px]">
                            <p className="text-base sm:text-2xl font-black text-rose-700 tracking-tighter leading-none">{allStudents.filter(s => s.payerStatus === 'pending').length}</p>
                            <div className="flex flex-col items-end gap-0.5 sm:gap-1 shrink-0">
                                <XCircle className="text-rose-600 w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                                <p className="text-[5px] sm:text-[7px] font-black text-rose-600/60 uppercase tracking-tighter leading-none">Deuda</p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {(branding?.industry !== 'school_treasury' && !feesSummary) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tarjeta de Asistencia Hoy */}
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
                            <span 
                                className="px-4 py-1.5 rounded-full text-xs font-black transition-colors"
                                style={{ 
                                    backgroundColor: `${branding?.primaryColor || '#6366f1'}15`,
                                    color: branding?.primaryColor || '#6366f1' 
                                }}
                            >
                                {presentToday} / {totalStudents}
                            </span>
                        </div>

                        {presentToday > 0 ? (
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                {allStudents.filter(s => attendance.has(String(s.id))).slice(0, 5).map(s => (
                                    <img
                                        key={s.id}
                                        className="inline-block h-10 w-10 rounded-full border-2 border-white shadow-sm object-cover shrink-0"
                                        src={s.photo}
                                        alt={s.name}
                                    />
                                ))}
                                {presentToday > 5 && (
                                    <div className="h-10 w-10 rounded-full bg-zinc-100 border-2 border-white flex items-center justify-center shrink-0 shadow-sm">
                                        <span className="text-[10px] font-black text-zinc-500">+{presentToday - 5}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-3 py-6 px-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 w-full transition-all">
                                <CalendarCheck size={20} className="text-zinc-300 shrink-0" />
                                <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Sin registros hoy</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* HISTORIAL DE ASISTENCIA */}
            {branding?.industry !== 'school_treasury' && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-black text-zinc-800 flex items-center gap-2 uppercase tracking-tighter">
                            <RefreshCw className="text-zinc-400" size={18} />
                            Historial Reciente
                        </h3>
                        <div className="flex items-center gap-2">
                            <button onClick={() => {
                                if (historyMonth === 0) { setHistoryMonth(11); setHistoryYear(y => y - 1); }
                                else setHistoryMonth(m => m - 1);
                                setHistoryPage(0);
                            }} className="w-8 h-8 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center active:scale-95 transition-all hover:bg-zinc-100">
                                <ChevronLeft size={16} className="text-zinc-500" />
                            </button>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider min-w-[80px] text-center">
                                {new Date(historyYear, historyMonth).toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })}
                            </span>
                            <button onClick={() => {
                                const today = new Date();
                                if (historyMonth === today.getMonth() && historyYear === today.getFullYear()) return;
                                if (historyMonth === 11) { setHistoryMonth(0); setHistoryYear(y => y + 1); }
                                else setHistoryMonth(m => m + 1);
                                setHistoryPage(0);
                            }} className="w-8 h-8 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center active:scale-95 transition-all hover:bg-zinc-100 disabled:opacity-30"
                                disabled={historyMonth === new Date().getMonth() && historyYear === new Date().getFullYear()}
                            >
                                <ChevronRight size={16} className="text-zinc-500" />
                            </button>
                        </div>
                    </div>

                    {historyDates.length === 0 ? (
                        <div className="flex items-center gap-3 py-10 px-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 justify-center transition-all">
                            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest text-center">Sin registros registrados en este periodo</p>
                        </div>
                    ) : (
                        <div className="max-h-[320px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                            {historyDates.map(date => {
                                const records: any[] = historyByDate[date];
                                const presentCount = records.filter(r => r.status === 'present').length;
                                const dateObj = new Date(date + 'T12:00:00');
                                const dateStr = dateObj.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });
                                const students = records.filter(r => r.status === 'present' && r.student);

                                return (
                                    <div 
                                        key={date} 
                                        onClick={() => setSelectedHistoryDate(date)}
                                        className="bg-white hover:bg-zinc-50 rounded-[2rem] p-3 border border-zinc-100 transition-all active:scale-[0.98] cursor-pointer group shadow-sm hover:shadow-md"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-zinc-50 border border-zinc-100 flex flex-col items-center justify-center shrink-0 shadow-sm">
                                                    <span className="text-[7px] font-black uppercase leading-none mb-0.5" style={{ color: branding?.primaryColor || '#6366f1' }}>{dateObj.toLocaleDateString('es-CL', { month: 'short' })}</span>
                                                    <span className="text-sm font-black text-zinc-900 leading-none">{dateObj.getDate()}</span>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest leading-none">{dateStr}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase" style={{ color: branding?.primaryColor || '#6366f1' }}>
                                                            {presentCount} presentes
                                                        </span>
                                                        {records[0]?.created_at && (
                                                            <span className="text-[8px] text-zinc-400 font-bold opacity-60">
                                                                {new Date(records[0].created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {students.length > 0 && (
                                                    <div className="flex -space-x-1.5 overflow-hidden">
                                                        {students.slice(0, 5).map((r: any) => (
                                                            <img key={r.id} src={r.student?.photo} className="h-7 w-7 rounded-full border-2 border-white object-cover shrink-0 shadow-sm" alt={r.student?.name} />
                                                        ))}
                                                        {students.length > 5 && (
                                                            <div className="h-7 w-7 rounded-full border-2 border-white bg-zinc-100 flex items-center justify-center shrink-0">
                                                                <span className="text-[7px] font-black text-zinc-500">+{students.length - 5}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* HORARIO DEL DÍA — solo para industrias compatibles */}
            {branding?.industry === 'school_treasury' && (
                <TodaySchedule schedules={schedulesList} primaryColor={branding?.primaryColor} />
            )}
        </div>
    );
}
