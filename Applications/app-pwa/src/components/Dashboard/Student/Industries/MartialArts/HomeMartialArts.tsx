"use client";

import React, { useState } from "react";
import { ChevronRight, CheckCircle2, RefreshCw, CreditCard, QrCode, X, Info, Award } from "lucide-react";
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
    schedulesList,
    primaryColor,
    students,
    setActiveScanner,
    vocab,
    isDark = false,
}: HomeMartialArtsProps) {
    const todayStr = todayCL();
    const [promoStudent, setPromoStudent] = useState<any>(null);

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
                    
                    // Priorizar progreso del servidor (Single Source of Truth)
                    let progress = null;
                    if (student.belt_progress) {
                        const sbp = student.belt_progress;
                        progress = {
                            totalForBelt: sbp.total_for_belt,
                            classesPerStripe: sbp.classes_per_stripe,
                            currentStripe: sbp.current_stripe,
                            progressPct: sbp.progress_pct,
                            isReadyForBelt: sbp.is_ready_for_belt,
                            extraClasses: sbp.extra_merit_classes,
                            classesInBelt: sbp.total_effective,
                            classesInCurrentStripe: sbp.total_effective % (sbp.classes_per_stripe || 1),
                            nextBeltName: sbp.next_belt,
                            nextStepLabel: sbp.is_ready_for_belt ? `PROFESOR: LISTO PARA ${sbp.next_belt}` : `PRÓXIMO HITO: ${sbp.current_stripe + 1}★`,
                        };
                    } else if (student.belt_rank) {
                        progress = calcBeltProgress(student.belt_rank, student.degrees ?? 0, student.belt_classes_at_promotion ?? 0, totalClasses);
                    }

                    return (
                        <div key={student.id} className={`rounded-[2.5rem] p-4 border transition-all ${
                            isPresent
                                ? 'border-emerald-400 bg-emerald-50/50 shadow-emerald-100 shadow-md'
                                : isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'
                        }`}>
                            <div className="flex items-center gap-4">
                                {/* Foto Perfil Multi-Data */}
                                <div className="shrink-0">
                                    <StudentAvatar
                                        photo={student.photo}
                                        name={student.name}
                                        size={56}
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
                                    <div className="flex flex-col">
                                        <p className={`text-base font-black truncate leading-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                            {student.name.split(' ').slice(0, 2).join(' ')}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                                {student.category === 'kids' ? vocab.cat1 : vocab.cat2}
                                            </p>
                                            {student.consumable_credits > 0 && (
                                                <span className="text-[9px] font-black text-[#c9a84c] uppercase tracking-widest">★ {student.consumable_credits} VIP</span>
                                            )}
                                        </div>
                                        <div className="mt-1 flex items-center gap-1.5">
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Acumulado:</span>
                                            <span className={`text-[10px] font-black ${isDark ? 'text-zinc-300' : 'text-zinc-900'}`}>
                                                {progress?.isReadyForBelt && (progress.extraClasses ?? 0) > 0 
                                                    ? `${progress.totalForBelt} + ${progress.extraClasses}` 
                                                    : (progress ? progress.classesInBelt : totalClasses)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* QR Call to Action (Version Compacta) */}
                                <button
                                    onClick={() => setActiveScanner(student.id)}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all shrink-0 border-2 ${
                                        isPresent
                                            ? 'bg-emerald-500 border-emerald-400 shadow-emerald-500/20'
                                            : 'bg-zinc-950 border-zinc-800 shadow-black/20'
                                    }`}
                                >
                                    <QrCode size={18} className={isPresent ? 'text-white' : 'text-orange-400'} />
                                </button>
                            </div>

                            {/* Gamificación de Grados (VERSION COMPACTA) */}
                            {progress && (
                                <div className="mt-4 pt-3 border-t border-dashed border-zinc-200/50 dark:border-zinc-800/50">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${
                                            progress.isReadyForBelt ? 'text-emerald-500 animate-pulse' : isDark ? 'text-zinc-600' : 'text-zinc-400'
                                        }`}>
                                            {progress.nextStepLabel}
                                        </p>
                                        <p className={`text-[8px] font-black uppercase tracking-widest ${
                                            progress.isReadyForBelt ? 'text-emerald-500' : 'text-zinc-400'
                                        }`}>
                                            {progress.isReadyForBelt ? '¡LISTO!' : `Meta: ${progress.totalForBelt}`}
                                        </p>
                                    </div>
                                    
                                    {/* Nueva Barra de Progreso: 5 Bloques (4 Rayas + 1 Ascenso) */}
                                    <div className="mt-2 space-y-1.5">
                                        <div className="flex gap-1.5 h-6">
                                            {[...Array(5)].map((_, i) => {
                                                const isFull = i < progress.currentStripe;
                                                const isCurrent = i === progress.currentStripe;
                                                const stripeProgress = isFull ? 100 : isCurrent ? progress.progressPct : 0;
                                                const barColor = isFull ? 'bg-emerald-500' : 'bg-amber-400';
                                                const isPromotionBlock = i === 4;
                                                
                                                return (
                                                    <div key={i} className={`flex-1 relative rounded-lg border overflow-hidden ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'} ${isPromotionBlock ? 'border-dashed' : ''}`}>
                                                        {/* Lado completado */}
                                                        <div 
                                                            className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${barColor}`}
                                                            style={{ width: `${stripeProgress}%` }}
                                                        />
                                                        {/* Etiqueta de clases o icono */}
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            {isPromotionBlock ? (
                                                                <Award size={10} className={`${stripeProgress > 45 ? 'text-zinc-900' : isDark ? 'text-zinc-700' : 'text-zinc-300'}`} />
                                                            ) : (
                                                                <span className={`text-[8px] font-black tracking-tighter ${
                                                                    stripeProgress > 45 
                                                                        ? (isFull ? 'text-white' : 'text-zinc-900') 
                                                                        : isDark ? 'text-zinc-600' : 'text-zinc-400'
                                                                }`}>
                                                                    {progress.classesPerStripe}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {/* Marcas abajo: 0, 1, 2, 3, 4, 🎓 (Alineadas con las esquinas) */}
                                        <div className="flex justify-between px-0.5 mt-0.5">
                                            {[0, 1, 2, 3, 4, 5].map((n) => (
                                                <div key={n} className="flex flex-col items-center w-0 overflow-visible">
                                                    <div className={`w-[1px] h-1 mb-0.5 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                                                    <span className={`text-[7px] font-black tracking-tighter uppercase whitespace-nowrap ${
                                                        n <= progress.currentStripe ? 'text-emerald-500' : isDark ? 'text-zinc-700' : 'text-zinc-400'
                                                    }`}>
                                                        {n === 0 ? '0' : n === 5 ? 'AZUL' : `${n}★`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Botón de Promoción Súper Premium */}
                                    {progress.isReadyForBelt && (
                                        <button 
                                            onClick={() => setPromoStudent({ ...student, progress })}
                                            className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 p-3 rounded-2xl flex items-center justify-between shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center text-white">
                                                    <Award size={16} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[10px] font-black text-white leading-none uppercase tracking-tighter">Subir a Cinturón {progress.nextBeltName}</p>
                                                    <p className="text-[8px] font-bold text-white/70 leading-none mt-0.5">Requisitos completados</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={14} className="text-white group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
                {students.length > 0 && (
                    <div className={`mt-2 rounded-[2rem] p-5 border ${isDark ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1 h-3 rounded-full bg-orange-400" />
                            <h3 className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                Este es tu horario el día de hoy..
                            </h3>
                        </div>
                        
                        <div className="space-y-2">
                            {(() => {
                                const dow = new Date().getDay();
                                const todayClasses = (schedulesList || []).filter(s => s.day_of_week === dow);
                                
                                if (todayClasses.length === 0) {
                                    return <p className="text-[10px] font-bold text-zinc-500 text-center py-2">No hay clases programadas para hoy</p>;
                                }

                                return todayClasses.sort((a: any, b: any) => a.start_time.localeCompare(b.start_time)).map((cls: any, idx: number) => {
                                    const studentMatch = students.find((s: any) => {
                                        const sCat = s.category?.toLowerCase();
                                        const cCat = cls.category?.toLowerCase();
                                        return (sCat === 'kids' && cCat === 'kids') || ((sCat === 'adults' || !sCat) && (cCat === 'adulto' || cCat === 'adults' || !cCat));
                                    });

                                    const startH = parseInt(cls.start_time.split(':')[0]);
                                    const isNight = startH >= 19;
                                    const isAfternoon = startH >= 14 && startH < 19;
                                    
                                    const isKids = cls.category?.toLowerCase() === 'kids';
                                    const colorKey = isKids ? 'fuchsia' : isNight ? 'blue' : isAfternoon ? 'orange' : 'amber';
                                    const dotColor = isKids ? 'bg-fuchsia-500' : isNight ? `bg-blue-600` : `bg-${colorKey}-500`;
                                    const bgColor = isKids ? 'bg-fuchsia-500/10' : isNight ? `bg-blue-600/10` : `bg-${colorKey}-500/10`;
                                    const textColor = isKids ? 'text-fuchsia-500' : isNight ? `text-blue-600` : `text-${colorKey}-500`;
                                    const lineColor = isKids ? 'bg-fuchsia-100' : isNight ? `bg-blue-600` : `bg-${colorKey}-500`;

                                    return (
                                        <div key={idx} className={`flex items-center justify-between p-3 rounded-2xl ${
                                            isDark ? 'bg-zinc-900' : 'bg-white'
                                        } shadow-sm transition-all`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl ${bgColor} ${textColor}`}>
                                                    <span className="text-[10px] font-black leading-none">{cls.start_time.slice(0, 5)}</span>
                                                    <div className={`w-4 h-[1px] opacity-20 my-1 ${lineColor}`} />
                                                    <span className="text-[8px] font-bold opacity-70">{cls.end_time.slice(0, 5)}</span>
                                                </div>
                                                <div>
                                                    <p className={`text-xs font-black uppercase tracking-tight ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                                                        {cls.name || cls.subject}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <div className={`w-1 h-1 rounded-full ${dotColor}`} />
                                                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">
                                                            {cls.category === 'kids' ? 'Infantil' : 'Adulto'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            {studentMatch && (
                                                <div className="flex -space-x-2">
                                                    <div className="w-6 h-6 rounded-full border-2 border-white ring-2 ring-emerald-400/20 overflow-hidden bg-zinc-200">
                                                        {studentMatch.photo ? (
                                                            <img src={studentMatch.photo} alt={studentMatch.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-zinc-400">
                                                                {studentMatch.name.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Información de Graduación */}
            {promoStudent && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-8 sm:items-center sm:pb-0 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPromoStudent(null)} />
                    <div className={`relative w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-500 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
                        {/* Header Modal */}
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-white relative">
                            <button onClick={() => setPromoStudent(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors">
                                <X size={18} />
                            </button>
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md border border-white/20 shadow-xl">
                                    <Award size={32} />
                                </div>
                                <h3 className="text-2xl font-black uppercase leading-tight tracking-tighter">Ascenso a Cinturón {promoStudent.progress.nextBeltName}</h3>
                                <p className="text-sm font-bold opacity-80 mt-1">Status de Graduación: {promoStudent.name}</p>
                            </div>
                        </div>

                        {/* Contenido Modal */}
                        <div className="p-8">
                            <div className="space-y-6">
                                <section className="flex gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-zinc-800 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <div>
                                        <h4 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>Requistos Técnicos OK</h4>
                                        <p className={`text-[11px] leading-relaxed mt-1 font-medium ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                            Has completado el mínimo de <strong>{promoStudent.progress.totalForBelt} clases</strong> requeridas por el sistema Alliance Jiu-Jitsu.
                                        </p>
                                    </div>
                                </section>

                                <div className={`p-5 rounded-2xl border-2 border-dashed ${isDark ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                                    <div className="flex items-start gap-3 mb-2">
                                        <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                        <p className={`text-[10px] font-black uppercase tracking-tight ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>Disclaimer de Graduación</p>
                                    </div>
                                    <p className={`text-[10px] leading-relaxed font-bold italic ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                                        "Los ascensos de cinturón no son automáticos por cantidad de clases. El profesor evalúa la capacidad técnica, asistencia constante, comportamiento y actitud dentro y fuera del tatami. La decisión final queda bajo el criterio del Mestre y el staff técnico según lo estipulado en el contrato de formación."
                                    </p>
                                </div>

                                <button 
                                    onClick={() => setPromoStudent(null)}
                                    className="w-full bg-zinc-950 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-black/20 active:scale-[0.98] transition-all"
                                >
                                    Entendido, hablaré con mi Profe
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
