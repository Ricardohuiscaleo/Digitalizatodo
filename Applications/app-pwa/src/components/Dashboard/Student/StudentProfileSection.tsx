import React from "react";
import { 
    User, 
    Settings, 
    ChevronRight, 
    Camera, 
    Loader2, 
    Check, 
    X, 
    ShieldCheck, 
    LogOut, 
    AlertCircle,
    CreditCard
} from "lucide-react";
import { updateStudentName } from "@/lib/api";
import { AccountSwitcher } from "../AccountSwitcher";

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
    isSchoolTreasury = false
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
            {/* Guardian Profile Card */}
            <div className="bg-zinc-900 text-white rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden group">
                <div className="relative z-10 flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                        <div className="w-20 h-20 rounded-[2rem] bg-white/10 flex items-center justify-center overflow-hidden border border-white/20 backdrop-blur-md">
                            {guardian.photo ? (
                                <img src={guardian.photo} className="w-full h-full object-cover" alt="Profile" />
                            ) : (
                                <User size={40} className="text-white/40" />
                            )}
                            {isUploadingPhoto && (
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                    <Loader2 className="text-white animate-spin" size={24} />
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={() => profileFileInputRef.current?.click()}
                            className="absolute -bottom-1 -right-1 w-8 h-8 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-zinc-900 transition-transform hover:scale-110 active:scale-90"
                        >
                            <Camera size={14} />
                        </button>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 mb-1">Apoderado</p>
                        <h2 className="text-xl font-black truncate">{guardian.name}</h2>
                        <p className="text-xs opacity-60 truncate font-medium">{guardian.email}</p>
                    </div>
                </div>
                <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all" />
            </div>

            {/* Students List ("Mis hijos") */}
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-2 ml-1">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Mis {vocab.memberLabel.toLowerCase()}s</h3>
                </div>
                {students.map((student: any) => (
                    <div key={student.id} className="bg-white border border-zinc-100 rounded-[2rem] p-4 flex items-center justify-between group hover:shadow-md transition-all">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <button 
                                onClick={() => {
                                    studentForPhotoRef.current = String(student.id);
                                    profileFileInputRef.current?.click();
                                }}
                                className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center overflow-hidden border border-zinc-100 relative group/photo shrink-0 transition-transform active:scale-90"
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
                                <div className="absolute inset-0 bg-black/0 group-hover/photo:bg-black/20 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-all">
                                    <Camera size={14} className="text-white" />
                                </div>
                            </button>
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
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{student.category || vocab.memberLabel}</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-zinc-100 rounded-3xl p-2">
                {isSchoolTreasury ? (
                    <>
                        <button
                            onClick={() => setActiveSection("payments")}
                            className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 rounded-2xl transition-all group"
                        >
                            <div className="flex items-center gap-4 text-zinc-500 group-hover:text-zinc-900 transition-colors">
                                <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center">
                                    <CreditCard size={20} />
                                </div>
                                <span className="font-black text-sm">Mis {vocab.cat1}s</span>
                            </div>
                            <ChevronRight size={18} className="text-zinc-300 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <div className="h-px bg-zinc-50 mx-4" />
                        <button
                            onClick={() => setActiveSection("calendar")}
                            className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 rounded-2xl transition-all group"
                        >
                            <div className="flex items-center gap-4 text-zinc-500 group-hover:text-zinc-900 transition-colors">
                                <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center">
                                    <ShieldCheck size={20} />
                                </div>
                                <span className="font-black text-sm">Horario</span>
                            </div>
                            <ChevronRight size={18} className="text-zinc-300 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <div className="h-px bg-zinc-50 mx-4" />
                        <button
                            onClick={() => setActiveSection("rendicion")}
                            className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 rounded-2xl transition-all group"
                        >
                            <div className="flex items-center gap-4 text-zinc-500 group-hover:text-zinc-900 transition-colors">
                                <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center">
                                    <AlertCircle size={20} />
                                </div>
                                <span className="font-black text-sm">Rendición</span>
                            </div>
                            <ChevronRight size={18} className="text-zinc-300 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => setActiveSection("calendar")}
                            className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 rounded-2xl transition-all group"
                        >
                            <div className="flex items-center gap-4 text-zinc-500 group-hover:text-zinc-900 transition-colors">
                                <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center">
                                    <ShieldCheck size={20} />
                                </div>
                                <span className="font-black text-sm">Historial de {vocab.attendance}</span>
                            </div>
                            <ChevronRight size={18} className="text-zinc-300 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <div className="h-px bg-zinc-50 mx-4" />
                        <button
                            onClick={() => { setActiveSection("payments"); setPaymentTab("history"); }}
                            className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 rounded-2xl transition-all group"
                        >
                            <div className="flex items-center gap-4 text-zinc-500 group-hover:text-zinc-900 transition-colors">
                                <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center">
                                    <CreditCard size={20} />
                                </div>
                                <span className="font-black text-sm">Historial de Pagos</span>
                            </div>
                            <ChevronRight size={18} className="text-zinc-300 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </>
                )}
                <div className="h-px bg-zinc-50 mx-4" />
                <button
                    onClick={() => {
                        localStorage.removeItem("auth_token");
                        localStorage.removeItem("staff_token");
                        localStorage.removeItem("remember_token");
                        window.location.href = "/";
                    }}
                    className="w-full flex items-center justify-between p-4 hover:bg-rose-50 rounded-2xl transition-all group text-rose-500"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                            <LogOut size={20} />
                        </div>
                        <span className="font-black text-sm">Cerrar Sesión</span>
                    </div>
                    <ChevronRight size={18} className="text-rose-200 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            <AccountSwitcher 
                currentTenantId={localStorage.getItem("tenant_id") || ""} 
                onSwitch={onAccountSwitch} 
            />

            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 flex gap-3 italic">
                <ShieldCheck className="text-orange-500 shrink-0" size={20} />
                <p className="text-[10px] text-orange-800 leading-relaxed">
                    Tu cuenta está protegida con encriptación de extremo a extremo. Los datos son privados y solo accesibles para ti y la administración del {vocab.placeLabel.toLowerCase()}.
                </p>
            </div>
        </div>
    );
}
