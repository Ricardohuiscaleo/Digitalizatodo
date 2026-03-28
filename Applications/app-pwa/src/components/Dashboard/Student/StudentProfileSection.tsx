import React from "react";
import { 
    User, 
    Settings, 
    Camera, 
    Loader2, 
    Check, 
    X, 
    LogOut,
    Moon,
    Sun,
    Trophy,
    Mail,
    Phone
} from "lucide-react";
import { updateStudentName } from "@/lib/api";
import AppUpdatesAccordion from "../AppUpdatesAccordion";
import { getBeltColor, formatStudentCategory, calcBeltProgress, getBeltHex } from "@/lib/industryUtils";
import { BeltDisplay } from "@/components/Dashboard/Industries/MartialArts/BeltDisplay";
import { StudentAvatar } from "@/components/Dashboard/Industries/MartialArts/StudentAvatar";

interface StudentProfileSectionProps {
    guardian: any;
    primaryColor: string;
    isUploadingPhoto: boolean;
    profileFileInputRef: React.RefObject<HTMLInputElement>;
    students: any[];
    editingStudentId: string | null;
    setEditingStudentId: (id: string | null) => void;
    editingStudentName: string;
    setEditingStudentName: (name: string) => void;
    savingStudentName: boolean;
    setSavingStudentName: (val: boolean) => void;
    refreshData: () => void;
    studentPhotoLoadingId: string | null;
    handleUploadPhoto: (studentId: string, file: File) => void;
    studentForPhotoRef: React.MutableRefObject<string | null>;
    setActiveSection: (section: any) => void;
    setPaymentTab: (tab: "pending" | "history") => void;
    vocab: any;
    onAccountSwitch: (tenant: any) => void;
    isSchoolTreasury?: boolean;
    appUpdates?: any[];
    isDark?: boolean;
    onToggleDark?: () => void;
}

