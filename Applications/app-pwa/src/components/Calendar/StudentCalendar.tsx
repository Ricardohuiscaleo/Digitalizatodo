"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react";

interface AttendanceRecord {
    date: string; // YYYY-MM-DD
    status: "present" | "absent";
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

    const attendanceMap = attendance.reduce((acc, rec) => {
        acc[rec.date] = rec.status;
        return acc;
    }, {} as Record<string, string>);

    const days = [];
    const numDays = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);

    // Padding for first week
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
        days.push(<div key={`empty-${i}`} className="h-10 w-10" />);
    }

    for (let day = 1; day <= numDays; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const status = attendanceMap[dateStr];
        const isToday = dateStr === today;

        days.push(
            <div 
                key={day} 
                className={`h-10 w-10 flex flex-col items-center justify-center rounded-xl relative transition-all ${
                    isToday ? "bg-stone-900 text-white font-black" : "text-zinc-600"
                }`}
            >
                <span className="text-xs">{day}</span>
                {status === "present" && (
                    <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                )}
                {status === "absent" && (
                    <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
                )}
            </div>
        );
    }

    return (
        <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-6 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-black text-zinc-900">{monthNames[month]}</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{year}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
                        <ChevronLeft size={18} />
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-y-2 mb-4 text-center">
                {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                    <span key={i} className="text-[10px] font-black text-zinc-300 uppercase">{d}</span>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1 text-center font-bold">
                {days}
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-50 flex justify-around">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Asistió</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Faltó</span>
                </div>
            </div>
        </div>
    );
}
