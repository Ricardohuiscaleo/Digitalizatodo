"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Plus, Trash2, Receipt, Package, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { getExpenses, createExpense, deleteExpense } from "@/lib/api";

const CATEGORIES = [
    { id: "alimentacion",    label: "Alimentación" },
    { id: "materiales",      label: "Materiales" },
    { id: "infraestructura", label: "Infraestructura" },
    { id: "actividades",     label: "Actividades" },
    { id: "administrativo",  label: "Administrativo" },
    { id: "insumos",         label: "Insumos" },
    { id: "otros",           label: "Otros" },
];

function formatCLP(n: number) {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

function PhotoInput({ label, icon: Icon, onChange }: { label: string; icon: React.ElementType; onChange: (f: File | null) => void }) {
    const ref = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        onChange(file);
        setPreview(file ? URL.createObjectURL(file) : null);
    };

    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</label>
            <div
                onClick={() => ref.current?.click()}
                className="relative h-28 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex items-center justify-center cursor-pointer overflow-hidden hover:border-zinc-400 transition-colors"
            >
                {preview ? (
                    <img src={preview} className="w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center gap-1 text-zinc-300">
                        <Icon size={22} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Subir foto</span>
                    </div>
                )}
                <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handle} />
            </div>
        </div>
    );
}

