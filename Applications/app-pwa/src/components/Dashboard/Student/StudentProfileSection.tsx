import React from "react";
import { 
    User, 
    Settings, 
    Camera, 
    Loader2, 
    Check, 
    X, 
    LogOut
} from "lucide-react";
import { updateStudentName } from "@/lib/api";
import AppUpdatesAccordion from "../AppUpdatesAccordion";

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
    appUpdates = []
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

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Guardian Profile Card — compacta */}
            <div className="bg-zinc-900 text-white rounded-[2rem] px-5 py-4 shadow-xl relative overflow-hidden group">
                <div className="relative z-10 flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
                            {guardian.photo ? (
                                <img src={guardian.photo} className="w-full h-full object-cover" alt="Profile" />
                            ) : (
                                <User size={28} className="text-white/40" />
                            )}
                            {isUploadingPhoto && (
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                    <Loader2 className="text-white animate-spin" size={18} />
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={() => profileFileInputRef.current?.click()}
                            className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 text-white rounded-lg flex items-center justify-center shadow-lg border-2 border-zinc-900 transition-transform active:scale-90"
                        >
                            <Camera size={11} />
                        </button>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-400">Apoderado</p>
                        <h2 className="text-base font-black truncate leading-tight">{guardian.name}</h2>
                        <p className="text-[10px] opacity-50 truncate">{guardian.email}</p>
                    </div>
                </div>
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
            </div>

            {/* Students List ("Mis hijos") */}
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-2 ml-1">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Mis {vocab.memberLabel.toLowerCase()}s</h3>
                </div>
                {students.map((student: any) => (
                    <div key={student.id} className="bg-white border border-zinc-100 rounded-[2rem] p-4 flex items-center justify-between group hover:shadow-md transition-all">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="relative shrink-0">
                                <button 
                                    onClick={() => {
                                        studentForPhotoRef.current = String(student.id);
                                        profileFileInputRef.current?.click();
                                    }}
                                    className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center overflow-hidden border border-zinc-100 relative transition-transform active:scale-90"
                                >
                                    {studentPhotoLoadingId === String(student.id) ? (
                                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                                            <Loader2 className="text-orange-500 animate-spin" size={16} />
                                        </div>
                                    ) : student.photo ? (
                                        <img src={student.photo} className="w-full h-full object-cover" alt={student.name} />
                                    ) : (
                                        <User size={20} className="text-zinc-200" />
                                    )}
                                </button>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 text-white rounded-lg flex items-center justify-center shadow-lg border-2 border-white pointer-events-none">
                                    <Camera className="w-3 h-3" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                {editingStudentId === String(student.id) ? (
                                    <div className="flex items-center gap-2">
                                        <input 
                                            autoFocus
                                            value={editingStudentName}
                                            onChange={(e) => setEditingStudentName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateStudentName()}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-sm font-bold focus:outline-none focus:border-zinc-400"
                                        />
                                        <button 
                                            onClick={handleUpdateStudentName}
                                            disabled={savingStudentName}
                                            className="text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors"
                                        >
                                            {savingStudentName ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                        </button>
                                        <button 
                                            onClick={() => setEditingStudentId(null)}
                                            className="text-zinc-400 hover:bg-zinc-50 p-1.5 rounded-lg transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-black text-zinc-900 truncate">{student.name}</p>
                                            <button 
                                                onClick={() => {
                                                    setEditingStudentId(String(student.id));
                                                    setEditingStudentName(student.name);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-zinc-300 hover:text-zinc-600 transition-all"
                                            >
                                                <Settings size={12} />
                                            </button>
                                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{student.category ? (() => { const c = student.category; const l = c.toLowerCase(); if (l === 'prekinder') return 'Pre-Kinder'; if (l === 'kinder') return 'Kinder'; const m = c.match(/^(\d+)_(.+)$/); if (m) return `${m[1]}° ${m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase()}`; return c.replace(/_/g, ' '); })() : vocab.memberLabel}</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

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
