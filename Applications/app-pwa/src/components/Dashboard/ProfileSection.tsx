"use client";

import React from 'react';
import { Settings, DollarSign, LogOut, ChevronRight, User } from 'lucide-react';
import AppUpdatesAccordion from "./AppUpdatesAccordion";
import { BeltDisplay } from './Industries/MartialArts/BeltDisplay';
import { StudentAvatar } from './Industries/MartialArts/StudentAvatar';

interface ProfileSectionProps {
    user: any;
    branding: any;
    appUpdates: any[];
    changeTab: (tab: string) => void;
    isDark?: boolean;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
    user,
    branding,
    appUpdates,
    changeTab,
    isDark = false
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
        <div className={`space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 ${isDark ? 'bg-black text-white' : ''}`}>
            {/* Perfil Card */}
            <div className={`rounded-[2.5rem] p-8 text-center shadow-lg border transition-all ${
                isDark ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-100'
            }`}>
                <div className="mb-4 flex justify-center">
                    <StudentAvatar 
                        photo={user?.photo}
                        name={user?.name}
                        size={96}
                        beltRank={branding?.industry === 'school_treasury' ? null : user?.belt_rank}
                        degrees={branding?.industry === 'school_treasury' ? null : user?.degrees}
                        modality={branding?.industry === 'school_treasury' ? null : user?.modality}
                        isDark={isDark}
                        industry={branding?.industry}
                    />
                </div>
                
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-orange-400 mb-1">
                    Panel de Control · Staff
                </p>
                <h3 className={`text-xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                    {user?.name || 'Admin'}
                </h3>
                <p className={`text-xs font-bold mb-4 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{user?.email}</p>
                
                {user?.belt_rank && branding?.industry !== 'school_treasury' && isDark && (
                    <div className="flex justify-center mb-2">
                        <BeltDisplay beltRank={user.belt_rank} degrees={user.degrees ?? 0} size="md" />
                    </div>
                )}

                <div className={`inline-block text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${
                    isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-900 text-white'
                }`}>
                    {branding?.tenant_name || 'Admin'}
                </div>
            </div>

            {/* Menú */}
            <div className={`border rounded-[2.5rem] p-2 ${
                isDark ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'
            }`}>
                <button onClick={() => changeTab('settings')} className={`w-full flex items-center justify-between p-4 rounded-3xl transition-all group ${
                    isDark ? 'hover:bg-zinc-900/50' : 'hover:bg-zinc-50'
                }`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                            isDark ? 'bg-zinc-900 text-zinc-500 group-hover:text-zinc-300' : 'bg-zinc-50 text-zinc-400 group-hover:text-zinc-700'
                        }`}>
                            <Settings size={20} />
                        </div>
                        <span className={`font-black text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>Ajustes de Cuenta</span>
                    </div>
                    <ChevronRight size={18} className="text-zinc-300" />
                </button>
                
                {branding?.industry === 'school_treasury' && (
                    <button onClick={() => changeTab('fees')} className={`w-full flex items-center justify-between p-4 rounded-3xl transition-all group ${
                        isDark ? 'hover:bg-zinc-900/50' : 'hover:bg-zinc-50'
                    }`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                isDark ? 'bg-zinc-900 text-zinc-500 group-hover:text-zinc-300' : 'bg-zinc-50 text-zinc-400 group-hover:text-zinc-700'
                            }`}>
                                <DollarSign size={20} />
                            </div>
                            <span className={`font-black text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>Gestión de Cuotas</span>
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
                className="w-full flex items-center justify-center gap-2 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-rose-500/80 hover:text-rose-500 transition-colors"
            >
                <LogOut size={14} />
                Cerrar Sesión
            </button>

            {/* Crédito — pie de página */}
            <a
                href="https://digitalizatodo.cl"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-col items-center gap-0.5 pt-6 pb-2 border-t group ${
                    isDark ? 'border-zinc-900' : 'border-zinc-100'
                }`}
            >
                <p className={`text-[12px] font-black tracking-[0.25em] uppercase ${isDark ? 'text-zinc-700' : 'text-zinc-400'}`}>Digitaliza Todo</p>
                <p className={`text-[9px] text-center mt-1 px-8 leading-relaxed ${isDark ? 'text-zinc-800' : 'text-zinc-400'}`}>
                    {branding?.industry === 'school_treasury' ? "Sistemas a medida para gestión financiera escolar." : "Sistemas a medida para academias de alto rendimiento."}
                </p>
                <p className="text-[8px] font-black text-orange-400/80 tracking-[0.3em] uppercase mt-3">Arica, Chile 🇨🇱</p>
            </a>
        </div>
    );
};

export default ProfileSection;

