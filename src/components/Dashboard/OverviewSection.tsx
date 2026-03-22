"use client";

import React from 'react';
import { 
    Users, CheckCircle2, RefreshCw, XCircle, 
    CalendarCheck, ChevronLeft, ChevronRight, Clock, User,
    ArrowRight
} from 'lucide-react';
import TodaySchedule from './TodaySchedule';
import { nowCL } from '@/lib/utils';

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
    isDemo?: boolean; // Assuming isDemo might be passed as a prop or context
}

export default function OverviewSection(props: OverviewSectionProps) {
    const {
        allStudents, attendance, attendanceHistory,
        historyMonth, setHistoryMonth, historyYear, setHistoryYear,
        historyPage, setHistoryPage, branding, now, 
        setSelectedHistoryDate, schedulesList, feesSummary,
        vocab, setActiveTab
    } = props;

    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [activePreviewDate, setActivePreviewDate] = React.useState<string | null>(null);

    // Inicializar con la fecha de hoy al cargar
    React.useEffect(() => {
        setActivePreviewDate(nowCL().toISOString().split('T')[0]);
    }, []);

    // Memoized grouping for cards and preview
    const groupedHistory = React.useMemo(() => {
        const groups: { [key: string]: { count: number, students: any[] } } = {};
        attendanceHistory.forEach(record => {
            const d = record.date;
            if (!groups[d]) {
                groups[d] = { count: 0, students: [] };
            }
            if (record.status === 'present') {
                groups[d].count++;
                if (record.student) groups[d].students.push(record.student);
            }
        });
        return groups;
    }, [attendanceHistory]);

    // Auto-scroll al final para ver lo más reciente
    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
    }, [historyMonth, historyYear, attendanceHistory]);

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
                        {/* Top: Icon (30%) + Number (70%) */}
                        <div className="flex items-center justify-between gap-1 sm:gap-2">
                            <div className="w-[30%] shrink-0 flex justify-start items-center">
                                {card.icon}
                            </div>
                            <div className="w-[70%] flex justify-end items-center">
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


                    {/* Historial Mensual — Tarjetas Horizontales */}
                    <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-zinc-100 mt-4 animate-in slide-in-from-bottom-2 duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Historial Mensual</h3>
                            
                            {/* Selector de Mes */}
                            <div className="flex items-center gap-2 bg-zinc-50 rounded-full px-3 py-1 border border-zinc-100">
                                <button 
                                    onClick={() => setHistoryMonth(prev => prev === 1 ? 12 : prev - 1)}
                                    className="text-zinc-400 hover:text-zinc-900 transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900 min-w-[60px] text-center">
                                    {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][historyMonth - 1]} {historyYear}
                                </span>
                                <button 
                                    onClick={() => setHistoryMonth(prev => prev === 12 ? 1 : prev + 1)}
                                    className="text-zinc-400 hover:text-zinc-900 transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        {attendanceHistory.length > 0 ? (
                            <div 
                                ref={scrollRef}
                                className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-2 px-2 snap-x"
                            >
                                {(() => {

                                    // Generar todos los días del mes actual o seleccionado de forma ASCENDENTE
                                    const lastDay = new Date(historyYear, historyMonth, 0).getDate();
                                    const todayNum = now.getDate();
                                    const currentYear = nowCL().getFullYear();
                                    const currentMonth = nowCL().getMonth() + 1;
                                    const isCurrentMonth = historyMonth === currentMonth && historyYear === currentYear;
                                    
                                    // Si es el mes actual, mostramos hasta el día de hoy, si no, todo el mes
                                    const endDay = isCurrentMonth ? todayNum : lastDay;
                                    const days = [];
                                    
                                    for (let i = 1; i <= endDay; i++) {
                                        const dStr = `${historyYear}-${String(historyMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                                        const dateObj = new Date(historyYear, historyMonth - 1, i);
                                        const dayName = dateObj.toLocaleDateString('es-CL', { weekday: 'short' });
                                        const stats = groupedHistory[dStr];
                                        const isToday = isCurrentMonth && i === todayNum;
                                        const isActive = activePreviewDate === dStr;
                                        
                                        days.push(
                                            <button
                                                key={dStr}
                                                onClick={() => setActivePreviewDate(dStr)}
                                                className={`flex-shrink-0 w-20 aspect-[3/4] rounded-3xl p-3 flex flex-col items-center justify-between transition-all active:scale-95 snap-start shadow-sm border-2 ${
                                                    isActive
                                                        ? 'bg-zinc-900 border-zinc-900 ring-4 ring-zinc-100'
                                                        : isToday 
                                                            ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-100' 
                                                            : 'bg-white border-zinc-100 hover:border-zinc-300'
                                                }`}
                                            >
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-zinc-400' : isToday ? 'text-blue-600' : 'text-zinc-400'}`}>
                                                    {dayName}
                                                </span>
                                                <span className={`text-2xl font-black tracking-tighter ${isActive ? 'text-white' : isToday ? 'text-blue-900' : 'text-zinc-900'}`}>
                                                    {i}
                                                </span>
                                                <div className="flex flex-col items-center">
                                                    {stats ? (
                                                        <>
                                                            <div className="flex flex-col items-center">
                                                                <span className={`text-[12px] font-black leading-none ${isActive ? 'text-emerald-400' : isToday ? 'text-blue-600' : 'text-emerald-600'}`}>
                                                                    {stats.count}
                                                                </span>
                                                                <span className={`text-[6px] font-black uppercase tracking-tighter ${isActive ? 'text-zinc-500' : 'text-zinc-400'}`}>Total</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className={`text-[7px] font-black uppercase tracking-tighter leading-tight text-center ${isActive ? 'text-zinc-600' : 'text-zinc-300'}`}>Sin<br/>asistencia</span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    }
                                    return days;
                                })()}
                            </div>
                        ) : (
                            <div className="py-8 bg-zinc-50 rounded-[2rem] border-2 border-dashed border-zinc-100 flex flex-col items-center justify-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Sin registros este mes</p>
                            </div>
                        )}

                        {/* Visor Dinámico de Asistentes */}
                        <div className="mt-2 pt-2 border-t border-zinc-50">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-[10px] font-black text-zinc-900 uppercase tracking-tighter flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    {activePreviewDate === nowCL().toISOString().split('T')[0] 
                                        ? 'Hoy están entrenando en el dojo:' 
                                        : 'Este día entrenaron:'}
                                </h3>
                            </div>

                            {activePreviewDate && groupedHistory[activePreviewDate] && groupedHistory[activePreviewDate].count > 0 ? (
                                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar snap-x">
                                    {groupedHistory[activePreviewDate].students.map((student: any, idx: number) => (
                                        <div 
                                            key={idx} 
                                            className="flex flex-col items-center gap-1.5 flex-shrink-0 snap-start"
                                        >
                                            <div className="h-14 w-14 rounded-full ring-4 ring-zinc-50 shadow-sm relative overflow-hidden bg-zinc-100 flex-shrink-0">
                                                {student.photo ? (
                                                    <img src={student.photo} className="h-full w-full object-cover" alt={student.name} />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-zinc-300">
                                                        <User size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-tighter truncate max-w-[56px] text-center">
                                                {student.name.split(' ')[0]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 px-6 bg-zinc-50 rounded-[2rem] border-2 border-dashed border-zinc-100 flex items-center justify-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Sin asistentes registrados</p>
                                </div>
                            )}

                            {activePreviewDate && groupedHistory[activePreviewDate]?.count > 0 && (
                                <div className="mt-2 flex justify-center">
                                    <button 
                                        onClick={() => setSelectedHistoryDate(activePreviewDate)}
                                        className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-900 transition-colors py-2 px-4 bg-zinc-50 rounded-full border border-zinc-100"
                                    >
                                        Ver listado
                                    </button>
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
