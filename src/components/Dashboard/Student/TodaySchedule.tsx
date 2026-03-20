"use client";

import React from "react";
import { Calendar } from "lucide-react";
import { nowCL } from "@/lib/utils";

interface TodayScheduleProps {
    schedules: any[];
    primaryColor?: string;
}

export function TodaySchedule({ schedules, primaryColor }: TodayScheduleProps) {
    const dow = nowCL().getDay();
    const today = schedules.filter(s => s.day_of_week === dow).sort((a, b) => a.start_time.localeCompare(b.start_time));
    const dayName = nowCL().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
    
    return (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-100">
            <h3 className="text-sm font-black text-zinc-800 flex items-center gap-2 uppercase tracking-tighter mb-4">
                <Calendar style={{ color: primaryColor || '#6366f1' }} size={18} />
                Clases de hoy
                <span className="text-[9px] font-bold text-zinc-400 normal-case tracking-normal capitalize">{dayName}</span>
            </h3>
            {today.length === 0 ? (
                <div className="flex items-center gap-3 py-8 px-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 justify-center">
                    <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Sin clases hoy</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {today.map((s: any) => {
                        const bg = s.color || '#f4f4f5';
                        const lum = bg !== '#f4f4f5' ? (() => { const r=parseInt(bg.slice(1,3),16),g=parseInt(bg.slice(3,5),16),b=parseInt(bg.slice(5,7),16); return (0.299*r+0.587*g+0.114*b)/255; })() : 1;
                        const fg = lum > 0.55 ? '#18181b' : '#ffffff';
                        return (
                            <div key={s.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ backgroundColor: bg, color: fg }}>
                                <div className="flex flex-col items-center shrink-0 w-10">
                                    <span className="text-[10px] font-black leading-none">{s.start_time.slice(0,5)}</span>
                                    <div className="w-px h-3 my-0.5" style={{ backgroundColor: fg, opacity: 0.3 }} />
                                    <span className="text-[10px] font-black leading-none opacity-70">{s.end_time.slice(0,5)}</span>
                                </div>
                                <span className="text-sm font-black uppercase tracking-tight">{s.subject || s.name || 'Clase'}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
