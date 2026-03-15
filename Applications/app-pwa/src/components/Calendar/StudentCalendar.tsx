"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, User } from "lucide-react";

interface AttendanceRecord {
    date: string; // YYYY-MM-DD
    status: "present" | "absent";
    studentName?: string;
}

interface StudentCalendarProps {
    attendance: AttendanceRecord[];
    primaryColor?: string;
}

export default function StudentCalendar({ attendance, primaryColor = "#f97316" }: StudentCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

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

    const today = new Date().toISOString().split('T')[0];

    // Map by date with an array of records
    const attendanceMap = attendance.reduce((acc, rec) => {
        if (!acc[rec.date]) acc[rec.date] = [];
        acc[rec.date].push(rec);
        return acc;
    }, {} as Record<string, AttendanceRecord[]>);

    const days = [];
    const numDays = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);

    // Padding for first week (Monday as first day)
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
        days.push(<div key={`empty-${i}`} className="h-12 w-12" />);
    }

    for (let day = 1; day <= numDays; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const records = attendanceMap[dateStr] || [];
        const isToday = dateStr === today;

        days.push(
            <div 
                key={day} 
                className={`h-12 w-full flex flex-col items-center justify-start py-1 rounded-2xl relative transition-all border border-transparent ${
                    isToday ? "bg-stone-900 text-white font-black" : "hover:bg-zinc-50 text-zinc-600"
                }`}
            >
                <span className="text-[11px] mb-1">{day}</span>
                
                {/* Dots container */}
                <div className="flex flex-wrap justify-center gap-[2px] px-1 max-w-full overflow-hidden">
                    {records.map((rec, idx) => {
                        const isPresent = rec.status === "present";
                        return (
                            <div 
                                key={idx}
                                title={rec.studentName}
                                className={`w-1.5 h-1.5 rounded-full ${
                                    isPresent 
                                        ? "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.3)]" 
                                        : "bg-red-400"
                                }`}
                            />
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-6 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-black text-zinc-900 tracking-tight">{monthNames[month]}</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{year}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2.5 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-all active:scale-90 text-zinc-400">
                        <ChevronLeft size={18} />
                    </button>
                    <button onClick={nextMonth} className="p-2.5 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-all active:scale-90 text-zinc-400">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-4 text-center">
                {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                    <span key={i} className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{d}</span>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center font-bold">
                {days}
            </div>

            <div className="mt-8 pt-8 border-t border-zinc-100 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-emerald-50/50 p-3 rounded-2xl">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Presente</p>
                        <p className="text-[8px] font-medium text-emerald-600/60 uppercase">Asistencia válida</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-red-50/50 p-3 rounded-2xl">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-sm" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-700">Ausente</p>
                        <p className="text-[8px] font-medium text-red-600/60 uppercase">Inasistencia</p>
                    </div>
                </div>
            </div>
            
            <p className="mt-6 text-center text-[9px] font-bold text-zinc-300 uppercase tracking-widest">
                Cada punto representa la asistencia de un alumno
            </p>
        </div>
    );
}
