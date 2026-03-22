import React from "react";
import { 
    ShoppingCart, 
    Loader2 
} from "lucide-react";
import { ExpenseCard } from "@/app/dashboard/expenses/page";

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
        <div className="space-y-4 pb-24 px-4 pt-4">
            <div className="bg-zinc-950 rounded-[24px] p-5 text-white">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">Rendición de Caja</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Total Gastado</p>
                        <p className="text-xl font-black text-rose-400">{fmt(expensesTotal)}</p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Saldo Caja</p>
                        <p className={`text-xl font-black ${expensesBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt(expensesBalance)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-white/10 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider">{expensesList.length} compras</span>
                    {expensesSummary.map((s: any) => (
                        <span key={s.category} className="bg-white/10 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider">
                            {s.category} {fmt(s.total)}
                        </span>
                    ))}
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
                        <ExpenseCard
                            key={exp.id}
                            exp={exp}
                            onLightbox={setExpenseLightbox}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
