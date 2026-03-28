"use client";
// Payments Refactor 🥋💳🔘

import React, { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import NotificationToast from "@/components/Notifications/NotificationToast";
import { StudentQRScanner } from "@/components/Dashboard/Student/StudentQRScanner";
import { ConfirmDialog, ProofModal } from "@/components/Dashboard/Student/StudentUIHelpers";
import { FeePayModal } from "@/components/Dashboard/Student/StudentPaymentComponents";
import { StudentCalendarSection } from "@/components/Dashboard/Student/StudentCalendarSection";
import { StudentProfileSection } from "@/components/Dashboard/Student/StudentProfileSection";
import { StudentRendicionSection } from "@/components/Dashboard/Student/StudentRendicionSection";
import BottomNav, { NavSection } from "@/components/Navigation/BottomNav";

// Industry Components
import { HomeTreasury } from "@/components/Dashboard/Student/Industries/SchoolTreasury/HomeTreasury";
import { PaymentsTreasury } from "@/components/Dashboard/Student/Industries/SchoolTreasury/PaymentsTreasury";
import { HomeMartialArts } from "@/components/Dashboard/Student/Industries/MartialArts/HomeMartialArts";
import { PaymentsMartialArts } from "@/components/Dashboard/Student/Industries/MartialArts/PaymentsMartialArts";

// Hooks
import { useStudentCommon } from "@/hooks/useStudentCommon";
import { useStudentTreasuryData } from "@/hooks/useStudentTreasuryData";
import { useStudentMartialArtsData } from "@/hooks/useStudentMartialArtsData";

import { useRealtimeChannel, useRealtimeVisibility } from "@/hooks/useRealtimeChannel";
import { unlockAudio } from "@/lib/audio";
import { industryConfig } from "@/lib/constants";
import { nowCL } from "@/lib/utils";
import { buyConsumablePack } from "@/lib/api";

export default function StudentDashboard() {
    const common = useStudentCommon();
    const [activeSection, setActiveSection] = useState<NavSection>("home");
    const [isDark, setIsDark] = useState(false);
    
    const slug = common.branding?.slug;
    const token = typeof window !== 'undefined' ? (localStorage.getItem("auth_token") || localStorage.getItem("staff_token")) : null;
    
    const treasury = useStudentTreasuryData(slug, token);
    const martialArts = useStudentMartialArtsData(slug, token);

    // Common states for UI helpers
    const [proofModal, setProofModal] = useState<{ url: string; canDelete: boolean; paymentId: string } | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [paymentTab, setPaymentTab] = useState<"pending" | "upgrade" | "history">("pending");
    const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
    const [uploadingPayment, setUploadingPayment] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
    const [copiedBank, setCopiedBank] = useState(false);
    const [expenseLightbox, setExpenseLightbox] = useState<string | null>(null);

    const handleBuyPack = async (studentId: string, type: string, file?: File) => {
        if (!slug || !token) return;
        
        let res;
        if (file) {
            // Es un upgrade de plan con comprobante
            const { buyPlanWithProof } = await import("@/lib/api");
            res = await buyPlanWithProof(slug, token, studentId, type, file);
        } else {
            // Es la compra de un consumible (legacy o sin comprobante inmediato)
            res = await buyConsumablePack(slug, token, studentId, type);
        }

        if (res && (res.payment || res.status)) {
            common.refreshData();
            setPaymentTab("history"); // Mover al historial para ver el estado "En Revisión"
            common.setToastNotification({
                id: Date.now().toString(),
                title: "¡Recibido!",
                body: "Tu comprobante está en revisión. Lo validaremos a la brevedad.",
                type: "payment"
            });
        }
    };
    
    // Refs for file inputs
    const profileFileInputRef = useRef<HTMLInputElement>(null);
    const bulkFileInputRef = useRef<HTMLInputElement>(null);
    const studentForPhotoRef = useRef<string | null>(null);

    // ─── Real-time ───
    useRealtimeVisibility(() => common.refreshData());

    useRealtimeChannel(`attendance.${slug}`, {
        'student.checked-in': () => common.refreshData(),
        'student.checked-out': () => common.refreshData(),
        'schedule.updated': () => martialArts.refreshSchedules(),
    }, !!slug);

    useRealtimeChannel(`payments.${slug}`, {
        'payment.updated': (ev: any) => {
            const guardianId = common.data?.guardian?.id;
            if (!guardianId || String(ev.payerId) === String(guardianId)) common.refreshData();
        },
        'fee.updated': () => treasury.refreshMyFees(),
        'expense.updated': () => {
            if (activeSection === 'rendicion') treasury.loadExpenses();
        },
    }, !!slug);

    useRealtimeChannel(
        `notifications.${slug}.${common.data?.guardian?.id}`,
        {
            'notification.sent': (ev: any) => {
                common.setToastNotification({ id: ev.notificationId, title: ev.title, body: ev.body, type: ev.type });
                common.setUnreadCount(c => c + 1);
                common.setNotifications(prev => [{ id: ev.notificationId, title: ev.title, body: ev.body, type: ev.type, read: false, created_at: 'Ahora' }, ...prev]);
            },
        },
        !!slug && !!common.data?.guardian?.id
    );

    // ─── Initialization ───
    useEffect(() => {
        common.refreshData().then(() => {
            // The specialized hooks will now react to slug/token changes and load themselves
            common.setLoading(false);
        });
    }, []);

    // ─── Audio ───
    useEffect(() => {
        document.addEventListener('click', unlockAudio, { once: true });
        document.addEventListener('touchstart', unlockAudio, { once: true });
    }, []);

    // ─── Rendición lazy load ───
    useEffect(() => {
        if (activeSection === 'rendicion' && slug) {
            treasury.loadExpenses();
        }
    }, [activeSection, slug]);

    // ─── Handlers ───
    const handleUploadProof = async (paymentId: string, file: File) => {
        setUploadingPayment(paymentId);
        if (!token || !slug) return;
        
        const isFee = paymentId.startsWith('fee-');
        const cleanId = isFee ? paymentId.replace('fee-', '') : paymentId;
        
        const formData = new FormData();
        formData.append("proof", file);
        try {
            const API = process.env.NEXT_PUBLIC_API_URL || "https://admin.digitalizatodo.cl/api";
            // Usar endpoint de cuotas o de pagos genéricos según prefijo
            const endpoint = isFee ? `fees/${cleanId}/upload-proof` : `payments/${cleanId}/upload-proof`;
            
            const res = await fetch(`${API}/${slug}/${endpoint}`, {
                method: "POST",
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                body: formData,
            });
            if (res.ok) {
                setUploadSuccess(paymentId);
                setTimeout(() => { 
                    setUploadSuccess(null); 
                    common.refreshData();
                    if (isFee) treasury.refreshMyFees();
                }, 2000);
            }
        } finally { setUploadingPayment(null); }
    };

    const handleBulkUploadProof = async (file: File) => {
        if (selectedPayments.length === 0) return;
        setUploadingPayment("bulk");
        if (!token || !slug) return;
        const formData = new FormData();
        formData.append("proof", file);
        selectedPayments.forEach(id => formData.append("payment_ids[]", id));
        try {
            const API = process.env.NEXT_PUBLIC_API_URL || "https://admin.digitalizatodo.cl/api";
            const res = await fetch(`${API}/${slug}/payments/bulk-upload-proof`, {
                method: "POST",
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                body: formData
            });
            if (res.ok) {
                setUploadSuccess("bulk");
                setSelectedPayments([]);
                setTimeout(() => { setUploadSuccess(null); common.refreshData(); }, 2000);
            }
        } finally { setUploadingPayment(null); }
    };

    const handleDeleteProof = async (paymentId: string) => {
        const isFee = (common.data?.payment_history || []).find((p: any) => String(p.id) === String(paymentId))?.is_fee;
        setConfirmDelete(null);
        setProofModal(null);
        if (isFee) await treasury.handleDeleteFeeProof(paymentId);
        else await martialArts.handleGenericPaymentProofDelete(paymentId);
        common.refreshData();
    };

    const isSchoolTreasury = common.effectiveIndustry === 'school_treasury';
    const primaryColor = common.branding?.primaryColor || "#f97316";
    const vocab = industryConfig[common.effectiveIndustry] || industryConfig.default;
    const guardian = common.data?.guardian || { name: "Usuario", photo: null };
    const students = common.data?.students || [];

    if (common.loading) return (
        <div className="min-h-screen bg-stone-50 px-4 pt-6 pb-32 max-w-lg mx-auto space-y-4 animate-pulse">
            <div className="flex items-center justify-between mb-2">
                <div className="space-y-2">
                    <div className="h-7 w-36 bg-zinc-200 rounded-xl" />
                    <div className="h-3 w-48 bg-zinc-100 rounded-lg" />
                </div>
                <div className="w-14 h-14 bg-zinc-200 rounded-full" />
            </div>
            <div className="h-36 bg-zinc-200 rounded-[2.5rem]" />
        </div>
    );

    return (
        <div className={`min-h-screen overflow-x-hidden font-sans pb-32 transition-colors duration-500 ${
            isDark ? 'bg-[#09090b]' : 'bg-stone-50'
        }`}>
            <NotificationToast notification={common.toastNotification} onDismiss={() => common.setToastNotification(null)} />

            {/* Header */}
            <header className={`flex items-center justify-between px-6 py-4 fixed top-0 left-0 right-0 backdrop-blur-md z-[80] border-b transition-colors duration-500 ${
                isDark ? 'bg-zinc-950/80 border-zinc-800' : 'bg-stone-50/80 border-zinc-100'
            }`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-zinc-100 flex items-center justify-center shadow-sm">
                        {common.branding?.logo ? (
                            <img src={common.branding.logo} className="w-full h-full object-cover" alt="L" />
                        ) : (
                            <span className="font-black text-xl uppercase tracking-tighter text-zinc-950">{common.branding?.name?.[0] || 'D'}</span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h1 className={`text-lg font-black uppercase tracking-tighter leading-none ${
                                isDark ? 'text-white' : 'text-zinc-950'
                            }`}>{common.branding?.name || 'Academy'}</h1>
                            <button onClick={() => common.setShowPushModal(true)} className="shrink-0 mt-0.5">
                                <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm transition-colors duration-500 ${
                                    common.pushPermission === 'granted' ? 'bg-emerald-500 animate-pulse' :
                                    common.pushPermission === 'denied'  ? 'bg-red-500' : 'bg-amber-400'
                                }`} />
                            </button>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest mt-0.5" style={{ color: primaryColor }}>
                            {activeSection === 'home' ? 'Inicio' :
                             activeSection === 'calendar' ? (isSchoolTreasury ? 'Horario' : 'Asistencia') :
                             activeSection === 'payments' ? (isSchoolTreasury ? 'Cuotas' : 'Pagos') :
                             activeSection === 'rendicion' ? 'Rendición' : 'Perfil'}
                        </span>
                    </div>
                </div>
                <button onClick={() => common.setShowNotifications(!common.showNotifications)} className="relative w-10 h-10 flex items-center justify-center rounded-full border border-zinc-100 shadow-sm bg-white">
                    <Bell size={20} className="text-zinc-600" />
                    {common.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{common.unreadCount > 9 ? '9+' : common.unreadCount}</span>
                    )}
                </button>
            </header>

            {/* Notifications */}
            {common.showNotifications && (
                <div className="fixed inset-0 z-[100]" onClick={() => common.setShowNotifications(false)}>
                    <div className="absolute top-16 right-2 w-80 max-h-96 bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-zinc-50 flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Notificaciones</span>
                            {common.unreadCount > 0 && <button onClick={common.markAllRead} className="text-[9px] font-black text-zinc-400 hover:text-zinc-600">Marcar leídas</button>}
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                            {common.notifications.length > 0 ? common.notifications.map((n: any) => (
                                <div key={n.id} onClick={() => { if (!n.read) common.markRead(n.id); if (n.type === 'attendance') setActiveSection('calendar'); else if (n.type === 'payment') setActiveSection('payments'); common.setShowNotifications(false); }}
                                    className={`p-4 border-b border-zinc-50 cursor-pointer hover:bg-zinc-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-zinc-200'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-zinc-800 truncate">{n.title}</p>
                                            <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{n.body}</p>
                                            <p className="text-[9px] text-zinc-300 mt-1">{n.created_at}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : <div className="p-8 text-center text-zinc-300 text-xs">Sin notificaciones</div>}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="px-2 md:px-8 pt-20">
                {activeSection === "home" && (
                    isSchoolTreasury ? (
                        <HomeTreasury guardian={guardian} branding={common.branding} myFees={treasury.myFees} schedulesList={martialArts.schedulesList} primaryColor={primaryColor} students={students} setActiveSection={setActiveSection} vocab={vocab} />
                    ) : (
                        <HomeMartialArts 
                            guardian={guardian} 
                            branding={common.branding} 
                            totalDueOrReview={common.data?.total_due > 0 || students.some((s:any)=> (s.payments||[]).some((p:any)=>p.status==='pending_review'))} 
                            hasPendingReview={students.some((s:any)=> (s.payments||[]).some((p:any)=>p.status==='pending_review'))} 
                            totalDue={common.data?.total_due || 0} 
                            setActiveSection={setActiveSection} 
                            schedulesList={martialArts.schedulesList} 
                            primaryColor={primaryColor} 
                            students={students} 
                            isUploadingPhoto={common.isUploadingPhoto} 
                            studentPhotoLoadingId={common.studentPhotoLoadingId} 
                            studentForPhotoRef={studentForPhotoRef} 
                            profileFileInputRef={profileFileInputRef as any} 
                            setActiveScanner={martialArts.setActiveScanner} 
                            vocab={vocab}
                            isDark={isDark}
                        />
                    )
                )}
                
                {activeSection === "calendar" && (
                    <StudentCalendarSection branding={common.branding} schedulesList={martialArts.schedulesList} students={students} primaryColor={primaryColor} isSchoolTreasury={isSchoolTreasury} />
                )}

                {activeSection === "payments" && (
                    isSchoolTreasury ? (
                        <PaymentsTreasury paymentTab={paymentTab} setPaymentTab={setPaymentTab} bankInfo={common.data?.bank_info} copiedBank={copiedBank} setCopiedBank={setCopiedBank} selectedPayments={selectedPayments} setSelectedPayments={setSelectedPayments} uploadingPayment={uploadingPayment} bulkFileInputRef={bulkFileInputRef as any} myFees={treasury.myFees} setFeePayModal={treasury.setFeePayModal} students={students} primaryColor={primaryColor} uploadSuccess={uploadSuccess} handleUploadProof={handleUploadProof} setProofModal={setProofModal} setConfirmDelete={setConfirmDelete} handleBulkUploadProof={handleBulkUploadProof} paymentHistory={common.data?.payment_history || []} vocab={vocab} />
                    ) : (
                        <PaymentsMartialArts paymentTab={paymentTab} setPaymentTab={setPaymentTab} bankInfo={common.data?.bank_info} copiedBank={copiedBank} setCopiedBank={setCopiedBank} selectedPayments={selectedPayments} setSelectedPayments={setSelectedPayments} uploadingPayment={uploadingPayment} bulkFileInputRef={bulkFileInputRef as any} myFees={treasury.myFees} plans={martialArts.plans} students={students} primaryColor={primaryColor} uploadSuccess={uploadSuccess} handleUploadProof={handleUploadProof} setProofModal={setProofModal} setConfirmDelete={setConfirmDelete} handleBulkUploadProof={handleBulkUploadProof} paymentHistory={common.data?.payment_history || []} vocab={vocab} onBuyPack={handleBuyPack} />
                    )
                )}

                {activeSection === "profile" && (
                    <StudentProfileSection 
                        guardian={guardian} 
                        primaryColor={primaryColor} 
                        isUploadingPhoto={common.isUploadingPhoto} 
                        profileFileInputRef={profileFileInputRef as any} 
                        students={students} 
                        editingStudentId={null} 
                        setEditingStudentId={()=>{}} 
                        editingStudentName={""} 
                        setEditingStudentName={()=>{}} 
                        savingStudentName={false} 
                        setSavingStudentName={()=>{}} 
                        refreshData={common.refreshData} 
                        studentPhotoLoadingId={common.studentPhotoLoadingId} 
                        handleUploadPhoto={common.handleUploadPhoto} 
                        studentForPhotoRef={studentForPhotoRef} 
                        setActiveSection={setActiveSection} 
                        setPaymentTab={setPaymentTab} 
                        vocab={vocab} 
                        onAccountSwitch={common.handleAccountSwitch} 
                        isSchoolTreasury={isSchoolTreasury} 
                        appUpdates={common.appUpdates}
                        isDark={isDark}
                        onToggleDark={() => setIsDark(d => !d)}
                    />
                )}

                {activeSection === "rendicion" && (
                    <StudentRendicionSection expensesTotal={treasury.expensesTotal} expensesBalance={treasury.expensesBalance} expensesList={treasury.expensesList} expensesSummary={treasury.expensesSummary} expensesLoading={treasury.expensesLoading} setExpenseLightbox={setExpenseLightbox} />
                )}
            </main>

            <BottomNav activeSection={activeSection} setActiveSection={setActiveSection} primaryColor={primaryColor} userPhoto={guardian.photo} userName={guardian.name} industry={common.effectiveIndustry} />

            {/* Modal Logic */}
            {martialArts.activeScanner && (
                <StudentQRScanner 
                    studentId={martialArts.activeScanner} 
                    primaryColor={primaryColor} 
                    hasCredits={(students.find((s: any) => String(s.id) === String(martialArts.activeScanner))?.consumable_credits || 0) > 0}
                    onComplete={() => { martialArts.setActiveScanner(null); common.refreshData(); }} 
                    onCancel={() => martialArts.setActiveScanner(null)} 
                />
            )}
            {treasury.feePayModal && <FeePayModal fees={treasury.feePayModal.fees} onClose={() => treasury.setFeePayModal(null)} onSuccess={treasury.refreshMyFees} submitFeePayment={treasury.submitFeePayment} />}
            {proofModal && <ProofModal url={proofModal.url} canDelete={proofModal.canDelete} onClose={() => setProofModal(null)} onDelete={() => setConfirmDelete(proofModal.paymentId)} />}
            {confirmDelete && <ConfirmDialog title="¿Eliminar comprobante?" message="Se eliminará la imagen y el pago volverá a estado pendiente." onConfirm={() => handleDeleteProof(confirmDelete)} onCancel={() => setConfirmDelete(null)} />}
            
            {/* Expense Lightbox */}
            {expenseLightbox && (
                <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setExpenseLightbox(null)}>
                    <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setExpenseLightbox(null)} className="absolute -top-12 right-0 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white border border-white/20 active:scale-95">
                            <X size={18} />
                        </button>
                        <img src={expenseLightbox} className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
                    </div>
                </div>
            )}
            
            {common.showPushModal && (
                <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-end justify-center p-4" onClick={() => common.setShowPushModal(false)}>
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 text-center" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-black">{isSchoolTreasury ? 'Mantente al día' : 'Alertas en tiempo real'}</h3>
                        <p className="text-xs text-zinc-500 my-2">Activa las notificaciones push para recibir noticias importantes.</p>
                        <button onClick={common.handleActivatePush} style={{ backgroundColor: primaryColor }} className="w-full py-4 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] mb-2">Activar ahora</button>
                        <button onClick={() => common.setShowPushModal(false)} className="w-full py-3 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Ahora no</button>
                    </div>
                </div>
            )}

            <input 
                type="file" 
                ref={profileFileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => { 
                    const file = e.target.files?.[0]; 
                    if (!file) return;
                    
                    if (studentForPhotoRef.current) {
                        // Es una foto de alumno
                        common.handleUploadPhoto(studentForPhotoRef.current, file);
                    } else {
                        // Es la foto del perfil (guardian)
                        common.handleProfilePhotoUpload(file);
                    }
                    // Reset input
                    e.target.value = '';
                }} 
            />
        </div>
    );
}
