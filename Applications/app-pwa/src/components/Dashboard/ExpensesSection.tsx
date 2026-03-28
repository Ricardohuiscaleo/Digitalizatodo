"use client";

import React from 'react';
import { 
    Plus, Loader2, DollarSign, ShoppingCart, X, Receipt, Package 
} from 'lucide-react';
import { SchoolExpenseCard } from "./SchoolExpenseCard";

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
        <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">{label}</label>
            <label className="flex flex-col items-center justify-center h-24 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[20px] cursor-pointer hover:bg-zinc-100 hover:border-zinc-300 transition-all overflow-hidden relative group">
                {preview ? (
                    <>
                        <img src={preview} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                             <button type="button" onClick={(e) => { e.preventDefault(); setPreview(null); onChange(null); }} 
                                className="bg-rose-500 text-white p-2 rounded-xl shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                <X size={14} />
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-1 text-zinc-400 group-hover:text-zinc-600 transition-colors">
                            <Icon size={18} />
                        </div>
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Subir</span>
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
        <div className="space-y-6 pb-24">
            {/* Arqueo de caja Estilo Dashboard Azul Elegante */}
            <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 rounded-[32px] p-6 shadow-xl shadow-blue-900/10 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 opacity-10 blur-3xl -mr-16 -mt-16 rounded-full" />
                
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-300/60">Saldo de Caja</p>
                        <p className="text-3xl font-black tracking-tighter leading-tight mt-1 text-white">
                            {formatCLP(saldo)}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-blue-300 border border-white/10">
                        <DollarSign size={24} strokeWidth={2.5} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-6 border-b border-white/10 relative z-10">
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                        <p className="text-[7px] font-black uppercase tracking-widest text-blue-300/50 mb-1">Recaudado</p>
                        <p className="text-sm font-black text-emerald-400">{formatCLP(recaudado)}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                        <p className="text-[7px] font-black uppercase tracking-widest text-blue-300/50 mb-1">Gastado</p>
                        <p className="text-sm font-black text-rose-400">{formatCLP(gastado)}</p>
                    </div>
                </div>

                {expensesSummary.length > 0 && (
                    <div className="mt-5 relative z-10">
                        <p className="text-[8px] font-black uppercase tracking-widest text-blue-300/40 mb-3 px-1">Por Categoría</p>
                        <div className="-mx-6 px-6 overflow-x-auto flex gap-3 no-scrollbar pb-1">
                            {expensesSummary.map((s: any) => (
                                <div key={s.category} className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/10 min-w-[110px] shrink-0">
                                    <p className="text-[7px] font-black uppercase tracking-widest text-blue-200/60 leading-none mb-1.5">{s.category}</p>
                                    <p className="text-xs font-black text-white leading-none tracking-tight">{formatCLP(s.total)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Header compras */}
            <div className="flex items-center justify-between px-2">
                <div className="flex flex-col">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 leading-none">Últimas Compras</h3>
                    <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{expensesList.length} registros</p>
                </div>
                <button
                    onClick={() => setShowCreateExpense(true)}
                    className="flex items-center gap-2 bg-zinc-950 text-white text-[9px] font-black uppercase tracking-[0.15em] pl-4 pr-5 py-3 rounded-2xl shadow-lg shadow-zinc-200 active:scale-95 transition-all"
                >
                    <Plus size={14} strokeWidth={3} /> Nueva
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
                <div className="space-y-4">
                    {expensesList.map((exp: any) => (
                        <SchoolExpenseCard
                            key={exp.id}
                            exp={exp}
                            onLightbox={setExpenseLightbox}
                            onDelete={() => handleDeleteExpense(exp.id)}
                            deleting={expenseDeletingId === exp.id}
                            formatCLP={formatCLP}
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
                        <form onSubmit={handleCreateExpense} className="p-5 space-y-4 bg-zinc-50/50">
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
