"use client";

import React, { useState } from "react";
import { Plus, Trash2, X, Check, Loader2, Edit2 } from "lucide-react";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const DAY_COLORS = [
    "bg-yellow-400 text-yellow-900",
    "bg-teal-500 text-white",
    "bg-pink-400 text-white",
    "bg-blue-400 text-white",
    "bg-orange-400 text-white",
];
const DAY_INDEX = [1, 2, 3, 4, 5];

// Paleta estándar chilena + extras
const SUBJECT_COLORS: { label: string; hex: string; bg: string; text: string }[] = [
    { label: "Lenguaje",   hex: "#ef4444", bg: "bg-red-500",    text: "text-white" },
    { label: "Matemáticas",hex: "#3b82f6", bg: "bg-blue-500",   text: "text-white" },
    { label: "Ciencias",   hex: "#22c55e", bg: "bg-green-500",  text: "text-white" },
    { label: "Historia",   hex: "#eab308", bg: "bg-yellow-400", text: "text-yellow-900" },
    { label: "Inglés",     hex: "#a855f7", bg: "bg-purple-500", text: "text-white" },
    { label: "Religión",   hex: "#7dd3fc", bg: "bg-sky-300",    text: "text-sky-900" },
    { label: "Artes",      hex: "#f9fafb", bg: "bg-zinc-100",   text: "text-zinc-700" },
    { label: "Tecnología", hex: "#92400e", bg: "bg-amber-800",  text: "text-white" },
    { label: "Ed. Física", hex: "#ec4899", bg: "bg-pink-500",   text: "text-white" },
    { label: "Música",     hex: "#f97316", bg: "bg-orange-500", text: "text-white" },
    { label: "Otro",       hex: "#71717a", bg: "bg-zinc-500",   text: "text-white" },
];

const getColorStyle = (hex?: string | null) => {
    if (!hex) return { backgroundColor: "#f4f4f5", color: "#52525b" };
    return { backgroundColor: hex, color: getContrastColor(hex) };
};

// Contraste simple blanco/negro
function getContrastColor(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? "#1a1a1a" : "#ffffff";
}

export interface ScheduleEntry {
    id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    subject: string | null;
    name: string | null;
    color?: string | null;
}

interface Props {
    schedules: ScheduleEntry[];
    editable?: boolean;
    onSave?: (entry: Omit<ScheduleEntry, "id">) => Promise<void>;
    onUpdate?: (id: number, entry: Partial<ScheduleEntry>) => Promise<void>;
    onDelete?: (id: number) => Promise<void>;
}

const fmtTime = (t: string) => t.slice(0, 5);

function timeSlots(schedules: ScheduleEntry[]): string[] {
    const slots = new Set<string>();
    schedules.forEach(s => slots.add(`${s.start_time}|${s.end_time}`));
    return Array.from(slots).sort();
}

interface CellModalProps {
    day: number;
    slot: string;
    existing: ScheduleEntry | undefined;
    editable: boolean;
    onSave: (value: string, color: string) => Promise<void>;
    onDelete: () => Promise<void>;
    onClose: () => void;
}

