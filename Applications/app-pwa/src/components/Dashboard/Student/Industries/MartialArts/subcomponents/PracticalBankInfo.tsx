"use client";

import React, { useState } from "react";
import { 
    ShieldCheck, 
    Copy, 
    Check, 
    Info,
    CreditCard
} from "lucide-react";

interface PracticalBankInfoProps {
    bankInfo: any;
    primaryColor: string;
}

export function PracticalBankInfo({
    bankInfo,
    primaryColor
}: PracticalBankInfoProps) {
    const [copied, setCopied] = useState(false);

    if (!bankInfo) return null;

    const copyToClipboard = () => {
        const text = `${bankInfo.bank_name}\n${bankInfo.account_type}\n${bankInfo.account_number}\n${bankInfo.holder_name}\n${bankInfo.holder_rut}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group animate-in zoom-in-95 duration-500">
            {/* Dark Premium Card */}
            <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-700 shadow-inner">
                            <ShieldCheck size={20} className="text-orange-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Datos para Transferir</p>
                            <p className="text-sm font-bold text-white">{bankInfo.bank_name}</p>
                        </div>
                    </div>
                    <button 
                        onClick={copyToClipboard}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                            copied ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                    >
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                        {copied ? 'Copiado' : 'Copiar Todo'}
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <div className="bg-zinc-950/50 rounded-2xl p-4 border border-zinc-800/50 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Número de Cuenta</span>
                            <span className="text-sm font-mono font-black text-orange-400 tracking-wider">
                                {bankInfo.account_number}
                            </span>
                        </div>
                        <div className="h-px bg-zinc-800/30 w-full" />
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Tipo</span>
                            <span className="text-[10px] font-black text-zinc-200">{bankInfo.account_type}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Titular</span>
                            <span className="text-[10px] font-black text-zinc-200 uppercase truncate max-w-[150px]">{bankInfo.holder_name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">RUT</span>
                            <span className="text-[10px] font-black text-zinc-200">{bankInfo.holder_rut}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-2 px-1">
                    <Info size={12} className="text-zinc-500" />
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tight">
                        Envía el comprobante una vez realizada la transferencia.
                    </p>
                </div>
            </div>
        </div>
    );
}
