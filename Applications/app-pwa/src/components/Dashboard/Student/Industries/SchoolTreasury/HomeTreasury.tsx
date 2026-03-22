"use client";

import React from "react";
import { 
    ChevronRight, 
    CheckCircle2, 
    RefreshCw
} from "lucide-react";
import { TodaySchedule } from "../../TodaySchedule";
import { NavSection } from "@/components/Navigation/BottomNav";

interface HomeTreasuryProps {
    guardian: any;
    branding: any;
    myFees: any[];
    schedulesList: any[];
    primaryColor: string;
    students: any[];
    setActiveSection: (section: NavSection) => void;
    vocab: any;
}

export function HomeTreasury({
    guardian,
    branding,
    myFees,
    schedulesList,
    primaryColor,
    students,
    setActiveSection,
    vocab
}: HomeTreasuryProps) {
    const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    
    const formatCategory = (cat: string) => {
        if (!cat) return '';
        const lower = cat.toLowerCase();
        if (lower === 'prekinder') return 'Pre-Kinder';
        if (lower === 'kinder') return 'Kinder';
        const match = cat.match(/^(\d+)_(.+)$/);
        if (match) return `${match[1]}° ${match[2].charAt(0).toUpperCase() + match[2].slice(1).toLowerCase()}`;
        return cat.replace(/_/g, ' ');
    };

    const today = new Date();
    const allPeriods = myFees.flatMap((fd: any) => fd.periods || []);
    const hasReview  = allPeriods.some((p: any) => p.status === 'review');
    const hasOverdue = allPeriods.some((p: any) =>
        p.status === 'pending' && p.due_date && new Date(p.due_date) < today
    );
    
    const nextPending = myFees.flatMap((fd: any) =>
        (fd.periods || [])
            .filter((p: any) => p.status === 'pending')
            .map((p: any) => ({ ...p, amount: fd.fee.amount, title: fd.fee.title }))
    ).sort((a: any, b: any) => a.year !== b.year ? a.year - b.year : a.month - b.month)[0];

    const student = students[0];
    const StudentAvatar = () => student ? (
        <div className="shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white/20 border-2 border-white/30">
                {student.photo
                    ? <img src={student.photo} className="w-full h-full object-cover" alt="" />
                    : <div className="w-full h-full flex items-center justify-center text-white font-black text-2xl">{student.name[0]}</div>
                }
            </div>
        </div>
    ) : null;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-4">
                <h1 className="text-2xl font-black text-zinc-900 leading-tight">Hola, {guardian.name.split(' ')[0]}</h1>
                <p className="text-[11px] font-bold text-zinc-500 mt-1">Gestiona tus cuotas y pagos del {vocab.placeLabel.toLowerCase()} 😊</p>
            </div>

            {/* Financial Status Card */}
            {hasReview ? (
                <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2rem] p-5 text-white shadow-xl shadow-orange-500/20">
                    <div className="flex items-center gap-4">
                        <StudentAvatar />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                                <RefreshCw size={10} className="animate-[spin_3s_linear_infinite] opacity-80" />
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-80">En revisión</p>
                            </div>
                            <h2 className="text-lg font-black leading-tight mb-0.5">Pago enviado</h2>
                            <p className="text-[10px] opacity-70 mb-3">Te avisamos cuando sea aprobado 🔔</p>
                            <button onClick={() => setActiveSection('payments')} className="bg-white/20 border border-white/30 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                Ver cuotas <ChevronRight size={11} />
                            </button>
                        </div>
                    </div>
                </div>
            ) : hasOverdue && nextPending ? (
                <div className="bg-gradient-to-br from-red-500 to-orange-600 rounded-[2rem] p-5 text-white shadow-xl shadow-red-500/20 relative">
                    <button onClick={() => setActiveSection('payments')} className="absolute bottom-4 right-4 text-[10px] font-black opacity-80">Pagar 👉🏻</button>
                    <div className="flex items-center gap-4">
                        <StudentAvatar />
                        <div className="flex-1 min-w-0">
                            {student && <>
                                <p className="font-black opacity-90 leading-tight" style={{ fontSize: 'clamp(0.65rem, 3.5vw, 0.875rem)' }}>{student.name}</p>
                                {student.category && <p className="text-[10px] opacity-70 mb-0.5">{formatCategory(student.category)}</p>}
                            </>}
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-0.5">Cuota vencida</p>
                            <h2 className="text-2xl font-black leading-tight">${Number(nextPending.amount).toLocaleString('es-CL')}</h2>
                            <p className="text-[10px] opacity-70">{nextPending.title} · {MONTHS[nextPending.month - 1]} {nextPending.year}</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] p-5 text-white shadow-xl shadow-emerald-500/20">
                    <div className="flex items-center gap-4">
                        <StudentAvatar />
                        <div className="flex-1 min-w-0">
                            <CheckCircle2 className="w-6 h-6 mb-1.5" />
                            <h2 className="text-lg font-black leading-tight">¡Estás al día!</h2>
                            {nextPending ? (
                                <p className="text-[10px] opacity-70 mt-1">Próx. venc: {MONTHS[nextPending.month - 1]} {nextPending.year} · ${Number(nextPending.amount).toLocaleString('es-CL')}</p>
                            ) : (
                                <p className="text-[10px] opacity-70 mt-1">No tienes cuotas pendientes.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Daily Schedule */}
            <TodaySchedule 
                key={schedulesList.map((s:any)=>`${s.id}-${s.subject}-${s.color}`).join(',')} 
                schedules={schedulesList} 
                primaryColor={primaryColor} 
                vocab={vocab} 
            />
        </div>
    );
}