function CellModal({ day, slot, existing, editable, onSave, onDelete, onClose }: CellModalProps) {
    const [value, setValue] = useState(existing?.subject || "");
    const [color, setColor] = useState(existing?.color || SUBJECT_COLORS[10].hex);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [start, end] = slot.split("|");
    const dayName = DAYS[day - 1];

    const handleSave = async () => {
        setSaving(true);
        await onSave(value, color);
        setSaving(false);
        onClose();
    };

    const handleDelete = async () => {
        setDeleting(true);
        await onDelete();
        setDeleting(false);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[300] bg-zinc-950/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-sm rounded-t-[2rem] pb-10 shadow-2xl animate-in slide-in-from-bottom-4 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-center pt-4 pb-3">
                    <div className="w-10 h-1.5 bg-zinc-200 rounded-full" />
                </div>

                <div className="px-6 pb-4 border-b border-zinc-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                {dayName} · {fmtTime(start)} – {fmtTime(end)}
                            </p>
                            <p className="text-base font-black uppercase text-zinc-900 mt-0.5">
                                {existing?.subject || "Celda vacía"}
                            </p>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {editable ? (
                    <div className="px-6 pt-5 space-y-4">
                        <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 block">
                                Asignatura / Actividad
                            </label>
                            <input
                                autoFocus
                                value={value}
                                onChange={e => setValue(e.target.value.toUpperCase())}
                                onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onClose(); }}
                                placeholder="Ej: MATEMÁTICAS"
                                className="w-full h-12 bg-zinc-50 rounded-xl px-4 text-sm font-black uppercase text-zinc-900 placeholder:text-zinc-300 border border-zinc-100 outline-none focus:ring-2 ring-zinc-950"
                            />
                        </div>

                        {/* Color picker */}
                        <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2 block">
                                Color de asignatura
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {SUBJECT_COLORS.map(c => (
                                    <button
                                        key={c.hex}
                                        onClick={() => setColor(c.hex)}
                                        title={c.label}
                                        className={`w-8 h-8 rounded-full border-2 transition-all active:scale-90 ${
                                            color === c.hex ? "border-zinc-950 scale-110 shadow-md" : "border-transparent"
                                        }`}
                                        style={{ backgroundColor: c.hex }}
                                    />
                                ))}
                            </div>
                            {/* Preview */}
                            <div
                                className="mt-3 h-9 rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all"
                                style={getColorStyle(color)}
                            >
                                {value || "ASIGNATURA"}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {existing && (
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="h-12 px-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase active:scale-95 transition-all disabled:opacity-40"
                                >
                                    {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    Borrar
                                </button>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={saving || !value.trim()}
                                className="flex-1 h-12 bg-zinc-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Guardar</>}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="px-6 pt-5">
                        <div
                            className="h-10 rounded-xl flex items-center justify-center text-[11px] font-black uppercase tracking-widest"
                            style={getColorStyle(existing?.color)}
                        >
                            {existing?.subject || "Sin asignatura"}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function WeeklySchedule({ schedules, editable = false, onSave, onUpdate, onDelete }: Props) {
    const [modalCell, setModalCell] = useState<{ day: number; slot: string } | null>(null);
    const [showAddRow, setShowAddRow] = useState(false);
    const [newStart, setNewStart] = useState("");
    const [newEnd, setNewEnd] = useState("");
    const [addSaving, setAddSaving] = useState(false);
    const [deletingSlot, setDeletingSlot] = useState<string | null>(null);

    const slots = timeSlots(schedules);

    const getCell = (day: number, slot: string) => {
        const [start, end] = slot.split("|");
        return schedules.find(s => s.day_of_week === day && s.start_time === start && s.end_time === end);
    };

    const handleCellSave = async (value: string, color: string) => {
        if (!modalCell) return;
        const [start, end] = modalCell.slot.split("|");
        const existing = getCell(modalCell.day, modalCell.slot);
        if (existing) {
            await onUpdate?.(existing.id, { subject: value, color });
        } else if (value.trim()) {
            await onSave?.({ day_of_week: modalCell.day, start_time: start, end_time: end, subject: value, color, name: null });
        }
    };

    const handleCellDelete = async () => {
        if (!modalCell) return;
        const existing = getCell(modalCell.day, modalCell.slot);
        if (existing) await onDelete?.(existing.id);
    };

    const handleAddRow = async () => {
        if (!newStart || !newEnd) return;
        setAddSaving(true);
        for (const day of DAY_INDEX) {
            await onSave?.({ day_of_week: day, start_time: newStart, end_time: newEnd, subject: "", color: null, name: null });
        }
        setAddSaving(false);
        setShowAddRow(false);
        setNewStart(""); setNewEnd("");
    };

    const handleDeleteRow = async (slot: string) => {
        setDeletingSlot(slot);
        const [start, end] = slot.split("|");
        const toDelete = schedules.filter(s => s.start_time === start && s.end_time === end);
        for (const s of toDelete) await onDelete?.(s.id);
        setDeletingSlot(null);
    };

    const modalExisting = modalCell ? getCell(modalCell.day, modalCell.slot) : undefined;

    return (
        <>
            <div className="w-full">
                {/* ── DESKTOP: tabla grid ── */}
                <div className="hidden md:block overflow-x-auto">
                    <div className="min-w-[400px]">
                        <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: "56px repeat(5, 1fr)" }}>
                            <div />
                            {DAYS.map((day, i) => (
                                <div key={day} className={`${DAY_COLORS[i]} text-[8px] font-black uppercase tracking-wider text-center py-1.5 rounded-lg`}>
                                    {day.slice(0, 3)}
                                </div>
                            ))}
                        </div>

                        {slots.map(slot => (
                            <div key={slot} className="grid gap-1 mb-1 group/row" style={{ gridTemplateColumns: "56px repeat(5, 1fr)" }}>
                                <div className="flex flex-col items-center justify-center gap-0.5 relative">
                                    <span className="text-[9px] font-black text-zinc-500 text-center leading-tight">
                                        {fmtTime(slot.split("|")[0])}
                                    </span>
                                    <div className="w-px h-2 bg-zinc-200" />
                                    <span className="text-[9px] font-black text-zinc-400 text-center leading-tight">
                                        {fmtTime(slot.split("|")[1])}
                                    </span>
                                    {editable && (
                                        <button
                                            onClick={() => handleDeleteRow(slot)}
                                            disabled={deletingSlot === slot}
                                            className="opacity-0 group-hover/row:opacity-100 mt-0.5 w-4 h-4 bg-red-100 text-red-400 rounded-full flex items-center justify-center transition-opacity disabled:opacity-40"
                                        >
                                            {deletingSlot === slot ? <Loader2 size={7} className="animate-spin" /> : <Trash2 size={7} />}
                                        </button>
                                    )}
                                </div>

                                {DAY_INDEX.map(day => {
                                    const cell = getCell(day, slot);
                                    return (
                                        <div
                                            key={day}
                                            onClick={() => editable && setModalCell({ day, slot })}
                                            className={`min-h-[36px] rounded-lg flex items-center justify-center p-1 transition-all border ${
                                                editable ? "cursor-pointer hover:opacity-80" : ""
                                            }`}
                                            style={cell?.subject ? getColorStyle(cell.color) : { backgroundColor: "#f9fafb", borderColor: "#f4f4f5" }}
                                        >
                                            <span className="text-[8px] font-black uppercase text-center leading-tight">
                                                {cell?.subject || (editable ? <span style={{ opacity: 0.3 }}>+</span> : "–")}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}

                        {editable && (
                            <div className="mt-2">
                                {showAddRow ? (
                                    <div className="flex items-center gap-2 bg-zinc-50 rounded-xl p-3 border border-zinc-200 flex-wrap">
                                        <input type="time" value={newStart} onChange={e => setNewStart(e.target.value)} className="text-xs border border-zinc-200 rounded-lg px-2 py-1 w-24" />
                                        <span className="text-zinc-400 text-xs">–</span>
                                        <input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)} className="text-xs border border-zinc-200 rounded-lg px-2 py-1 w-24" />
                                        <button onClick={handleAddRow} disabled={addSaving || !newStart || !newEnd} className="flex items-center gap-1 bg-zinc-900 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-lg disabled:opacity-40">
                                            {addSaving ? <Loader2 size={10} className="animate-spin" /> : <><Check size={10} /> Agregar</>}
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

                {/* ── MOBILE: columnas por día ── */}
                <div className="md:hidden space-y-4">
                    {slots.length === 0 ? (
                        <div className="text-center py-10 text-zinc-300">
                            <p className="text-xs font-bold">Sin bloques horarios</p>
                        </div>
                    ) : (
                        DAYS.map((dayName, i) => {
                            const dayIdx = DAY_INDEX[i];
                            const dayCells = slots.map(slot => ({ slot, cell: getCell(dayIdx, slot) })).filter(({ cell }) => cell?.subject);
                            if (dayCells.length === 0) return null;
                            return (
                                <div key={dayName}>
                                    <div className={`${DAY_COLORS[i]} text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl inline-block mb-2`}>
                                        {dayName}
                                    </div>
                                    <div className="space-y-1.5">
                                        {dayCells.map(({ slot, cell }) => (
                                            <div
                                                key={slot}
                                                onClick={() => editable && setModalCell({ day: dayIdx, slot })}
                                                className={`flex items-center gap-3 rounded-2xl px-4 py-3 shadow-sm border border-transparent ${editable ? "cursor-pointer active:scale-[0.98] transition-transform" : ""}`}
                                                style={getColorStyle(cell?.color)}
                                            >
                                                <div className="flex flex-col items-center shrink-0 w-10">
                                                    <span className="text-[10px] font-black leading-none" style={{ opacity: 0.8 }}>{fmtTime(slot.split("|")[0])}</span>
                                                    <div className="w-px h-3 my-0.5" style={{ backgroundColor: "currentColor", opacity: 0.3 }} />
                                                    <span className="text-[10px] font-black leading-none" style={{ opacity: 0.6 }}>{fmtTime(slot.split("|")[1])}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-black uppercase truncate">{cell?.subject || "—"}</p>
                                                </div>
                                                {editable && <Edit2 size={14} style={{ opacity: 0.5 }} className="shrink-0" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {slots.length > 0 && DAYS.map((dayName, i) => {
                        const dayIdx = DAY_INDEX[i];
                        const hasCells = slots.some(slot => getCell(dayIdx, slot)?.subject);
                        if (hasCells) return null;
                        return (
                            <div key={`empty-${dayName}`} className="flex items-center gap-3 opacity-40">
                                <div className={`${DAY_COLORS[i]} text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl`}>
                                    {dayName.slice(0, 3)}
                                </div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase">Sin clases</p>
                            </div>
                        );
                    })}

                    {editable && (
                        <div className="pt-2">
                            {showAddRow ? (
                                <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200 space-y-3">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Nuevo bloque horario</p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <label className="text-[8px] font-black uppercase text-zinc-400 mb-1 block">Inicio</label>
                                            <input type="time" value={newStart} onChange={e => setNewStart(e.target.value)} className="w-full h-10 text-sm border border-zinc-200 rounded-xl px-3 bg-white" />
                                        </div>
                                        <span className="text-zinc-300 mt-4">–</span>
                                        <div className="flex-1">
                                            <label className="text-[8px] font-black uppercase text-zinc-400 mb-1 block">Fin</label>
                                            <input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)} className="w-full h-10 text-sm border border-zinc-200 rounded-xl px-3 bg-white" />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setShowAddRow(false)} className="flex-1 h-10 bg-zinc-100 text-zinc-400 text-[10px] font-black uppercase rounded-xl">Cancelar</button>
                                        <button onClick={handleAddRow} disabled={addSaving || !newStart || !newEnd} className="flex-[2] h-10 bg-zinc-950 text-white text-[10px] font-black uppercase rounded-xl flex items-center justify-center gap-2 disabled:opacity-40">
                                            {addSaving ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Agregar</>}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setShowAddRow(true)} className="w-full flex items-center justify-center gap-2 border border-dashed border-zinc-200 rounded-2xl py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 active:scale-95 transition-all">
                                    <Plus size={12} /> Agregar bloque horario
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {modalCell && (
                <CellModal
                    day={modalCell.day}
                    slot={modalCell.slot}
                    existing={modalExisting}
                    editable={editable}
                    onSave={handleCellSave}
                    onDelete={handleCellDelete}
                    onClose={() => setModalCell(null)}
                />
            )}
        </>
    );
}
