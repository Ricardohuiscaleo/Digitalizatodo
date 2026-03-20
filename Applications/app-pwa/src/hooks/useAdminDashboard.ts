"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { getEcho, reconnect } from '@/lib/echo';
import { todayCL, nowCL } from '@/lib/utils';
import { unlockAudio, setAppBadge } from "@/lib/audio";
import { subscribeToPush } from "@/lib/push";
import {
    getProfile,
    getPayers,
    storeAttendance,
    deleteAttendance,
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
    getFees,
    getFeeDetail,
    createFee,
    deleteFee,
    approveFeePayment,
    getFeesGuardiansSummary,
    getExpenses,
    createExpense,
    deleteExpense,
    getSchedules,
    getPlans,
    resumeSession
} from "@/lib/api";

import { industryConfig } from "@/lib/constants";

const EXPENSE_CATEGORIES = ["Alimentación", "Materiales", "Mantenimiento", "Publicidad", "Sueldos", "Servicios", "Otros"];

export function useAdminDashboard(branding: any, setBranding: (b: any) => void) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [tabDirection, setTabDirection] = useState(0);
    const [payers, setPayers] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [isDemo, setIsDemo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [prices, setPrices] = useState({
        cat1: 25000,
        cat2: 35000,
        discountThreshold: 2,
        discountPercentage: 15
    });

    const [bankData, setBankData] = useState<any>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('pending');
    const [selectedMonth, setSelectedMonth] = useState(nowCL().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(nowCL().getFullYear());
    const [expandedPayerId, setExpandedPayerId] = useState<string | null>(null);
    const [historyPage, setHistoryPage] = useState(0);
    const [historyMonth, setHistoryMonth] = useState(nowCL().getMonth());
    const [historyYear, setHistoryYear] = useState(nowCL().getFullYear());
    const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
    const [now, setNow] = useState(nowCL());
    const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false);
    const [bubbleModalPayer, setBubbleModalPayer] = useState<any>(null);
    const [regPageCode, setRegPageCode] = useState<string | null>(null);
    const [generatingPage, setGeneratingPage] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [proofModalUrl, setProofModalUrl] = useState<string | null>(null);
    const [paymentActionPayer, setPaymentActionPayer] = useState<any>(null);
    const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [appUpdates, setAppUpdates] = useState<any[]>([]);
    const [toastNotification, setToastNotification] = useState<any>(null);
    const [feesSummary, setFeesSummary] = useState<{ total: number; pending: number; review: number } | null>(null);
    const [feesList, setFeesList] = useState<any[]>([]);
    const [feesSearch, setFeesSearch] = useState('');
    const filteredFees = useMemo(() => {
        if (!feesSearch) return feesList;
        const low = feesSearch.toLowerCase();
        return feesList.filter(f => 
            f.title.toLowerCase().includes(low) || 
            (f.description && f.description.toLowerCase().includes(low))
        );
    }, [feesList, feesSearch]);
    const [feesLoading, setFeesLoading] = useState(false);
    const [expensesList, setExpensesList] = useState<any[]>([]);
    const [expensesTotal, setExpensesTotal] = useState(0);
    const [expensesSummary, setExpensesSummary] = useState<any[]>([]);
    const [expensesLoading, setExpensesLoading] = useState(false);
    const [showCreateExpense, setShowCreateExpense] = useState(false);
    const [expenseForm, setExpenseForm] = useState({ title: '', description: '', amount: '', category: 'insumos', expense_date: new Date().toISOString().split('T')[0] });
    const [schedulesList, setSchedulesList] = useState<any[]>([]);
    const [schedulesLoading, setSchedulesLoading] = useState(false);
    const [expenseReceiptPhoto, setExpenseReceiptPhoto] = useState<File | null>(null);
    const [expenseProductPhoto, setExpenseProductPhoto] = useState<File | null>(null);
    const [expenseSubmitting, setExpenseSubmitting] = useState(false);
    const [expenseFormError, setExpenseFormError] = useState('');
    const [expenseDeletingId, setExpenseDeletingId] = useState<number | null>(null);
    const [expenseLightbox, setExpenseLightbox] = useState<string | null>(null);
    const [showCreateFee, setShowCreateFee] = useState(false);
    const [selectedFee, setSelectedFee] = useState<any>(null);
    const [feePayments, setFeePayments] = useState<any[]>([]);
    const [feeDetailLoading, setFeeDetailLoading] = useState(false);
    const [feeProofUrl, setFeeProofUrl] = useState<string | null>(null);
    const [feeForm, setFeeForm] = useState({ title: '', description: '', amount: '', due_date: '', target: 'all', type: 'once', recurring_day: '', start_month: '', start_year: '', end_month: '', end_year: '' });
    const [feeSubmitting, setFeeSubmitting] = useState(false);
    const [feeFormError, setFeeFormError] = useState('');
    const [approvingFeePayment, setApprovingFeePayment] = useState<any>(null);
    const [feeApproveMethod, setFeeApproveMethod] = useState<'cash' | 'transfer'>('cash');
    const [feeApproveNotes, setFeeApproveNotes] = useState('');
    const [feeApprovingLoading, setFeeApprovingLoading] = useState(false);
    const [feesGuardians, setFeesGuardians] = useState<any[]>([]);
    const [feesGuardiansLoading, setFeesGuardiansLoading] = useState(false);
    const [showPushBanner, setShowPushBanner] = useState(false);
    const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
    const [showPushModal, setShowPushModal] = useState(false);
    const [lastCheckedInStudent, setLastCheckedInStudent] = useState<any>(null);
    const [showInactivePayers, setShowInactivePayers] = useState(false);
    const [loadingSync, setLoadingSync] = useState(false);
    const [copied, setCopied] = useState(false);
    const [longPressPayerId, setLongPressPayerId] = useState<string | null>(null);
    const [feesGuardianFilter, setFeesGuardianFilter] = useState<'all' | 'pending' | 'paid'>('all');
    const [feesGuardianSearch, setFeesGuardianSearch] = useState('');
    const [feesGuardianDropdown, setFeesGuardianDropdown] = useState<string | null>(null);
    const [feesBubbleModal, setFeesBubbleModal] = useState<any>(null);
    const [feesView, setFeesView] = useState<'list' | 'guardians' | 'history'>('list');

    useEffect(() => {
        const t = setInterval(() => setNow(nowCL()), 60000);
        return () => clearInterval(t);
    }, []);

    // Refs for stability in callbacks
    const tokenRef = useRef(token);
    useEffect(() => { tokenRef.current = token; }, [token]);
    const brandingSlugRef = useRef(branding?.slug);
    useEffect(() => { brandingSlugRef.current = branding?.slug; }, [branding?.slug]);
    const userRef = useRef(user);
    useEffect(() => { userRef.current = user; }, [user]);

    useEffect(() => {
        document.addEventListener('click', () => unlockAudio(), { once: true });
        document.addEventListener('touchstart', () => unlockAudio(), { once: true });
    }, []);

    const refreshPayers = useCallback(async (customToken?: string, slug?: string) => {
        const storedToken = customToken || token || localStorage.getItem("staff_token") || localStorage.getItem("auth_token");
        const tenantSlug = slug || localStorage.getItem("tenant_slug")?.trim();
        if (!storedToken || !tenantSlug) return;

        const isHistory = paymentFilter === 'history';
        const data = await getPayers(tenantSlug, storedToken, {
            month: selectedMonth,
            year: selectedYear,
            history: isHistory
        });
        
        if (data?.payers) {
            setPayers(data.payers);
            const currentAttendance = new Set<string>();
            data.payers.forEach((p: any) => {
                const students = p.enrolledStudents || p.students || [];
                students.forEach((s: any) => {
                    if (s.today_status === 'present') currentAttendance.add(String(s.id));
                });
            });
            setAttendance(currentAttendance);
        }
    }, [token, paymentFilter, selectedMonth, selectedYear]);

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
            await refreshPayers();
            alert("✓ Sincronización completada");
        } catch (e) {
            alert("Error al sincronizar");
        } finally {
            setLoadingSync(false);
        }
    };

    const loadExpenses = async () => {
        setExpensesLoading(true);
        const data = await getExpenses(branding?.slug || '', token || '');
        setExpensesList(data?.expenses ?? []);
        setExpensesTotal(data?.total ?? 0);
        setExpensesSummary(data?.summary ?? []);
        setExpensesLoading(false);
    };

    const loadSchedules = async () => {
        setSchedulesLoading(true);
        const data = await getSchedules(branding?.slug || '', token || '');
        setSchedulesList(data?.schedules ?? []);
        setSchedulesLoading(false);
    };

    const loadFees = async () => {
        setFeesLoading(true);
        const [feesData, guardiansData] = await Promise.all([
            getFees(branding?.slug || '', token || ''),
            branding?.industry === 'school_treasury' ? getFeesGuardiansSummary(branding?.slug || '', token || '') : Promise.resolve({ guardians: [] })
        ]);

        setFeesList(feesData?.fees || []);
        if (feesData?.fees) {
            const total = feesData.fees.length;
            const pending = feesData.fees.reduce((a: number, f: any) => a + (f.total_count - f.paid_count - f.review_count), 0);
            const review = feesData.fees.reduce((a: number, f: any) => a + (f.review_count || 0), 0);
            setFeesSummary({ total, pending, review });
        }

        if (guardiansData?.guardians) {
            setFeesGuardians(guardiansData.guardians);
        }

        setFeesLoading(false);
    };

    const handlePriceInput = (cat: 'cat1' | 'cat2', val: string) => {
        const num = Math.max(0, parseInt(val) || 0);
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

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token || !branding?.slug) return;
        const res = await updateLogo(branding.slug, token, file);
        if (res?.logo) setBranding({ ...branding, logo: res.logo });
    };

    const handleLoadDemo = () => {
        setIsDemo(true);
        setPayers([
            { id: 'demo1', name: 'Juan Pérez', status: 'pending', amount: 45000, last_payment: '2024-03-01' },
            { id: 'demo2', name: 'María García', status: 'paid', amount: 45000, last_payment: '2024-03-15' },
        ]);
        alert("✓ Datos de demostración cargados");
    };

    const longPressTimer = useRef<NodeJS.Timeout | undefined>(undefined);
    const handleLongPressStart = (payerId: string) => {
        longPressTimer.current = setTimeout(() => {
            const payer = payers.find(p => p.id === payerId);
            if (payer) setBubbleModalPayer(payer);
        }, 600);
    };
    const handleLongPressEnd = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };

    const openFee = async (fee: any) => {
        setSelectedFee(fee);
        setFeeDetailLoading(true);
        const data = await getFeeDetail(branding?.slug || '', token || '', fee.id);
        setFeePayments(data?.payments || []);
        setFeeDetailLoading(false);
    };

    const handleDeleteFee = async (feeId: number) => {
        if (!confirm('¿Eliminar esta cuota y todos sus pagos?')) return;
        await deleteFee(branding?.slug || '', token || '', feeId);
        loadFees();
    };

    const getAttendanceHistoryData = async () => {
        const tenantSlug = localStorage.getItem("tenant_slug")?.trim();
        const storedToken = token || localStorage.getItem("staff_token");
        if (!tenantSlug || !storedToken) return;
        const data = await getAttendanceHistory(tenantSlug, storedToken);
        setAttendanceHistory(data?.attendance || []);
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
    };

    // Derived State
    const allStudents = useMemo(() => {
        return payers.flatMap(payer => {
            const students = payer.enrolledStudents || payer.students || [];
            return students.map((student: any) => ({
                ...student,
                payerId: payer.id,
                payerStatus: payer.status
            }));
        });
    }, [payers]);

    // Handlers
    const toggleAttendance = async (rawId: string | number) => {
        const studentId = String(rawId);
        const isPresent = attendance.has(studentId);
        const student = allStudents.find(s => String(s.id) === studentId);

        const newAttendance = new Set(attendance);
        if (isPresent) {
            newAttendance.delete(studentId);
            setAttendanceHistory(prev => prev.filter(r => !(String(r.student_id) === String(studentId) && (r.date || r.created_at?.split('T')[0]) === todayCL())));
        } else {
            newAttendance.add(studentId);
            setAttendanceHistory(prev => [{
                id: `local-${Date.now()}`,
                student_id: studentId,
                student: { id: studentId, name: student?.name || 'Alumno', photo: student?.photo },
                date: todayCL(),
                status: 'present',
                created_at: new Date().toISOString(),
                registration_method: 'manual',
            }, ...prev]);
        }
        setAttendance(newAttendance);

        if (!isDemo && token && (user?.tenant_slug || user?.tenant_id)) {
            if (isPresent) {
                await deleteAttendance(user.tenant_slug || user.tenant_id, token, studentId);
            } else {
                await storeAttendance(user.tenant_slug || user.tenant_id, token, { student_id: studentId, status: 'present' });
            }
        }
    };

    const handleConfirmPayment = async () => {
        if (!paymentActionPayer) return;
        const payerId = paymentActionPayer.id;

        if (isDemo) {
            setPayers(payers.map(p => p.id === payerId ? { ...p, status: 'paid' } : p));
            setPaymentActionPayer(null);
            return;
        }

        if (token && (user?.tenant_slug || user?.tenant_id)) {
            await approvePayment(user.tenant_slug || user.tenant_id, token, payerId);
            setPaymentActionPayer(null);
            refreshPayers();
        }
    };

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!expenseForm.title || !expenseForm.amount) { setExpenseFormError('Completa los campos requeridos'); return; }
        setExpenseSubmitting(true); setExpenseFormError('');
        const fd = new FormData();
        fd.append('title', expenseForm.title);
        fd.append('description', expenseForm.description);
        fd.append('amount', expenseForm.amount);
        fd.append('category', expenseForm.category);
        fd.append('expense_date', expenseForm.expense_date);
        if (expenseReceiptPhoto) fd.append('receipt_photo', expenseReceiptPhoto);
        if (expenseProductPhoto) fd.append('product_photo', expenseProductPhoto);
        const res = await createExpense(branding?.slug || '', token || '', fd);
        if (res?.expense) {
            setShowCreateExpense(false);
            setExpenseForm({ title: '', description: '', amount: '', category: 'insumos', expense_date: new Date().toISOString().split('T')[0] });
            setExpenseReceiptPhoto(null); setExpenseProductPhoto(null);
            await loadExpenses();
        } else {
            setExpenseFormError(res?.message ?? 'Error al guardar');
        }
        setExpenseSubmitting(false);
    };

    const handleDeleteExpense = async (id: number) => {
        if (!confirm('¿Eliminar este gasto?')) return;
        setExpenseDeletingId(id);
        await deleteExpense(branding?.slug || '', token || '', id);
        await loadExpenses();
        setExpenseDeletingId(null);
    };

    const handleCreateFee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feeForm.title || !feeForm.amount) { setFeeFormError('Completa todos los campos requeridos'); return; }
        setFeeSubmitting(true); setFeeFormError('');
        const startDate = feeForm.type === 'recurring' && feeForm.start_month && feeForm.start_year
            ? `${feeForm.start_year}-${String(feeForm.start_month).padStart(2,'0')}-01` : undefined;
        const endDate = feeForm.type === 'recurring' && feeForm.end_month && feeForm.end_year
            ? `${feeForm.end_year}-${String(feeForm.end_month).padStart(2,'0')}-28` : undefined;
        
        const result = await createFee(branding?.slug || '', token || '', {
                ...feeForm,
                amount: parseFloat(feeForm.amount),
                recurring_day: feeForm.type === 'recurring' ? parseInt(feeForm.recurring_day) : undefined,
                due_date: feeForm.type === 'once' ? feeForm.due_date : startDate,
                end_date: endDate,
            });
        setFeeSubmitting(false);
        if (result?.fee) {
            setShowCreateFee(false);
            setFeeForm({ title: '', description: '', amount: '', due_date: '', target: 'all', type: 'once', recurring_day: '', start_month: '', start_year: '', end_month: '', end_year: '' });
            loadFees();
        } else {
            setFeeFormError(result?.message || 'Error al crear cuota');
        }
    };

    const handleApproveFeePayment = async () => {
        if (!approvingFeePayment || !selectedFee) return;
        setFeeApprovingLoading(true);
        await approveFeePayment(branding?.slug || '', token || '', selectedFee.id, {
            guardian_id: approvingFeePayment.guardian_id,
            payment_method: feeApproveMethod,
            notes: feeApproveNotes,
        });
        setFeeApprovingLoading(false);
        setApprovingFeePayment(null);
        setFeeApproveNotes('');
        const data = await getFeeDetail(branding?.slug || '', token || '', selectedFee.id);
        setFeePayments(data?.payments || []);
        loadFees();
    };

    // Effects
    useEffect(() => {
        const init = async () => {
            let storedToken = localStorage.getItem("staff_token") || localStorage.getItem("auth_token");
            let tenantSlug = localStorage.getItem("tenant_slug")?.trim();
            const tenantId = localStorage.getItem("tenant_id")?.trim();

            if (!storedToken && tenantSlug) {
                const rememberToken = localStorage.getItem("remember_token");
                if (rememberToken) {
                    const resumed = await resumeSession(tenantSlug || '', rememberToken);
                    if (resumed?.token) {
                        storedToken = resumed.token;
                        const key = resumed.user_type === 'staff' ? 'staff_token' : 'auth_token';
                        localStorage.setItem(key, storedToken || '');
                    }
                }
            }

            if (!storedToken || !tenantSlug) { window.location.href = "/"; return; }

            setToken(storedToken);

            let [profile, payersData, attendanceHistoryData]: any[] = await Promise.all([
                getProfile(tenantSlug || '', storedToken || ''),
                getPayers(tenantSlug || '', storedToken || '', { month: selectedMonth, year: selectedYear, history: paymentFilter === 'history' }),
                getAttendanceHistory(tenantSlug || '', storedToken || ''),
            ]);

            // Session recovery if token expired but remember_token exists
            if (!profile && tenantSlug) {
                const rememberToken = localStorage.getItem("remember_token");
                if (rememberToken) {
                    const resumed = await resumeSession(tenantSlug, rememberToken);
                    if (resumed?.token) {
                        storedToken = resumed.token;
                        setToken(storedToken || '');
                        [profile, payersData, attendanceHistoryData] = await Promise.all([
                            getProfile(tenantSlug || '', storedToken || ''),
                            getPayers(tenantSlug || '', storedToken || '', { month: selectedMonth, year: selectedYear, history: paymentFilter === 'history' }),
                            getAttendanceHistory(tenantSlug || '', storedToken || ''),
                        ]);
                    }
                }
            }


            if (profile) {
                if (profile.user_type === 'guardian') { window.location.href = '/dashboard/student'; return; }
                setUser({ ...profile, tenant_id: profile.tenant_id || tenantId, tenant_slug: profile.tenant?.slug || tenantSlug });
                // Cargar precios desde plans (fuente de verdad)
                const plansData = await getPlans(tenantSlug || '', storedToken || '');
                if (Array.isArray(plansData) && plansData.length > 0) {
                    const kids = plansData.find((p: any) => p.name?.toLowerCase().includes('kid') || p.description?.toLowerCase().includes('kid'));
                    const adult = plansData.find((p: any) => p.name?.toLowerCase().includes('adult') || p.description?.toLowerCase().includes('adult'));
                    setPrices((prev: any) => ({
                        ...prev,
                        cat1: kids ? Number(kids.price) : prev.cat1,
                        cat2: adult ? Number(adult.price) : prev.cat2,
                    }));
                } else if (profile.tenant?.data?.pricing) {
                    setPrices(profile.tenant.data.pricing.prices || profile.tenant.data.pricing);
                }
                if (profile.tenant?.data?.bank_info) setBankData(profile.tenant.data.bank_info);
                if (profile.tenant) {
                    localStorage.setItem('tenant_industry', profile.tenant.industry || '');
                    setBranding({
                        id: String(profile.tenant.id),
                        slug: profile.tenant.slug,
                        name: profile.tenant.name,
                        industry: profile.tenant.industry,
                        logo: profile.tenant.logo,
                        primaryColor: profile.tenant.primary_color
                    });
                }
                setPayers(payersData?.payers || []);
                setAttendanceHistory(attendanceHistoryData?.attendance || []);
                if (profile.tenant?.industry === 'school_treasury') {
                    getSchedules(tenantSlug || '', storedToken || '').then(d => setSchedulesList(d?.schedules || []));
                    getFees(tenantSlug || '', storedToken || '').then(d => setFeesList(d?.fees || []));
                }
                getAppUpdates('staff', profile.tenant?.industry || undefined).then(d => setAppUpdates(d?.updates ?? []));
            } else {
                localStorage.clear();
                window.location.href = "/";
            }
            setLoading(false);
        };
        init();
    }, [setBranding]);

    // WebSockets
    useEffect(() => {
        if (!branding?.slug) return;
        const echo = getEcho();
        if (!echo) return;

        const slug = branding.slug;
        const safeRefresh = () => refreshPayers();

        echo.channel(`attendance.${slug}`)
            .listen('.student.checked-in', (data: any) => {
                setAttendance(prev => new Set(prev).add(String(data.studentId)));
                setLastCheckedInStudent({ ...data, _ts: Date.now() });
                setAttendanceHistory(prev => [{
                    id: `ws-${Date.now()}`,
                    student_id: data.studentId,
                    student: { id: data.studentId, name: data.studentName || 'Alumno', photo: data.studentPhoto },
                    date: todayCL(),
                    status: 'present',
                    created_at: new Date().toISOString(),
                    registration_method: 'qr',
                }, ...prev]);
                safeRefresh();
            })
            .listen('.student.checked-out', (data: any) => {
                setAttendance(prev => { const next = new Set(prev); next.delete(String(data.studentId)); return next; });
                setAttendanceHistory(prev => prev.filter(r => !(String(r.student_id) === String(data.studentId) && (r.date || r.created_at?.split('T')[0]) === todayCL())));
                safeRefresh();
            })
            .listen('.schedule.updated', (ev: any) => {
                console.log('[WS] 📅 schedule.updated recibido (staff)', ev);
                const s = brandingSlugRef.current || branding?.slug || '';
                const tk = tokenRef.current || '';
                if (s && tk) getSchedules(s, tk).then(d => { console.log('[WS] 📅 horario recargado (staff)', d?.schedules?.length, 'bloques'); setSchedulesList(d?.schedules || []); });
            });

        echo.channel(`payments.${slug}`)
            .listen('.payment.updated', () => { safeRefresh(); });
        
        echo.channel(`dashboard.${slug}`)
            .listen('.student.registered', () => { safeRefresh(); });

        if (userRef.current?.id) {
            echo.channel(`notifications.${slug}.${userRef.current.id}`)
                .listen('.notification.sent', (data: any) => {
                    setToastNotification({ id: data.notificationId, title: data.title, body: data.body, type: data.type });
                    setUnreadCount(c => c + 1);
                    setNotifications(prev => [{ id: data.notificationId, title: data.title, body: data.body, type: data.type, read: false, created_at: 'Ahora' }, ...prev]);
                });
        }

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                reconnect();
                safeRefresh();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            echo.leaveChannel(`attendance.${slug}`);
            echo.leaveChannel(`payments.${slug}`);
            echo.leaveChannel(`dashboard.${slug}`);
            if (userRef.current?.id) echo.leaveChannel(`notifications.${slug}.${userRef.current.id}`);
        };
    }, [branding?.slug, refreshPayers]);

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);
    };

    const formatCLP = (value: number) => {
        if (!value || value === 0) return '';
        return `$ ${new Intl.NumberFormat('es-CL').format(value)}`;
    };

    const parseCLP = (str: string) => {
        const digits = str.replace(/\D/g, '');
        return digits === '' ? 0 : parseInt(digits, 10);
    };

    const handlePaymentApprove = (payerId: string) => {
        const payer = payers.find(p => p.id === payerId);
        if (payer) setPaymentActionPayer(payer);
    };

    const handleActivatePush = () => {
        setShowPushBanner(false);
        setShowPushModal(false);
        if (typeof Notification !== 'undefined') {
            Notification.requestPermission().then(permission => {
                setPushPermission(permission);
                if (permission === 'granted' && token && branding?.slug) {
                    subscribeToPush(branding.slug, token);
                }
            });
        }
    };

    const STATUS_LABEL: Record<string, { label: string; color: string }> = {
        pending: { label: 'Pendiente', color: 'bg-rose-50 text-rose-600 border-rose-100' },
        review:  { label: 'En revisión', color: 'bg-amber-50 text-amber-600 border-amber-100' },
        paid:    { label: 'Pagado', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    };

    return {
        activeTab, setActiveTab, changeTab, tabDirection,
        payers, setPayers, attendance, loading, token, user, isDemo,
        prices, setPrices, bankData, setBankData,
        searchTerm, setSearchTerm, paymentFilter, setPaymentFilter,
        selectedMonth, setSelectedMonth, selectedYear, setSelectedYear,
        expandedPayerId, setExpandedPayerId, historyPage, setHistoryPage,
        historyMonth, setHistoryMonth, historyYear, setHistoryYear,
        attendanceHistory, setAttendanceHistory, now, setNow, copied, setCopied,
        paymentDropdownOpen, setPaymentDropdownOpen, longPressPayerId, setLongPressPayerId,
        longPressTimer: undefined, bubbleModalPayer, setBubbleModalPayer, regPageCode, setRegPageCode,
        generatingPage, setGeneratingPage, showQRModal, setShowQRModal,
        proofModalUrl, setProofModalUrl, paymentActionPayer, setPaymentActionPayer,
        selectedHistoryDate, setSelectedHistoryDate, notifications, setNotifications,
        unreadCount, setUnreadCount, showNotifications, setShowNotifications,
        appUpdates, setAppUpdates, toastNotification, setToastNotification,
        feesSummary, setFeesSummary, feesList, setFeesList, feesLoading, setFeesLoading,
        expensesList, setExpensesList, expensesTotal, setExpensesTotal,
        expensesSummary, setExpensesSummary, expensesLoading, setExpensesLoading,
        showCreateExpense, setShowCreateExpense, expenseForm, setExpenseForm,
        schedulesList, setSchedulesList, schedulesLoading, setSchedulesLoading,
        expenseReceiptPhoto, setExpenseReceiptPhoto, expenseProductPhoto, setExpenseProductPhoto,
        expenseSubmitting, setExpenseSubmitting, expenseFormError, setExpenseFormError,
        expenseDeletingId, setExpenseDeletingId, expenseLightbox, setExpenseLightbox,
        showCreateFee, setShowCreateFee, selectedFee, setSelectedFee, feePayments, setFeePayments,
        feeDetailLoading, setFeeDetailLoading, feeProofUrl, setFeeProofUrl,
        feeForm, setFeeForm, feeSubmitting, setFeeSubmitting, feeFormError, setFeeFormError,
        approvingFeePayment, setApprovingFeePayment, feeApproveMethod, setFeeApproveMethod,
        feeApproveNotes, setFeeApproveNotes, feeApprovingLoading, setFeeApprovingLoading,
        feesGuardians, setFeesGuardians, feesGuardiansLoading, setFeesGuardiansLoading,
        feesGuardianFilter, setFeesGuardianFilter, feesGuardianSearch, setFeesGuardianSearch,
        feesGuardianDropdown, setFeesGuardianDropdown, feesBubbleModal, setFeesBubbleModal,
        feesSearch, setFeesSearch, filteredFees, feesView, setFeesView,
        showInactivePayers, setShowInactivePayers, loadingSync, setLoadingSync,
        lastCheckedInStudent, setLastCheckedInStudent, showPushBanner, setShowPushBanner,
        pushPermission, setPushPermission, showPushModal, setShowPushModal,
        vocab: industryConfig[branding?.industry || 'default'] || industryConfig.default,
        handleLogout, forceSync, refreshPayers, loadExpenses, loadSchedules, loadFees,
        allStudents, toggleAttendance, handleConfirmPayment, handleCreateExpense,
        handleDeleteExpense, handleCreateFee, handleApproveFeePayment,
        handlePriceInput, handleSavePrices, handleSaveBankInfo,
        handleLogoUpload, openFee, markAllNotificationsRead, markNotificationRead,
        formatMoney, formatCLP, parseCLP, handlePaymentApprove, handleActivatePush,
        handleDeleteFee, handleLongPressStart, handleLongPressEnd, handleLoadDemo,
        STATUS_LABEL
    };
}

