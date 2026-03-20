"use client";

import React from "react";
import { CalendarCheck } from "lucide-react";
import { nowCL } from "@/lib/utils";

interface TodayScheduleProps {
    schedules: any[];
    primaryColor?: string;
    vocab?: any;
}

export function TodaySchedule({ schedules, primaryColor, vocab }: TodayScheduleProps) {
    const dow = nowCL().getDay();
    const today = schedules.filter(s => s.day_of_week === dow).sort((a, b) => a.start_time.localeCompare(b.start_time));
    const dayName = nowCL().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

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

    const durationLabel = (start: string, end: string) => {
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        const mins = (eh * 60 + em) - (sh * 60 + sm);
        if (mins <= 0) return null;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h === 0) return `${m} min`;
        if (m === 0) return `${h} hora${h > 1 ? 's' : ''}`;
        return `${h}h ${m}min`;
    };

    // Construir lista intercalando recreos entre bloques con gap
    const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
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
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-100">
            <h3 className="text-sm font-black text-zinc-800 flex items-center gap-2 uppercase tracking-tighter mb-4">
                <CalendarCheck style={{ color: primaryColor || '#6366f1' }} size={18} />
                Clases de hoy
                <span className="text-[9px] font-bold text-zinc-400 normal-case tracking-normal capitalize">{dayName}</span>
            </h3>
            {grouped.length === 0 ? (
                <div className="flex items-center gap-3 py-8 px-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 justify-center">
                    <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Sin clases hoy</p>
                </div>
            ) : (
                <div className="space-y-1.5">
                    {items.map((item, idx) => {
                        if (item.type === 'break') return (
                            <div key={`break-${idx}`} className="flex items-center gap-3 px-4 py-1.5 mx-1">
                                <div className="flex flex-col items-center shrink-0 w-10">
                                    <span className="text-[9px] font-bold text-zinc-500 leading-none">{item.start}</span>
                                </div>
                                <div className="flex-1 flex items-center gap-2">
                                    <div className="flex-1 h-px bg-zinc-300" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">🍎🧃 {item.dur}</span>
                                    <div className="flex-1 h-px bg-zinc-300" />
                                </div>
                            </div>
                        );
                        const bg = item.color;
                        const lum = bg !== '#f4f4f5' ? (() => { const r=parseInt(bg.slice(1,3),16),g2=parseInt(bg.slice(3,5),16),b=parseInt(bg.slice(5,7),16); return (0.299*r+0.587*g2+0.114*b)/255; })() : 1;
                        const fg = lum > 0.55 ? '#18181b' : '#ffffff';
                        const dur = durationLabel(item.start, item.end);
                        return (
                            <div key={item.ids.join('-')} className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ backgroundColor: bg, color: fg }}>
                                <div className="flex flex-col items-center shrink-0 w-10">
                                    <span className="text-[10px] font-black leading-none">{item.start}</span>
                                    <div className="w-px h-3 my-0.5" style={{ backgroundColor: fg, opacity: 0.3 }} />
                                    <span className="text-[10px] font-black leading-none opacity-70">{item.end}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-black uppercase tracking-tight">{item.subject}</span>
                                    {dur && <span className="text-[9px] font-bold opacity-60 mt-0.5">{dur}</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
