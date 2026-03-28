"use client";

import React from 'react';
import { 
    Users, CheckCircle2, RefreshCw, XCircle, 
    ChevronLeft, ChevronRight, Clock, User,
    ArrowRight
} from 'lucide-react';
import TodaySchedule from './TodaySchedule';
import { nowCL } from '@/lib/utils';
import { getClassesSinceLastStripe } from '@/lib/industryUtils';
import { StudentAvatar } from './Industries/MartialArts/StudentAvatar';

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
    isDark?: boolean;
    isDemo?: boolean;
}

export default function OverviewSection(props: OverviewSectionProps) {
    const {
        allStudents, attendance, attendanceHistory,
        historyMonth, setHistoryMonth, historyYear, setHistoryYear,
        historyPage, setHistoryPage, branding, now, 
        setSelectedHistoryDate, schedulesList, feesSummary,
        vocab, setActiveTab, isDark = false
    } = props;

    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [activePreviewDate, setActivePreviewDate] = React.useState<string | null>(null);

    // Inicializar con la fecha de hoy al cargar
    React.useEffect(() => {
        setActivePreviewDate(nowCL().toISOString().split('T')[0]);
    }, []);

    // Memoized grouping for cards and preview
    const { groupedHistory, totalCountByStudent } = React.useMemo(() => {
        const groups: { [key: string]: { count: number, students: any[] } } = {};
        const totalCount: { [studentId: string]: number } = {};
        const studentMap = new Map(allStudents.map(s => [String(s.id), s]));
        attendanceHistory.forEach(record => {
            const d = record.date;
            if (!groups[d]) groups[d] = { count: 0, students: [] };
            if (record.status === 'present') {
                groups[d].count++;
                if (record.student) {
                    const full = studentMap.get(String(record.student.id));
                    groups[d].students.push(full ? { ...record.student, ...full } : record.student);
                    const sid = String(record.student.id);
                    totalCount[sid] = (totalCount[sid] ?? 0) + 1;
                }
            }
        });
        return { groupedHistory: groups, totalCountByStudent: totalCount };
    }, [attendanceHistory, allStudents]);

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

    // BANDEJA DE APROBACIÓN (New Registrations)
    const pendingStudents = allStudents.filter(s => s.status === 'pending' || s.status === 'pending_approval');
    const hasPending = pendingStudents.length > 0;

    return (
        <div className={`space-y-6 transition-colors duration-500 ${ isDark ? 'text-zinc-100' : 'text-zinc-950' }`}>
            {/* Dashboard Summary Horizontal Grid — 4 Columns on Mobile */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {(feesSummary ? [
                    { icon: <Users size={24} />, label: 'Total Estudiantes', value: feesSummary.total, colorClass: 'text-indigo-500', bgClass: 'bg-indigo-500/5', borderClass: 'border-indigo-500/10' },
                    { icon: <CheckCircle2 size={24} />, label: 'Pagos Al Día', value: feesSummary.al_dia, colorClass: 'text-emerald-500', bgClass: 'bg-emerald-500/5', borderClass: 'border-emerald-500/10' },
                    { icon: <RefreshCw size={24} />, label: 'En Revisión', value: feesSummary.en_revision, colorClass: 'text-amber-500', bgClass: 'bg-amber-500/5', borderClass: 'border-amber-500/10', spin: true },
                    { icon: <XCircle size={24} />, label: 'Pendientes', value: feesSummary.morosos, colorClass: 'text-rose-500', bgClass: 'bg-rose-500/5', borderClass: 'border-rose-500/10' }
                ] : [
                    { icon: <Users size={24} />, label: 'Inscritos', value: totalStudents, colorClass: 'text-indigo-500', bgClass: 'bg-indigo-500/5', borderClass: 'border-indigo-500/10' },
                    { icon: <CheckCircle2 size={24} />, label: 'Mensualidad OK', value: paidStudents, colorClass: 'text-emerald-500', bgClass: 'bg-emerald-500/5', borderClass: 'border-emerald-500/10' },
                    { icon: <RefreshCw size={24} />, label: 'Por Validar', value: allStudents.filter(s => s.payerStatus === 'review').length, colorClass: 'text-amber-500', bgClass: 'bg-amber-500/5', borderClass: 'border-amber-500/10', spin: true },
                    { icon: <XCircle size={24} />, label: 'En Deuda', value: allStudents.filter(s => s.payerStatus === 'pending').length, colorClass: 'text-rose-500', bgClass: 'bg-rose-500/5', borderClass: 'border-rose-500/10' }
                ]).map((card, i) => (
                    <div 
                        key={i} 
                        className={`group relative rounded-[2.5rem] p-6 md:p-8 border shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl overflow-hidden ${
                            isDark ? `bg-zinc-900 ${card.borderClass}` : `bg-white ${card.borderClass}`
                        }`}
                    >
                        {/* Decorative Background Glow */}
                        <div className={`absolute -right-8 -bottom-8 w-24 h-24 rounded-full blur-3xl opacity-20 transition-all duration-500 group-hover:scale-150 ${card.bgClass}`} />
                        
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex items-center justify-between mb-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-12 ${
                                    isDark ? 'bg-white/5 border border-white/10' : 'bg-zinc-50 border border-zinc-100'
                                }`}>
                                    <div className={`${card.colorClass} ${card.spin ? 'animate-spin-slow' : ''}`}>
                                        {card.icon}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-3xl md:text-5xl font-black tracking-tighter leading-none ${ 
                                        isDark ? 'text-white' : 'text-zinc-950' 
                                    }`}>
                                        {card.value}
                                    </p>
                                </div>
                            </div>
                            
                            <div>
                                <p className={`text-[10px] md:text-xs font-black uppercase tracking-[0.2em] opacity-60 mb-1 ${ 
                                    isDark ? 'text-zinc-500' : 'text-zinc-400' 
                                }`}>
                                    {card.label}
                                </p>
                                <div className="flex items-center gap-1">
                                    <div className={`w-1 h-1 rounded-full ${card.colorClass} animate-pulse`} />
                                    <span className={`text-[8px] font-bold uppercase tracking-widest ${card.colorClass}`}>Actualizado ahora</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* BANDEJA DE APROBACIÓN — Solo Martial Arts y si hay pendientes */}
            {hasPending && !isTreasury && (
                <div className="bg-zinc-950 rounded-[2.5rem] p-6 shadow-xl border border-zinc-800 shadow-zinc-200 animate-in slide-in-from-top-2 duration-700 relative overflow-hidden group">
                    {/* Background Glow */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-700"></div>
                    
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                                    <Users size={24} className="text-zinc-950" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center border-2 border-zinc-950 animate-bounce">
                                    <span className="text-[10px] font-black text-white">{pendingStudents.length}</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tighter leading-none">Bandeja de Aprobación</h3>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Hay {pendingStudents.length} {pendingStudents.length === 1 ? 'nuevo atleta' : 'nuevos atletas'} por validar</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setActiveTab?.('attendance')}
                            className="bg-zinc-800 hover:bg-zinc-700 text-amber-500 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-zinc-700"
                        >
                            Revisar
                        </button>
                    </div>

                    {/* Preview of names */}
                    <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {pendingStudents.slice(0, 5).map((s, idx) => (
                            <div key={idx} className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full flex items-center gap-2 shrink-0">
                                <div className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center text-[8px] font-black text-zinc-500 uppercase">{s.name[0]}</div>
                                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-tighter">{s.name.split(' ')[0]}</span>
                            </div>
                        ))}
                        {pendingStudents.length > 5 && (
                            <div className="bg-zinc-900/50 px-3 py-1.5 rounded-full shrink-0 flex items-center">
                                <span className="text-[10px] font-black text-zinc-600 uppercase">+{pendingStudents.length - 5}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* SECCIÓN INFERIOR — Oculta si es tesorería */}
            {!isTreasury && (
                <div className="space-y-4">


                    {/* Historial Mensual — Tarjetas Horizontales */}
                    <div className={`rounded-[2.5rem] p-6 shadow-sm border mt-4 animate-in slide-in-from-bottom-2 duration-500 ${
                        isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-100'
                    }`}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${ isDark ? 'text-white' : 'text-zinc-900' }`}>Historial Mensual</h3>
                            <div className={`flex items-center gap-2 rounded-full px-3 py-1 border ${ isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-100' }`}>
                                <button onClick={() => setHistoryMonth(prev => prev === 1 ? 12 : prev - 1)} className={`transition-colors ${ isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-400 hover:text-zinc-900' }`}>
                                    <ChevronLeft size={16} />
                                </button>
                                <span className={`text-[10px] font-black uppercase tracking-widest min-w-[60px] text-center ${ isDark ? 'text-white' : 'text-zinc-900' }`}>
                                    {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][historyMonth - 1]} {historyYear}
                                </span>
                                <button onClick={() => setHistoryMonth(prev => prev === 12 ? 1 : prev + 1)} className={`transition-colors ${ isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-400 hover:text-zinc-900' }`}>
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                            <div 
                                ref={scrollRef}
                                className="flex gap-3 overflow-x-auto py-2 no-scrollbar -mx-2 px-2 snap-x"
                            >
                                {(() => {
                                    const lastDay = new Date(historyYear, historyMonth, 0).getDate();
                                    const todayNum = now.getDate();
                                    const currentYear = nowCL().getFullYear();
                                    const currentMonth = nowCL().getMonth() + 1;
                                    const isCurrentMonth = historyMonth === currentMonth && historyYear === currentYear;
                                    const endDay = isCurrentMonth ? todayNum : lastDay;
                                    const days = [];
                                    
                                    for (let i = 1; i <= endDay; i++) {
                                        const dStr = `${historyYear}-${String(historyMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                                        const dateObj = new Date(historyYear, historyMonth - 1, i);
                                        const dayName = dateObj.toLocaleDateString('es-CL', { weekday: 'short' });
                                        const stats = groupedHistory[dStr];
                                        const isToday = isCurrentMonth && i === todayNum;
                                        const isActive = activePreviewDate === dStr;

                                        // Estilos por estado
                                        let cardBg: string;
                                        let dayNameColor: string;
                                        let dayNumColor: string;
                                        let countColor: string;
                                        let labelColor: string;

                                        if (isActive && isToday) {
                                            // Hoy seleccionado: dorado más intenso
                                            cardBg = isDark
                                                ? 'bg-[#c9a84c]/20 border-[#c9a84c] ring-2 ring-[#c9a84c]/50'
                                                : 'bg-amber-100 border-amber-500 ring-2 ring-amber-200';
                                            dayNameColor = isDark ? 'text-[#c9a84c]' : 'text-amber-700';
                                            dayNumColor = isDark ? 'text-[#c9a84c]' : 'text-amber-800';
                                            countColor = isDark ? 'text-[#c9a84c]' : 'text-amber-700';
                                            labelColor = isDark ? 'text-[#c9a84c]/60' : 'text-amber-500';
                                        } else if (isActive) {
                                            // Otro día seleccionado
                                            cardBg = isDark
                                                ? 'bg-zinc-700 border-zinc-500 ring-2 ring-zinc-500'
                                                : 'bg-zinc-800 border-zinc-700 ring-2 ring-zinc-600';
                                            dayNameColor = 'text-zinc-300';
                                            dayNumColor = 'text-white';
                                            countColor = 'text-emerald-400';
                                            labelColor = 'text-zinc-400';
                                        } else if (isToday) {
                                            // Hoy no seleccionado
                                            cardBg = isDark
                                                ? 'bg-[#c9a84c]/10 border-[#c9a84c] ring-2 ring-[#c9a84c]/30'
                                                : 'bg-amber-50 border-amber-400 ring-2 ring-amber-100';
                                            dayNameColor = isDark ? 'text-[#c9a84c]' : 'text-amber-600';
                                            dayNumColor = isDark ? 'text-[#c9a84c]' : 'text-amber-700';
                                            countColor = isDark ? 'text-[#c9a84c]' : 'text-amber-600';
                                            labelColor = isDark ? 'text-[#c9a84c]/60' : 'text-amber-400';
                                        } else {
                                            // Día normal
                                            cardBg = isDark
                                                ? 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-500'
                                                : 'bg-white border-zinc-100 hover:border-zinc-300';
                                            dayNameColor = isDark ? 'text-zinc-500' : 'text-zinc-400';
                                            dayNumColor = isDark ? 'text-zinc-200' : 'text-zinc-900';
                                            countColor = isDark ? 'text-emerald-500' : 'text-emerald-600';
                                            labelColor = isDark ? 'text-zinc-500' : 'text-zinc-400';
                                        }
                                        
                                        days.push(
                                            <button
                                                key={dStr}
                                                onClick={() => setActivePreviewDate(dStr)}
                                                className={`flex-shrink-0 w-20 aspect-[3/4] rounded-3xl p-3 flex flex-col items-center justify-between transition-all active:scale-95 snap-start shadow-sm border-2 ${cardBg}`}
                                            >
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${dayNameColor}`}>
                                                    {dayName}
                                                </span>
                                                <span className={`text-2xl font-black tracking-tighter ${dayNumColor}`}>
                                                    {i}
                                                </span>
                                                <div className="flex flex-col items-center">
                                                    {stats ? (
                                                        <div className="flex flex-col items-center">
                                                            <span className={`text-[12px] font-black leading-none ${countColor}`}>{stats.count}</span>
                                                            <span className={`text-[6px] font-black uppercase tracking-tighter ${labelColor}`}>Total</span>
                                                        </div>
                                                    ) : (
                                                        <span className={`text-[7px] font-black uppercase tracking-tighter leading-tight text-center ${labelColor}`}>Sin<br/>asistencia</span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    }
                                    return days;
                                })()}
                            </div>

                        {/* Visor Dinámico de Asistentes */}
                        <div className={`mt-4 pt-4 border-t ${ isDark ? 'border-zinc-800' : 'border-zinc-100' }`}>
                            {(() => {
                                const todayStr = nowCL().toISOString().split('T')[0];
                                const isToday = activePreviewDate === todayStr;
                                const todayStudents = isToday
                                    ? allStudents.filter(s => attendance.has(String(s.id)))
                                    : (groupedHistory[activePreviewDate!]?.students ?? []);
                                const hasStudents = todayStudents.length > 0;
                                // Ring del avatar: dorado siempre (es el color de marca)
                                const avatarRing = isDark
                                    ? 'ring-[#c9a84c] bg-zinc-700'
                                    : 'ring-amber-400 bg-zinc-100';

                                return (
                                    <>
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className={`text-[10px] font-black uppercase tracking-tighter flex items-center gap-2 ${ isDark ? 'text-white' : 'text-zinc-900' }`}>
                                                {isToday && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                                {isToday ? 'Hoy están entrenando en el dojo:' : 'Este día entrenaron:'}
                                            </h3>
                                        </div>

                                        {hasStudents ? (
                                            <div
                                                key={activePreviewDate}
                                                className="flex gap-6 overflow-x-auto py-2 px-1 no-scrollbar snap-x animate-in fade-in slide-in-from-bottom-2 duration-500"
                                            >
                                                {todayStudents.map((student: any, idx: number) => {
                                                    const sid = String(student.id);
                                                    const historyClasses = totalCountByStudent[sid] ?? 0;
                                                    const classesSinceStripe = getClassesSinceLastStripe(student, historyClasses);
                                                    const payerDot = student.payerStatus === 'paid'
                                                        ? 'bg-emerald-500'
                                                        : student.payerStatus === 'review'
                                                        ? 'bg-amber-400'
                                                        : 'bg-rose-500';
                                                    return (
                                                    <div key={idx} className="flex flex-col items-center gap-1.5 flex-shrink-0 snap-start">
                                                        <StudentAvatar
                                                            photo={student.photo}
                                                            name={student.name}
                                                            size={56}
                                                            beltRank={student.belt_rank}
                                                            degrees={student.degrees ?? 0}
                                                            classesCount={classesSinceStripe ?? undefined}
                                                            payerStatus={student.payerStatus}
                                                            modality={student.modality}
                                                            isDark={isDark}
                                                        />
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${payerDot}`} />
                                                            <span className={`text-[9px] font-black uppercase tracking-tighter truncate max-w-[56px] ${ isDark ? 'text-zinc-300' : 'text-zinc-600' }`}>
                                                                {student.name.split(' ')[0]}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className={`py-6 px-6 rounded-[2rem] border-2 border-dashed flex items-center justify-center ${ isDark ? 'bg-zinc-800/30 border-zinc-700' : 'bg-zinc-50 border-zinc-100' }`}>
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${ isDark ? 'text-zinc-500' : 'text-zinc-300' }`}>
                                                    {isToday ? 'Nadie en el dojo aún' : 'Sin asistentes registrados'}
                                                </p>
                                            </div>
                                        )}

                                        {!isToday && groupedHistory[activePreviewDate!]?.count > 0 && (
                                            <div className="mt-3 flex justify-center">
                                                <button
                                                    onClick={() => setSelectedHistoryDate(activePreviewDate)}
                                                    className={`text-[9px] font-black uppercase tracking-[0.2em] active:scale-90 transition-all py-2 px-4 rounded-full border ${ isDark ? 'text-zinc-300 hover:text-white bg-zinc-800 border-zinc-700' : 'text-zinc-500 hover:text-zinc-900 bg-zinc-50 border-zinc-100' }`}
                                                >
                                                    Ver listado
                                                </button>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