export function StudentProfileSection({
    guardian,
    primaryColor,
    isUploadingPhoto,
    profileFileInputRef,
    students,
    editingStudentId,
    setEditingStudentId,
    editingStudentName,
    setEditingStudentName,
    savingStudentName,
    setSavingStudentName,
    refreshData,
    studentPhotoLoadingId,
    handleUploadPhoto,
    studentForPhotoRef,
    setActiveSection,
    setPaymentTab,
    vocab,
    onAccountSwitch,
    isSchoolTreasury = false,
    appUpdates = [],
    isDark = false,
    onToggleDark,
}: StudentProfileSectionProps) {

    const handleUpdateStudentName = async () => {
        if (!editingStudentId || !editingStudentName.trim()) return;
        setSavingStudentName(true);
        const token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
        const slug = localStorage.getItem("tenant_slug");
        if (token && slug) {
            const success = await updateStudentName(slug, token, editingStudentId, editingStudentName);
            if (success) {
                setEditingStudentId(null);
                refreshData();
            }
        }
        setSavingStudentName(false);
    };

    const isSelf = (s: any) => s.name.trim().toLowerCase() === guardian.name.trim().toLowerCase();
    const selfStudent = students.find(isSelf);
    const otherStudents = students.filter(s => !isSelf(s));

    const renderProgress = (student: any) => {
        if (isSchoolTreasury) return null;

        const totalClasses = (student.total_attendances ?? 0) + (student.previous_classes ?? 0);
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
                nextBeltName: sbp.next_belt,
                nextStepLabel: sbp.is_ready_for_belt ? `LISTO PARA ${sbp.next_belt}` : `PRÓXIMO HITO: ${sbp.current_stripe + 1}★`,
            };
        } else if (student.belt_rank) {
            progress = calcBeltProgress(student.belt_rank, student.degrees ?? 0, student.belt_classes_at_promotion ?? 0, totalClasses);
        }

        if (!progress) return null;

        return (
            <div className={`mt-4 pt-3 border-t border-dashed ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
                <div className="flex justify-between items-center mb-1">
                    <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${
                        progress.isReadyForBelt ? 'text-emerald-500 animate-pulse' : isDark ? 'text-zinc-600' : 'text-zinc-400'
                    }`}>
                        {progress.nextStepLabel}
                    </p>
                    <p className={`text-[8px] font-black uppercase tracking-widest ${
                        progress.isReadyForBelt ? 'text-emerald-500' : 'text-zinc-400'
                    }`}>
                        {progress.isReadyForBelt ? '¡LOGRADO!' : `Meta: ${progress.totalForBelt}`}
                    </p>
                </div>
                
                {/* Visualización de 5 bloques (Rayas) */}
                <div className="mt-2 flex gap-1 h-3">
                    {[...Array(5)].map((_, i) => {
                        const isFull = i < progress.currentStripe;
                        const isCurrent = i === progress.currentStripe;
                        const stripeProgress = isFull ? 100 : isCurrent ? progress.progressPct : 0;
                        const barColor = isFull ? 'bg-emerald-500' : 'bg-amber-400';
                        const isPromotionBlock = i === 4;
                        
                        return (
                            <div key={i} className={`flex-1 relative rounded-sm overflow-hidden ${isDark ? 'bg-zinc-950 border border-zinc-800' : 'bg-zinc-50 border border-zinc-200'} ${isPromotionBlock ? 'border-dashed' : ''}`}>
                                <div 
                                    className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${barColor}`}
                                    style={{ width: `${stripeProgress}%` }}
                                />
                            </div>
                        );
                    })}
                </div>
                
                <div className="flex items-center justify-between mt-1.5 px-0.5">
                    <span className={`text-[9px] font-black ${ isDark ? 'text-zinc-300' : 'text-zinc-600' }`}>
                        {progress.isReadyForBelt && (progress.extraClasses ?? 0) > 0 
                            ? `${progress.totalForBelt} + ${progress.extraClasses}` 
                            : progress.classesInBelt}
                        <span className={`text-[8px] ml-0.5 font-bold ${ isDark ? 'text-zinc-600' : 'text-zinc-400' }`}>clases</span>
                    </span>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${
                        progress.isReadyForBelt ? 'text-emerald-500' : isDark ? 'text-zinc-500' : 'text-zinc-400'
                    }`}>
                        {progress.isReadyForBelt ? 'Siguiente nivel →' : `${progress.currentStripe}★ de 5`}
                    </span>
                </div>
            </div>
        );
    };

    const renderStudentCard = (student: any, isSelfCard = false) => (
        <div key={student.id} className={`rounded-[2rem] p-4 border transition-all group ${
            isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-100 hover:shadow-md'
        }`}>
            <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                    <button
                        onClick={() => { studentForPhotoRef.current = String(student.id); profileFileInputRef.current?.click(); }}
                        className="relative transition-transform active:scale-90"
                    >
                        <StudentAvatar
                            photo={student.photo}
                            name={student.name}
                            size={56}
                            beltRank={null} // Opcional, ya se muestra abajo con BeltDisplay
                            degrees={student.degrees ?? 0}
                            modality={student.modality}
                            isDark={isDark}
                            ring={isDark ? 'ring-zinc-800 bg-zinc-900' : 'ring-zinc-100 bg-zinc-50'}
                        />
                        {studentPhotoLoadingId === String(student.id) && (
                            <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center z-10">
                                <Loader2 className="text-orange-500 animate-spin" size={16} />
                            </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 text-white rounded-lg flex items-center justify-center shadow-lg border-2 border-white pointer-events-none z-20">
                            <Camera className="w-3 h-3" />
                        </div>
                    </button>
                </div>
                <div className="flex-1 min-w-0">
                    {editingStudentId === String(student.id) ? (
                        <div className="flex items-center gap-2">
                            <input autoFocus value={editingStudentName}
                                onChange={(e) => setEditingStudentName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateStudentName()}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-sm font-bold focus:outline-none focus:border-zinc-400"
                            />
                            <button onClick={handleUpdateStudentName} disabled={savingStudentName} className="text-emerald-500 p-1.5 rounded-lg">
                                {savingStudentName ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            </button>
                            <button onClick={() => setEditingStudentId(null)} className="text-zinc-400 p-1.5 rounded-lg"><X size={16} /></button>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-2">
                                <p className={`text-sm font-black truncate ${ isDark ? 'text-white' : 'text-zinc-900' }`}>
                                    {student.name.split(' ').slice(0, 2).join(' ')}
                                </p>
                                {isSelfCard && <span className="text-[7px] font-black uppercase tracking-widest text-orange-400 bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-100 shrink-0">Titular</span>}
                                <button
                                    onClick={() => { setEditingStudentId(String(student.id)); setEditingStudentName(student.name); }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-300 hover:text-zinc-600 transition-all shrink-0"
                                >
                                    <Settings size={12} />
                                </button>
                            </div>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${ isDark ? 'text-zinc-500' : 'text-zinc-400' }`}>
                                {formatStudentCategory(student.category, isSchoolTreasury ? 'school_treasury' : 'martial_arts', vocab.memberLabel)}
                            </p>
                            {!isSchoolTreasury && student.belt_rank && (
                                <div className="mt-1.5">
                                    <BeltDisplay beltRank={student.belt_rank} degrees={student.degrees ?? 0} size="md" />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            {renderProgress(student)}
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Guardian / Self Card */}
            <div className={`rounded-[2rem] px-5 py-5 shadow-xl relative overflow-hidden ${
                isDark ? 'bg-zinc-900/80 border border-zinc-800' : 'bg-zinc-900'
            } text-white`}>
                <div className="relative z-10 flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                        <button
                            onClick={() => {
                                if (selfStudent) { studentForPhotoRef.current = String(selfStudent.id); profileFileInputRef.current?.click(); }
                                else profileFileInputRef.current?.click();
                            }}
                            className="relative transition-transform active:scale-90"
                        >
                            <StudentAvatar
                                photo={selfStudent?.photo || guardian.photo}
                                name={selfStudent?.name || guardian.name}
                                size={56}
                                beltRank={null}
                                modality={selfStudent?.modality}
                                isDark={isDark}
                                ring="ring-2 ring-white/20 bg-white/10"
                            />
                            {isUploadingPhoto && (
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
                                    <Loader2 className="text-white animate-spin" size={18} />
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 text-white rounded-lg flex items-center justify-center shadow-lg border-2 border-zinc-900 transition-transform active:scale-90 z-20">
                                <Camera size={11} />
                            </div>
                        </button>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 mb-1">
                            {selfStudent ? 'Titular · Atleta' : 'Titular · Apoderado'}
                        </p>
                        <h2 className="text-xl font-black truncate leading-tight">
                            {guardian.name}
                        </h2>
                        {selfStudent?.belt_rank && (
                            <div className="mt-2">
                                <BeltDisplay beltRank={selfStudent.belt_rank} degrees={selfStudent.degrees ?? 0} size="sm" />
                            </div>
                        )}
                    </div>
                    {onToggleDark && (
                        <button onClick={onToggleDark}
                            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition-all active:scale-90 hover:bg-white/20 shrink-0">
                            {isDark ? <Sun size={14} className="text-[#c9a84c]" /> : <Moon size={14} className="text-zinc-400" />}
                        </button>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Datos de Contacto (Titular)</p>
                    <div className="flex flex-col gap-3">
                        {guardian.email && (
                            <div className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-all shadow-lg">
                                    <Mail size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-0.5">Email del Responsable</span>
                                    <span className="text-sm font-bold text-white leading-none">{guardian.email}</span>
                                </div>
                            </div>
                        )}
                        {guardian.phone && (
                            <div className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-all shadow-lg">
                                    <Phone size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-0.5">Teléfono de Contacto</span>
                                    <span className="text-sm font-bold text-white leading-none">{guardian.phone}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Progreso del titular si también es atleta */}
                {selfStudent && (
                    <div className="mt-4">
                        {renderProgress(selfStudent)}
                    </div>
                )}
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
            </div>

            {/* Otros alumnos */}
            {otherStudents.length > 0 && (
                <div className="space-y-4">
                    <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${ isDark ? 'text-zinc-500' : 'text-zinc-400' }`}>
                        Mis {vocab.memberLabel.toLowerCase()}s
                    </h3>
                    {otherStudents.map(s => renderStudentCard(s, false))}
                </div>
            )}

            <AppUpdatesAccordion appUpdates={appUpdates} />

            {/* Cerrar Sesión — discreto en rojo */}
            <button
                onClick={() => {
                    localStorage.removeItem("auth_token");
                    localStorage.removeItem("staff_token");
                    localStorage.removeItem("remember_token");
                    window.location.href = "/";
                }}
                className="w-full flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-600 transition-colors"
            >
                <LogOut size={13} />
                Cerrar Sesión
            </button>

            {/* Crédito — pie de página */}
            <a
                href="https://digitalizatodo.cl"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-0.5 pt-4 pb-2 border-t border-zinc-100 group"
            >
                <p className="text-[13px] font-black tracking-[0.25em] text-zinc-500 uppercase">Digitaliza Todo</p>
                <p className="text-[10px] text-zinc-400 text-center mt-1">Somos una empresa de desarrollo de software a la medida</p>
                <p className="text-[10px] font-semibold text-zinc-500 group-hover:text-zinc-700 transition-colors mt-1">¿Necesitas nuestros servicios? <span className="underline underline-offset-2">Haz click aquí</span></p>
                <p className="text-[8px] text-orange-400/90 tracking-[0.3em] uppercase mt-2">Digitalizando en Arica, Chile 🇨🇱</p>
            </a>
        </div>
    );
}
