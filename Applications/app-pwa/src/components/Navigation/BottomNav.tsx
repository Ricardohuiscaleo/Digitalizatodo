"use client";

import React from "react";
import { Home, Calendar, CreditCard, User } from "lucide-react";

export type NavSection = "home" | "calendar" | "payments" | "profile";

interface BottomNavProps {
    activeSection: NavSection;
    setActiveSection: (section: NavSection) => void;
    primaryColor?: string;
}

export default function BottomNav({ activeSection, setActiveSection, primaryColor = "#f97316" }: BottomNavProps) {
    const items: { id: NavSection; label: string; icon: any }[] = [
        { id: "home", label: "Inicio", icon: Home },
        { id: "calendar", label: "Clases", icon: Calendar },
        { id: "payments", label: "Pagos", icon: CreditCard },
        { id: "profile", label: "Perfil", icon: User },
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
                            className={`flex flex-col items-center gap-1 transition-all duration-300 relative ${
                                isActive ? "scale-110" : "scale-100 opacity-40 hover:opacity-100"
                            }`}
                        >
                            <div
                                className={`p-2 rounded-2xl transition-all ${
                                    isActive ? "bg-stone-100 text-stone-900" : ""
                                }`}
                                style={isActive ? { color: primaryColor, backgroundColor: `${primaryColor}10` } : {}}
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
            </div>
        </nav>
    );
}