export default function ExpensesPage() {
    const router = useRouter();
    const [expenses, setExpenses] = useState<any[]>([]);
    const [summary, setSummary] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [lightbox, setLightbox] = useState<string | null>(null);

    const [form, setForm] = useState({
        title: "", description: "", amount: "", category: "insumos", expense_date: new Date().toISOString().split("T")[0],
    });
    const [receiptPhoto, setReceiptPhoto] = useState<File | null>(null);
    const [productPhoto, setProductPhoto] = useState<File | null>(null);

    const tenantSlug = typeof window !== "undefined" ? localStorage.getItem("tenantSlug") ?? "" : "";
    const token      = typeof window !== "undefined" ? localStorage.getItem("authToken") ?? "" : "";

    const load = async () => {
        setLoading(true);
        const data = await getExpenses(tenantSlug, token);
        setExpenses(data?.expenses ?? []);
        setSummary(data?.summary ?? []);
        setTotal(data?.total ?? 0);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const fd = new FormData();
        fd.append("title",        form.title);
        fd.append("description",  form.description);
        fd.append("amount",       form.amount);
        fd.append("category",     form.category);
        fd.append("expense_date", form.expense_date);
        if (receiptPhoto) fd.append("receipt_photo", receiptPhoto);
        if (productPhoto) fd.append("product_photo", productPhoto);

        const res = await createExpense(tenantSlug, token, fd);
        if (res?.expense) {
            setShowForm(false);
            setForm({ title: "", description: "", amount: "", category: "insumos", expense_date: new Date().toISOString().split("T")[0] });
            setReceiptPhoto(null);
            setProductPhoto(null);
            await load();
        } else {
            setError(res?.message ?? "Error al guardar");
        }
        setSaving(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Eliminar este gasto?")) return;
        setDeletingId(id);
        await deleteExpense(tenantSlug, token, id);
        await load();
        setDeletingId(null);
    };

    return (
        <div className="min-h-screen bg-zinc-50 font-sans pb-24">
            {/* Header */}
            <div className="bg-white border-b border-zinc-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
                <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-zinc-100 transition-colors">
                    <ArrowLeft size={18} className="text-zinc-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-sm font-black uppercase tracking-widest text-zinc-900">Gastos</h1>
                    <p className="text-[10px] text-zinc-400 font-bold">Registro de insumos y boletas</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-1.5 bg-zinc-950 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl"
                >
                    <Plus size={13} /> Nuevo
                </button>
            </div>

            <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">

                {/* Resumen total */}
                <div className="bg-zinc-950 rounded-[24px] p-5 text-white">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Total gastado</p>
                    <p className="text-3xl font-black tracking-tighter">{formatCLP(total)}</p>
                    {summary.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {summary.map((s: any) => (
                                <div key={s.category} className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                                    <span className="text-[9px] font-black uppercase tracking-wider">{s.category}</span>
                                    <span className="text-[9px] font-bold text-zinc-300">{formatCLP(s.total)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Lista */}
                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin text-zinc-300" size={24} /></div>
                ) : expenses.length === 0 ? (
                    <div className="text-center py-12 text-zinc-300">
                        <Receipt size={32} className="mx-auto mb-2" />
                        <p className="text-xs font-bold">Sin gastos registrados</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {expenses.map((exp: any) => (
                            <ExpenseCard
                                key={exp.id}
                                exp={exp}
                                onLightbox={setLightbox}
                                onDelete={() => handleDelete(exp.id)}
                                deleting={deletingId === exp.id}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Form modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white rounded-[28px] w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
                            <h2 className="text-sm font-black uppercase tracking-widest">Nuevo Gasto</h2>
                            <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-zinc-100">
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {error && <div className="bg-rose-50 text-rose-600 text-[10px] font-black uppercase p-3 rounded-xl">{error}</div>}

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Descripción</label>
                                <input
                                    required value={form.title}
                                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    placeholder="Ej: Resmas de papel"
                                    className="w-full h-12 bg-zinc-50 rounded-xl px-4 text-sm font-bold text-zinc-900 outline-none focus:ring-2 ring-zinc-200"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Monto ($)</label>
                                    <input
                                        required type="number" min="0" value={form.amount}
                                        onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                                        placeholder="15000"
                                        className="w-full h-12 bg-zinc-50 rounded-xl px-4 text-sm font-bold text-zinc-900 outline-none focus:ring-2 ring-zinc-200"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Fecha</label>
                                    <input
                                        required type="date" value={form.expense_date}
                                        onChange={e => setForm(p => ({ ...p, expense_date: e.target.value }))}
                                        className="w-full h-12 bg-zinc-50 rounded-xl px-4 text-sm font-bold text-zinc-900 outline-none focus:ring-2 ring-zinc-200"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Categoría</label>
                                <select
                                    value={form.category}
                                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                                    className="w-full h-12 bg-zinc-50 rounded-xl px-4 text-sm font-bold text-zinc-900 outline-none focus:ring-2 ring-zinc-200 appearance-none"
                                >
                                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Notas (opcional)</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Detalle adicional..."
                                    rows={2}
                                    className="w-full bg-zinc-50 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 outline-none focus:ring-2 ring-zinc-200 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <PhotoInput label="Foto boleta" icon={Receipt} onChange={setReceiptPhoto} />
                                <PhotoInput label="Foto producto" icon={Package} onChange={setProductPhoto} />
                            </div>

                            <button
                                type="submit" disabled={saving}
                                className="w-full h-14 bg-zinc-950 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : "Guardar Gasto"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Lightbox */}
            {lightbox && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
                    <img src={lightbox} className="max-w-full max-h-full rounded-2xl object-contain" />
                    <button className="absolute top-4 right-4 p-2 bg-white/20 rounded-full"><X size={18} className="text-white" /></button>
                </div>
            )}
        </div>
    );
}

/* ─── Shared Expense Card — usado en admin y apoderado ─── */
const CAT_COLORS: Record<string, string> = {
    alimentacion:    "bg-orange-100 text-orange-700",
    materiales:      "bg-blue-100 text-blue-700",
    infraestructura: "bg-slate-100 text-slate-700",
    actividades:     "bg-purple-100 text-purple-700",
    administrativo:  "bg-zinc-100 text-zinc-700",
    insumos:         "bg-green-100 text-green-700",
    otros:           "bg-rose-100 text-rose-700",
};

function fmtDate(raw: string) {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? raw : d.toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });
}

function fmtCLP(n: number) {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

export function ExpenseCard({
    exp,
    onLightbox,
    onDelete,
    deleting,
}: {
    exp: any;
    onLightbox: (url: string) => void;
    onDelete?: () => void;
    deleting?: boolean;
}) {
    const photo = exp.receipt_photo || exp.product_photo;
    const hasBoth = !!(exp.receipt_photo && exp.product_photo);

    return (
        <div className="bg-white rounded-[20px] border border-zinc-100 shadow-sm overflow-hidden">
            <div className="flex">
                {/* Foto cuadrada izquierda */}
                {photo ? (
                    <button
                        onClick={() => onLightbox(exp.receipt_photo || exp.product_photo)}
                        className="w-[72px] h-[72px] shrink-0 relative overflow-hidden border-r border-zinc-100 rounded-l-[20px]"
                    >
                        <img src={exp.receipt_photo || exp.product_photo} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[7px] text-white font-black text-center py-0.5 uppercase tracking-wider">
                            {exp.receipt_photo ? "Boleta" : "Producto"}
                        </div>
                    </button>
                ) : (
                    <div className="w-[72px] h-[72px] shrink-0 bg-zinc-50 border-r border-zinc-100 rounded-l-[20px] flex items-center justify-center">
                        <Receipt size={22} className="text-zinc-200" />
                    </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0 px-3 py-2.5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${CAT_COLORS[exp.category] ?? "bg-zinc-100 text-zinc-600"}`}>
                                {exp.category}
                            </span>
                            <span className="text-[9px] text-zinc-400 font-bold">{fmtDate(exp.expense_date)}</span>
                        </div>
                        <p className="text-sm font-black text-zinc-900 leading-tight truncate">{exp.title}</p>
                        {exp.description && (
                            <p className="text-[10px] text-zinc-400 line-clamp-1">{exp.description}</p>
                        )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                        <p className="text-base font-black text-zinc-900">{fmtCLP(exp.amount)}</p>
                        <div className="flex items-center gap-1.5">
                            {/* Thumbnail foto producto si hay ambas */}
                            {hasBoth && (
                                <button
                                    onClick={() => onLightbox(exp.product_photo)}
                                    className="w-7 h-7 rounded-lg overflow-hidden border border-zinc-100 shrink-0"
                                >
                                    <img src={exp.product_photo} className="w-full h-full object-cover" />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={onDelete}
                                    disabled={deleting}
                                    className="w-7 h-7 rounded-lg bg-zinc-50 hover:bg-rose-50 text-zinc-300 hover:text-rose-500 transition-colors flex items-center justify-center border border-zinc-100"
                                >
                                    {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
