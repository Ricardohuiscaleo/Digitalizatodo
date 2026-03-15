"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, User, CircleCheck, CircleX } from "lucide-react";

interface AttendanceRecord {
    date: string; // YYYY-MM-DD
    status: "present" | "absent";
    studentName: string;
    studentPhoto?: string;
}

interface StudentCalendarProps {
    attendance: AttendanceRecord[];
    primaryColor?: string;
}

export default function StudentCalendar({ attendance, primaryColor = "#f97316" }: StudentCalendarProps) {
    // Corregimos el "hoy" usando fecha local para evitar saltos de zona horaria (ISO vs Local)
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

    // Mapeo por fecha
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
                className={`h-10 w-full flex flex-col items-center justify-center rounded-xl relative transition-all border ${
                    isSelected 
                        ? "bg-zinc-900 border-zinc-900 text-white shadow-lg z-10 scale-105" 
                        : isToday 
                            ? "border-indigo-200 bg-indigo-50 text-indigo-700 font-black" 
                            : "border-transparent hover:bg-zinc-50 text-zinc-600"
                }`}
            >
                <span className="text-[11px] font-bold">{day}</span>
                
                {hasActivity && !isSelected && (
                    <div className="absolute bottom-1 flex gap-[2px]">
                        {records.slice(0, 3).map((r, i) => (
                            <div key={i} className={`w-1 h-1 rounded-full ${r.status === 'present' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        ))}
                    </div>
                )}
            </button>
        );
    }

    const selectedDayDetails = selectedDate ? attendanceMap[selectedDate] : null;

    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-180px)] space-y-4 overflow-hidden animate-in fade-in duration-500">
            {/* CALENDARIO COMPACTO */}
            <div className="bg-white border border-zinc-100 rounded-[2rem] p-4 shadow-sm shrink-0">
                <div className="flex items-center justify-between mb-4 px-2">
                    <div>
                        <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tighter">{monthNames[month]} {year}</h3>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={prevMonth} className="p-1.5 bg-zinc-50 hover:bg-zinc-100 rounded-lg transition-all text-zinc-400">
                            <ChevronLeft size={16} />
                        </button>
                        <button onClick={nextMonth} className="p-1.5 bg-zinc-50 hover:bg-zinc-100 rounded-lg transition-all text-zinc-400">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                        <span key={i} className="text-[9px] font-black text-zinc-300 uppercase">{d}</span>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                    {days}
                </div>
            </div>

            {/* DETALLES DEL DÍA SELECCIONADO */}
            <div className="flex-1 bg-white border border-zinc-100 rounded-[2rem] p-5 shadow-sm overflow-y-auto min-h-0 relative">
                <div className="sticky top-0 bg-white pb-3 z-10 flex items-center justify-between border-b border-zinc-50 mb-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                        {selectedDate === today ? "Estado de Hoy" : `Detalle: ${selectedDate?.split('-').reverse().join('/')}`}
                    </h4>
                    {selectedDayDetails && (
                        <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {selectedDayDetails.filter(r => r.status === 'present').length} Presentes
                        </span>
                    )}
                </div>

                <div className="space-y-3">
                    {selectedDayDetails && selectedDayDetails.length > 0 ? (
                        selectedDayDetails.map((rec, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50/50 rounded-2xl border border-zinc-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white border border-zinc-100 flex items-center justify-center overflow-hidden">
                                        {rec.studentPhoto ? (
                                            <img src={rec.studentPhoto} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="font-black text-xs text-zinc-200">{rec.studentName[0]}</div>
                                        )}
                                    </div>
                                    <span className="text-[11px] font-black text-zinc-800">{rec.studentName}</span>
                                </div>
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                                    rec.status === 'present' 
                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                                        : 'bg-red-50 border-red-100 text-red-500'
                                }`}>
                                    {rec.status === 'present' ? <CircleCheck size={12} /> : <CircleX size={12} />}
                                    <span className="text-[9px] font-black uppercase">{rec.status === 'present' ? 'Presente' : 'Ausente'}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-8 text-center space-y-2">
                            <div className="w-10 h-10 bg-zinc-50 rounded-full flex items-center justify-center mx-auto text-zinc-200">
                                <User size={20} />
                            </div>
                            <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest italic">No hay registros para este día</p>
                        </div>
                    )}
                </div>
                
                {/* Visual indicator of the bottom to ensure no content is hidden */}
                <div className="h-4" />
            </div>
        </div>
    );
}
