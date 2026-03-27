"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, User, CircleCheck, CircleX } from "lucide-react";
import { StudentAvatar } from "../Dashboard/Industries/MartialArts/StudentAvatar";

interface AttendanceRecord {
    date: string; // YYYY-MM-DD
    status: "present" | "absent";
    studentName: string;
    studentPhoto?: string;
    studentCategory?: string;
    studentModality?: string;
    studentBeltRank?: string;
    studentDegrees?: number;
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
                className={`h-11 w-full flex flex-col items-center justify-center rounded-2xl relative transition-all border outline-none ${
                    isSelected 
                        ? "bg-zinc-900 border-zinc-900 text-white shadow-xl z-10 scale-105" 
                        : isToday 
                            ? "border-indigo-100 bg-indigo-50/50 text-indigo-700 font-black" 
                            : "border-transparent hover:bg-zinc-50 text-zinc-600"
                }`}
            >
                <span className={`text-[11px] font-bold ${isSelected ? "text-white" : ""}`}>{day}</span>
                {hasActivity && (
                    <div className="absolute bottom-1.5 flex gap-[3px]">
                        {records.slice(0, 3).map((r, i) => (
                            <div 
                                key={i} 
                                className={`w-1 h-1 rounded-full shadow-sm ring-1 ${
                                    isSelected ? "ring-white/40" : "ring-transparent"
                                } ${r.status === 'present' ? 'bg-emerald-400' : 'bg-red-500'}`} 
                            />
                        ))}
                    </div>
                )}
            </button>
        );
    }

    const selectedDayDetails = selectedDate ? attendanceMap[selectedDate] : null;

    return (
        <div className="bg-white border border-zinc-100 rounded-[2.5rem] shadow-sm flex flex-col h-full max-h-[calc(100vh-210px)] overflow-hidden animate-in fade-in duration-500">
            {/* CALENDARIO SECTION */}
            <div className="p-4 pb-2 shrink-0">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tighter">{monthNames[month]} {year}</h3>
                    <div className="flex gap-1">
                        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-all text-zinc-400">
                            <ChevronLeft size={16} />
                        </button>
                        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-all text-zinc-400">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                        <span key={i} className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">{d}</span>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                    {days}
                </div>
            </div>

            {/* SEPARADOR ELEGANTE */}
            <div className="px-8 shrink-0">
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-100 to-transparent rounded-full" />
            </div>

            {/* DETALLES SECTION CON ALTURA CONTROLADA */}
            <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 scrollbar-hide">
                <div className="flex items-center justify-between mb-4 sticky top-0 bg-white/95 backdrop-blur-sm pb-2 z-10 transition-all">
                    <div className="flex flex-col">
                        <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Actividad</p>
                        <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-tight">
                            {selectedDate === today ? "Hoy, " : ""}{selectedDate?.split('-').reverse().join('/')}
                        </h4>
                    </div>
                    {selectedDayDetails && (
                        <div className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded-full">
                            <div className="w-1 h-1 rounded-full bg-orange-400 animate-pulse" />
                            <span className="text-[8px] font-black text-white uppercase tracking-tighter">
                                {selectedDayDetails.filter(r => r.status === 'present').length} Presentes
                            </span>
                        </div>
                    )}
                </div>

                <div className="space-y-2.5 pb-2">
                    {selectedDayDetails && selectedDayDetails.length > 0 ? (
                        selectedDayDetails.map((rec, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50/50 rounded-[1.5rem] border border-zinc-100/30 group active:scale-[0.98] transition-all">
                                <div className="flex items-center gap-2.5">
                                    <StudentAvatar
                                        photo={rec.studentPhoto}
                                        name={rec.studentName}
                                        size={36}
                                        beltRank={rec.studentBeltRank}
                                        degrees={rec.studentDegrees ?? 0}
                                        modality={rec.studentModality}
                                        isDark={false}
                                        ring="ring-2 ring-white shadow-sm"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-zinc-800 leading-none">{rec.studentName}</span>
                                        <span className="text-[7px] font-bold text-zinc-400 uppercase mt-0.5">
                                            {rec.studentCategory || "—"}
                                        </span>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border transition-all ${
                                    rec.status === 'present' 
                                        ? 'bg-white border-emerald-100 text-emerald-600 shadow-sm' 
                                        : 'bg-white border-red-100 text-red-500 shadow-sm'
                                }`}>
                                    {rec.status === 'present' ? <CircleCheck size={12} /> : <CircleX size={12} />}
                                    <span className="text-[8px] font-black uppercase tracking-tighter">{rec.status === 'present' ? 'Presente' : 'Ausente'}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-6 text-center flex flex-col items-center gap-2">
                            <div className="w-10 h-10 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-200">
                                <User size={20} />
                            </div>
                            <p className="text-[8px] font-black text-zinc-300 uppercase tracking-[0.2em]">Sin registros</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
