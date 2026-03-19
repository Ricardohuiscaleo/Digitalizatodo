"use client";

import React from "react";
import { Home, Calendar, CreditCard, ShoppingCart } from "lucide-react";

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
        { id: "payments" as NavSection, label: "Pagos", icon: CreditCard },
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
                            className={`flex flex-col items-center gap-0.5 transition-all duration-150 ${
                                isActive ? "opacity-100" : "opacity-30 hover:opacity-100"
                            }`}
                        >
                            <div
                                className="p-2 transition-all"
                                style={isActive ? { color: primaryColor } : {}}
                            >
                                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span
                                className="text-[10px] font-black uppercase tracking-widest transition-all"
                                style={isActive ? { color: primaryColor } : {}}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
                {/* Profile tab con foto */}
                <button
                    onClick={() => setActiveSection("profile")}
                    className={`flex flex-col items-center gap-0.5 transition-all duration-150 ${
                        activeSection === "profile" ? "opacity-100" : "opacity-30 hover:opacity-100"
                    }`}
                >
                    <div className={`w-7 h-7 rounded-full overflow-hidden border-2 ${activeSection === "profile" ? '' : 'border-transparent'}`} style={activeSection === "profile" ? { borderColor: primaryColor } : {}}>
                        {userPhoto ? (
                            <img src={userPhoto} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <div className="w-full h-full bg-zinc-200 flex items-center justify-center text-zinc-500 text-xs font-black">
                                {userName?.[0] || 'U'}
                            </div>
                        )}
                    </div>
                    <span
                        className="text-[10px] font-black uppercase tracking-widest transition-all"
                        style={activeSection === "profile" ? { color: primaryColor } : {}}
                    >
                        Perfil
                    </span>
                </button>
            </div>
        </nav>
    );
}
