"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Bell, Camera, Loader2 } from "lucide-react";
import { useBranding } from "@/context/BrandingContext";
import NotificationToast from "@/components/Notifications/NotificationToast";
import { StudentQRScanner } from "@/components/Dashboard/Student/StudentQRScanner";
import { ConfirmDialog, ProofModal } from "@/components/Dashboard/Student/StudentUIHelpers";
import { StudentHomeSection } from "@/components/Dashboard/Student/StudentHomeSection";
import { StudentPaymentsSection } from "@/components/Dashboard/Student/StudentPaymentsSection";
import { FeePayModal } from "@/components/Dashboard/Student/StudentPaymentComponents";
import { StudentCalendarSection } from "@/components/Dashboard/Student/StudentCalendarSection";
import { StudentProfileSection } from "@/components/Dashboard/Student/StudentProfileSection";
import { StudentRendicionSection } from "@/components/Dashboard/Student/StudentRendicionSection";
import {
    getProfile,
    resumeSession,
    getNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    deletePaymentProof,
    getExpenses,
    getSchedules,
    getMyFees,
    getAppUpdates,
    submitFeePayment
} from "@/lib/api";
import { nowCL } from "@/lib/utils";
import BottomNav, { NavSection } from "@/components/Navigation/BottomNav";
import { getEcho, reconnect } from "@/lib/echo";
import { unlockAudio, setAppBadge } from "@/lib/audio";
import { subscribeToPush } from "@/lib/push";
import { industryConfig } from "@/lib/constants";

