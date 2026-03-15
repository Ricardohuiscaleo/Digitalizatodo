"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, User, CircleCheck, CircleX } from "lucide-react";

interface AttendanceRecord {
    date: string; // YYYY-MM-DD
    status: "present" | "absent";
    studentName: string;
    studentPhoto?: string;
    studentCategory?: string; // Nuevo: Para mostrar la categoría correcta
}

interface StudentCalendarProps {
    attendance: AttendanceRecord[];
    primaryColor?: string;
}

export default function StudentCalendar({ attendance, primaryColor = "#f97316" }: StudentCalendarProps) {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(today);

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const attendanceMap = attendance.reduce((acc, rec) => {
        if (!acc[rec.date]) acc[rec.date] = [];
        acc[rec.date].push(rec);
        return acc;
    }, {} as Record<string, AttendanceRecord[]>);

    const days = [];
    const numDays = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);

    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
        days.push(<div key={`empty-${i}`} className="h-10 w-full" />);
    }

    for (let day = 1; day <= numDays; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const records = attendanceMap[dateStr] || [];
        const isToday = dateStr === today;
        const isSelected = selectedDate === dateStr;
        const hasActivity = records.length > 0;

        days.push(
            <button 
                key={day} 
                onClick={() => setSelectedDate(dateStr)}
                className={`h-11 w-full flex flex-col items-center justify-center rounded-2xl relative transition-all border ${
                    isSelected 
                        ? "bg-zinc-900 border-zinc-900 text-white shadow-lg z-10 scale-105" 
                        : isToday 
                            ? "border-indigo-100 bg-indigo-50/50 text-indigo-700 font-black" 
                            : "border-transparent hover:bg-zinc-50 text-zinc-600"
                }`}
            >
                <span className="text-[11px] font-bold">{day}</span>
                {hasActivity && !isSelected && (
                    <div className="absolute bottom-1.5 flex gap-[2.5px]">
                        {records.slice(0, 3).map((r, i) => (
                            <div key={i} className={`w-1 h-1 rounded-full shadow-[0_0_2px_rgba(0,0,0,0.1)] ${r.status === 'present' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        ))}
                    </div>
                )}
            </button>
        );
    }

    const selectedDayDetails = selectedDate ? attendanceMap[selectedDate] : null;

    return (
        <div className="bg-white border border-zinc-100 rounded-[2.5rem] shadow-sm flex flex-col h-full max-h-[calc(100vh-140px)] overflow-hidden animate-in fade-in duration-500">
            {/* CALENDARIO SECTION */}
            <div className="p-6 pb-4 shrink-0">
                <div className="flex items-center justify-between mb-6 px-1">
                    <h3 className="text-base font-black text-zinc-900 uppercase tracking-tighter">{monthNames[month]} {year}</h3>
                    <div className="flex gap-1.5">
                        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-all text-zinc-400">
                            <ChevronLeft size={16} />
                        </button>
                        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-all text-zinc-400">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-3">
                    {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                        <span key={i} className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">{d}</span>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                    {days}
                </div>
            </div>

            {/* SEPARADOR ELEGANTE */}
            <div className="px-8 shrink-0">
                <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-zinc-100 to-transparent rounded-full" />
            </div>

            {/* DETALLES SECTION CON ALTURA CONTROLADA (MAX 3 ITEMS BASE) */}
            <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 scrollbar-hide">
                <div className="flex items-center justify-between mb-5 sticky top-0 bg-white/95 backdrop-blur-sm pb-2 z-10 transition-all">
                    <div className="flex flex-col">
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Actividad del día</p>
                        <h4 className="text-xs font-black text-zinc-900 uppercase tracking-tight">
                            {selectedDate === today ? "Hoy, " : ""}{selectedDate?.split('-').reverse().join('/')}
                        </h4>
                    </div>
                    {selectedDayDetails && (
                        <div className="flex items-center gap-1.5 bg-zinc-900 px-3 py-1 rounded-full">
                            <div className="w-1 h-1 rounded-full bg-orange-400 animate-pulse" />
                            <span className="text-[9px] font-black text-white uppercase tracking-tighter">
                                {selectedDayDetails.filter(r => r.status === 'present').length} Presentes
                            </span>
                        </div>
                    )}
                </div>

                <div className="space-y-3 pb-4">
                    {selectedDayDetails && selectedDayDetails.length > 0 ? (
                        selectedDayDetails.map((rec, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3.5 bg-zinc-50/50 rounded-[1.8rem] border border-zinc-100/50 group transition-all active:scale-[0.98]">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full border-2 border-white shadow-sm overflow-hidden bg-white shrink-0">
                                        {rec.studentPhoto ? (
                                            <img src={rec.studentPhoto} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-black text-xs text-zinc-200">{rec.studentName[0]}</div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-black text-zinc-800 leading-none">{rec.studentName}</span>
                                        <span className="text-[8px] font-bold text-zinc-400 uppercase mt-1">
                                            {rec.studentCategory || "Sin Categoría"}
                                        </span>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all ${
                                    rec.status === 'present' 
                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                                        : 'bg-red-50 border-red-100 text-red-500'
                                }`}>
                                    {rec.status === 'present' ? <CircleCheck size={14} /> : <CircleX size={14} />}
                                    <span className="text-[9px] font-black uppercase tracking-tighter">{rec.status === 'present' ? 'Presente' : 'Ausente'}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-8 text-center flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-200">
                                <User size={24} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">Sin registros</p>
                                <p className="text-[8px] font-bold text-zinc-200 uppercase">No hay actividad registrada</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
