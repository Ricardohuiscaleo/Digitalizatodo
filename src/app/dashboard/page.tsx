"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { getEcho, reconnect } from '@/lib/echo';
import { todayCL, nowCL } from '@/lib/utils';
import { QRCodeCanvas } from 'qrcode.react';
import DynamicQRModal from '@/components/Dashboard/DynamicQRModal';
import FeesSection from '@/components/Dashboard/FeesSection';
import ExpensesSection from '@/components/Dashboard/ExpensesSection';
import OverviewSection from '@/components/Dashboard/OverviewSection';
import {
    Users,
    CreditCard,
    Settings,
    LayoutDashboard,
    CheckCircle2,
    XCircle,
    CalendarCheck,
    Search,
    ChevronDown,
    ChevronUp,
    Camera,
    LogOut,
    RefreshCw,
    ChevronRight,
    Plus,
    Loader2,
    ClipboardPaste,
    QrCode,
    Eye,
    X,
    Clock,
    UserCheck,
    Check,
    Sparkles,
    Edit2,
    Save,
    Calendar,
    DollarSign,
    User,
    Bell,
    ChevronLeft,
    Trash2,
    Banknote,
    Receipt,
    Package,
    ShoppingCart,
    UserPlus,
    ClipboardCheck
} from 'lucide-react';
import { useBranding } from "@/context/BrandingContext";
import NotificationToast from "@/components/Notifications/NotificationToast";
import {
    getProfile,
    getPayers,
    storeAttendance,
    approvePayment,
    updateLogo,
    updatePricing,
    generateRegistrationPage,
    getRegistrationPageCode,
    deleteRegistrationPage,
    getAttendanceHistory,
    resumeSession,
    updateBankInfo,
    deleteAttendance,
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
    createSchedule,
    updateSchedule,
    deleteSchedule
} from "@/lib/api";
import WeeklySchedule from "@/components/Schedule/WeeklySchedule";
import { ExpenseCard } from "@/app/dashboard/expenses/page";
import { unlockAudio, setAppBadge } from "@/lib/audio";
import { subscribeToPush } from "@/lib/push";
import PaymentsSection from "@/components/Dashboard/PaymentsSection";
import AppUpdatesAccordion from "@/components/Dashboard/AppUpdatesAccordion";
import AttendanceSection from "@/components/Dashboard/AttendanceSection";
import FeesGuardiansSection from "@/components/Dashboard/Industries/SchoolTreasury/FeesGuardiansSection";
import ScheduleSection from "@/components/Dashboard/ScheduleSection";
import SettingsSection from "@/components/Dashboard/SettingsSection";
import ProfileSection from "@/components/Dashboard/ProfileSection";
import OverviewTreasury from "@/components/Dashboard/Industries/SchoolTreasury/OverviewTreasury";
import AttendanceMartialArts from "@/components/Dashboard/Industries/MartialArts/AttendanceMartialArts";

import {
    PaymentActionModal,
    HistoryDetailModal,
    ProofModal
} from '@/components/Dashboard/Admin/AdminModals';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import TermsModal from '@/components/Dashboard/TermsModal';


const EXPENSE_CATEGORIES = ["Materiales escolares", "Insumos de aseo", "Alimentación", "Actividades", "Infraestructura", "Servicios básicos", "Fiestas Patrias", "Navidad", "Pascua", "Día del Alumno", "Día del Profesor", "Otros"];

