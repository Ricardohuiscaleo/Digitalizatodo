"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
    getPayers, 
    storeAttendance, 
    deleteAttendance, 
    approvePayment, 
    getExpenses, 
    createExpense,
    deleteExpense,
    getSchedules, 
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getPlans, 
    createPlan,
    updatePlan,
    deletePlan,
    getNotifications, 
    markAllNotificationsRead,
    markNotificationRead,
    getAppUpdates,
    getTenantTerms,
    updateTenantTerms
} from "@/lib/api";
import { todayCL, nowCL } from "@/lib/utils";

export function useDashboardCommon(slug: string | undefined, token: string | null, industry: string | undefined) {
    const [payers, setPayers] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [appUpdates, setAppUpdates] = useState<any[]>([]);
    const [schedulesList, setSchedulesList] = useState<any[]>([]);
    const [expensesList, setExpensesList] = useState<any[]>([]);
    const [expensesTotal, setExpensesTotal] = useState(0);
    const [expensesSummary, setExpensesSummary] = useState<any[]>([]);
    const [expensesLoading, setExpensesLoading] = useState(false);
    const [schedulesLoading, setSchedulesLoading] = useState(false);
    const [plansList, setPlansList] = useState<any[]>([]);
    const [plansLoading, setPlansLoading] = useState(false);
    const [tenantTerms, setTenantTerms] = useState<any>(null);
    const [termsLoading, setTermsLoading] = useState(false);

    const [expandedPayerId, setExpandedPayerId] = useState<string | null>(null);
    const [historyPage, setHistoryPage] = useState(0);
    const [copied, setCopied] = useState(false);
    const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false);
    const [longPressPayerId, setLongPressPayerId] = useState<string | null>(null);
    const [bubbleModalPayer, setBubbleModalPayer] = useState<any>(null);
    const [generatingPage, setGeneratingPage] = useState(false);
    const [showPushBanner, setShowPushBanner] = useState(false);
    const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

    const [expenseForm, setExpenseForm] = useState({ title: '', description: '', amount: '', category: 'Materiales escolares', expense_date: new Date().toISOString().split('T')[0] });
    const [expenseReceiptPhoto, setExpenseReceiptPhoto] = useState<File | null>(null);
    const [expenseProductPhoto, setExpenseProductPhoto] = useState<File | null>(null);
    const [expenseSubmitting, setExpenseSubmitting] = useState(false);
    const [expenseFormError, setExpenseFormError] = useState('');
    const [expenseDeletingId, setExpenseDeletingId] = useState<number | null>(null);
    const [expenseLightbox, setExpenseLightbox] = useState<string | null>(null);

    const refreshPayers = useCallback(async (
        customMonth?: number, 
        customYear?: number, 
        customFilter?: string
    ) => {
        if (!token || !slug) return;
        const month = customMonth ?? (nowCL().getMonth() + 1);
        const year = customYear ?? nowCL().getFullYear();
        const filter = customFilter ?? 'pending';
        
        const isHistory = filter === 'history';
        const data = await getPayers(slug, token, { month, year, history: isHistory });
        const payersList = data?.payers || (Array.isArray(data) ? data : []);
        setPayers(payersList);
    }, [token, slug]);

    const loadExpenses = useCallback(async () => {
        if (!slug || !token) return;
        setExpensesLoading(true);
        const data = await getExpenses(slug, token);
        setExpensesList(data?.expenses ?? []);
        setExpensesTotal(data?.total ?? 0);
        setExpensesSummary(data?.summary ?? []);
        setExpensesLoading(false);
    }, [slug, token]);

    const loadSchedules = useCallback(async () => {
        if (!slug || !token) return;
        setSchedulesLoading(true);
        const data = await getSchedules(slug, token);
        setSchedulesList(data?.schedules ?? []);
        setSchedulesLoading(false);
    }, [slug, token]);

    const loadPlans = useCallback(async () => {
        if (!slug || !token) return;
        setPlansLoading(true);
        const data = await getPlans(slug, token);
        setPlansList(data ?? []);
        setPlansLoading(false);
    }, [slug, token]);

    const handleCreatePlan = async (data: any) => {
        if (!slug || !token) return;
        const res = await createPlan(slug, token, data);
        if (res) await loadPlans();
        return res;
    };

    const handleUpdatePlan = async (id: number, data: any) => {
        if (!slug || !token) return;
        const res = await updatePlan(slug, token, id, data);
        if (res) await loadPlans();
        return res;
    };

    const handleDeletePlan = async (id: number) => {
        if (!slug || !token) return;
        const res = await deletePlan(slug, token, id);
        if (res) await loadPlans();
        return res;
    };

    const handleCreateSchedule = async (data: any) => {
        if (!slug || !token) return;
        const res = await createSchedule(slug, token, data);
        if (res) await loadSchedules();
        return res;
    };

    const handleUpdateSchedule = async (id: number, data: any) => {
        if (!slug || !token) return;
        const res = await updateSchedule(slug, token, id, data);
        if (res) await loadSchedules();
        return res;
    };

    const handleDeleteSchedule = async (id: number) => {
        if (!slug || !token) return;
        const res = await deleteSchedule(slug, token, id);
        if (res) await loadSchedules();
        return res;
    };

    const loadTenantTerms = useCallback(async () => {
        if (!slug || !token) return;
        setTermsLoading(true);
        const data = await getTenantTerms(slug, token);
        setTenantTerms(data?.terms ?? null);
        setTermsLoading(false);
    }, [slug, token]);

    const handleUpdateTenantTerms = async (content: string) => {
        if (!slug || !token) return;
        const res = await updateTenantTerms(slug, token, content);
        if (res?.terms) setTenantTerms(res.terms);
        return res;
    };

    const longPressTimer = useRef<NodeJS.Timeout | undefined>(undefined);

    const handleLongPressStart = (payerId: string) => {
        longPressTimer.current = setTimeout(() => {
            const payer = payers.find(p => String(p.id) === String(payerId));
            if (payer) setBubbleModalPayer(payer);
        }, 600);
    };

    const handleLongPressEnd = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!expenseForm.title || !expenseForm.amount || !slug || !token) {
            setExpenseFormError('Completa los campos requeridos');
            return;
        }
        setExpenseSubmitting(true);
        setExpenseFormError('');
        const fd = new FormData();
        fd.append('title', expenseForm.title);
        fd.append('description', expenseForm.description);
        fd.append('amount', expenseForm.amount);
        fd.append('category', expenseForm.category);
        fd.append('expense_date', expenseForm.expense_date);
        if (expenseReceiptPhoto) fd.append('receipt_photo', expenseReceiptPhoto);
        if (expenseProductPhoto) fd.append('product_photo', expenseProductPhoto);

        const res = await createExpense(slug, token, fd);
        if (res?.expense) {
            setExpenseForm({ title: '', description: '', amount: '', category: 'Materiales escolares', expense_date: new Date().toISOString().split('T')[0] });
            setExpenseReceiptPhoto(null);
            setExpenseProductPhoto(null);
            await loadExpenses();
            return true;
        } else {
            setExpenseFormError(res?.message ?? 'Error al guardar');
            return false;
        }
    };

    const handleDeleteExpense = async (id: number) => {
        if (!confirm('¿Eliminar este gasto?') || !slug || !token) return;
        setExpenseDeletingId(id);
        await deleteExpense(slug, token, id);
        await loadExpenses();
        setExpenseDeletingId(null);
    };

    const toggleAttendance = async (rawId: string | number) => {
        if (!slug || !token) return;
        const studentId = String(rawId);
        const isPresent = !!(payers.flatMap(p => p.enrolledStudents || p.students || []).find(s => String(s.id) === studentId && s.today_status === 'present'));

        if (isPresent) {
            await deleteAttendance(slug, token, studentId);
        } else {
            await storeAttendance(slug, token, { student_id: studentId, status: 'present' });
        }
        await refreshPayers();
    };

    const markAllNotificationsReadHandler = async (customSlug?: string, customToken?: string | null) => {
        const s = customSlug || slug;
        const t = customToken || token;
        if (!s || !t) return;
        await markAllNotificationsRead(s, t);
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const markNotificationReadHandler = async (customSlug?: string, customToken?: string | null, id?: number) => {
        // Handle cases where id is the first, second or third argument based on how page.tsx calls it
        // page.tsx line 283: markNotificationRead(branding.slug, token, n.id);
        const s = typeof customSlug === 'string' ? customSlug : slug;
        const t = typeof customToken === 'string' ? customToken : token;
        const realId = typeof id === 'number' ? id : (typeof customToken === 'number' ? customToken : undefined);
        
        if (!s || !t || realId === undefined) return;
        await markNotificationRead(s, t, realId);
        setUnreadCount(c => Math.max(0, c - 1));
        setNotifications(prev => prev.map(n => n.id === realId ? { ...n, read: true } : n));
    };

    const activeSchedule = useMemo(() => {
        if (!schedulesList.length) return null;
        const now = nowCL();
        const dow = now.getDay();
        const currentTime = now.toLocaleTimeString('en-GB', { hour12: false });
        
        return schedulesList.find(s => {
            if (s.day_of_week !== dow) return false;
            // Pad times if needed (HH:mm)
            const start = s.start_time.length === 5 ? `${s.start_time}:00` : s.start_time;
            const end = s.end_time.length === 5 ? `${s.end_time}:00` : s.end_time;
            return currentTime >= start && currentTime <= end;
        });
    }, [schedulesList]);

    const formatCLP = (value: number) => {
        if (!value || value === 0) return '';
        return `$ ${new Intl.NumberFormat('es-CL').format(value)}`;
    };

    const parseCLP = (str: string) => {
        const digits = str.replace(/\D/g, '');
        return digits === '' ? 0 : parseInt(digits, 10);
    };

    return useMemo(() => ({
        payers, setPayers,
        notifications, setNotifications, unreadCount, setUnreadCount,
        appUpdates, setAppUpdates, schedulesList, setSchedulesList,
        expensesList, setExpensesList, expensesTotal, setExpensesTotal,
        expensesSummary, setExpensesSummary, expensesLoading, setExpensesLoading,
        schedulesLoading, setSchedulesLoading,
        plansList, setPlansList, plansLoading, setPlansLoading,
        expandedPayerId, setExpandedPayerId, historyPage, setHistoryPage,
        copied, setCopied, paymentDropdownOpen, setPaymentDropdownOpen,
        longPressPayerId, setLongPressPayerId, bubbleModalPayer, setBubbleModalPayer,
        generatingPage, setGeneratingPage,
        showPushBanner, setShowPushBanner, pushPermission, setPushPermission,
        tenantTerms, setTenantTerms, termsLoading, setTermsLoading,
        expenseForm, setExpenseForm, expenseReceiptPhoto, setExpenseReceiptPhoto,
        expenseProductPhoto, setExpenseProductPhoto, expenseSubmitting, setExpenseSubmitting,
        expenseFormError, setExpenseFormError, expenseDeletingId, setExpenseDeletingId,
        expenseLightbox, setExpenseLightbox,
        activeSchedule,
        refreshPayers, loadExpenses, loadSchedules, loadPlans, loadTenantTerms, toggleAttendance,
        handleCreateExpense, handleDeleteExpense, handleLongPressStart, handleLongPressEnd,
        handleCreatePlan, handleUpdatePlan, handleDeletePlan,
        handleCreateSchedule, handleUpdateSchedule, handleDeleteSchedule,
        handleUpdateTenantTerms,
        markAllNotificationsRead: markAllNotificationsReadHandler,
        markNotificationRead: markNotificationReadHandler,
        formatCLP, parseCLP
    }), [
        payers, notifications, unreadCount, appUpdates, schedulesList, 
        expensesList, expensesTotal, expensesSummary, expensesLoading, schedulesLoading,
        longPressPayerId, bubbleModalPayer, generatingPage, 
        showPushBanner, pushPermission, tenantTerms, termsLoading, expenseForm, expenseReceiptPhoto, 
        expenseProductPhoto, expenseSubmitting, expenseFormError, expenseDeletingId, 
        expenseLightbox, activeSchedule, refreshPayers, loadExpenses, loadSchedules, loadPlans, loadTenantTerms, toggleAttendance,
        handleCreateExpense, handleDeleteExpense, handleLongPressStart, handleLongPressEnd,
        handleCreatePlan, handleUpdatePlan, handleDeletePlan,
        handleCreateSchedule, handleUpdateSchedule, handleDeleteSchedule,
        handleUpdateTenantTerms,
        markAllNotificationsReadHandler, markNotificationReadHandler
    ]);
}
