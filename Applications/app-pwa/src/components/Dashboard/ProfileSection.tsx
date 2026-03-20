"use client";

import React from 'react';
import { Settings, DollarSign, LogOut, ChevronRight } from 'lucide-react';
import AppUpdatesAccordion from "./AppUpdatesAccordion";

interface ProfileSectionProps {
    user: any;
    branding: any;
    appUpdates: any[];
    changeTab: (tab: string) => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
    user,
    branding,
    appUpdates,
    changeTab
}) => {
    const handleLogout = () => {
        const slug = localStorage.getItem("tenant_slug");
        const brandingData = localStorage.getItem("tenant_branding");
        localStorage.clear();
        if (slug) localStorage.setItem("tenant_slug", slug);
        if (brandingData) localStorage.setItem("tenant_branding", brandingData);
        window.location.href = "/";
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            {/* Perfil Card */}
            <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 text-center shadow-sm">
                <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden border-4 border-zinc-50 shadow-md">
                    <img src={user?.photo || '/DLogo-v2.webp'} className="w-full h-full object-cover" alt="" />
                </div>
                <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">{user?.name || 'Admin'}</h3>
                <p className="text-xs text-zinc-400 font-bold mb-2">{user?.email}</p>
                <span className="inline-block bg-zinc-900 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Staff</span>
            </div>

            {/* Menú */}
            <div className="bg-white border border-zinc-100 rounded-3xl p-2">
                <button onClick={() => changeTab('settings')} className="w-full flex items-center justify-between p-4 hover:bg-stone-50 rounded-2xl transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-zinc-700 transition-colors"><Settings size={20} /></div>
                        <span className="font-black text-sm text-zinc-700">Ajustes</span>
                    </div>
                    <ChevronRight size={18} className="text-zinc-300" />
                </button>
                {branding?.industry === 'school_treasury' && (
                    <button onClick={() => changeTab('fees')} className="w-full flex items-center justify-between p-4 hover:bg-stone-50 rounded-2xl transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-zinc-700 transition-colors"><DollarSign size={20} /></div>
                            <span className="font-black text-sm text-zinc-700">Crear cuotas</span>
                        </div>
                        <ChevronRight size={18} className="text-zinc-300" />
                    </button>
                )}
            </div>

            {/* Changelog */}
            <AppUpdatesAccordion appUpdates={appUpdates} />

            {/* Logout */}
            <button
                onClick={handleLogout}
                className="w-full h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] hover:bg-red-100 transition-all active:scale-[0.98]"
            >
                <LogOut size={18} /> Cerrar Sesión
            </button>

            <div className="pt-6 text-center space-y-1">
                <a href="https://digitalizatodo.cl" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors">
                    DIGITALIZA TODO® 2026
                </a>
                <p className="text-[9px] text-zinc-300">Software Factory a la Medida</p>
            </div>
        </div>
    );
};

export default ProfileSection;
