"use client";

import React from "react";
import { ChevronRight, CheckCircle2, RefreshCw, CreditCard, QrCode } from "lucide-react";
import { todayCL } from "@/lib/utils";
import { NavSection } from "@/components/Navigation/BottomNav";
import { BeltDisplay } from "@/components/Dashboard/Industries/MartialArts/BeltDisplay";
import { calcBeltProgress, getBeltHex } from "@/lib/industryUtils";

interface HomeMartialArtsProps {
    guardian: any;
    branding: any;
    totalDueOrReview: boolean;
    hasPendingReview: boolean;
    totalDue: number;
    setActiveSection: (section: NavSection) => void;
    schedulesList: any[];
    primaryColor: string;
    students: any[];
    isUploadingPhoto: boolean;
    studentPhotoLoadingId: string | null;
    studentForPhotoRef: React.MutableRefObject<string | null>;
    profileFileInputRef: React.MutableRefObject<HTMLInputElement | null>;
    setActiveScanner: (id: string | null) => void;
    vocab: any;
    isDark?: boolean;
}

export function HomeMartialArts({
    guardian,
    totalDueOrReview,
    hasPendingReview,
    totalDue,
    setActiveSection,
    primaryColor,
    students,
    setActiveScanner,
    vocab,
    isDark = false,
}: HomeMartialArtsProps) {
    const todayStr = todayCL();

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Saludo */}
            <div>
                <h1 className={`text-2xl font-black leading-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                    Hola, {guardian.name.split(' ')[0]}
                </h1>
                <p className={`text-[11px] font-bold mt-0.5 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Gestiona tus pagos y asistencia en el {vocab.placeLabel} 😊
                </p>
            </div>

            {/* Estado financiero */}
            {totalDueOrReview ? (
                hasPendingReview ? (
                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2.5rem] p-6 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-1">
                                <RefreshCw size={12} className="animate-[spin_3s_linear_infinite]" />
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-90">Pago en revisión</p>
                            </div>
                            <h2 className="text-4xl font-black mb-2">${Number(totalDue).toLocaleString("es-CL")}</h2>
                            <button onClick={() => setActiveSection("payments")} className="bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                Ver mis pagos <ChevronRight size={14} />
                            </button>
                        </div>
                        <CreditCard className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 -rotate-12" />
                    </div>
                ) : (
                    <div className="bg-gradient-to-br from-red-500 to-orange-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-red-500/20 relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Saldo pendiente</p>
                            <h2 className="text-4xl font-black mb-4">${Number(totalDue).toLocaleString("es-CL")}</h2>
                            <button onClick={() => setActiveSection("payments")} className="bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                Pagar ahora <ChevronRight size={14} />
                            </button>
                        </div>
                        <CreditCard className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 -rotate-12" />
                    </div>
                )
            ) : (
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] p-5 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
                    <div className="relative z-10 flex items-center gap-3">
                        <CheckCircle2 className="w-7 h-7 shrink-0" />
                        <div>
                            <h2 className="text-lg font-black">¡Estás al día!</h2>
                            <p className="text-[10px] opacity-80">Sin pagos pendientes 🎉</p>
                        </div>
                    </div>
                </div>
            )}

            {/* VIP Credits */}
            {students.some(s => s.consumable_credits > 0) && (
                <div className="bg-zinc-950 rounded-[2.5rem] p-5 text-white shadow-2xl relative overflow-hidden border border-[#c9a84c]/30">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9a84c]/10 rounded-full blur-3xl" />
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-[#c9a84c] text-black text-[7px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest">VIP</span>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#c9a84c]">Clases Personalizadas</p>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-4xl font-black">{students.reduce((a, s) => a + (s.consumable_credits || 0), 0)}</span>
                                <span className="text-xs font-bold text-zinc-500 uppercase">Disponibles</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 border-2 border-[#c9a84c] rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-[#c9a84c] font-black text-xl">★</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Cards de atletas */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full" style={{ backgroundColor: primaryColor }} />
                    <h3 className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h3>
                </div>

                {students.map((student: any) => {
                    const isPresent = (student.recent_attendance || []).some((a: any) => a.date === todayStr && a.status === 'present');
                    const progress = student.belt_rank
                        ? calcBeltProgress(student.belt_rank, student.degrees ?? 0, student.belt_classes_at_promotion ?? 0, student.total_attendances ?? 0)
                        : null;

                    return (
                        <div key={student.id} className={`rounded-[2rem] p-4 border transition-all ${
                            isPresent
                                ? 'border-emerald-400 bg-emerald-50/50 shadow-emerald-100 shadow-md'
                                : isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'
                        }`}>
                            <div className="flex items-center gap-4">
                                {/* Foto */}
                                <div className={`w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-2 ${isPresent ? 'border-emerald-400' : 'border-zinc-100'}`}>
                                    {student.photo
                                        ? <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                                        : <div className={`w-full h-full flex items-center justify-center text-2xl font-black ${isDark ? 'bg-zinc-800 text-zinc-600' : 'bg-zinc-100 text-zinc-300'}`}>{student.name[0]}</div>
                                    }
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className={`text-sm font-black truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                            {student.name.split(' ').slice(0, 2).join(' ')}
                                        </p>
                                        {isPresent && (
                                            <span className="flex items-center gap-1 text-[7px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full shrink-0">
                                                <CheckCircle2 size={8} /> Presente
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                        {student.category === 'kids' ? vocab.cat1 : vocab.cat2}
                                    </p>
                                    {student.belt_rank && (
                                        <BeltDisplay beltRank={student.belt_rank} degrees={student.degrees ?? 0} size="sm" />
                                    )}
                                    {student.consumable_credits > 0 && (
                                        <div className="mt-1 flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
                                            <span className="text-[8px] font-black uppercase text-[#c9a84c]">{student.consumable_credits} VIP</span>
                                        </div>
                                    )}
                                </div>

                                {/* QR */}
                                <button
                                    onClick={() => setActiveScanner(student.id)}
                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all shrink-0 border ${
                                        isPresent
                                            ? 'bg-emerald-500 border-emerald-400 shadow-emerald-200'
                                            : 'bg-zinc-900 border-zinc-700 shadow-zinc-200'
                                    }`}
                                >
                                    <QrCode size={26} className={isPresent ? 'text-white' : 'text-orange-400'} />
                                </button>
                            </div>

                            {/* Progreso BJJ */}
                            {progress && (
                                <div className={`mt-3 rounded-xl p-3 border ${isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                            {progress.isReadyForBelt
                                                ? `¡Listo para ${progress.nextBeltName ?? 'Maestría'}!`
                                                : progress.nextStripe
                                                    ? `Hacia raya ${progress.nextStripe}`
                                                    : 'Progreso'}
                                        </span>
                                        <span className={`text-[9px] font-black ${progress.isReadyForBelt ? 'text-[#c9a84c]' : isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                            {progress.isReadyForBelt
                                                ? `→ ${progress.nextBeltName}`
                                                : progress.classesForNextStripe != null
                                                    ? `${progress.classesForNextStripe} clases → ${progress.nextStripe}★`
                                                    : `${progress.classesForPromotion} → ${progress.nextBeltName}`}
                                        </span>
                                    </div>
                                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                                        <div className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: `${progress.progressPct}%`,
                                                backgroundColor: progress.isReadyForBelt ? '#c9a84c' : getBeltHex(student.belt_rank),
                                                boxShadow: `0 0 6px ${getBeltHex(student.belt_rank)}60`
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className={`text-[9px] font-black ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                            {progress.classesInCurrentStripe} / {progress.classesPerStripe} clases
                                        </span>
                                        <span className={`text-[9px] ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                            {progress.classesInBelt} total en cinturón
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
