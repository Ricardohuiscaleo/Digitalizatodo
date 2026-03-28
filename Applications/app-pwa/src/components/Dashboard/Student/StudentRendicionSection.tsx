import React from "react";
import { 
    ShoppingCart, 
    Loader2,
    DollarSign
} from "lucide-react";
import { SchoolExpenseCard } from "../SchoolExpenseCard";

interface StudentRendicionSectionProps {
    expensesTotal: number;
    expensesBalance: number;
    expensesList: any[];
    expensesSummary: any[];
    expensesLoading: boolean;
    setExpenseLightbox: (url: string | null) => void;
}

export function StudentRendicionSection({
    expensesTotal,
    expensesBalance,
    expensesList,
    expensesSummary,
    expensesLoading,
    setExpenseLightbox
}: StudentRendicionSectionProps) {
    const fmt = (n: number) => `$${Number(n).toLocaleString('es-CL')}`;

    return (
        <div className="space-y-6 pb-24 px-4 pt-4">
            {/* Arqueo de caja Estilo Dashboard Azul Estudiante - Clonando Staff visual */}
            <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 rounded-[32px] p-6 shadow-xl shadow-blue-900/10 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 opacity-10 blur-3xl -mr-16 -mt-16 rounded-full" />
                
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-300/60">Saldo Mi Caja</p>
                        <p className="text-3xl font-black tracking-tighter leading-tight mt-1 text-white">
                            {fmt(expensesBalance)}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-blue-300 border border-white/10">
                        <DollarSign size={24} strokeWidth={2.5} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-6 border-b border-white/10 relative z-10">
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                        <p className="text-[7px] font-black uppercase tracking-widest text-blue-300/50 mb-1">Recaudado</p>
                        <p className="text-sm font-black text-emerald-400">{fmt(expensesBalance + expensesTotal)}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                        <p className="text-[7px] font-black uppercase tracking-widest text-blue-300/50 mb-1">Total Gastado</p>
                        <p className="text-sm font-black text-rose-400">{fmt(expensesTotal)}</p>
                    </div>
                </div>

                {expensesSummary.length > 0 && (
                    <div className="mt-5 relative z-10">
                        <p className="text-[8px] font-black uppercase tracking-widest text-blue-300/40 mb-3 px-1">Por Categoría</p>
                        <div className="-mx-6 px-6 overflow-x-auto flex gap-3 no-scrollbar pb-1">
                            {expensesSummary.map((s: any) => (
                                <div key={s.category} className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/10 min-w-[110px] shrink-0">
                                    <p className="text-[7px] font-black uppercase tracking-widest text-blue-200/60 leading-none mb-1.5">{s.category}</p>
                                    <p className="text-xs font-black text-white leading-none tracking-tight">{fmt(s.total)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Header rendición */}
            <div className="flex items-center justify-between px-2 pt-2">
                <div className="flex flex-col">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 leading-none">Mis Gastos</h3>
                    <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{expensesList.length} registros</p>
                </div>
            </div>

            {expensesLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-zinc-300" size={24} /></div>
            ) : expensesList.length === 0 ? (
                <div className="text-center py-12 text-zinc-300">
                    <ShoppingCart size={32} className="mx-auto mb-2" />
                    <p className="text-xs font-bold">Sin compras registradas</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {expensesList.map((exp: any) => (
                        <SchoolExpenseCard
                            key={exp.id}
                            exp={exp}
                            onLightbox={setExpenseLightbox}
                            formatCLP={fmt}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
