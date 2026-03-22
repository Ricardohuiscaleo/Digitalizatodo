"use client";

import React from "react";
import { 
    ChevronRight, 
    CheckCircle2, 
    RefreshCw,
    CreditCard,
    Camera,
    QrCode,
    Loader2
} from "lucide-react";
import { todayCL } from "@/lib/utils";
import { TodaySchedule } from "../../TodaySchedule";
import { NavSection } from "@/components/Navigation/BottomNav";
import { getBeltColor } from "@/lib/industryUtils";

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
    isUploadingPhoto,
    studentPhotoLoadingId,
    studentForPhotoRef,
    profileFileInputRef,
    setActiveScanner,
    vocab
}: HomeMartialArtsProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-4">
                <h1 className="text-2xl font-black text-zinc-900 leading-tight">Hola, {guardian.name.split(' ')[0]}</h1>
                <p className="text-[11px] font-bold text-zinc-500 mt-1">Gestiona tu asistencia en el {vocab.placeLabel} 😊</p>
            </div>

            {/* Financial Status Card */}
            {totalDueOrReview ? (
                hasPendingReview ? (
                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2.5rem] p-6 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-1">
                                <RefreshCw size={12} className="animate-[spin_3s_linear_infinite]" />
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-90">Pago en revisión</p>
                            </div>
                            <h2 className="text-4xl font-black mb-2">${Number(totalDue).toLocaleString("es-CL")}</h2>
                            <p className="text-xs opacity-80 mb-4">Te notificaremos cuando sea aprobado 🔔</p>
                            <button onClick={() => setActiveSection("payments")} className="bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/30 transition-all flex items-center gap-2">
                                Ver mis pagos <ChevronRight size={14} />
                            </button>
                        </div>
                        <CreditCard className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
                    </div>
                ) : (
                    <div className="bg-gradient-to-br from-red-500 to-orange-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-red-500/20 relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Saldo pendiente</p>
                            <h2 className="text-4xl font-black mb-4">${Number(totalDue).toLocaleString("es-CL")}</h2>
                            <button onClick={() => setActiveSection("payments")} className="bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/30 transition-all flex items-center gap-2">
                                Pagar ahora <ChevronRight size={14} />
                            </button>
                        </div>
                        <CreditCard className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
                    </div>
                )
            ) : (
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
                    <div className="relative z-10">
                        <CheckCircle2 className="w-8 h-8 mb-2" />
                        <h2 className="text-xl font-black">¡Estás al día!</h2>
                        <p className="text-xs opacity-80 mt-1">No tienes {vocab.cat1.toLowerCase()}s pendientes.</p>
                    </div>
                    <CreditCard className="absolute -right-4 -bottom-4 w-32 h-32 opacity-5 -rotate-12" />
                </div>
            )}

            {/* Premium Credits Card (Consumables) */}
            {students.some(s => s.consumable_credits > 0) && (
              <div className="bg-zinc-950 rounded-[2.5rem] p-6 text-white shadow-2xl relative overflow-hidden group border border-[#c9a84c]/30">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9a84c]/10 rounded-full blur-3xl" />
                <div className="relative z-10 flex justify-between items-center text-left">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-[#c9a84c] text-black text-[7px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest">VIP EXPERIENCE</span>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#c9a84c]">Clases Personalizadas</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-4xl font-black text-white">{students.reduce((acc, s) => acc + (s.consumable_credits || 0), 0)}</h2>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Disponibles</span>
                    </div>
                  </div>
                  <div className="bg-[#c9a84c]/10 p-4 rounded-3xl border border-[#c9a84c]/20">
                     <div className="w-10 h-10 border-2 border-[#c9a84c] rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-[#c9a84c] font-black text-xl">★</span>
                     </div>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 w-32 h-32 text-[#c9a84c] opacity-5 -rotate-12 font-black text-8xl pointer-events-none select-none">VIP</div>
              </div>
            )}

            {/* Attendance Sections */}
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
                        <div key={student.id} className={`bg-white rounded-[2.5rem] p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all border-2 ${isPresentToday ? 'border-emerald-400 shadow-emerald-50' : 'border-zinc-100'}`}>
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
                                        <div className="w-full h-full flex items-center justify-center text-2xl font-black text-zinc-200">{student.name[0]}</div>
                                    )}
                                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center text-zinc-400 border border-zinc-100 z-10">
                                        <Camera className="w-3.5 h-3.5" />
                                    </div>
                                </button>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-zinc-900 truncate">{student.name}</h4>
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-2">{student.category === 'kids' ? vocab.cat1 : student.category === 'adult' ? vocab.cat2 : student.category}</p>
                                    {student.label && (
                                        <div className={`mt-1.5 w-full h-1 rounded-full ${getBeltColor(student.label)}`} />
                                    )}
                                    {student.consumable_credits > 0 && (
                                        <div className="mt-2 flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
                                            <span className="text-[9px] font-black uppercase text-[#c9a84c] tracking-tighter">
                                                {student.consumable_credits} Clases VIP
                                            </span>
                                        </div>
                                    )}
                                    {isPresentToday ? (
                                        <p className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter flex items-center gap-1.5 bg-emerald-50 w-fit px-2 py-1 rounded-full border border-emerald-200 mt-2">
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
                                        onClick={(e) => { e.stopPropagation(); setActiveScanner(student.id); }}
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
