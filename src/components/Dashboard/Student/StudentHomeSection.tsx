"use client";

import React from "react";
import { 
    RefreshCw, 
    ChevronRight, 
    CheckCircle2, 
    Camera, 
    QrCode, 
    Loader2,
    CreditCard
} from "lucide-react";
import { todayCL } from "@/lib/utils";
import { TodaySchedule } from "./TodaySchedule";
import { NavSection } from "@/components/Navigation/BottomNav";

interface StudentHomeSectionProps {
    guardian: any;
    isSchoolTreasury: boolean;
    branding: any;
    totalDueOrReview: boolean;
    hasPendingReview: boolean;
    totalDue: number;
    setActiveSection: (section: NavSection) => void;
    myFees: any[];
    schedulesList: any[];
    primaryColor: string;
    students: any[];
    isUploadingPhoto: boolean;
    studentPhotoLoadingId: string | null;
    studentForPhotoRef: React.MutableRefObject<string | null>;
    profileFileInputRef: React.MutableRefObject<HTMLInputElement | null>;
    setActiveScanner: (id: string | null) => void;
    vocab: any;
}

export function StudentHomeSection({
    guardian,
    isSchoolTreasury,
    branding,
    totalDueOrReview,
    hasPendingReview,
    totalDue,
    setActiveSection,
    myFees,
    schedulesList,
    primaryColor,
    students,
    isUploadingPhoto,
    studentPhotoLoadingId,
    studentForPhotoRef,
    profileFileInputRef,
    setActiveScanner,
    vocab
}: StudentHomeSectionProps) {
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

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Mini */}
            <div className="mb-4">
                <h1 className="text-2xl font-black text-zinc-900 leading-tight">Hola, {guardian.name.split(' ')[0]}</h1>
                <p className="text-[11px] font-bold text-zinc-500 mt-1">{isSchoolTreasury ? `Gestiona tus cuotas y pagos del ${vocab.placeLabel.toLowerCase()} 😊` : `Gestiona tu asistencia en el ${vocab.placeLabel} 😊`}</p>
            </div>

            {/* Deuda / Status Card — solo para academias con mensualidades */}
            {!isSchoolTreasury && (totalDueOrReview ? (
                hasPendingReview ? (
                    /* ESTADO 2: EN REVISIÓN (AMARILLO/NARANJA) */
                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2.5rem] p-6 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-1">
                                <RefreshCw size={12} className="animate-[spin_3s_linear_infinite]" />
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-90">Pago en revisión</p>
                            </div>
                            <h2 className="text-4xl font-black mb-2">${Number(totalDue).toLocaleString("es-CL")}</h2>
                            <p className="text-xs opacity-80 mb-4">Te notificaremos cuando sea aprobado 🔔</p>
                            <button 
                                onClick={() => setActiveSection("payments")}
                                className="bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/30 transition-all flex items-center gap-2"
                            >
                                Ver mis pagos <ChevronRight size={14} />
                            </button>
                        </div>
                        <CreditCard className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
                    </div>
                ) : (
                    /* ESTADO 1: DEUDA CRÍTICA (ROJO) */
                    <div className="bg-gradient-to-br from-red-500 to-orange-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-red-500/20 relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Saldo pendiente</p>
                            <h2 className="text-4xl font-black mb-4">${Number(totalDue).toLocaleString("es-CL")}</h2>
                            <button 
                                onClick={() => setActiveSection("payments")}
                                className="bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/30 transition-all flex items-center gap-2"
                            >
                                Pagar ahora <ChevronRight size={14} />
                            </button>
                        </div>
                        <CreditCard className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
                    </div>
                )
            ) : (
                /* ESTADO 3: AL DÍA (VERDE) */
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
                    <div className="relative z-10">
                        <CheckCircle2 className="w-8 h-8 mb-2" />
                        <h2 className="text-xl font-black">¡Estás al día!</h2>
                        <p className="text-xs opacity-80 mt-1">No tienes {vocab.cat1.toLowerCase()}s pendientes.</p>
                    </div>
                    <CreditCard className="absolute -right-4 -bottom-4 w-32 h-32 opacity-5 -rotate-12" />
                </div>
            ))}

            {/* Status cuotas — school_treasury */}
            {isSchoolTreasury && (() => {
                const today = new Date();
                const allPeriods = myFees.flatMap((fd: any) => fd.periods || []);
                const hasReview  = allPeriods.some((p: any) => p.status === 'review');
                const hasOverdue = allPeriods.some((p: any) =>
                    p.status === 'pending' && p.due_date && new Date(p.due_date) < today
                );
                // Próximo pendiente no vencido
                const nextPending = myFees.flatMap((fd: any) =>
                    (fd.periods || [])
                        .filter((p: any) => p.status === 'pending')
                        .map((p: any) => ({ ...p, amount: fd.fee.amount, title: fd.fee.title }))
                ).sort((a: any, b: any) => a.year !== b.year ? a.year - b.year : a.month - b.month)[0];

                // 1. Amarillo: comprobante en revisión
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

                if (hasReview) return (
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
                );
                if (hasOverdue && nextPending) return (
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
                );
                return (
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
                );
            })()}

            {/* Horario del día — school_treasury */}
            {isSchoolTreasury && (
                <TodaySchedule key={schedulesList.length + schedulesList.map((s:any)=>s.id).join(',')} schedules={schedulesList} primaryColor={primaryColor} vocab={vocab} />
            )}



            {/* Mis Alumnos Cards — otras industrias con QR */}
            {!isSchoolTreasury && (
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-4 bg-orange-500 rounded-full" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-400">
                        Registrar asistencia {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h3>
                </div>
                {students.map((student: any) => {
                    const todayStr = todayCL();
                    const isPresentToday = (student.recent_attendance || []).some((a: any) => a.date === todayStr && a.status === 'present');
                    return (
                    <div
                        key={student.id}
                        className={`bg-white rounded-[2.5rem] p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all border-2 ${isPresentToday ? 'border-emerald-400 shadow-emerald-50' : 'border-zinc-100'}`}
                    >
                        <div className="flex items-center gap-4 relative z-10">
                            <button
                                type="button"
                                className={`w-16 h-16 rounded-full overflow-hidden bg-zinc-100 shadow-md shrink-0 relative cursor-pointer z-30 active:scale-95 transition-transform touch-none border-2 ${isPresentToday ? 'border-emerald-400' : 'border-zinc-50'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    studentForPhotoRef.current = student.id;
                                    profileFileInputRef.current?.click();
                                }}
                            >
                                {(isUploadingPhoto && !studentPhotoLoadingId) || studentPhotoLoadingId === student.id ? (
                                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center z-20">
                                        <Loader2 className="animate-spin text-orange-500" size={18} />
                                    </div>
                                ) : null}
                                {student.photo ? (
                                    <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl font-black text-zinc-200">
                                        {student.name[0]}
                                    </div>
                                )}
                                <div className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center text-zinc-400 border border-zinc-100 z-10">
                                    <Camera className="w-3.5 h-3.5" />
                                </div>
                            </button>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-black text-zinc-900 truncate">{student.name}</h4>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-2">{student.category === 'kids' ? vocab.cat1 : student.category === 'adult' ? vocab.cat2 : student.category}</p>
                                {isPresentToday ? (
                                    <p className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter flex items-center gap-1.5 bg-emerald-50 w-fit px-2 py-1 rounded-full border border-emerald-200">
                                        <CheckCircle2 size={10} /> Presente
                                    </p>
                                ) : (
                                    <p className="text-[8px] font-black text-indigo-500 uppercase tracking-tighter flex items-center gap-1.5 bg-indigo-50/50 w-fit px-2 py-1 rounded-full border border-indigo-100/50">
                                        Registra tu asistencia 👉🏻
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveScanner(student.id);
                                    }}
                                    className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-lg shadow-zinc-200 active:scale-90 transition-all shrink-0 relative group/qr z-20 border border-zinc-300"
                                >
                                    <QrCode size={28} className="text-orange-400 group-hover/qr:scale-110 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                    );
                })}
            </div>
            )}
        </div>
    );
}
