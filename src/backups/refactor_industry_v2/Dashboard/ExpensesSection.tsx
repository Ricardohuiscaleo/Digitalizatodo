"use client";

import React from 'react';
import { 
    Plus, Loader2, DollarSign, ShoppingCart, X, Receipt, Package 
} from 'lucide-react';
import { ExpenseCard } from "@/app/dashboard/expenses/page";

interface ExpensesSectionProps {
    feesList: any[];
    expensesTotal: number;
    expensesSummary: any[];
    expensesList: any[];
    expensesLoading: boolean;
    showCreateExpense: boolean;
    setShowCreateExpense: (show: boolean) => void;
    expenseLightbox: string | null;
    setExpenseLightbox: (url: string | null) => void;
    handleDeleteExpense: (id: any) => void;
    expenseDeletingId: any;
    expenseFormError: string | null;
    handleCreateExpense: (e: React.FormEvent) => void;
    expenseForm: any;
    setExpenseForm: (form: any) => void;
    setExpenseReceiptPhoto: (f: File | null) => void;
    setExpenseProductPhoto: (f: File | null) => void;
    expenseSubmitting: boolean;
    formatCLP: (v: number) => string;
    parseCLP: (v: string) => number;
    EXPENSE_CATEGORIES: any[];
}

function ExpensePhotoInput({ label, icon: Icon, onChange }: { label: string; icon: React.ElementType; onChange: (f: File | null) => void }) {
    const [preview, setPreview] = React.useState<string | null>(null);
    return (
        <div className="flex-1 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</label>
            <label className="flex flex-col items-center justify-center h-20 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-xl cursor-pointer hover:bg-zinc-100 transition-all overflow-hidden relative">
                {preview ? (
                    <>
                        <img src={preview} className="w-full h-full object-cover" />
                        <button type="button" onClick={(e) => { e.preventDefault(); setPreview(null); onChange(null); }} 
                            className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-lg">
                            <X size={10} />
                        </button>
                    </>
                ) : (
                    <>
                        <Icon size={18} className="text-zinc-300 mb-1" />
                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">Subir Foto</span>
                    </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    if (f) {
                        const r = new FileReader();
                        r.onload = (ev) => setPreview(ev.target?.result as string);
                        r.readAsDataURL(f);
                    }
                    onChange(f);
                }} />
            </label>
        </div>
    );
}

