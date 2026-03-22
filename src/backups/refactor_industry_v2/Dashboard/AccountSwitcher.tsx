"use client";

import React, { useState } from 'react';
import { RefreshCw, ChevronRight, School, LogOut } from 'lucide-react';

interface AccountSwitcherProps {
    currentTenantId: string | number;
    onSwitch: (tenant: any) => void;
}

export const AccountSwitcher: React.FC<AccountSwitcherProps> = ({ currentTenantId, onSwitch }) => {
    const [availableTenants, setAvailableTenants] = useState<any[]>(() => {
        try {
            const stored = localStorage.getItem("available_tenants");
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const otherTenants = availableTenants.filter(t => String(t.id) !== String(currentTenantId));

    if (otherTenants.length === 0) return null;

    return (
        <div className="space-y-3 pt-4 border-t border-zinc-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Otras Academias</p>
            <div className="space-y-2">
                {otherTenants.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => onSwitch(t)}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 hover:bg-zinc-100 active:scale-[0.98] transition-all group"
                    >
                        <div className="w-10 h-10 rounded-full bg-white border border-zinc-100 overflow-hidden flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
                            {t.logo ? (
                                <img src={t.logo} alt={t.name} className="w-full h-full object-cover" />
                            ) : (
                                <School size={16} className="text-zinc-400" />
                            )}
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-xs font-bold text-zinc-900 leading-tight">{t.name}</p>
                            <p className="text-[9px] text-zinc-400 uppercase tracking-tight">Cambiar a esta cuenta</p>
                        </div>
                        <ChevronRight size={14} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                    </button>
                ))}
            </div>
        </div>
    );
};
