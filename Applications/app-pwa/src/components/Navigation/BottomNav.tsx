"use client";

import React from "react";
import { Home, Calendar, CreditCard, ShoppingCart } from "lucide-react";
import { StudentAvatar } from "../Dashboard/Industries/MartialArts/StudentAvatar";

export type NavSection = "home" | "calendar" | "payments" | "profile" | "rendicion";

interface BottomNavProps {
    activeSection: NavSection;
    setActiveSection: (section: NavSection) => void;
    primaryColor?: string;
    userPhoto?: string | null;
    userName?: string;
    industry?: string;
}

export default function BottomNav({ activeSection, setActiveSection, primaryColor = "#f97316", userPhoto, userName, industry }: BottomNavProps) {
    const items: { id: NavSection; label: string; icon: any }[] = [
        { id: "home", label: "Inicio", icon: Home },
        industry === 'school_treasury'
            ? { id: "calendar" as NavSection, label: "Horario", icon: Calendar }
            : { id: "calendar" as NavSection, label: "Clases", icon: Calendar },
        { id: "payments" as NavSection, label: industry === 'school_treasury' ? 'Cuotas' : 'Pagos', icon: CreditCard },
        ...(industry === 'school_treasury' ? [{ id: "rendicion" as NavSection, label: "Rendición", icon: ShoppingCart }] : []),
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-zinc-100 px-6 pb-7 pt-3 md:hidden z-50 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center max-w-lg mx-auto">
                {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className="flex flex-col items-center gap-1 transition-all duration-200"
                            style={{ color: isActive ? primaryColor : '#a1a1aa' }}
                        >
                            <div
                                className={`p-2 transition-all duration-300 ${isActive ? 'rounded-2xl shadow-sm' : 'bg-transparent'}`}
                                style={isActive ? { backgroundColor: `${primaryColor}15` } : {}}
                            >
                                <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 3 : 2.5} />
                            </div>
                            <span className={`text-[7px] font-black uppercase tracking-[0.2em] transition-all ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
                {/* Profile tab con foto */}
                <button
                    onClick={() => setActiveSection("profile")}
                    className="flex flex-col items-center gap-1 transition-all duration-200"
                >
                    <div className={`p-2 transition-all duration-300 ${activeSection === "profile" ? 'rounded-2xl shadow-sm' : 'bg-transparent'}`} style={activeSection === "profile" ? { backgroundColor: `${primaryColor}15` } : {}}>
                        <StudentAvatar 
                            photo={userPhoto}
                            name={userName}
                            size={22}
                            isDark={false}
                        />
                    </div>
                    <span className={`text-[7px] font-black uppercase tracking-[0.2em] transition-all ${activeSection === "profile" ? 'opacity-100' : 'opacity-60'}`} style={{ color: activeSection === "profile" ? primaryColor : '#a1a1aa' }}>
                        Perfil
                    </span>
                </button>
            </div>
        </nav>
    );
}
