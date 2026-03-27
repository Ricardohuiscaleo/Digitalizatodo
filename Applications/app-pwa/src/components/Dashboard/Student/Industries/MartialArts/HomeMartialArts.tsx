"use client";

import React from "react";
import { ChevronRight, CheckCircle2, RefreshCw, CreditCard, QrCode } from "lucide-react";
import { todayCL } from "@/lib/utils";
import { NavSection } from "@/components/Navigation/BottomNav";
import { BeltDisplay } from "@/components/Dashboard/Industries/MartialArts/BeltDisplay";
import { StudentAvatar } from "@/components/Dashboard/Industries/MartialArts/StudentAvatar";
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
                    const totalClasses = (student.total_attendances ?? 0) + (student.previous_classes ?? 0);
                    const progress = student.belt_rank
                        ? calcBeltProgress(student.belt_rank, student.degrees ?? 0, student.belt_classes_at_promotion ?? 0, totalClasses)
                        : null;

                    return (
                        <div key={student.id} className={`rounded-[2.5rem] p-5 border transition-all ${
                            isPresent
                                ? 'border-emerald-400 bg-emerald-50/50 shadow-emerald-100 shadow-md'
                                : isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'
                        }`}>
                            <div className="flex items-center gap-5">
                                {/* Foto Perfil Multi-Data */}
                                <div className="shrink-0">
                                    <StudentAvatar
                                        photo={student.photo}
                                        name={student.name}
                                        size={80}
                                        beltRank={student.belt_rank}
                                        degrees={student.degrees}
                                        classesCount={progress ? progress.classesInCurrentStripe : totalClasses}
                                        modality={student.modality}
                                        isDark={isDark}
                                        ring={isPresent ? 'ring-emerald-400' : isDark ? 'ring-zinc-800' : 'ring-zinc-50'}
                                    />
                                </div>
                                
                                {/* Info Principal */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col gap-0.5">
                                        <p className={`text-lg font-black truncate leading-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                            {student.name.split(' ').slice(0, 2).join(' ')}
                                        </p>
                                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                            {student.category === 'kids' ? vocab.cat1 : vocab.cat2}
                                            {student.consumable_credits > 0 && (
                                                <span className="ml-2 text-[#c9a84c]">/ {student.consumable_credits} VIP</span>
                                            )}
                                        </p>
                                        <p className="mt-1 flex items-baseline gap-1 text-zinc-900 border border-zinc-100 bg-zinc-50 rounded-lg px-2 py-1 w-fit">
                                            <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Acumulado:</span>
                                            <span className="text-xs font-black">{totalClasses} Clases</span>
                                        </p>
                                    </div>
                                    
                                    {/* Estado de Asistencia Hoy */}
                                    {isPresent && (
                                        <div className="mt-2 flex items-center gap-1.5 text-emerald-600 bg-emerald-100 self-start px-2 py-0.5 rounded-full w-fit">
                                            <CheckCircle2 size={10} />
                                            <span className="text-[8px] font-black uppercase tracking-widest leading-none">Presente Hoy</span>
                                        </div>
                                    )}
                                </div>

                                {/* QR Call to Action */}
                                <button
                                    onClick={() => setActiveScanner(student.id)}
                                    className={`w-16 h-16 rounded-[1.5rem] flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all shrink-0 border-2 ${
                                        isPresent
                                            ? 'bg-emerald-500 border-emerald-400 shadow-emerald-500/20'
                                            : 'bg-zinc-950 border-zinc-800 shadow-black/20'
                                    }`}
                                >
                                    <QrCode size={24} className={isPresent ? 'text-white' : 'text-orange-400'} />
                                    <span className={`text-[7px] font-black uppercase tracking-widest ${isPresent ? 'text-white' : 'text-zinc-500'}`}>Check-in</span>
                                </button>
                            </div>

                            {/* Gamificación de Grados (Nueva UI) */}
                            {progress && (
                                <div className="mt-6 pt-5 border-t border-dashed border-zinc-200/50 dark:border-zinc-800/50">
                                    <div className="flex justify-between items-end mb-3">
                                        <div className="space-y-1">
                                            <p className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                                Camino a {progress.isReadyForBelt ? progress.nextBeltName : `${progress.nextStripe}★ Raya`}
                                            </p>
                                            <div className="flex items-baseline gap-1">
                                                <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                                    {progress.classesInCurrentStripe}
                                                </span>
                                                <span className={`text-xs font-bold ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                                    / {progress.classesPerStripe} clases
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-[9px] font-black uppercase tracking-widest text-[#c9a84c] mb-1`}>
                                                Faltan
                                            </p>
                                            <p className={`text-lg font-black leading-none ${isDark ? 'text-[#c9a84c]' : 'text-[#c9a84c]'}`}>
                                                {progress.isReadyForBelt ? '¡LISTO!' : progress.classesForNextStripe}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Barra de Progreso Premium */}
                                    <div className={`h-2.5 rounded-full overflow-hidden p-0.5 ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                                        <div 
                                            className="h-full rounded-full transition-all duration-1000 ease-out relative group"
                                            style={{
                                                width: `${progress.progressPct}%`,
                                                backgroundColor: progress.isReadyForBelt ? '#c9a84c' : getBeltHex(student.belt_rank),
                                                boxShadow: `0 0 12px ${getBeltHex(student.belt_rank)}40`
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between mt-2.5">
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-700' : 'text-zinc-300'}`}>
                                            Total en cinturón: {progress.classesInBelt}
                                        </span>
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-700' : 'text-zinc-300'}`}>
                                            Alliance BJJ System
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
