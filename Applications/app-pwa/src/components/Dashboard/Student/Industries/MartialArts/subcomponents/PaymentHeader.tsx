"use client";

import React from "react";
import { 
    Clock, 
    CheckCircle2, 
    AlertCircle,
    Banknote,
    TrendingUp
} from "lucide-react";

interface PaymentHeaderProps {
    pendingCount: number;
    overdueCount: number;
    totalAmount: number;
}

export function PaymentHeader({
    pendingCount,
    overdueCount,
    totalAmount
}: PaymentHeaderProps) {
    return (
        <div className="relative mb-10 group">
            {/* Background Gradient Layer */}
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-400/20 to-blue-400/20 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
            
            <div className="relative bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[3rem] p-8 shadow-[0_8px_40px_rgba(0,0,0,0.03)]">
                <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                             <div className="w-10 h-10 rounded-2xl bg-zinc-950 flex items-center justify-center text-white shadow-xl shadow-zinc-200">
                                <Banknote size={20} />
                             </div>
                             <h2 className="text-3xl font-black tracking-tight text-zinc-900">Mis Pagos</h2>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 ml-1">Finanzas Personales</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 lg:flex lg:gap-8">
                        {/* Overdue Stat */}
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 mb-1 flex items-center gap-1.5">
                                <AlertCircle size={10} /> Vencidos
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-2xl font-black ${overdueCount > 0 ? 'text-rose-500' : 'text-zinc-300'}`}>
                                    {overdueCount}
                                </span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">Cuotas</span>
                            </div>
                        </div>

                        {/* Total Amount Stat */}
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-1 flex items-center gap-1.5">
                                <TrendingUp size={10} /> Por Pagar
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-zinc-900">
                                    ${totalAmount.toLocaleString('es-CL')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar (Visual Only for WOW factor) */}
                <div className="mt-8 relative h-1.5 w-full bg-zinc-100/50 rounded-full overflow-hidden">
                    <div 
                        className="absolute inset-y-0 left-0 bg-zinc-900 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: pendingCount > 0 ? '65%' : '100%' }}
                    />
                </div>
            </div>
        </div>
    );
}
