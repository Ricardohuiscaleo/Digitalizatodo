"use client";

import React from 'react';
import { CalendarCheck, Clock } from 'lucide-react';
import { nowCL } from '@/lib/utils';

interface TodayScheduleProps {
    schedules: any[];
    primaryColor?: string;
    isDark?: boolean;
}

export default function TodaySchedule({ schedules, primaryColor, isDark = false }: TodayScheduleProps) {
    const dow = nowCL().getDay();
    const today = (schedules || []).filter(s => s.day_of_week === dow).sort((a, b) => a.start_time.localeCompare(b.start_time));
    const dayName = nowCL().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

    const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const durationLabel = (start: string, end: string) => {
        const mins = toMins(end) - toMins(start);
        if (mins <= 0) return null;
        const h = Math.floor(mins / 60), m = mins % 60;
        if (h === 0) return `${m} min`;
        if (m === 0) return `${h} hora${h > 1 ? 's' : ''}`;
        return `${h}h ${m}min`;
    };

    // Agrupar bloques consecutivos de la misma materia
    const grouped: { subject: string; start: string; end: string; color: string; ids: number[] }[] = [];
    for (const s of today) {
        const subj = s.subject || s.name || 'Clase';
        const last = grouped[grouped.length - 1];
        if (last && last.subject === subj && last.end === s.start_time.slice(0, 5)) {
            last.end = s.end_time.slice(0, 5);
            last.ids.push(s.id);
        } else {
            grouped.push({ subject: subj, start: s.start_time.slice(0, 5), end: s.end_time.slice(0, 5), color: s.color || '#f4f4f5', ids: [s.id] });
        }
    }

    // Intercalar recreos entre gaps
    const items: ({ type: 'class' } & typeof grouped[0] | { type: 'break'; start: string; end: string; dur: string })[] = [];
    grouped.forEach((g, i) => {
        if (i > 0) {
            const prev = grouped[i - 1];
            const gap = toMins(g.start) - toMins(prev.end);
            if (gap > 0) items.push({ type: 'break', start: prev.end, end: g.start, dur: durationLabel(prev.end, g.start) || '' });
        }
        items.push({ type: 'class', ...g });
    });

    return (
        <div className={`rounded-[2.5rem] p-6 shadow-sm border transition-colors duration-500 h-full ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'
        }`}>
            <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-6 ${
                isDark ? 'text-white' : 'text-zinc-900'
            }`}>
                <CalendarCheck style={{ color: primaryColor || '#6366f1' }} size={16} />
                Clases de hoy
                <span className={`text-[9px] font-bold lowercase tracking-normal capitalize opacity-40 ml-auto`}>{dayName}</span>
            </h3>

            {grouped.length === 0 ? (
                <div className={`flex items-center gap-3 py-12 px-4 rounded-[2rem] border-2 border-dashed justify-center ${
                    isDark ? 'bg-zinc-800/30 border-zinc-700' : 'bg-zinc-50 border-zinc-100'
                }`}>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest text-center">Sin clases hoy</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item, idx) => {
                        if (item.type === 'break') return (
                            <div key={`break-${idx}`} className="flex items-center gap-3 px-4 py-1.5 mx-1">
                                <div className="flex flex-col items-center shrink-0 w-10">
                                    <span className={`text-[9px] font-bold leading-none ${isDark ? 'text-zinc-600' : 'text-zinc-300'}`}>{item.start}</span>
                                </div>
                                <div className="flex-1 flex items-center gap-3">
                                    <div className={`flex-1 h-px ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`} />
                                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-zinc-700' : 'text-zinc-300'}`}>
                                        RECESO {item.dur}
                                    </span>
                                    <div className={`flex-1 h-px ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`} />
                                </div>
                            </div>
                        );

                        const isDefaultColor = item.color === '#f4f4f5' || !item.color;
                        const bg = isDefaultColor 
                            ? (isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc') 
                            : item.color;
                        
                        const fg = !isDefaultColor 
                            ? (() => { 
                                const c = item.color.replace('#','');
                                const r=parseInt(c.slice(0,2),16), g2=parseInt(c.slice(2,4),16), b=parseInt(c.slice(4,6),16);
                                const lum = (0.299*r+0.587*g2+0.114*b)/255;
                                return lum > 0.55 ? '#18181b' : '#ffffff';
                              })()
                            : (isDark ? '#e4e4e7' : '#18181b');

                        const dur = durationLabel(item.start, item.end);
                        
                        return (
                            <div key={item.ids.join('-')} 
                                className={`flex items-center gap-4 px-5 py-4 rounded-3xl transition-all border ${
                                    isDefaultColor ? (isDark ? 'border-zinc-800/50' : 'border-zinc-100') : 'border-transparent shadow-lg'
                                }`} 
                                style={{ backgroundColor: bg, color: fg }}>
                                <div className="flex flex-col items-center shrink-0 w-10">
                                    <span className="text-[11px] font-black leading-none">{item.start}</span>
                                    <div className="w-px h-3 my-1" style={{ backgroundColor: fg, opacity: 0.2 }} />
                                    <span className="text-[11px] font-black leading-none opacity-40">{item.end}</span>
                                </div>
                                <div className="flex flex-col flex-1">
                                    <span className="text-sm font-black uppercase tracking-tight leading-tight">{item.subject}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        {dur && <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest">{dur}</span>}
                                        <div className="w-1 h-1 rounded-full bg-current opacity-20" />
                                        <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest">Dojo Central</span>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 border border-white/10 shrink-0">
                                    <Clock size={14} className="opacity-40" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