export default function ExpensesSection(props: ExpensesSectionProps) {
    const {
        feesList, expensesTotal, expensesSummary, expensesList,
        expensesLoading, showCreateExpense, setShowCreateExpense,
        expenseLightbox, setExpenseLightbox, handleDeleteExpense,
        expenseDeletingId, expenseFormError, handleCreateExpense,
        expenseForm, setExpenseForm, setExpenseReceiptPhoto,
        setExpenseProductPhoto, expenseSubmitting, formatCLP,
        parseCLP, EXPENSE_CATEGORIES
    } = props;

    // Arqueo: recaudado = suma de fee_payments aprobados
    const recaudado = feesList.reduce((acc: number, f: any) => acc + (f.paid_amount || 0), 0);
    const gastado = expensesTotal;
    const saldo = recaudado - gastado;

    return (
        <div className="space-y-4 pb-24">
            {/* Arqueo de caja */}
            <div className="bg-zinc-950 rounded-[24px] p-5 text-white">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">Arqueo de Caja</p>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Recaudado</p>
                        <p className="text-base font-black text-emerald-400">{formatCLP(recaudado)}</p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Gastado</p>
                        <p className="text-base font-black text-rose-400">{formatCLP(gastado)}</p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Saldo</p>
                        <p className={`text-base font-black ${saldo >= 0 ? 'text-white' : 'text-rose-400'}`}>{formatCLP(saldo)}</p>
                    </div>
                </div>
                {expensesSummary.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {expensesSummary.map((s: any) => (
                            <div key={s.category} className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                                <span className="text-[9px] font-black uppercase tracking-wider">{s.category}</span>
                                <span className="text-[9px] font-bold text-zinc-300">{formatCLP(s.total)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Header compras */}
            <div className="flex items-center justify-between">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{expensesList.length} compras registradas</p>
                <button
                    onClick={() => setShowCreateExpense(true)}
                    className="flex items-center gap-1.5 bg-zinc-950 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl"
                >
                    <Plus size={13} /> Nueva
                </button>
            </div>

            {/* Lista */}
            {expensesLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-zinc-300" size={24} /></div>
            ) : expensesList.length === 0 ? (
                <div className="text-center py-12 text-zinc-300 flex flex-col items-center">
                    <ShoppingCart size={32} className="mx-auto mb-2 text-zinc-200" />
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Sin compras registradas</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {expensesList.map((exp: any) => (
                        <ExpenseCard
                            key={exp.id}
                            exp={exp}
                            onLightbox={setExpenseLightbox}
                            onDelete={() => handleDeleteExpense(exp.id)}
                            deleting={expenseDeletingId === exp.id}
                        />
                    ))}
                </div>
            )}

            {/* Form modal */}
            {showCreateExpense && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[28px] w-full max-w-md max-h-[94vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
                            <h2 className="text-sm font-black uppercase tracking-widest">Nueva Compra</h2>
                            <button onClick={() => setShowCreateExpense(false)} className="p-2 rounded-xl bg-zinc-50 text-zinc-400 border border-zinc-100 active:scale-95 transition-all"><X size={16} /></button>
                        </div>
                        <form onSubmit={handleCreateExpense} className="p-5 space-y-4">
                            {expenseFormError && <div className="bg-rose-50 text-rose-600 text-[10px] font-black uppercase p-3 rounded-xl border border-rose-100">{expenseFormError}</div>}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Descripción</label>
                                <input required value={expenseForm.title}
                                    onChange={e => setExpenseForm((p: any) => ({ ...p, title: e.target.value }))}
                                    placeholder="Ej: Toallas Nova, agua, cloro..."
                                    className="w-full h-12 bg-zinc-50 rounded-xl px-4 text-sm font-bold text-zinc-900 placeholder:text-zinc-300 border-2 border-zinc-100 outline-none focus:border-zinc-300 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Monto</label>
                                    <input required type="text" inputMode="numeric"
                                        value={expenseForm.amount ? formatCLP(parseInt(expenseForm.amount)) : ''}
                                        onChange={e => setExpenseForm((p: any) => ({ ...p, amount: String(parseCLP(e.target.value)) }))}
                                        placeholder="$ 0"
                                        className="w-full h-12 bg-zinc-50 rounded-xl px-4 text-sm font-black text-zinc-900 placeholder:text-zinc-300 border-2 border-zinc-100 outline-none focus:border-zinc-300 focus:bg-white transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Fecha</label>
                                    <input required type="date" value={expenseForm.expense_date}
                                        onChange={e => setExpenseForm((p: any) => ({ ...p, expense_date: e.target.value }))}
                                        className="w-full h-12 bg-zinc-50 rounded-xl px-4 text-sm font-bold text-zinc-900 border-2 border-zinc-100 outline-none focus:border-zinc-300 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Categoría</label>
                                <select value={expenseForm.category}
                                    onChange={e => setExpenseForm((p: any) => ({ ...p, category: e.target.value }))}
                                    className="w-full h-12 bg-zinc-50 rounded-xl px-4 text-sm font-bold text-zinc-900 border-2 border-zinc-100 outline-none focus:border-zinc-300 focus:bg-white transition-all"
                                >
                                    {EXPENSE_CATEGORIES.map((c: string) => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Notas (opcional)</label>
                                <textarea value={expenseForm.description}
                                    onChange={e => setExpenseForm((p: any) => ({ ...p, description: e.target.value }))}
                                    placeholder="Detalle adicional..."
                                    rows={2}
                                    className="w-full bg-zinc-50 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 placeholder:text-zinc-300 border-2 border-zinc-100 outline-none focus:border-zinc-300 focus:bg-white transition-all resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <ExpensePhotoInput label="Foto boleta" icon={Receipt} onChange={setExpenseReceiptPhoto} />
                                <ExpensePhotoInput label="Foto producto" icon={Package} onChange={setExpenseProductPhoto} />
                            </div>
                            <button type="submit" disabled={expenseSubmitting}
                                className="w-full h-14 bg-zinc-950 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-xl shadow-zinc-200 transition-all mt-4"
                            >
                                {expenseSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Guardar Compra'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Lightbox */}
            {expenseLightbox && (
                <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setExpenseLightbox(null)}>
                    <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setExpenseLightbox(null)} className="absolute -top-12 right-0 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white border border-white/20 active:scale-95">
                            <X size={18} />
                        </button>
                        <img src={expenseLightbox} className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
                    </div>
                </div>
            )}
        </div>
    );
}
