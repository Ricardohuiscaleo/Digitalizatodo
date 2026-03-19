"use client";

import React, { useState } from "react";
import { Plus, Trash2, X, Check } from "lucide-react";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const DAY_COLORS = ["bg-yellow-400", "bg-teal-500", "bg-pink-400", "bg-blue-400", "bg-orange-400"];
const DAY_INDEX = [1, 2, 3, 4, 5];

export interface ScheduleEntry {
    id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    subject: string | null;
    name: string | null;
}

interface Props {
    schedules: ScheduleEntry[];
    editable?: boolean;
    onSave?: (entry: Omit<ScheduleEntry, "id">) => Promise<void>;
    onUpdate?: (id: number, entry: Partial<ScheduleEntry>) => Promise<void>;
    onDelete?: (id: number) => Promise<void>;
}

function timeSlots(schedules: ScheduleEntry[]): string[] {
    const slots = new Set<string>();
    schedules.forEach(s => slots.add(`${s.start_time}|${s.end_time}`));
    return Array.from(slots).sort();
}

export default function WeeklySchedule({ schedules, editable = false, onSave, onUpdate, onDelete }: Props) {
    const [editingCell, setEditingCell] = useState<{ day: number; slot: string } | null>(null);
    const [editValue, setEditValue] = useState("");
    const [showAddRow, setShowAddRow] = useState(false);
    const [newStart, setNewStart] = useState("");
    const [newEnd, setNewEnd] = useState("");
    const [saving, setSaving] = useState(false);

    const slots = timeSlots(schedules);

    const getCell = (day: number, slot: string) => {
        const [start, end] = slot.split("|");
        return schedules.find(s => s.day_of_week === day && s.start_time === start && s.end_time === end);
    };

    const handleCellClick = (day: number, slot: string) => {
        if (!editable) return;
        const cell = getCell(day, slot);
        setEditingCell({ day, slot });
        setEditValue(cell?.subject || "");
    };

    const handleCellSave = async () => {
        if (!editingCell) return;
        setSaving(true);
        const [start, end] = editingCell.slot.split("|");
        const existing = getCell(editingCell.day, editingCell.slot);
        if (existing) {
            await onUpdate?.(existing.id, { subject: editValue });
        } else if (editValue.trim()) {
            await onSave?.({ day_of_week: editingCell.day, start_time: start, end_time: end, subject: editValue, name: null });
        }
        setSaving(false);
        setEditingCell(null);
    };

    const handleAddRow = async () => {
        if (!newStart || !newEnd) return;
        setSaving(true);
        for (const day of DAY_INDEX) {
            await onSave?.({ day_of_week: day, start_time: newStart, end_time: newEnd, subject: "", name: null });
        }
        setSaving(false);
        setShowAddRow(false);
        setNewStart(""); setNewEnd("");
    };

    const handleDeleteRow = async (slot: string) => {
        const [start, end] = slot.split("|");
        const toDelete = schedules.filter(s => s.start_time === start && s.end_time === end);
        for (const s of toDelete) await onDelete?.(s.id);
    };

    const fmtSlot = (slot: string) => slot.replace("|", " – ");

    return (
        <div className="w-full overflow-x-auto">
            <div className="min-w-[320px]">
                {/* Header días */}
                <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: "72px repeat(5, 1fr)" }}>
                    <div />
                    {DAYS.map((day, i) => (
                        <div key={day} className={`${DAY_COLORS[i]} text-white text-[8px] font-black uppercase tracking-wider text-center py-1.5 rounded-lg`}>
                            {day.slice(0, 3)}
                        </div>
                    ))}
                </div>

                {/* Filas */}
                {slots.map(slot => (
                    <div key={slot} className="grid gap-1 mb-1 group/row" style={{ gridTemplateColumns: "72px repeat(5, 1fr)" }}>
                        <div className="flex flex-col items-center justify-center gap-0.5">
                            <span className="text-[7px] font-black text-zinc-400 text-center leading-tight">{fmtSlot(slot)}</span>
                            {editable && (
                                <button onClick={() => handleDeleteRow(slot)} className="opacity-0 group-hover/row:opacity-100 w-4 h-4 bg-red-100 text-red-400 rounded-full flex items-center justify-center transition-opacity">
                                    <Trash2 size={8} />
                                </button>
                            )}
                        </div>
                        {DAY_INDEX.map(day => {
                            const cell = getCell(day, slot);
                            const isEditing = editingCell?.day === day && editingCell?.slot === slot;
                            return (
                                <div
                                    key={day}
                                    onClick={() => handleCellClick(day, slot)}
                                    className={`min-h-[36px] rounded-lg border flex items-center justify-center p-1 transition-all ${
                                        editable ? "cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/50" : ""
                                    } ${cell?.subject ? "bg-white border-zinc-200 shadow-sm" : "bg-zinc-50 border-zinc-100"}`}
                                >
                                    {isEditing ? (
                                        <div className="flex items-center gap-0.5 w-full" onClick={e => e.stopPropagation()}>
                                            <input
                                                autoFocus
                                                value={editValue}
                                                onChange={e => setEditValue(e.target.value.toUpperCase())}
                                                onKeyDown={e => { if (e.key === "Enter") handleCellSave(); if (e.key === "Escape") setEditingCell(null); }}
                                                className="w-full text-[8px] font-black uppercase bg-transparent outline-none text-center"
                                                placeholder="ASIG."
                                            />
                                            <button onClick={handleCellSave} disabled={saving} className="shrink-0 text-emerald-500"><Check size={9} /></button>
                                            <button onClick={() => setEditingCell(null)} className="shrink-0 text-zinc-300"><X size={9} /></button>
                                        </div>
                                    ) : (
                                        <span className="text-[8px] font-black uppercase text-center text-zinc-700 leading-tight">
                                            {cell?.subject || (editable ? <span className="text-zinc-200">+</span> : "–")}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}

                {/* Agregar bloque */}
                {editable && (
                    <div className="mt-2">
                        {showAddRow ? (
                            <div className="flex items-center gap-2 bg-zinc-50 rounded-xl p-3 border border-zinc-200 flex-wrap">
                                <input type="time" value={newStart} onChange={e => setNewStart(e.target.value)} className="text-xs border border-zinc-200 rounded-lg px-2 py-1 w-24" />
                                <span className="text-zinc-400 text-xs">–</span>
                                <input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)} className="text-xs border border-zinc-200 rounded-lg px-2 py-1 w-24" />
                                <button onClick={handleAddRow} disabled={saving || !newStart || !newEnd} className="flex items-center gap-1 bg-zinc-900 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-lg disabled:opacity-40">
                                    <Check size={10} /> Agregar
                                </button>
                                <button onClick={() => setShowAddRow(false)} className="text-zinc-300"><X size={14} /></button>
                            </div>
                        ) : (
                            <button onClick={() => setShowAddRow(true)} className="w-full flex items-center justify-center gap-2 border border-dashed border-zinc-200 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:border-zinc-400 transition-all">
                                <Plus size={12} /> Agregar bloque horario
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
