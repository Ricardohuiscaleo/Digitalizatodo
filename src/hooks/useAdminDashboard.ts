"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { getEcho } from '@/lib/echo';
import { useRealtimeChannel, useRealtimeVisibility } from '@/hooks/useRealtimeChannel';
import { todayCL, nowCL } from '@/lib/utils';
import { unlockAudio } from "@/lib/audio";
import { subscribeToPush } from "@/lib/push";
import {
    getProfile,
    getPayers,
    approvePayment,
    updateLogo,
    updatePricing,
    updateBankInfo,
    getRegistrationPageCode,
    getAttendanceHistory,
    getNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    getAppUpdates,
    getSchedules,
    getPlans,
    resumeSession
} from "@/lib/api";

import { industryConfig } from "@/lib/constants";
import { useTreasuryData } from './useTreasuryData';
import { useMartialArtsData } from './useMartialArtsData';
import { useDashboardCommon } from './useDashboardCommon';

const EXPENSE_CATEGORIES = ["Materiales escolares", "Insumos de aseo", "Alimentación", "Actividades", "Infraestructura", "Servicios básicos", "Fiestas Patrias", "Navidad", "Pascua", "Día del Alumno", "Día del Profesor", "Otros"];

export function useAdminDashboard(branding: any, setBranding: (b: any) => void) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [tabDirection, setTabDirection] = useState(0);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [isDemo, setIsDemo] = useState(false);
    
    // Hooks Secundarios
    const common = useDashboardCommon(branding?.slug, token, branding?.industry);
    const treasury = useTreasuryData(branding?.slug, token, branding?.industry);
    const martialArts = useMartialArtsData(branding?.slug, token, branding?.industry);

    const [prices, setPrices] = useState({ cat1: 25000, cat2: 35000, discountThreshold: 2, discountPercentage: 15 });
    const [bankData, setBankData] = useState<any>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('pending');
    const [selectedMonth, setSelectedMonth] = useState(nowCL().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(nowCL().getFullYear());
    const [historyMonth, setHistoryMonth] = useState(nowCL().getMonth());
    const [historyYear, setHistoryYear] = useState(nowCL().getFullYear());
    const [now, setNow] = useState(nowCL());
    const [regPageCode, setRegPageCode] = useState<string | null>(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [proofModalUrl, setProofModalUrl] = useState<string | null>(null);
    const [paymentActionPayer, setPaymentActionPayer] = useState<any>(null);
    const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [toastNotification, setToastNotification] = useState<any>(null);
    const [feesSearch, setFeesSearch] = useState('');
    const [showCreateExpense, setShowCreateExpense] = useState(false);
    const [showCreateFee, setShowCreateFee] = useState(false);
    const [showPushModal, setShowPushModal] = useState(false);
    const [lastCheckedInStudent, setLastCheckedInStudent] = useState<any>(null);
    const [loadingSync, setLoadingSync] = useState(false);

    useEffect(() => {
        const t = setInterval(() => setNow(nowCL()), 60000);
        return () => clearInterval(t);
    }, []);

    const brandingSlugRef = useRef(branding?.slug);
    useEffect(() => { brandingSlugRef.current = branding?.slug; }, [branding?.slug]);

    useEffect(() => {
        document.addEventListener('click', () => unlockAudio(), { once: true });
        document.addEventListener('touchstart', () => unlockAudio(), { once: true });
    }, []);

    const handleLogout = () => {
        const slug = localStorage.getItem("tenant_slug");
        const brandingData = localStorage.getItem("tenant_branding");
        localStorage.clear();
        if (slug) localStorage.setItem("tenant_slug", slug);
        if (brandingData) localStorage.setItem("tenant_branding", brandingData);
        window.location.href = "/";
    };

    const forceSync = async () => {
        if (!token || !branding?.slug) return;
        setLoadingSync(true);
        try {
            await common.refreshPayers(selectedMonth, selectedYear, paymentFilter);
            alert("✓ Sincronización completada");
        } catch (e) {
            alert("Error al sincronizar");
        } finally {
            setLoadingSync(false);
        }
    };

    const changeTab = (newTab: string) => {
        const tabs = ['dashboard', 'attendance', 'payments', 'settings', 'profile', 'fees', 'expenses', 'schedule'];
        const currentIndex = tabs.indexOf(activeTab);
        const newIndex = tabs.indexOf(newTab);
        setTabDirection(newIndex > currentIndex ? 1 : -1);
        setActiveTab(newTab);
        if (newTab === 'settings' && !regPageCode) {
            getRegistrationPageCode(user?.tenant_slug ?? '', token ?? '').then(r => { if (r?.code) setRegPageCode(r.code); });
        }
        if (newTab === 'expenses') common.loadExpenses();
        if (newTab === 'schedule') common.loadSchedules();
        if (newTab === 'fees') treasury.loadFees();
    };

    const allStudents = useMemo(() => {
        return common.payers.flatMap((payer: any) => {
            const students = payer.enrolledStudents || payer.students || [];
            return students.map((student: any) => ({
                ...student,
                payerId: payer.id,
                payerStatus: payer.status
            }));
        });
    }, [common.payers]);

    // Initial Load Logic
    useEffect(() => {
        const init = async () => {
            let storedToken = localStorage.getItem("staff_token") || localStorage.getItem("auth_token");
            let tenantSlug = localStorage.getItem("tenant_slug")?.trim();

            if (!storedToken && tenantSlug) {
                const rememberToken = localStorage.getItem("remember_token");
                if (rememberToken) {
                    const resumed = await resumeSession(tenantSlug || '', rememberToken);
                    if (resumed?.token) {
                        storedToken = resumed.token;
                        localStorage.setItem(resumed.user_type === 'staff' ? 'staff_token' : 'auth_token', storedToken || '');
                    }
                }
            }

            if (!storedToken || !tenantSlug) { window.location.href = "/"; return; }
            setToken(storedToken);

            let [profile, payersData, attendanceHistoryData] = await Promise.all([
                getProfile(tenantSlug, storedToken),
                getPayers(tenantSlug, storedToken, { month: selectedMonth, year: selectedYear, history: paymentFilter === 'history' }),
                getAttendanceHistory(tenantSlug, storedToken),
            ]);

            if (profile) {
                if (profile.user_type === 'guardian') { window.location.href = '/dashboard/student'; return; }
                setUser({ ...profile, tenant_slug: profile.tenant?.slug || tenantSlug });
                
                // Load Branding
                if (profile.tenant) {
                    setBranding({
                        id: String(profile.tenant.id),
                        slug: profile.tenant.slug,
                        name: profile.tenant.name,
                        industry: profile.tenant.industry,
                        logo: profile.tenant.logo,
                        primaryColor: profile.tenant.primary_color
                    });
                }

                // Load Initial Data
                common.setPayers(payersData?.payers || []);
                
                if (profile.tenant?.industry === 'martial_arts' || !profile.tenant?.industry) {
                    const currentAttendance = new Set<string>();
                    (payersData?.payers || []).forEach((p: any) => {
                        const students = p.enrolledStudents || p.students || [];
                        students.forEach((s: any) => { if (s.today_status === 'present') currentAttendance.add(String(s.id)); });
                    });
                    martialArts.setAttendance(currentAttendance);
                    martialArts.setAttendanceHistory(attendanceHistoryData?.attendance || []);
                }
                
                if (profile.tenant?.industry === 'school_treasury') {
                    common.loadSchedules();
                    treasury.loadFees();
                }

                getAppUpdates('staff', profile.tenant?.industry).then(d => common.setAppUpdates(d?.updates ?? []));
                getNotifications(tenantSlug, storedToken).then(d => {
                    if (d?.unread !== undefined) common.setUnreadCount(d.unread);
                    if (d?.notifications) common.setNotifications(d.notifications);
                });
            } else {
                localStorage.clear();
                window.location.href = "/";
            }
            setLoading(false);
        };
        init();
    }, [setBranding]);

    // Derived refresh with attendance calculation (Used for Initial Load and Sync)
    const refreshPayersAndAttendance = async (m?: number, y?: number, f?: string, updateAttendance = false) => {
        await common.refreshPayers(m, y, f);
        if (updateAttendance && (branding?.industry === 'martial_arts' || !branding?.industry)) {
            const currentAttendance = new Set<string>();
            common.payers.forEach((p: any) => {
                const students = p.enrolledStudents || p.students || [];
                students.forEach((s: any) => { if (s.today_status === 'present') currentAttendance.add(String(s.id)); });
            });
            martialArts.setAttendance(currentAttendance);
        }
    };

    // WebSockets
    useRealtimeVisibility(() => refreshPayersAndAttendance(selectedMonth, selectedYear, paymentFilter, true));

    useRealtimeChannel(`attendance.${branding?.slug}`, {
        'student.checked-in': (data: any) => {
            const sid = String(data.studentId);
            martialArts.setAttendance((prev: Set<string>) => new Set(prev).add(sid));
            setLastCheckedInStudent({ ...data, _ts: Date.now() });
            // Defer full refresh to update list colors/status without flickering the bubble/emerald state
            setTimeout(() => common.refreshPayers(selectedMonth, selectedYear, paymentFilter), 1000);
        },
        'student.checked-out': (data: any) => {
            const sid = String(data.studentId);
            martialArts.setAttendance((prev: Set<string>) => { const next = new Set(prev); next.delete(sid); return next; });
            setTimeout(() => common.refreshPayers(selectedMonth, selectedYear, paymentFilter), 1000);
        },
        'schedule.updated': () => common.loadSchedules(),
    }, !!branding?.slug);

    const reloadDataAndFees = () => {
        refreshPayersAndAttendance(selectedMonth, selectedYear, paymentFilter);
        if (branding?.industry === 'school_treasury') treasury.loadFees();
    };

    useRealtimeChannel(`payments.${branding?.slug}`, {
        'payment.updated': () => reloadDataAndFees(),
        'fee.updated': () => reloadDataAndFees(),
        'expense.updated': () => common.loadExpenses(),
    }, !!branding?.slug);

    useRealtimeChannel(`dashboard.${branding?.slug}`, {
        'student.registered': () => reloadDataAndFees(),
    }, !!branding?.slug);

    const handlePriceInput = (cat: 'cat1' | 'cat2', val: string) => {
        const num = common.parseCLP(val);
        setPrices(prev => ({ ...prev, [cat]: num }));
    };

    const handleSavePrices = async () => {
        if (!token || !branding?.slug) return;
        const res = await updatePricing(branding.slug, token, prices);
        if (res?.success) alert("✓ Precios actualizados");
    };

    const handleSaveBankInfo = async () => {
        if (!token || !branding?.slug) return;
        const res = await updateBankInfo(branding.slug, token, bankData);
        if (res?.success) alert("✓ Datos bancarios guardados");
    };

    const handleLogoUpload = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file || !token || !branding?.slug) return;
        const res = await updateLogo(branding.slug, token, file);
        if (res?.logo) setBranding({ ...branding, logo: res.logo });
    };

    const handlePaymentApprove = (payer: any) => {
        setPaymentActionPayer(payer);
    };

    const handleActivatePush = () => {
        common.setShowPushBanner(false);
        setShowPushModal(false);
        if (typeof Notification !== 'undefined') {
            Notification.requestPermission().then(permission => {
                common.setPushPermission(permission);
                if (permission === 'granted' && token && branding?.slug) {
                    subscribeToPush(branding.slug, token);
                }
            });
        }
    };

    const handleLoadDemo = () => {
        setIsDemo(true);
        const demoAttendance = new Set<string>();
        const demoHistory: any[] = [];
        
        const demoPayers = Array.from({ length: 100 }, (_, i) => {
            const status: 'pending' | 'paid' | 'review' = (i % 3 === 0) ? 'pending' : (i % 3 === 1 ? 'paid' : 'review');
            const studentId = `demo-s-${i}`;
            const studentName = `Alumno ${i + 1}`;
            const isPresent = i < 15;

            if (isPresent) {
                demoAttendance.add(studentId);
                demoHistory.push({
                    id: `demo-h-${i}`,
                    student_id: studentId,
                    student: { id: studentId, name: studentName, photo: null },
                    date: todayCL(),
                    status: 'present',
                    created_at: new Date().toISOString(),
                    registration_method: 'manual'
                });
            }

            const demoPayments: any[] = [];
            if (status === 'paid') {
                demoPayments.push({ id: `demo-pay-${i}-1`, amount: 45000, status: 'approved', month: selectedMonth, year: selectedYear, date: '2024-03-01' });
            } else if (status === 'review') {
                demoPayments.push({ id: `demo-pay-${i}-1`, amount: 45000, status: 'review', month: selectedMonth, year: selectedYear, date: '2024-03-10', proof_url: 'https://placehold.co/400x600?text=Comprobante' });
            } else {
                demoPayments.push({ id: `demo-pay-${i}-1`, amount: 45000, status: 'pending', month: selectedMonth, year: selectedYear, date: '2024-03-15' });
            }

            return {
                id: `demo-p-${i}`,
                name: `Apoderado ${i + 1}`,
                status,
                amount: 45000,
                last_payment: '2024-03-01',
                payments: demoPayments,
                enrolledStudents: [
                    { 
                        id: studentId, 
                        name: studentName, 
                        photo: null,
                        today_status: isPresent ? 'present' : 'absent'
                    }
                ]
            };
        });

        common.setPayers(demoPayers);
        martialArts.setAttendance(demoAttendance);
        martialArts.setAttendanceHistory(demoHistory);
        alert("✓ 100 alumnos de demostración cargados (Dojo Care Mode)");
    };

    const longPressTimer = useRef<NodeJS.Timeout | undefined>(undefined);

    const toggleAttendance = useCallback(async (studentId: string | number) => {
        if (branding?.industry === 'martial_arts') {
            await martialArts.toggleAttendance(studentId, allStudents);
        } else {
            await common.toggleAttendance(studentId);
        }
    }, [branding?.industry, martialArts, common, allStudents]);

    const handleConfirmPayment = async () => {
        if (!paymentActionPayer || !token || !branding?.slug) return;
        const payerId = paymentActionPayer.id;
        if (isDemo) {
            common.setPayers(common.payers.map((p: any) => p.id === payerId ? { ...p, status: 'paid' } : p));
        } else {
            await approvePayment(branding.slug, token, String(payerId));
            await common.refreshPayers(selectedMonth, selectedYear, paymentFilter);
        }
        setPaymentActionPayer(null);
    };

    const STATUS_LABEL: Record<string, { label: string; color: string }> = {
        pending: { label: 'Pendiente', color: 'bg-rose-50 text-rose-600 border-rose-100' },
        review:  { label: 'En revisión', color: 'bg-amber-50 text-amber-600 border-amber-100' },
        paid:    { label: 'Pagado', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    };

    return useMemo(() => ({
        // Core state
        activeTab, setActiveTab, changeTab, tabDirection,
        loading, token, user, isDemo,
        prices, setPrices, bankData, setBankData,
        searchTerm, setSearchTerm, paymentFilter, setPaymentFilter,
        selectedMonth, setSelectedMonth, selectedYear, setSelectedYear,
        historyMonth, setHistoryMonth, historyYear, setHistoryYear,
        now, setNow, regPageCode, setRegPageCode,
        showQRModal, setShowQRModal,
        proofModalUrl, setProofModalUrl, paymentActionPayer, setPaymentActionPayer,
        selectedHistoryDate, setSelectedHistoryDate,
        showNotifications, setShowNotifications,
        toastNotification, setToastNotification,
        showCreateExpense, setShowCreateExpense,
        showCreateFee, setShowCreateFee,
        showPushModal, setShowPushModal,
        lastCheckedInStudent, setLastCheckedInStudent,
        loadingSync, setLoadingSync,

        // Spread specialized hooks (Common, Treasury, Martial Arts)
        ...common,
        ...treasury,
        ...martialArts,

        // Overrides and computed values
        filteredFees: treasury.filteredFees(treasury.feesSearch),
        vocab: industryConfig[branding?.industry || 'default'] || industryConfig.default,
        handleLogout, forceSync, 
        allStudents, toggleAttendance,
        handlePriceInput, handleSavePrices, handleSaveBankInfo, handleLogoUpload,
        handlePaymentApprove, handleActivatePush, handleLoadDemo, handleConfirmPayment,
        formatMoney: (a: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(a),
        STATUS_LABEL,
        longPressTimer
    }), [
        activeTab, tabDirection, loading, token, user, isDemo,
        prices, bankData, searchTerm, paymentFilter, 
        selectedMonth, selectedYear, historyMonth, historyYear, 
        now, regPageCode, showQRModal, proofModalUrl, paymentActionPayer, 
        selectedHistoryDate, showNotifications, toastNotification, 
        showCreateExpense, showCreateFee, showPushModal, 
        lastCheckedInStudent, loadingSync,
        common, treasury, martialArts,
        allStudents, toggleAttendance, branding?.industry
    ]);
}