/* ─── Main Dashboard ─── */
export default function StudentDashboard() {
    const { branding, setBranding } = useBranding();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<NavSection>("home");
    // Estado reactivo de industry — inicia desde localStorage, se actualiza con el perfil del servidor
    const [effectiveIndustry, setEffectiveIndustry] = useState<string>(
        () => typeof window !== 'undefined' ? (localStorage.getItem('tenant_industry') || '') : ''
    );


    // Gastos / Rendición
    const [expensesList, setExpensesList] = useState<any[]>([]);
    const [expensesTotal, setExpensesTotal] = useState(0);
    const [expensesBalance, setExpensesBalance] = useState(0);
    const [expensesSummary, setExpensesSummary] = useState<any[]>([]);
    const [expensesLoading, setExpensesLoading] = useState(false);
    const [expenseLightbox, setExpenseLightbox] = useState<string | null>(null);

    // Horario
    const [schedulesList, setSchedulesList] = useState<any[]>([]);

    // QR Scanner
    const [activeScanner, setActiveScanner] = useState<string | null>(null);

    // Fotos
    const profileFileInputRef = useRef<HTMLInputElement>(null);
    const bulkFileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [studentPhotoLoadingId, setStudentPhotoLoadingId] = useState<string | null>(null);
    const studentForPhotoRef = useRef<string | null>(null);

    // Pagos
    const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
    const [paymentTab, setPaymentTab] = useState<"pending" | "history">("pending");
    const [uploadingPayment, setUploadingPayment] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
    const [proofModal, setProofModal] = useState<{ url: string; canDelete: boolean; paymentId: string } | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [copiedBank, setCopiedBank] = useState(false);
    const [myFees, setMyFees] = useState<any[]>([]);
    const [feePayModal, setFeePayModal] = useState<{ fees: any[] } | null>(null);
    const [appUpdates, setAppUpdates] = useState<any[]>([]);

    // Notificaciones
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [toastNotification, setToastNotification] = useState<any>(null);
    const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
    const [showPushModal, setShowPushModal] = useState(false);

    // Edición de nombres de alumnos
    const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
    const [editingStudentName, setEditingStudentName] = useState("");
    const [savingStudentName, setSavingStudentName] = useState(false);

    const refreshDataRef = useRef<() => void>(() => {});

    // ─── Cambio de tenant (multitenancy) ───
    const handleAccountSwitch = (tenant: any) => {
        const availableTenants = localStorage.getItem("available_tenants");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("staff_token");
        localStorage.removeItem("remember_token");
        localStorage.setItem("tenant_id", String(tenant.id));
        localStorage.setItem("tenant_slug", tenant.slug);
        if (availableTenants) localStorage.setItem("available_tenants", availableTenants);
        window.location.href = "/";
    };

    // ─── RefreshData ───
    const refreshData = useCallback(async () => {
        let token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
        const tenantSlug = localStorage.getItem("tenant_slug");

        if (!token && !tenantSlug) return;

        if (!token && tenantSlug) {
            const rememberToken = localStorage.getItem("remember_token");
            if (rememberToken) {
                const resumed = await resumeSession(tenantSlug, rememberToken);
                if (resumed?.token) {
                    token = resumed.token;
                    const key = resumed.user_type === 'staff' ? 'staff_token' : 'auth_token';
                    localStorage.setItem(key, token!);
                }
            }
        }

        if (!token || !tenantSlug) { window.location.href = "/"; return; }

        let profile = await getProfile(tenantSlug, token);

        if (!profile) {
            const rememberToken = localStorage.getItem("remember_token");
            if (rememberToken && tenantSlug) {
                const resumed = await resumeSession(tenantSlug, rememberToken);
                if (resumed?.token) {
                    const newToken = resumed.token;
                    const key = resumed.user_type === 'staff' ? 'staff_token' : 'auth_token';
                    localStorage.setItem(key, newToken);
                    profile = await getProfile(tenantSlug, newToken);
                }
            }
        }

        const notifData = await getNotifications(tenantSlug, token);
        if (notifData?.notifications) setNotifications(notifData.notifications);
        if (notifData?.unread !== undefined) setUnreadCount(notifData.unread);

        if (profile) {
            setData(profile);
            if (profile.tenant) {
                const ind = profile.tenant.industry || '';
                localStorage.setItem('tenant_industry', ind);
                setEffectiveIndustry(ind); // re-render inmediato con industry correcto
                setBranding({
                    id: String(profile.tenant.id),
                    slug: profile.tenant.slug,
                    name: profile.tenant.name,
                    industry: profile.tenant.industry,
                    logo: profile.tenant.logo,
                    primaryColor: profile.tenant.primary_color
                });
            }
        } else {
            window.location.href = "/";
        }
    }, [setBranding]);

    refreshDataRef.current = refreshData;

    // ─── WebSockets ───
    useEffect(() => {
        const key = process.env.NEXT_PUBLIC_REVERB_APP_KEY;
        if (!key || !branding?.slug) return;
        const echo = getEcho();
        if (!echo) return;

        const attChannel = echo.channel(`attendance.${branding.slug}`);
        attChannel.listen('.student.checked-in', () => refreshDataRef.current());
        attChannel.listen('.student.checked-out', () => refreshDataRef.current());
        attChannel.listen('.schedule.updated', (ev: any) => {
            console.log('[WS] 📅 schedule.updated recibido', ev);
            const slug = localStorage.getItem('tenant_slug') || '';
            const tk = localStorage.getItem('auth_token') || localStorage.getItem('staff_token') || '';
            if (slug) getSchedules(slug, tk).then(d => {
                const newList = d?.schedules ?? [];
                console.log('[WS] 📅 horario recargado', newList.length, 'bloques');
                console.log('[WS] 📅 primer bloque:', newList[0]?.subject, newList[0]?.color);
                setSchedulesList(prev => {
                    const kPrev = prev.map((s:any)=>`${s.id}-${s.subject}-${s.color}`).join(',');
                    const kNew  = newList.map((s:any)=>`${s.id}-${s.subject}-${s.color}`).join(',');
                    console.log('[WS] 📅 keys iguales:', kPrev === kNew);
                    if (kPrev !== kNew) console.log('[WS] 📅 DIFF detectado ✅');
                    else console.log('[WS] 📅 SIN DIFF — API devuelve datos viejos ❌');
                    return newList;
                });
            });
        });

        const payChannel = echo.channel(`payments.${branding.slug}`);
        payChannel.listen('.payment.updated', (ev: any) => {
            const guardianId = data?.guardian?.id;
            if (!guardianId || String(ev.payerId) === String(guardianId)) refreshDataRef.current();
        });
        payChannel.listen('.fee.updated', (ev: any) => {
            console.log('[WS] 💰 fee.updated recibido', ev);
            const guardianId = data?.guardian?.id;
            if (!guardianId || String(ev.guardianId) === String(guardianId)) {
                const slug = localStorage.getItem('tenant_slug') || '';
                const tk = localStorage.getItem('auth_token') || '';
                if (slug && tk) getMyFees(slug, tk).then(d => { console.log('[WS] 💰 fees recargadas', d?.fees?.length); setMyFees(d?.fees ?? []); });
            }
        });

        const handleVisibility = () => { if (document.visibilityState === 'visible') { reconnect(); refreshDataRef.current(); } };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            echo.leaveChannel(`attendance.${branding.slug}`);
            echo.leaveChannel(`payments.${branding.slug}`);
        };
    }, [branding?.slug]);

    // ─── Notificaciones WS (canal separado, depende de guardianId) ───
    useEffect(() => {
        const guardianId = data?.guardian?.id;
        if (!guardianId || !branding?.slug) return;
        const echo = getEcho();
        if (!echo) return;

        const channelName = `notifications.${branding.slug}.${guardianId}`;
        const notifChannel = echo.channel(channelName);
        notifChannel.listen('.notification.sent', (ev: any) => {
            setToastNotification({ id: ev.notificationId, title: ev.title, body: ev.body, type: ev.type });
            setUnreadCount(c => c + 1);
            setNotifications(prev => [{ id: ev.notificationId, title: ev.title, body: ev.body, type: ev.type, read: false, created_at: 'Ahora' }, ...prev]);
        });

        return () => {
            notifChannel.stopListening('.notification.sent');
            echo.leaveChannel(channelName);
        };
    }, [branding?.slug, data?.guardian?.id]);

    // ─── Init ───
    useEffect(() => {
        refreshData().then(() => {
            const slug = localStorage.getItem('tenant_slug') || '';
            const freshTk = localStorage.getItem('auth_token') || localStorage.getItem('staff_token') || '';
            Promise.all([
                slug ? getSchedules(slug, freshTk).then(d => setSchedulesList(d?.schedules ?? [])) : Promise.resolve(),
                slug && freshTk ? getMyFees(slug, freshTk).then(d => setMyFees(d?.fees ?? [])) : Promise.resolve(),
                getAppUpdates('student', localStorage.getItem('tenant_industry') || undefined).then(d => setAppUpdates(d?.updates ?? [])),
            ]).then(() => setLoading(false));
        });
    }, []);

    // ─── Unlock Audio ───
    useEffect(() => {
        document.addEventListener('click', unlockAudio, { once: true });
        document.addEventListener('touchstart', unlockAudio, { once: true });
    }, []);

    // ─── App Badge ───
    useEffect(() => { setAppBadge(unreadCount); }, [unreadCount]);

    // ─── SW Messages ───
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'REFRESH_NOTIFICATIONS') refreshData();
        };
        navigator.serviceWorker.addEventListener('message', handleMessage);
        return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
    }, [refreshData]);

    // ─── Push Permissions ───
    useEffect(() => {
        if (typeof Notification === 'undefined') { setPushPermission('denied'); return; }
        const updatePermission = () => {
            const perm = Notification.permission;
            setPushPermission(perm);
            const token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
            if (token && branding?.slug) {
                const dismissed = localStorage.getItem('push_banner_dismissed');
                if (perm === 'default' && !dismissed) {
                    setShowPushModal(true);
                } else {
                    setShowPushModal(false);
                    if (perm === 'granted' && branding?.industry !== 'school_treasury') {
                        subscribeToPush(branding.slug, token);
                    }
                }
            }
        };
        updatePermission();
        document.addEventListener('visibilitychange', updatePermission);
        return () => document.removeEventListener('visibilitychange', updatePermission);
    }, [branding?.slug]);

    // ─── Rendición lazy load ───
    useEffect(() => {
        if (activeSection === 'rendicion' && branding?.slug) {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('staff_token') || '';
            setExpensesLoading(true);
            getExpenses(branding.slug, token).then(data => {
                setExpensesList(data?.expenses ?? []);
                setExpensesTotal(data?.total ?? 0);
                setExpensesBalance(data?.balance ?? 0);
                setExpensesSummary(data?.summary ?? []);
                setExpensesLoading(false);
            });
        }
    }, [activeSection, branding?.slug]);

    // ─── Handlers ───
    const handleActivatePush = () => {
        setShowPushModal(false);
        if (typeof Notification !== 'undefined') {
            Notification.requestPermission().then(permission => {
                setPushPermission(permission);
                const token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
                if (permission === 'granted' && token && branding?.slug && branding?.industry !== 'school_treasury') {
                    subscribeToPush(branding.slug, token);
                }
            });
        }
    };

    const handleUploadProof = async (paymentId: string, file: File) => {
        setUploadingPayment(paymentId);
        const token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
        const tenantSlug = localStorage.getItem("tenant_slug");
        if (!token || !tenantSlug) return;
        const formData = new FormData();
        formData.append("proof", file);
        try {
            const API = process.env.NEXT_PUBLIC_API_URL || "https://admin.digitalizatodo.cl/api";
            const res = await fetch(`${API}/${tenantSlug}/payments/${paymentId}/upload-proof`, {
                method: "POST",
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                body: formData,
            });
            if (res.ok) {
                setUploadSuccess(paymentId);
                setTimeout(() => { setUploadSuccess(null); refreshData(); }, 2000);
            }
        } finally { setUploadingPayment(null); }
    };

    const refreshMyFees = async () => {
        const slug = localStorage.getItem('tenant_slug') || '';
        const tk = localStorage.getItem('auth_token') || localStorage.getItem('staff_token') || '';
        if (slug && tk) { const d = await getMyFees(slug, tk); setMyFees(d?.fees ?? []); }
    };

    const handleDeleteProof = async (paymentId: string) => {
        setConfirmDelete(null);
        setProofModal(null);
        const token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
        const slug = localStorage.getItem("tenant_slug");
        if (!token || !slug) return;
        const result = await deletePaymentProof(slug, token, paymentId);
        if (result) refreshData();
    };

    const handleProfilePhotoUpload = async (file: File) => {
        if (!file) return;
        setIsUploadingPhoto(true);
        const token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
        const tenantSlug = localStorage.getItem("tenant_slug");
        try {
            const API = process.env.NEXT_PUBLIC_API_URL || "https://admin.digitalizatodo.cl/api";
            const formData = new FormData();
            formData.append("photo", file);
            const response = await fetch(`${API}/${tenantSlug}/me/photo`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
                body: formData
            });
            if (response.ok) refreshData();
        } finally { setIsUploadingPhoto(false); }
    };

    const handleBulkUploadProof = async (file: File) => {
        if (selectedPayments.length === 0) return;
        setUploadingPayment("bulk");
        const token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
        const tenantSlug = localStorage.getItem("tenant_slug");
        if (!token || !tenantSlug) return;
        const formData = new FormData();
        formData.append("proof", file);
        selectedPayments.forEach(id => formData.append("payment_ids[]", id));
        try {
            const API = process.env.NEXT_PUBLIC_API_URL || "https://admin.digitalizatodo.cl/api";
            const res = await fetch(`${API}/${tenantSlug}/payments/bulk-upload-proof`, {
                method: "POST",
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                body: formData
            });
            if (res.ok) {
                setUploadSuccess("bulk");
                setSelectedPayments([]);
                setTimeout(() => { setUploadSuccess(null); refreshData(); }, 2000);
            }
        } finally { setUploadingPayment(null); }
    };

    const handleUploadPhoto = async (studentId: string, file: File) => {
        setStudentPhotoLoadingId(studentId);
        const token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
        const tenantSlug = localStorage.getItem("tenant_slug");
        if (!token || !tenantSlug) return;
        const formData = new FormData();
        formData.append("photo", file);
        try {
            const API = process.env.NEXT_PUBLIC_API_URL || "https://admin.digitalizatodo.cl/api";
            const res = await fetch(`${API}/${tenantSlug}/students/${studentId}/photo`, {
                method: "POST",
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                body: formData,
            });
            if (res.ok) refreshData();
        } finally { setStudentPhotoLoadingId(null); }
    };

    // ─── Derived state ───
    const primaryColor = branding?.primaryColor || "#f97316";
    // effectiveIndustry es un estado reactivo: inicia desde localStorage y se actualiza con el perfil del servidor
    const isSchoolTreasury = effectiveIndustry === 'school_treasury';
    const industry = effectiveIndustry;
    const guardian = data?.guardian || { name: "Usuario", email: "", phone: "" };
    const students = data?.students || [];
    const paymentHistory = data?.payment_history || [];
    const bankInfo = data?.bank_info;
    const totalDue = data?.total_due || 0;
    const hasPendingReview = students.some((s: any) => (s.payments || []).some((p: any) => p.status === 'pending_review'));
    const totalDueOrReview = totalDue > 0 || hasPendingReview;
    const vocab = industryConfig[industry] || industryConfig.default;

    // ─── Loading skeleton ───
    if (loading) return (
        <div className="min-h-screen bg-stone-50 px-4 pt-6 pb-32 max-w-lg mx-auto space-y-4 animate-pulse">
            <div className="flex items-center justify-between mb-2">
                <div className="space-y-2">
                    <div className="h-7 w-36 bg-zinc-200 rounded-xl" />
                    <div className="h-3 w-48 bg-zinc-100 rounded-lg" />
                </div>
                <div className="w-14 h-14 bg-zinc-200 rounded-full" />
            </div>
            <div className="h-36 bg-zinc-200 rounded-[2.5rem]" />
            <div className="h-4 w-32 bg-zinc-100 rounded-lg" />
            <div className="h-24 bg-zinc-100 rounded-[2rem]" />
            <div className="h-24 bg-zinc-100 rounded-[2rem]" />
        </div>
    );

    return (
        <div className="min-h-screen bg-stone-50 overflow-x-hidden font-sans pb-32">
            <NotificationToast notification={toastNotification} onDismiss={() => setToastNotification(null)} />

            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 fixed top-0 left-0 right-0 bg-stone-50/80 backdrop-blur-md z-[80] border-b border-zinc-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-zinc-100 flex items-center justify-center shadow-sm">
                        {branding?.logo ? (
                            <img src={branding.logo} className="w-full h-full object-cover" alt="L" />
                        ) : (
                            <span className="font-black text-xl uppercase tracking-tighter text-zinc-950">{branding?.name?.[0] || 'D'}</span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-black uppercase tracking-tighter text-zinc-950 leading-none">{branding?.name || 'Academy'}</h1>
                            <button onClick={() => setShowPushModal(true)} className="shrink-0 mt-0.5">
                                <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm transition-colors duration-500 ${
                                    pushPermission === 'granted' ? 'bg-emerald-500 animate-pulse' :
                                    pushPermission === 'denied'  ? 'bg-red-500' : 'bg-amber-400'
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
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative w-10 h-10 flex items-center justify-center rounded-full border border-zinc-100 shadow-sm bg-white">
                    <Bell size={20} className="text-zinc-600" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                </button>
            </header>

            {/* Notification Dropdown */}
            {showNotifications && (
                <div className="fixed inset-0 z-[100]" onClick={() => setShowNotifications(false)}>
                    <div className="absolute top-16 right-2 w-80 max-h-96 bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-zinc-50 flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Notificaciones</span>
                            {unreadCount > 0 && (
                                <button onClick={async () => {
                                    const tk = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
                                    const sl = localStorage.getItem("tenant_slug");
                                    if (tk && sl) { await markAllNotificationsRead(sl, tk); setUnreadCount(0); setNotifications(n => n.map(x => ({ ...x, read: true }))); }
                                }} className="text-[9px] font-black text-zinc-400 hover:text-zinc-600">Marcar leídas</button>
                            )}
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                            {notifications.length > 0 ? notifications.map((n: any) => (
                                <div key={n.id}
                                    onClick={async () => {
                                        if (!n.read) {
                                            const tk = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
                                            const sl = localStorage.getItem("tenant_slug");
                                            if (tk && sl) markNotificationRead(sl, tk, n.id);
                                            setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
                                            setUnreadCount(c => Math.max(0, c - 1));
                                        }
                                        if (n.type === 'attendance') setActiveSection('calendar');
                                        else if (n.type === 'payment') setActiveSection('payments');
                                        setShowNotifications(false);
                                    }}
                                    className={`p-4 border-b border-zinc-50 cursor-pointer hover:bg-zinc-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-zinc-200'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-zinc-800 truncate">{n.title}</p>
                                            <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{n.body}</p>
                                            <p className="text-[9px] text-zinc-300 mt-1">{n.created_at}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-zinc-300 text-xs">Sin notificaciones</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="px-2 md:px-8 pt-20">
                {activeSection === "home" && (
                    <StudentHomeSection
                        guardian={guardian}
                        isSchoolTreasury={isSchoolTreasury}
                        branding={branding}
                        totalDueOrReview={totalDueOrReview}
                        hasPendingReview={hasPendingReview}
                        totalDue={totalDue}
                        setActiveSection={setActiveSection}
                        myFees={myFees}
                        schedulesList={schedulesList}
                        primaryColor={primaryColor}
                        students={students}
                        isUploadingPhoto={isUploadingPhoto}
                        studentPhotoLoadingId={studentPhotoLoadingId}
                        studentForPhotoRef={studentForPhotoRef}
                        profileFileInputRef={profileFileInputRef}
                        setActiveScanner={setActiveScanner}
                        vocab={vocab}
                    />
                )}
                {activeSection === "calendar" && (
                    <StudentCalendarSection
                        branding={branding}
                        schedulesList={schedulesList}
                        students={students}
                        primaryColor={primaryColor}
                        isSchoolTreasury={isSchoolTreasury}
                    />
                )}
                {activeSection === "payments" && (
                    <StudentPaymentsSection
                        paymentTab={paymentTab}
                        setPaymentTab={setPaymentTab}
                        bankInfo={bankInfo}
                        copiedBank={copiedBank}
                        setCopiedBank={setCopiedBank}
                        selectedPayments={selectedPayments}
                        setSelectedPayments={setSelectedPayments}
                        uploadingPayment={uploadingPayment}
                        bulkFileInputRef={bulkFileInputRef as any}
                        myFees={myFees}
                        setFeePayModal={setFeePayModal}
                        students={students}
                        primaryColor={primaryColor}
                        uploadSuccess={uploadSuccess}
                        handleUploadProof={handleUploadProof}
                        setProofModal={setProofModal}
                        setConfirmDelete={setConfirmDelete}
                        handleBulkUploadProof={handleBulkUploadProof}
                        paymentHistory={paymentHistory}
                        vocab={vocab}
                    />
                )}
                {activeSection === "profile" && (
                    <StudentProfileSection
                        guardian={guardian}
                        primaryColor={primaryColor}
                        isUploadingPhoto={isUploadingPhoto}
                        profileFileInputRef={profileFileInputRef as any}
                        students={students}
                        editingStudentId={editingStudentId}
                        setEditingStudentId={setEditingStudentId}
                        editingStudentName={editingStudentName}
                        setEditingStudentName={setEditingStudentName}
                        savingStudentName={savingStudentName}
                        setSavingStudentName={setSavingStudentName}
                        refreshData={refreshData}
                        studentPhotoLoadingId={studentPhotoLoadingId}
                        handleUploadPhoto={(id: string, file: File) => handleUploadPhoto(id, file)}
                        studentForPhotoRef={studentForPhotoRef}
                        setActiveSection={setActiveSection}
                        setPaymentTab={setPaymentTab}
                        vocab={vocab}
                        onAccountSwitch={handleAccountSwitch}
                        isSchoolTreasury={isSchoolTreasury}
                        appUpdates={appUpdates}
                    />
                )}
                {activeSection === "rendicion" && (
                    <StudentRendicionSection
                        expensesTotal={expensesTotal}
                        expensesBalance={expensesBalance}
                        expensesList={expensesList}
                        expensesSummary={expensesSummary}
                        expensesLoading={expensesLoading}
                        setExpenseLightbox={setExpenseLightbox}
                    />
                )}
            </main>

            {/* Bottom Nav */}
            <BottomNav
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                primaryColor={primaryColor}
                userPhoto={guardian.photo}
                userName={guardian.name}
                industry={industry}
            />

            {/* Modals */}
            {activeScanner && (
                <StudentQRScanner
                    studentId={activeScanner}
                    primaryColor={primaryColor}
                    onComplete={() => { setActiveScanner(null); refreshData(); }}
                    onCancel={() => setActiveScanner(null)}
                />
            )}
            {feePayModal && (
                <FeePayModal
                    fees={feePayModal.fees}
                    onClose={() => setFeePayModal(null)}
                    onSuccess={refreshMyFees}
                    submitFeePayment={submitFeePayment}
                />
            )}
            {proofModal && (
                <ProofModal
                    url={proofModal.url}
                    canDelete={proofModal.canDelete}
                    onClose={() => setProofModal(null)}
                    onDelete={() => setConfirmDelete(proofModal.paymentId)}
                />
            )}
            {confirmDelete && (
                <ConfirmDialog
                    title="¿Eliminar comprobante?"
                    message="Se eliminará la imagen y el pago volverá a estado pendiente."
                    onConfirm={() => handleDeleteProof(confirmDelete)}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}

            {/* Push Modal */}
            {showPushModal && (
                <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-end justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowPushModal(false)}>
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
                        <h3 className="text-sm font-black uppercase tracking-tighter text-zinc-900 mb-2">Activar Alertas de Seguridad 🔔</h3>
                        <p className="text-xs text-zinc-500 leading-relaxed mb-6 font-medium">Es fundamental que actives las notificaciones para avisarte en tiempo real cuando el {vocab.memberLabel.toLowerCase()} ingrese al {vocab.placeLabel.toLowerCase()}.</p>
                        <button onClick={handleActivatePush} style={{ backgroundColor: primaryColor }} className="w-full py-4 rounded-2xl text-white font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all">Activar notificaciones</button>
                        <button onClick={() => setShowPushModal(false)} className="w-full py-3 text-zinc-400 font-black text-[9px] uppercase tracking-widest mt-2">Cerrar</button>
                    </div>
                </div>
            )}

            {/* Photo Input */}
            <input
                type="file"
                ref={profileFileInputRef}
                style={{ opacity: 0, position: 'absolute', pointerEvents: 'none', width: 0, height: 0 }}
                accept="image/*"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        if (studentForPhotoRef.current) handleUploadPhoto(studentForPhotoRef.current, file);
                        else handleProfilePhotoUpload(file);
                    }
                    studentForPhotoRef.current = null;
                }}
            />

            {/* Lightbox gastos */}
            {expenseLightbox && (
                <div className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-4" onClick={() => setExpenseLightbox(null)}>
                    <img src={expenseLightbox} className="max-w-full max-h-full rounded-2xl object-contain" alt="Gasto" />
                </div>
            )}
        </div>
    );
}