export default function App() {
    const { branding, setBranding } = useBranding();
    const [isDark, setIsDark] = useState(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem('tenant_industry') === 'martial_arts';
    });
    const isMartialArts = branding?.industry === 'martial_arts';

    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        activeTab, setActiveTab, changeTab, tabDirection,
        payers, setPayers, attendance, loading, token, user, isDemo,
        prices, setPrices, bankData, setBankData,
        searchTerm, setSearchTerm, paymentFilter, setPaymentFilter,
        selectedMonth, setSelectedMonth, selectedYear, setSelectedYear,
        expandedPayerId, setExpandedPayerId, historyPage, setHistoryPage,
        historyMonth, setHistoryMonth, historyYear, setHistoryYear,
        attendanceHistory, setAttendanceHistory, now, setNow, copied, setCopied,
        paymentDropdownOpen, setPaymentDropdownOpen, longPressPayerId, setLongPressPayerId,
        longPressTimer, bubbleModalPayer, setBubbleModalPayer, regPageCode, setRegPageCode,
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
        feesGuardianFilter, setFeesGuardianFilter, 
        feesGuardianDropdown, setFeesGuardianDropdown, feesBubbleModal, setFeesBubbleModal,
        feesSearch, setFeesSearch, filteredFees, feesView, setFeesView,
        showInactivePayers, setShowInactivePayers, loadingSync, setLoadingSync,
        lastCheckedInStudent, setLastCheckedInStudent, showPushBanner, setShowPushBanner,
        pushPermission, setPushPermission, showPushModal, setShowPushModal,
        showTermsModal, handleAcceptTerms,
        vocab, handleLogout, forceSync, refreshPayers,

        toggleAttendance, handleConfirmPayment, handleCreateExpense, handleDeleteExpense,
        handleCreateFee, handleApproveFeePayment, handlePriceInput, handleSavePrices,
        handleSaveBankInfo, handleLogoUpload, openFee, markAllNotificationsRead, markNotificationRead,
        loadExpenses, loadSchedules, loadFees,
        formatMoney, formatCLP, parseCLP, handlePaymentApprove, handleActivatePush,
        handleDeleteFee, handleLongPressStart, handleLongPressEnd, handleLoadDemo,
        allStudents, STATUS_LABEL
    } = useAdminDashboard(branding, setBranding);

    if (loading) return (
        <div className={`min-h-screen px-4 pt-6 pb-32 max-w-lg mx-auto space-y-4 animate-pulse ${
            isMartialArts && isDark ? 'bg-[#09090b]' : 'bg-stone-50'
        }`}>
            <div className="flex items-center justify-between mb-2">
                <div className="space-y-2">
                    <div className={`h-7 w-36 rounded-xl ${isMartialArts && isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                    <div className={`h-3 w-48 rounded-lg ${isMartialArts && isDark ? 'bg-zinc-900' : 'bg-zinc-100'}`} />
                </div>
                <div className={`w-14 h-14 rounded-full ${isMartialArts && isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
            </div>
            <div className={`h-36 rounded-[2.5rem] ${isMartialArts && isDark ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
            <div className={`h-4 w-32 rounded-lg ${isMartialArts && isDark ? 'bg-zinc-900' : 'bg-zinc-100'}`} />
            <div className={`h-24 rounded-[2rem] ${isMartialArts && isDark ? 'bg-zinc-900' : 'bg-zinc-100'}`} />
            <div className={`h-24 rounded-[2rem] ${isMartialArts && isDark ? 'bg-zinc-900' : 'bg-zinc-100'}`} />
            <div className={`h-24 rounded-[2rem] ${isMartialArts && isDark ? 'bg-zinc-900' : 'bg-zinc-100'}`} />
        </div>
    );

    return (
        <div className={`flex flex-col h-screen font-sans relative overflow-hidden text-zinc-950 transition-colors duration-500 ${
            isMartialArts && isDark ? 'bg-[#09090b]' : 'bg-white'
        }`}>
            {/* Banner Web Push — aparece una sola vez si nunca ha dado permiso */}
            {showPushBanner && (
                <div className="fixed bottom-24 left-3 right-3 z-[200] animate-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-zinc-900 rounded-2xl p-4 flex items-center gap-3 shadow-2xl border border-white/10">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                            <Bell size={20} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-white leading-tight">Activa las notificaciones</p>
                            <p className="text-[9px] text-white/50 font-bold mt-0.5">Recibe alertas de pagos y asistencia</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => {
                                    localStorage.setItem('push_banner_dismissed', '1');
                                    setShowPushBanner(false);
                                }}
                                className="text-[9px] font-black text-white/40 uppercase tracking-widest px-2 py-1"
                            >
                                Ahora no
                            </button>
                            <button
                                onClick={() => {
                                    setShowPushBanner(false);
                                    handleActivatePush();
                                }}
                                style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}
                                className="text-[9px] font-black text-white uppercase tracking-widest px-3 py-2 rounded-xl"
                            >
                                Activar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <NotificationToast
                notification={toastNotification}
                onDismiss={() => setToastNotification(null)}
                onNavigate={(type) => {
                    if (type === 'attendance') setActiveTab('attendance');
                    else if (type === 'payment') setActiveTab('payments');
                    else setActiveTab('profile');
                }}
            />
            {/* HEADER DINÁMICO - Oculto en Desktop ya que se integra en el Content */}
            <header className={`px-2 py-3 flex items-center justify-between sticky top-0 z-50 border-b shrink-0 md:hidden transition-colors duration-500 ${
                isMartialArts && isDark ? 'bg-zinc-950/90 border-zinc-800' : 'bg-white border-zinc-50'
            }`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center shrink-0 rounded-full overflow-hidden border border-zinc-100 shadow-sm">
                        {branding?.logo ? (
                            <img src={branding.logo} className="w-full h-full object-cover" alt="L" />
                        ) : (
                            <span className="font-black text-xl uppercase tracking-tighter text-zinc-950">{branding?.name?.[0] || 'D'}</span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h1 className={`text-lg font-black uppercase tracking-tighter leading-none ${ isDark ? 'text-white' : 'text-zinc-950' }`}>{branding?.name || 'Academy'}</h1>
                            <button onClick={() => setShowPushModal(true)} className="shrink-0 mt-0.5">
                                <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm transition-colors duration-500 ${
                                    pushPermission === 'granted' ? 'bg-emerald-500 animate-pulse' :
                                    pushPermission === 'denied'  ? 'bg-red-500' :
                                    'bg-amber-400'
                                }`} />
                            </button>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: branding?.primaryColor || '#6366f1' }}>{activeTab === 'dashboard' ? 'Resumen' : activeTab === 'attendance' ? vocab.attendance : activeTab === 'payments' ? (branding?.industry === 'school_treasury' ? 'Cuotas' : 'Pagos') : activeTab === 'settings' ? 'Ajustes' : 'Perfil'}</span>
                            {isDemo && <span className="bg-emerald-500/10 text-emerald-600 text-[6px] font-black px-1 py-0.5 rounded uppercase tracking-widest">DEMO</span>}
                        </div>
                    </div>
                </div>
                {/* Notification Bell */}
                <div className="flex items-center gap-2">
                    {isMartialArts && (
                        <button onClick={() => setIsDark(d => !d)}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 border ${
                                isDark ? 'bg-zinc-900 border-zinc-700 text-[#c9a84c]' : 'bg-zinc-50 border-zinc-100 text-zinc-400'
                            }`}>
                            {isDark
                                ? <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
                                : <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                            }
                        </button>
                    )}
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative w-10 h-10 flex items-center justify-center rounded-full border border-zinc-100 shadow-sm bg-white"
                    >
                        <Bell size={20} className="text-zinc-600" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>
                        )}
                    </button>
                </div>
            </header>

            {/* Notification Dropdown */}
            {showNotifications && (
                <div className="fixed inset-0 z-[100] md:hidden" onClick={() => setShowNotifications(false)}>
                    <div className="absolute top-16 right-2 w-80 max-h-96 bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-zinc-50 flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Notificaciones</span>
                            {unreadCount > 0 && (
                                <button onClick={async () => {
                                    if (branding?.slug && token) {
                                        await markAllNotificationsRead(branding.slug, token);
                                        setUnreadCount(0);
                                        setNotifications(n => n.map(x => ({ ...x, read: true })));
                                    }
                                }} className="text-[9px] font-black text-zinc-400 hover:text-zinc-600">Marcar leídas</button>
                            )}
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                            {notifications.length > 0 ? notifications.map((n: any) => (
                                <div
                                    key={n.id}
                                    onClick={async () => {
                                        if (!n.read && branding?.slug && token) {
                                            markNotificationRead(branding.slug, token, n.id);
                                            setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
                                            setUnreadCount(c => Math.max(0, c - 1));
                                        }
                                        if (n.type === 'attendance') setActiveTab('attendance');
                                        else if (n.type === 'payment') setActiveTab('payments');
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
                                <div className="p-8 text-center">
                                    <Bell size={24} className="text-zinc-200 mx-auto mb-2" />
                                    <p className="text-xs text-zinc-300">Sin notificaciones</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden">
                {/* SIDEBAR DESKTOP */}
                <aside className="hidden md:flex flex-col w-64 bg-white border-r border-zinc-100 p-6 gap-8">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-10 h-10 flex items-center justify-center shrink-0 rounded-full overflow-hidden border-2 border-zinc-100">
                            {branding?.logo ? (
                                <img src={branding.logo} className="w-full h-full object-cover" alt="L" />
                            ) : (
                                <span className="font-black text-xl uppercase tracking-tighter text-zinc-950">{branding?.name?.[0] || 'D'}</span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className={`text-sm font-black uppercase tracking-tighter text-zinc-950 truncate leading-none ${ isDark ? 'text-white' : 'text-zinc-950' }`}>{branding?.name || 'Academy'}</h2>
                                <button onClick={() => setShowPushModal(true)} className="shrink-0">
                                    <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm transition-colors duration-500 ${
                                        pushPermission === 'granted' ? 'bg-emerald-500 animate-pulse' :
                                        pushPermission === 'denied'  ? 'bg-red-500' :
                                        'bg-amber-400'
                                    }`} />
                                </button>
                            </div>
                            <p className="text-[8px] font-black uppercase tracking-widest mt-1" style={{ color: branding?.primaryColor || '#6366f1' }}>Software de Gestión</p>
                        </div>
                    </div>

                    <nav className="flex flex-col gap-2">
                        <SidebarButton icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => changeTab('dashboard')} primaryColor={branding?.primaryColor} />
                        <SidebarButton icon={Users} label={vocab.attendance} active={activeTab === 'attendance'} onClick={() => changeTab('attendance')} primaryColor={branding?.primaryColor} />
                        <SidebarButton icon={CreditCard} label={branding?.industry === 'school_treasury' ? 'Cuotas' : 'Pagos'} active={activeTab === 'payments'} onClick={() => changeTab('payments')} primaryColor={branding?.primaryColor} />
                        <SidebarButton icon={Settings} label="Ajustes" active={activeTab === 'settings'} onClick={() => changeTab('settings')} primaryColor={branding?.primaryColor} />
                    </nav>

                    <div className="mt-auto pt-6 border-t border-zinc-50 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-100">
                            <img src="/DLogo-v2.webp" className="w-full h-full object-cover" alt="D" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-zinc-900 truncate leading-none uppercase">{user?.name || 'Admin'}</p>
                            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Administrator</p>
                        </div>
                        <button onClick={() => { localStorage.clear(); window.location.href = "/"; }} className="text-zinc-300 hover:text-rose-500 transition-colors">
                            <LogOut size={16} />
                        </button>
                    </div>
                </aside>

                {/* CONTENIDO PRINCIPAL */}
                <main className={`flex-1 overflow-y-auto pb-28 md:pb-8 hide-scrollbar relative transition-colors duration-500 ${
                    isMartialArts && isDark ? 'bg-[#09090b]' : 'bg-white'
                }`}>
                    <div className="max-w-6xl mx-auto py-2 md:py-8 px-2 md:px-8">
                        <div key={activeTab} className="w-full animate-in fade-in duration-150">
                            <div className="hidden md:flex justify-between items-center mb-8">
                                <h2 className={`text-2xl font-black uppercase tracking-tighter ${ isDark ? 'text-white' : 'text-zinc-950' }`}>
                                    {activeTab === 'dashboard' ? 'Resumen General' : activeTab === 'attendance' ? vocab.attendance : activeTab === 'payments' ? (branding?.industry === 'school_treasury' ? 'Cuotas' : 'Estado de Pagos') : activeTab === 'settings' ? 'Configuración' : 'Mi Perfil'}
                                </h2>
                                {isDemo && <span className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Modo Demo Activo</span>}
                            </div>
                            {activeTab === 'dashboard' && (
                                <OverviewSection 
                                    allStudents={allStudents}
                                    attendance={attendance}
                                    attendanceHistory={attendanceHistory}
                                    historyMonth={historyMonth}
                                    setHistoryMonth={setHistoryMonth}
                                    historyYear={historyYear}
                                    setHistoryYear={setHistoryYear}
                                    historyPage={historyPage}
                                    setHistoryPage={setHistoryPage}
                                    branding={branding}
                                    now={now}
                                    setSelectedHistoryDate={setSelectedHistoryDate}
                                    schedulesList={schedulesList}
                                    feesSummary={feesSummary}
                                    vocab={vocab}
                                    setActiveTab={setActiveTab}
                                    isDark={isDark}
                                />
                            )}
                            {activeTab === 'attendance' && (
                                branding?.industry === 'martial_arts' ? (
                                    <AttendanceMartialArts
                                        allStudents={allStudents}
                                        attendance={attendance}
                                        searchTerm={searchTerm}
                                        setSearchTerm={setSearchTerm}
                                        attendanceHistory={attendanceHistory}
                                        toggleAttendance={toggleAttendance}
                                        setSelectedHistoryDate={setSelectedHistoryDate}
                                        setShowQRModal={setShowQRModal}
                                        branding={branding}
                                        vocab={vocab}
                                        token={token}
                                        onStudentUpdated={forceSync}
                                        isDark={isDark}
                                    />
                                ) : (
                                <AttendanceSection 
                                    allStudents={allStudents}
                                    attendance={attendance}
                                    searchTerm={searchTerm}
                                    setSearchTerm={setSearchTerm}
                                    attendanceHistory={attendanceHistory}
                                    formatMoney={formatMoney}
                                    toggleAttendance={toggleAttendance}
                                    setSelectedHistoryDate={setSelectedHistoryDate}
                                    setShowQRModal={setShowQRModal}
                                    branding={branding}
                                    vocab={vocab}
                                />
                                )
                            )}
                            {activeTab === 'payments' && (
                                branding?.industry === 'school_treasury' ? (
                                    <FeesGuardiansSection 
                                        payers={feesGuardians}
                                        feesSearch={feesSearch}
                                        setFeesSearch={setFeesSearch}
                                        branding={branding}
                                        setShowCreateFee={setShowCreateFee}
                                        feesGuardiansLoading={feesGuardiansLoading}
                                        feesBubbleModal={feesBubbleModal}
                                        setFeesBubbleModal={setFeesBubbleModal}
                                        approvingFeePayment={approvingFeePayment}
                                        setApprovingFeePayment={setApprovingFeePayment}
                                        selectedFee={selectedFee}
                                        setSelectedFee={setSelectedFee}
                                        feeApproveMethod={feeApproveMethod}
                                        setFeeApproveMethod={setFeeApproveMethod}
                                        feeApproveNotes={feeApproveNotes}
                                        setFeeApproveNotes={setFeeApproveNotes}
                                        feeApprovingLoading={feeApprovingLoading}
                                        handleApproveFeePayment={handleApproveFeePayment}
                                        setProofModalUrl={setProofModalUrl}
                                        formatMoney={formatMoney}
                                        vocab={vocab}
                                        token={token}
                                        onDeleteSuccess={refreshPayers}
                                    />
                                ) : (
                                    <PaymentsSection 
                                        payers={payers}
                                        searchTerm={searchTerm}
                                        setSearchTerm={setSearchTerm}
                                        paymentFilter={paymentFilter}
                                        setPaymentFilter={setPaymentFilter}
                                        selectedMonth={selectedMonth}
                                        setSelectedMonth={setSelectedMonth}
                                        selectedYear={selectedYear}
                                        setSelectedYear={setSelectedYear}
                                        paymentDropdownOpen={paymentDropdownOpen}
                                        setPaymentDropdownOpen={setPaymentDropdownOpen}
                                        expandedPayerId={expandedPayerId}
                                        setExpandedPayerId={setExpandedPayerId}
                                        branding={branding}
                                        formatMoney={formatMoney}
                                        handlePaymentApprove={handlePaymentApprove}
                                        handleLongPressStart={handleLongPressStart}
                                        handleLongPressEnd={handleLongPressEnd}
                                        setBubbleModalPayer={setBubbleModalPayer}
                                        setProofModalUrl={setProofModalUrl}
                                        bubbleModalPayer={bubbleModalPayer}
                                        vocab={vocab}
                                        isDark={isDark}
                                    />
                                )
                            )}
                            {activeTab === 'settings' && (
                                <SettingsSection 
                                    branding={branding}
                                    user={user}
                                    token={token}
                                    vocab={vocab}
                                    fileInputRef={fileInputRef}
                                    handleLogoUpload={handleLogoUpload}
                                    handleLoadDemo={handleLoadDemo}
                                    regPageCode={regPageCode}
                                    setRegPageCode={setRegPageCode}
                                    generatingPage={generatingPage}
                                    setGeneratingPage={setGeneratingPage}
                                    prices={prices}
                                    setPrices={setPrices}
                                    handlePriceInput={handlePriceInput}
                                    handleSavePrices={handleSavePrices}
                                    bankData={bankData}
                                    setBankData={setBankData}
                                    handleSaveBankData={handleSaveBankInfo}
                                    formatCLP={formatCLP}
                                    showInactivePayers={showInactivePayers}
                                    setShowInactivePayers={setShowInactivePayers}
                                    loadingSync={loadingSync}
                                    forceSync={forceSync}
                                    handleLogout={handleLogout}
                                />
                            )}
                            {activeTab === 'profile' && (
                                <ProfileSection 
                                    user={user}
                                    branding={branding}
                                    appUpdates={appUpdates}
                                    changeTab={changeTab}
                                    isDark={isDark}
                                />
                            )}
                            {activeTab === 'fees' && (
                                <FeesSection 
                                    feesList={filteredFees}
                                    feesLoading={feesLoading}
                                    feeSubmitting={feeSubmitting}
                                    feeForm={feeForm}
                                    setFeeForm={setFeeForm}
                                    feeFormError={feeFormError}
                                    showCreateFee={showCreateFee}
                                    setShowCreateFee={setShowCreateFee}
                                    loadFees={loadFees}
                                    handleCreateFee={handleCreateFee}
                                    handleDeleteFee={handleDeleteFee}
                                    formatMoney={formatMoney}
                                    formatCLP={formatCLP}
                                    parseCLP={parseCLP}
                                    nowCL={nowCL}
                                    STATUS_LABEL={STATUS_LABEL}
                                    selectedFee={selectedFee}
                                    setSelectedFee={setSelectedFee}
                                    feeDetailLoading={feeDetailLoading}
                                    feePayments={feePayments}
                                    openFee={openFee}
                                    approvingFeePayment={approvingFeePayment}
                                    setApprovingFeePayment={setApprovingFeePayment}
                                    feeApproveMethod={feeApproveMethod}
                                    setFeeApproveMethod={setFeeApproveMethod}
                                    feeApproveNotes={feeApproveNotes}
                                    setFeeApproveNotes={setFeeApproveNotes}
                                    handleApproveFeePayment={handleApproveFeePayment}
                                    feeApprovingLoading={feeApprovingLoading}
                                    feeProofUrl={feeProofUrl}
                                    setFeeProofUrl={setFeeProofUrl}
                                    branding={branding}
                                    feesSearch={feesSearch}
                                    setFeesSearch={setFeesSearch}
                                    feesView={feesView}
                                    setFeesView={setFeesView}
                                    feesGuardians={feesGuardians}
                                    feesGuardiansLoading={feesGuardiansLoading}
                                />
                            )}
                            {activeTab === 'expenses' && (
                                <ExpensesSection 
                                    feesList={feesList}
                                    expensesTotal={expensesTotal}
                                    expensesSummary={expensesSummary}
                                    expensesList={expensesList}
                                    expensesLoading={expensesLoading}
                                    showCreateExpense={showCreateExpense}
                                    setShowCreateExpense={setShowCreateExpense}
                                    expenseLightbox={expenseLightbox}
                                    setExpenseLightbox={setExpenseLightbox}
                                    handleDeleteExpense={handleDeleteExpense}
                                    expenseDeletingId={expenseDeletingId}
                                    expenseFormError={expenseFormError}
                                    handleCreateExpense={handleCreateExpense}
                                    expenseForm={expenseForm}
                                    setExpenseForm={setExpenseForm}
                                    setExpenseReceiptPhoto={setExpenseReceiptPhoto}
                                    setExpenseProductPhoto={setExpenseProductPhoto}
                                    expenseSubmitting={expenseSubmitting}
                                    formatCLP={formatCLP}
                                    parseCLP={parseCLP}
                                    EXPENSE_CATEGORIES={EXPENSE_CATEGORIES}
                                />
                            )}
                            {activeTab === 'schedule' && (
                                <ScheduleSection 
                                    schedulesLoading={schedulesLoading}
                                    schedulesList={schedulesList}
                                    branding={branding}
                                    token={token}
                                    loadSchedules={loadSchedules}
                                />
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* QR DINAMICO MODAL */}
            {showQRModal && (
                <DynamicQRModal 
                    tenantSlug={branding?.slug ?? ''} 
                    authToken={token ?? ''} 
                    onClose={() => { setShowQRModal(false); setLastCheckedInStudent(null); }}
                    primaryColor={branding?.primaryColor || '#a855f7'}
                    payers={payers}
                    checkedInStudent={lastCheckedInStudent}
                    onStudentAcknowledged={() => setLastCheckedInStudent(null)}
                />
            )}

            {/* MODAL PUSH PERMISSIONS */}
            {showPushModal && (
                <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-end justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowPushModal(false)}>
                    <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-4 duration-300 overflow-hidden" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="relative px-6 pt-8 pb-6" style={{ background: `linear-gradient(135deg, ${branding?.primaryColor || '#6366f1'}15, ${branding?.primaryColor || '#6366f1'}05)` }}>
                            <button onClick={() => setShowPushModal(false)} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center">
                                <X size={14} className="text-zinc-400" />
                            </button>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm ${
                                pushPermission === 'granted' ? 'bg-emerald-100' :
                                pushPermission === 'denied'  ? 'bg-red-100' : ''
                            }`} style={pushPermission === 'default' ? { backgroundColor: `${branding?.primaryColor || '#6366f1'}20` } : {}}>
                                <Bell size={26} className={`${
                                    pushPermission === 'granted' ? 'text-emerald-500' :
                                    pushPermission === 'denied'  ? 'text-red-400' : ''
                                }`} style={pushPermission === 'default' ? { color: branding?.primaryColor || '#6366f1' } : {}} />
                            </div>
                            <h3 className="text-base font-black text-zinc-900 leading-tight">
                                {pushPermission === 'granted' ? 'Notificaciones activas ✓' :
                                 pushPermission === 'denied'  ? 'Notificaciones bloqueadas' :
                                 'Activa las alertas del panel'}
                            </h3>
                            <p className="text-xs text-zinc-400 mt-1 font-medium">
                                {pushPermission === 'granted'
                                    ? 'Recibirás alertas aunque la app esté cerrada.'
                                    : pushPermission === 'denied'
                                    ? 'Ve a Ajustes → Safari → Notificaciones para activarlas.'
                                    : 'Entérate al instante de lo que pasa en tu academia.'}
                            </p>
                        </div>

                        {/* Beneficios — solo si no está activado/bloqueado */}
                        {pushPermission === 'default' && (
                            <div className="px-6 pb-2 space-y-3">
                                {(branding?.industry === 'school_treasury' ? [
                                    { icon: <CreditCard size={16} style={{ color: branding?.primaryColor || '#6366f1' }} />, text: 'Pagos y comprobantes de cuotas' },
                                    { icon: <UserPlus size={16} style={{ color: branding?.primaryColor || '#6366f1' }} />, text: 'Nuevos alumnos registrados' },
                                    { icon: <Calendar size={16} style={{ color: branding?.primaryColor || '#6366f1' }} />, text: 'Cambios de horario y actividades' },
                                    { icon: <ClipboardCheck size={16} style={{ color: branding?.primaryColor || '#6366f1' }} />, text: 'Recordatorios y reuniones' },
                                ] : [
                                    { icon: <CreditCard size={16} style={{ color: branding?.primaryColor || '#6366f1' }} />, text: 'Pagos recibidos y comprobantes' },
                                    { icon: <ClipboardCheck size={16} style={{ color: branding?.primaryColor || '#6366f1' }} />, text: 'Asistencia marcada por QR' },
                                    { icon: <UserPlus size={16} style={{ color: branding?.primaryColor || '#6366f1' }} />, text: 'Nuevos alumnos registrados' },
                                    { icon: <Calendar size={16} style={{ color: branding?.primaryColor || '#6366f1' }} />, text: 'Recordatorios y actividades' },
                                ]).map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${branding?.primaryColor || '#6366f1'}12` }}>
                                            {item.icon}
                                        </div>
                                        <span className="text-xs font-semibold text-zinc-700">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Botones */}
                        <div className="px-6 pt-4 pb-8 space-y-2">
                            {pushPermission === 'default' && (
                                <button
                                    onClick={handleActivatePush}
                                    style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}
                                    className="w-full py-4 rounded-2xl text-white font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg"
                                >
                                    Activar notificaciones
                                </button>
                            )}
                            <button
                                onClick={() => { setShowPushModal(false); localStorage.setItem('push_banner_dismissed', '1'); }}
                                className="w-full py-3 text-zinc-400 font-bold text-[10px] uppercase tracking-widest"
                            >
                                {pushPermission === 'default' ? 'Ahora no' : 'Cerrar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL TERMINOS Y CONDICIONES (BLOQUEANTE) */}
            <TermsModal 
                isOpen={showTermsModal} 
                onAccept={handleAcceptTerms} 
                primaryColor={branding?.primaryColor} 
            />

            {/* MODAL DE COMPROBANTE */}

            {proofModalUrl && (
                <ProofModal 
                    url={proofModalUrl} 
                    onClose={() => setProofModalUrl(null)} 
                />
            )}

            {/* Modal de Detalle de Historial */}
            {selectedHistoryDate && (
<HistoryDetailModal 
                    date={selectedHistoryDate}
                    records={attendanceHistory.filter((r: any) => (r.date || r.created_at?.split('T')[0]) === selectedHistoryDate)}
                    allStudents={allStudents}
                    attendanceHistory={attendanceHistory}
                    branding={branding}
                    onClose={() => setSelectedHistoryDate(null)}
                />
            )}

            {/* MODAL DE ACCIÓN DE PAGO */}
            {paymentActionPayer && (
                <PaymentActionModal
                    payer={paymentActionPayer}
                    formatMoney={formatMoney}
                    onConfirm={async () => {
                        if (paymentActionPayer) {
                            await handleConfirmPayment();
                            setPaymentActionPayer(null);
                        }
                    }}
                    onCancel={() => setPaymentActionPayer(null)}
                    primaryColor={branding?.primaryColor || '#6366f1'}
                />
            )}

            {/* NAV CON ESTILO PREMIUM - Solo visible en Mobile */}
            <nav className={`fixed bottom-0 left-0 right-0 pt-3 pb-8 px-6 flex justify-between items-center h-22 z-50 md:hidden transition-colors duration-500 ${
                isMartialArts && isDark ? 'bg-zinc-950/95 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-50 text-zinc-950'
            } border-t`}>
                <TabButton icon={LayoutDashboard} label="Inicio" active={activeTab === 'dashboard'} onClick={() => changeTab('dashboard')} primaryColor={branding?.primaryColor} />
                {branding?.industry !== 'school_treasury' && (
                    <TabButton icon={Users} label={vocab.attendance} active={activeTab === 'attendance'} onClick={() => changeTab('attendance')} primaryColor={branding?.primaryColor} />
                )}
                <TabButton icon={CreditCard} label={branding?.industry === 'school_treasury' ? 'Cuotas' : 'Pagos'} active={activeTab === 'payments'} onClick={() => changeTab('payments')} primaryColor={branding?.primaryColor} />
                {branding?.industry === 'school_treasury' && (
                    <TabButton icon={ShoppingCart} label="Compras" active={activeTab === 'expenses'} onClick={() => changeTab('expenses')} primaryColor={branding?.primaryColor} />
                )}
                {branding?.industry === 'school_treasury' && (
                    <TabButton icon={Calendar} label="Horario" active={activeTab === 'schedule'} onClick={() => changeTab('schedule')} primaryColor={branding?.primaryColor} />
                )}
                {/* Profile tab con foto */}
                <button
                    onClick={() => changeTab('profile')}
                    className="flex flex-col items-center gap-1 transition-all duration-200"
                    style={{ color: activeTab === 'profile' ? (branding?.primaryColor || '#6366f1') : '#a1a1aa' }}
                >
                    <div className={`p-2 transition-all duration-300 ${activeTab === 'profile' ? 'rounded-2xl shadow-sm' : 'bg-transparent'}`} style={activeTab === 'profile' ? { backgroundColor: `${branding?.primaryColor || '#6366f1'}15` } : {}}>
                        <div className={`w-[22px] h-[22px] rounded-full overflow-hidden border-2 ${activeTab === 'profile' ? '' : 'border-transparent'}`} style={activeTab === 'profile' ? { borderColor: branding?.primaryColor || '#6366f1' } : {}}>
                            <img src={user?.photo || '/DLogo-v2.webp'} className="w-full h-full object-cover" alt="" />
                        </div>
                    </div>
                    <span className={`text-[7px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'profile' ? 'opacity-100' : 'opacity-60'}`}>Perfil</span>
                </button>
            </nav>

            <style dangerouslySetInnerHTML={{
                __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
        </div>
    );
}

function SidebarButton({ icon: Icon, label, active, onClick, primaryColor }: { icon: any, label: string, active: boolean, onClick: () => void, primaryColor?: string }) {
    return (
        <button onClick={onClick} 
            style={active ? { backgroundColor: primaryColor || '#6366f1' } : {}}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 w-full group ${active ? 'text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600'}`}>
            <Icon size={20} strokeWidth={active ? 3 : 2} className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
            <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );
}

function TabButton({ icon: Icon, label, active, onClick, primaryColor = '#000' }: { icon: any, label: string, active: boolean, onClick: () => void, primaryColor?: string }) {
    return (
        <button 
            onClick={onClick} 
            className={`flex flex-col items-center gap-1 transition-all duration-200 ${active ? '' : 'text-zinc-400 hover:text-zinc-600'}`}
            style={active ? { color: primaryColor } : {}}
        >
            <div 
                className={`p-2 transition-all duration-300 ${active ? 'rounded-2xl shadow-sm' : 'bg-transparent'}`}
                style={active ? { backgroundColor: `${primaryColor}15` } : {}}
            >
                <Icon size={22} strokeWidth={active ? 3 : 2.5} />
            </div>
            <span className={`text-[7px] font-black uppercase tracking-[0.2em] transition-all ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
        </button>
    );
}
