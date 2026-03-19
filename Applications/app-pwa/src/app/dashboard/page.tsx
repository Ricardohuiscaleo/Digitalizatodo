"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { getEcho, reconnect } from '@/lib/echo';
import { todayCL, nowCL } from '@/lib/utils';
import { QRCodeCanvas } from 'qrcode.react';
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
    ShoppingCart
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

/* ─── Proof Modal Component ─── */
/* ─── Payment Action Modal ─── */
/* ─── Payment Action Modal ─── */
function ExpensePhotoInput({ label, icon: Icon, onChange }: { label: string; icon: React.ElementType; onChange: (f: File | null) => void }) {
    const ref = React.useRef<HTMLInputElement>(null);
    const [preview, setPreview] = React.useState<string | null>(null);
    const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        onChange(file);
        setPreview(file ? URL.createObjectURL(file) : null);
    };
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</label>
            <div onClick={() => ref.current?.click()} className="relative h-28 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex items-center justify-center cursor-pointer overflow-hidden hover:border-zinc-400 transition-colors">
                {preview ? <img src={preview} className="w-full h-full object-cover" /> : (
                    <div className="flex flex-col items-center gap-1 text-zinc-300">
                        <Icon size={22} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Subir foto</span>
                    </div>
                )}
                <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handle} />
            </div>
        </div>
    );
}

function PaymentActionModal({ payer, onConfirm, onCancel, primaryColor, formatMoney }: { payer: any; onConfirm: () => void; onCancel: () => void; primaryColor: string; formatMoney: (n: number) => string }) {
    const pendingDetails = payer.payments?.filter((p: any) => p.status === 'review' || p.status === 'pending' || p.status === 'overdue') || [];
    const totalAmount = pendingDetails.reduce((acc: number, p: any) => acc + p.amount, 0);

    return (
        <div className="fixed inset-0 z-[200] bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onCancel}>
            <div className="bg-zinc-50 rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-white/20 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                
                {/* Header: Perfil del Titular */}
                <div className="relative pt-8 pb-6 px-6 bg-white border-b border-zinc-100">
                    <div className="flex flex-col items-center text-center">
                        <div className="relative mb-3">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-zinc-50 shadow-md">
                                <img src={payer.photo} className="w-full h-full object-cover" alt={payer.name} />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full border-4 border-white shadow-sm">
                                <CheckCircle2 size={14} />
                            </div>
                        </div>
                        <h3 className="text-base font-black uppercase text-zinc-900 leading-tight mb-1">{payer.name}</h3>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                            <Users size={10} /> Titular de Cuenta
                        </div>
                    </div>
                </div>

                {/* Body: Detalle de Alumnos */}
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-[1px] flex-1 bg-zinc-200"></div>
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] px-2">Detalle de Cobro</span>
                        <div className="h-[1px] flex-1 bg-zinc-200"></div>
                    </div>

                    <div className="space-y-2 mb-8 max-h-[35vh] overflow-y-auto pr-1 custom-scrollbar">
                        {pendingDetails.length > 0 ? pendingDetails.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-white border border-zinc-100 shadow-sm transition-all hover:border-zinc-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100 shrink-0">
                                        <img src={item.student_photo || 'https://i.pravatar.cc/100'} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-black uppercase text-zinc-800 leading-tight mb-0.5">{item.student_name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${item.category === 'kids' ? 'bg-sky-50 text-sky-600' : 'bg-zinc-100 text-zinc-600'}`}>
                                                {item.category === 'kids' ? 'Infantil' : 'Adulto'}
                                            </span>
                                            <span className="text-[8px] text-zinc-400 font-bold uppercase">{item.due_date}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className="text-sm font-black text-zinc-900 tracking-tighter">{formatMoney(item.amount)}</span>
                            </div>
                        )) : (
                            <div className="py-8 text-center flex flex-col items-center gap-2">
                                <Sparkles className="text-zinc-200" size={32} />
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Todo al día</p>
                            </div>
                        )}
                    </div>

                    {/* Footer con Total y Botones */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Total Recibido</span>
                            <span className="text-2xl font-black text-zinc-950 tracking-tighter">{formatMoney(totalAmount)}</span>
                        </div>

                        <div className="flex flex-col gap-2 pt-2">
                            <button 
                                onClick={onConfirm}
                                style={{ backgroundColor: primaryColor }}
                                className="group relative w-full py-4 rounded-2xl text-white font-black text-[12px] uppercase tracking-widest shadow-xl shadow-zinc-200 overflow-hidden active:scale-95 transition-all"
                            >
                                <div className="relative z-10 flex items-center justify-center gap-3">
                                    <DollarSign size={20} className="transition-transform group-hover:scale-110" />
                                    <span>Confirmar Pago</span>
                                </div>
                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </button>
                            
                            <button 
                                onClick={onCancel}
                                className="w-full py-3 text-zinc-400 font-black text-[9px] uppercase tracking-widest hover:text-zinc-600 active:scale-95 transition-all text-center"
                            >
                                Volver al Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function HistoryDetailModal({ date, records, branding, onClose }: { date: string; records: any[]; branding: any; onClose: () => void }) {
    if (!date) return null;
    const dateObj = new Date(date + 'T12:00:00');
    const dateStr = dateObj.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Bloquear scroll del body mientras el modal está abierto
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const handleTouchStart = (e: React.TouchEvent) => {
        // Solo permitir swipe si el contenido scrolleable está en top
        if (scrollRef.current && scrollRef.current.scrollTop > 0) return;
        startY.current = e.touches[0].pageY;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const deltaY = e.touches[0].pageY - startY.current;
        if (deltaY > 0) {
            e.preventDefault();
            setDragY(deltaY);
        }
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (dragY > 100) onClose();
        else setDragY(0);
    };

    return (
        <div
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className={`bg-white w-full max-w-lg rounded-t-[2.5rem] md:rounded-[2.5rem] p-6 shadow-2xl ${!isDragging ? 'transition-all duration-300' : ''}`}
                style={{ transform: `translateY(${dragY}px)`, opacity: 1 - dragY / 400 }}
                onClick={e => e.stopPropagation()}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Handle swipe */}
                <div className="flex justify-center mb-4 md:hidden">
                    <div className="w-12 h-1.5 bg-zinc-200 rounded-full" />
                </div>

                <div className="mb-6">
                    <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tighter leading-none">{dateStr}</h2>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">{records.length} asistentes</p>
                </div>

                <div ref={scrollRef} className="max-h-[60vh] overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                    {records.map((r: any) => (
                        <div key={r.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                            <div className="flex items-center gap-3">
                                <img src={r.student?.photo} className="w-10 h-10 rounded-full object-cover border border-white shadow-sm" alt={r.student?.name} />
                                <div>
                                    <p className="text-sm font-black text-zinc-900 uppercase leading-none">{r.student?.name}</p>
                                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1">
                                        {r.registration_method === 'qr' ? 'Escaneado' : 'Manual'} • {new Date(r.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                            {r.registration_method === 'qr' && (
                                <div className="bg-emerald-500 p-1.5 rounded-xl">
                                    <QrCode size={14} className="text-white" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ProofModal({ url, onClose }: { url: string; onClose: () => void }) {
    return (
        <div 
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <button 
                    onClick={onClose}
                    className="absolute -top-12 -right-0 z-10 w-10 h-10 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                    <X size={20} />
                </button>
                <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                    <img src={url} alt="Comprobante" className="w-full object-contain max-h-[85vh]" />
                </div>
            </div>
        </div>
    );
}

function BubblePaymentModal({ payer, vocab, formatMoney, primaryColor, getPayerRealStats, onClose, onApprove, onViewProof }: {
    payer: any; vocab: any; formatMoney: (n: number) => string; primaryColor: string;
    getPayerRealStats: (p: any) => any;
    onClose: () => void; onApprove: (id: string) => void; onViewProof: (url: string) => void;
}) {
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (scrollRef.current && scrollRef.current.scrollTop > 0) return;
        startY.current = e.touches[0].pageY;
        setIsDragging(true);
    };
    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const deltaY = e.touches[0].pageY - startY.current;
        if (deltaY > 0) { e.preventDefault(); setDragY(deltaY); }
    };
    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (dragY > 100) onClose();
        else setDragY(0);
    };

    const { reviewAmount, pendingAmount, approvedAmount } = getPayerRealStats(payer);
    const isPaid = (payer.status === 'paid') || (approvedAmount > 0 && pendingAmount === 0 && reviewAmount === 0);
    const isReview = !isPaid && (payer.status === 'review' || reviewAmount > 0);

    const payments = payer.payments && payer.payments.length > 0
        ? payer.payments
        : payer.enrolledStudents?.map((s: any) => ({
            student_name: s.name,
            student_photo: s.photo,
            due_date: '—',
            status: payer.status === 'paid' ? 'approved' : payer.status,
            amount: 0,
        }));

    return (
        <div
            className="fixed inset-0 z-[200] bg-zinc-950/70 backdrop-blur-md flex items-end justify-center animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className={`bg-white w-full rounded-t-[2.5rem] shadow-2xl ${!isDragging ? 'transition-all duration-300' : ''}`}
                style={{ transform: `translateY(${dragY}px)`, opacity: 1 - dragY / 400 }}
                onClick={e => e.stopPropagation()}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Handle swipe */}
                <div className="flex justify-center pt-4 pb-2">
                    <div className="w-12 h-1.5 bg-zinc-200 rounded-full" />
                </div>

                {/* Header titular */}
                <div className="px-6 pb-4 border-b border-zinc-100">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">Desglose del Pago</p>
                    <div className="flex items-center gap-3">
                        <img src={payer.photo} className="w-12 h-12 rounded-full object-cover border-2 border-zinc-100 shadow-sm" />
                        <div>
                            <p className="text-base font-black uppercase text-zinc-900 leading-none">{payer.name}</p>
                            <p className="text-[10px] text-zinc-400 font-bold mt-0.5">{payer.enrolledStudents?.length} {vocab.memberLabel}s</p>
                        </div>
                    </div>
                </div>

                {/* Lista de pagos */}
                <div ref={scrollRef} className="px-6 pt-4 space-y-3 max-h-[55vh] overflow-y-auto pb-2">
                    {payments?.map((payment: any, idx: number) => {
                        const statusLabel = payment.status === 'approved' || payment.status === 'paid' ? 'Pagado'
                            : payment.status === 'review' ? 'Por Aprobar' : 'Por Pagar';
                        const statusColor = payment.status === 'approved' || payment.status === 'paid' ? 'text-emerald-600'
                            : payment.status === 'review' ? 'text-amber-600' : 'text-rose-600';
                        return (
                            <div key={idx} className="flex items-center gap-3 bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                                <img
                                    src={payment.student_photo || payer.photo}
                                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black uppercase text-zinc-900 leading-none truncate">{payment.student_name}</p>
                                    <p className="text-[10px] text-zinc-400 font-bold mt-1.5 uppercase">
                                        Vence: {payment.due_date} • <span className={statusColor}>{statusLabel}</span>
                                    </p>
                                    <p className="text-xl font-black text-zinc-950 mt-1 tracking-tighter">{formatMoney(payment.amount)}</p>
                                </div>
                                {payment.proof_url && (
                                    <button
                                        onClick={() => onViewProof(payment.proof_url)}
                                        className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0 active:scale-95"
                                    >
                                        <Eye size={16} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Botón acción */}
                {!isPaid && (
                    <div className="px-6 pt-4 pb-10">
                        <button
                            onClick={() => onApprove(payer.id)}
                            className="w-full h-14 rounded-2xl text-white font-black text-[12px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
                            style={{ backgroundColor: isReview ? '#f59e0b' : primaryColor }}
                        >
                            {isReview ? <><RefreshCw size={18} /> Aprobar Pago</> : <><DollarSign size={18} /> Marcar como Pagado</>}
                        </button>
                    </div>
                )}
                {isPaid && <div className="pb-10" />}
            </div>
        </div>
    );
}

function TodaySchedule({ schedules, primaryColor }: { schedules: any[], primaryColor?: string }) {
    const dow = nowCL().getDay();
    const today = schedules.filter(s => s.day_of_week === dow).sort((a, b) => a.start_time.localeCompare(b.start_time));
    const dayName = nowCL().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
    return (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-100">
            <h3 className="text-sm font-black text-zinc-800 flex items-center gap-2 uppercase tracking-tighter mb-4">
                <CalendarCheck style={{ color: primaryColor || '#6366f1' }} size={18} />
                Clases de hoy
                <span className="text-[9px] font-bold text-zinc-400 normal-case tracking-normal capitalize">{dayName}</span>
            </h3>
            {today.length === 0 ? (
                <div className="flex items-center gap-3 py-8 px-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 justify-center">
                    <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Sin clases hoy</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {today.map((s: any) => {
                        const bg = s.color || '#f4f4f5';
                        const lum = bg !== '#f4f4f5' ? (() => { const r=parseInt(bg.slice(1,3),16),g=parseInt(bg.slice(3,5),16),b=parseInt(bg.slice(5,7),16); return (0.299*r+0.587*g+0.114*b)/255; })() : 1;
                        const fg = lum > 0.55 ? '#18181b' : '#ffffff';
                        return (
                            <div key={s.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ backgroundColor: bg, color: fg }}>
                                <div className="flex flex-col items-center shrink-0 w-10">
                                    <span className="text-[10px] font-black leading-none">{s.start_time.slice(0,5)}</span>
                                    <div className="w-px h-3 my-0.5" style={{ backgroundColor: fg, opacity: 0.3 }} />
                                    <span className="text-[10px] font-black leading-none opacity-70">{s.end_time.slice(0,5)}</span>
                                </div>
                                <span className="text-sm font-black uppercase tracking-tight">{s.subject || s.name || 'Clase'}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function App() {
    const { branding, setBranding } = useBranding();

    // Vocabulario adaptado por industria
    const beltColors: Record<string, string> = {
        blanco: 'bg-white border border-zinc-200 text-zinc-600',
        amarillo: 'bg-yellow-400 text-yellow-900',
        naranja: 'bg-orange-400 text-white',
        verde: 'bg-green-500 text-white',
        azul: 'bg-blue-500 text-white',
        rojo: 'bg-red-500 text-white',
        negro: 'bg-zinc-800 text-white shadow-sm',
        cafe: 'bg-amber-800 text-white',
        marron: 'bg-amber-800 text-white',
    };
    const getBeltColor = (belt: string) => beltColors[belt?.toLowerCase()] ?? 'bg-zinc-100 text-zinc-500';

    const industryConfig: Record<string, { attendance: string; cat1: string; cat2: string; memberLabel: string; placeLabel: string }> = {
        martial_arts: { attendance: 'Tatami', cat1: 'Kids', cat2: 'Adultos', memberLabel: 'Alumno', placeLabel: 'Dojo' },
        fitness: { attendance: 'Clase', cat1: 'Mensual', cat2: 'Trimestral', memberLabel: 'Socio', placeLabel: 'Clientes' },
        dance: { attendance: 'Sala', cat1: 'Infantil', cat2: 'Adultos', memberLabel: 'Alumno', placeLabel: 'Clientes' },
        music: { attendance: 'Sala', cat1: 'Infantil', cat2: 'Adultos', memberLabel: 'Alumno', placeLabel: 'Clientes' },
        default: { attendance: 'Clase', cat1: 'Categoría 1', cat2: 'Categoría 2', memberLabel: 'Miembro', placeLabel: 'Clientes' },
    };
    const vocab = industryConfig[branding?.industry || 'default'] || industryConfig.default;
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
        kids: 25000,
        adult: 35000,
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
    const [copied, setCopied] = useState(false);
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
    const [feeForm, setFeeForm] = useState({ title: '', description: '', amount: '', due_date: '', target: 'all', type: 'once', recurring_day: '' });
    const [feeSubmitting, setFeeSubmitting] = useState(false);
    const [feeFormError, setFeeFormError] = useState('');
    const [approvingFeePayment, setApprovingFeePayment] = useState<any>(null);
    const [feeApproveMethod, setFeeApproveMethod] = useState<'cash' | 'transfer'>('cash');
    const [feeApproveNotes, setFeeApproveNotes] = useState('');
    const [feeApprovingLoading, setFeeApprovingLoading] = useState(false);

    // --- PERSISTENCE & DATA FETCHING ---

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
                if (p.enrolledStudents) {
                    p.enrolledStudents.forEach((s: any) => {
                        if (s.today_status === 'present') currentAttendance.add(String(s.id));
                    });
                }
            });
            setAttendance(currentAttendance);
        }
    }, [token, paymentFilter, selectedMonth, selectedYear]);

    useEffect(() => {
        const t = setInterval(() => setNow(nowCL()), 60000);
        return () => clearInterval(t);
    }, []);

    // Estado para estudiante detectado via QR (se pasa al modal)
    const [lastCheckedInStudent, setLastCheckedInStudent] = useState<any>(null);

    // Refs estables para usar dentro de callbacks sin causar re-suscripciones
    const tokenRef = useRef(token);
    useEffect(() => { tokenRef.current = token; }, [token]);
    const brandingSlugRef = useRef(branding?.slug);
    useEffect(() => { brandingSlugRef.current = branding?.slug; }, [branding?.slug]);
    const userRef = useRef(user);
    useEffect(() => { userRef.current = user; }, [user]);

    // REAL-TIME WEBSOCKETS (LARAVEL REVERB)
    // Suscripción única. Pusher-js maneja reconexión automática.
    // Al volver de background (móvil), forzamos reconexión + refresh.
    useEffect(() => {
        if (!branding?.slug) return;
        const echo = getEcho();
        if (!echo) return;

        const slug = branding.slug;
        console.log('[WS] Subscribing to channels for:', slug);

        const safeRefresh = () => {
            const t = tokenRef.current;
            const s = brandingSlugRef.current;
            if (!t || !s || !localStorage.getItem('staff_token')) return;
            getPayers(s, t, { month: nowCL().getMonth() + 1, year: nowCL().getFullYear() })
                .then(d => { if (d?.payers) setPayers(d.payers); })
                .catch(() => {});
            getAttendanceHistory(s, t)
                .then(h => { if (h?.attendance) setAttendanceHistory(h.attendance); })
                .catch(() => {});
            
            // Refrescar notificaciones también
            if (slug && token) {
                getNotifications(slug, token).then(d => {
                    if (d?.notifications) setNotifications(d.notifications);
                    if (d?.unread !== undefined) setUnreadCount(d.unread);
                });
            }
        };

        echo.channel(`attendance.${slug}`)
            .listen('.student.checked-in', (data: { studentId: string | number; studentName?: string; studentPhoto?: string }) => {
                console.log('[WS] ✅ student.checked-in:', data);
                setAttendance(prev => new Set(prev).add(String(data.studentId)));
                setLastCheckedInStudent({ id: data.studentId, name: data.studentName || 'Alumno', photo: data.studentPhoto, _ts: Date.now() });
                // Optimistic: inyectar registro en historial inmediatamente
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
            .listen('.student.checked-out', (data: { studentId: string | number }) => {
                console.log('[WS] ❌ student.checked-out:', data);
                setAttendance(prev => { const next = new Set(prev); next.delete(String(data.studentId)); return next; });
                const todayStr = todayCL();
                setAttendanceHistory(prev => prev.filter(r => !(String(r.student_id) === String(data.studentId) && (r.date || r.created_at?.split('T')[0]) === todayStr)));
                safeRefresh();
            });

        echo.channel(`payments.${slug}`)
            .listen('.payment.updated', () => { console.log('[WS] payment.updated'); safeRefresh(); });
        echo.channel(`dashboard.${slug}`)
            .listen('.student.registered', () => { console.log('[WS] student.registered'); safeRefresh(); });

        // Escuchar mensajes del Service Worker (Push Sync)
        let handleMessage: ((event: MessageEvent) => void) | null = null;
        if ('serviceWorker' in navigator) {
            handleMessage = (event: MessageEvent) => {
                if (event.data?.type === 'REFRESH_NOTIFICATIONS') {
                    console.log('[Staff PWA] 🔄 Push received — refreshing notifications');
                    safeRefresh();
                }
            };
            navigator.serviceWorker.addEventListener('message', handleMessage);
        }

        // Notificaciones en tiempo real
        const userId = userRef.current?.id;
        if (userId) {
            echo.channel(`notifications.${slug}.${userId}`)
                .listen('.notification.sent', (data: any) => {
                    console.log('[WS] 🔔 notification.sent:', data);
                    setToastNotification({ id: data.notificationId, title: data.title, body: data.body, type: data.type });
                    setUnreadCount(c => c + 1);
                    setNotifications(prev => [{ id: data.notificationId, title: data.title, body: data.body, type: data.type, read: false, created_at: 'Ahora' }, ...prev]);
                });
        }

        // Móvil: cuando la app vuelve de background, reconectar y refrescar
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                console.log('[WS] App visible — reconnecting');
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
    }, [branding?.slug, user?.id]);

    const tabs = ['dashboard', 'attendance', 'payments', 'settings', 'profile', 'fees', 'expenses', 'schedule'];

    const changeTab = (newTab: string) => {
        const currentIndex = tabs.indexOf(activeTab);
        const newIndex = tabs.indexOf(newTab);
        setTabDirection(newIndex > currentIndex ? 1 : -1);
        setActiveTab(newTab);
        if (newTab === 'settings' && !regPageCode) {
            getRegistrationPageCode(user?.tenant_slug ?? '', token ?? '').then(r => { if (r?.code) setRegPageCode(r.code); });
        }
    };


    useEffect(() => {
        const init = async () => {
            let storedToken = localStorage.getItem("staff_token") || localStorage.getItem("auth_token");
            let tenantSlug = localStorage.getItem("tenant_slug")?.trim();
            const tenantId = localStorage.getItem("tenant_id")?.trim();

            if (!storedToken && tenantSlug) {
                const rememberToken = localStorage.getItem("remember_token");
                if (rememberToken) {
                    const resumed = await resumeSession(tenantSlug, rememberToken);
                    if (resumed?.token) {
                        storedToken = resumed.token;
                        const key = resumed.user_type === 'staff' ? 'staff_token' : 'auth_token';
                        localStorage.setItem(key, storedToken!);
                    }
                }
            }

            if (!storedToken || !tenantSlug) {
                window.location.href = "/";
                return;
            }

            setToken(storedToken!);

            // Detectar industry desde branding en contexto para decidir qué cargar
            const cachedIndustry = localStorage.getItem('tenant_industry');
            const isSchoolTreasury = cachedIndustry === 'school_treasury';

            const baseRequests: Promise<any>[] = [
                getProfile(tenantSlug, storedToken!),
                getPayers(tenantSlug, storedToken!, { month: selectedMonth, year: selectedYear, history: paymentFilter === 'history' }),
                getAttendanceHistory(tenantSlug, storedToken!),
            ];
            if (isSchoolTreasury) baseRequests.push(getSchedules(tenantSlug, storedToken!));

            let [profile, payersData, attendanceHistoryData, schedulesData]: [any, any, any, any] = await Promise.all(baseRequests);

            // Si el token falló (ej: expiró) pero tenemos un remember_token, intentamos recuperar la sesión una vez
            if (!profile) {
                const rememberToken = localStorage.getItem("remember_token");
                if (rememberToken && tenantSlug) {
                    const resumed = await resumeSession(tenantSlug, rememberToken);
                    if (resumed?.token) {
                        const newToken = resumed.token;
                        const key = resumed.user_type === 'staff' ? 'staff_token' : 'auth_token';
                        localStorage.setItem(key, newToken);
                        setToken(newToken);
                        
                        // Re-intentamos las peticiones con el nuevo token
                        const retryRequests: Promise<any>[] = [
                            getProfile(tenantSlug, newToken),
                            getPayers(tenantSlug, newToken, { month: selectedMonth, year: selectedYear, history: paymentFilter === 'history' }),
                            getAttendanceHistory(tenantSlug, newToken),
                        ];
                        if (isSchoolTreasury) retryRequests.push(getSchedules(tenantSlug, newToken));
                        [profile, payersData, attendanceHistoryData, schedulesData] = await Promise.all(retryRequests);
                    }
                }
            }

            if (profile) {
                if (profile.user_type === 'guardian') {
                    window.location.href = '/dashboard/student';
                    return;
                }

                setUser({
                    ...profile,
                    tenant_id: profile.tenant_id || tenantId,
                    tenant_slug: profile.tenant?.slug || tenantSlug
                });
                if (profile.tenant?.data?.pricing) {
                    const p = profile.tenant.data.pricing;
                    setPrices(p.prices || p);
                }
                if (profile.tenant?.data?.bank_info) {
                    setBankData(profile.tenant.data.bank_info);
                }
                if (profile.tenant) {
                    localStorage.setItem('tenant_industry', profile.tenant.industry || '');
                    if (!branding?.name || !branding?.industry) {
                        setBranding({
                            id: String(profile.tenant.id),
                            slug: profile.tenant.slug,
                            name: profile.tenant.name,
                            industry: profile.tenant.industry,
                            logo: profile.tenant.logo,
                            primaryColor: profile.tenant.primary_color
                        });
                    }
                }
                setPayers(payersData?.payers || []);

                if (attendanceHistoryData?.attendance) {
                    setAttendanceHistory(attendanceHistoryData.attendance);
                }
                if (schedulesData?.schedules) {
                    setSchedulesList(schedulesData.schedules);
                }

                if (payersData?.payers) {
                    const currentAttendance = new Set<string>();
                    payersData.payers.forEach((p: any) => {
                        if (p.enrolledStudents) {
                            p.enrolledStudents.forEach((s: any) => {
                                if (s.today_status === 'present') currentAttendance.add(String(s.id));
                            });
                        }
                    });
                    setAttendance(currentAttendance);
                }
            } else {
                localStorage.clear();
                window.location.href = "/";
            }
            setLoading(false);
        };

        init();
    }, [setBranding]);

    // Desbloquear AudioContext en primer gesto
    useEffect(() => {
        document.addEventListener('click', unlockAudio, { once: true });
        document.addEventListener('touchstart', unlockAudio, { once: true });
    }, []);

    const [showPushBanner, setShowPushBanner] = useState(false);
    const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
    const [showPushModal, setShowPushModal] = useState(false);

    // Leer estado de permisos + mostrar banner reactivo
    useEffect(() => {
        if (typeof Notification === 'undefined') {
            setPushPermission('denied'); // iOS sin soporte → rojo, no mostrar banner
            return;
        }

        const updatePermission = () => {
            const perm = Notification.permission;
            setPushPermission(perm);
            
            if (token && branding?.slug) {
                const dismissed = localStorage.getItem('push_banner_dismissed');
                if (perm === 'default' && !dismissed) {
                    setShowPushBanner(true);
                } else {
                    setShowPushBanner(false);
                    if (perm === 'granted') {
                        subscribeToPush(branding.slug, token);
                    }
                }
            }
        };

        // Primera comprobación
        updatePermission();

        // 1. Escuchar cuando la PWA vuelve al primer plano
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                updatePermission();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // 2. Escuchar cambios de permisos directo (API)
        let permStatus: PermissionStatus | null = null;
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'notifications' })
                .then(status => {
                    permStatus = status;
                    status.onchange = updatePermission;
                })
                .catch(() => {});
        }

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (permStatus) {
                permStatus.onchange = null;
            }
        };
    }, [token, branding?.slug]);

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

    // App Badge — sincronizar contador con ícono PWA
    useEffect(() => { setAppBadge(unreadCount); }, [unreadCount]);

    // Cargar notificaciones y app updates
    useEffect(() => {
        if (!token || !branding?.slug) return;
        getNotifications(branding.slug, token).then(data => {
            if (data?.notifications) setNotifications(data.notifications);
            if (data?.unread !== undefined) setUnreadCount(data.unread);
        });
        getAppUpdates('staff').then(data => {
            if (data?.updates) setAppUpdates(data.updates);
        });
        // Cuotas — solo school_treasury
        if (branding?.industry === 'school_treasury') {
            getFees(branding.slug, token).then(data => {
                if (data?.fees) {
                    const total = data.fees.length;
                    const pending = data.fees.reduce((a: number, f: any) => a + (f.total_count - f.paid_count - f.review_count), 0);
                    const review = data.fees.reduce((a: number, f: any) => a + (f.review_count || 0), 0);
                    setFeesSummary({ total, pending, review });
                }
            });
        }
    }, [token, branding?.slug]);

    useEffect(() => {
        if (activeTab === 'payments' && !loading) {
            refreshPayers();
        }
        if (activeTab === 'fees' && !loading && branding?.slug && token) {
            loadFees();
        }
        if (activeTab === 'expenses' && !loading && branding?.slug && token) {
            loadExpenses();
            if (feesList.length === 0) loadFees();
        }
        if (activeTab === 'schedule' && !loading && branding?.slug && token) {
            loadSchedules();
        }
        if (activeTab === 'dashboard' && !loading && branding?.slug && token && branding?.industry === 'school_treasury' && schedulesList.length === 0) {
            loadSchedules();
        }    }, [paymentFilter, selectedMonth, selectedYear, activeTab]);

    // --- LÓGICA DE DATOS ---

    const allStudents = useMemo(() => {
        return payers.flatMap(payer =>
            payer.enrolledStudents.map((student: any) => ({
                ...student,
                payerId: payer.id,
                payerStatus: payer.status
            }))
        );
    }, [payers]);

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
    };

    const formatCLP = (value: number) => {
        if (!value || value === 0) return '';
        return `$ ${new Intl.NumberFormat('es-CL').format(value)}`;
    };

    const parseCLP = (str: string) => {
        const digits = str.replace(/\D/g, '');
        return digits === '' ? 0 : parseInt(digits, 10);
    };

    const handlePriceInput = (field: 'kids' | 'adult', raw: string) => {
        const num = parseCLP(raw);
        setPrices(p => ({ ...p, [field]: num }));
    };

    // --- ACCIONES ---

    const handleLoadDemo = () => {
        setIsDemo(true);
        const demoPayers = [
            {
                id: 'p1',
                name: 'Javier Muñoz',
                photo: 'https://i.pravatar.cc/150?u=7',
                status: 'paid',
                enrolledStudents: [
                    { id: 's1', name: 'Ana Muñoz', category: 'kids', photo: 'https://i.pravatar.cc/150?img=1' },
                    { id: 's2', name: 'Luis Muñoz', category: 'kids', photo: 'https://i.pravatar.cc/150?img=2' },
                    { id: 's3', name: 'Mía Muñoz', category: 'kids', photo: 'https://i.pravatar.cc/150?img=3' }
                ]
            },
            {
                id: 'p2',
                name: 'Valentina Rojas',
                photo: 'https://i.pravatar.cc/150?u=4',
                status: 'pending',
                enrolledStudents: [
                    { id: 's4', name: 'Valentina Rojas', category: 'adults', photo: 'https://i.pravatar.cc/150?u=4' },
                    { id: 's5', name: 'Pedro Rojas', category: 'kids', photo: 'https://i.pravatar.cc/150?img=5' }
                ]
            }
        ];
        setPayers(demoPayers);
        setUser({ name: 'Admin Demo', tenant_id: 'DEMO' });
    };

    const toggleAttendance = async (rawId: string | number) => {
        const studentId = String(rawId);
        const isPresent = attendance.has(studentId);
        const student = allStudents.find(s => String(s.id) === studentId);

        const newAttendance = new Set(attendance);
        if (isPresent) {
            newAttendance.delete(studentId);
            // Optimistic: remover del historial
            const today = todayCL();
            setAttendanceHistory(prev => prev.filter(r => !(String(r.student_id) === String(studentId) && (r.date || r.created_at?.split('T')[0]) === today)));
        } else {
            newAttendance.add(studentId);
            // Optimistic: inyectar en historial
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

    const handlePaymentApprove = (payerId: string) => {
        const payer = payers.find(p => p.id === payerId);
        if (payer) setPaymentActionPayer(payer);
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

    const handleSavePrices = async () => {
        if (isDemo) {
            alert("Precios guardados localmente (Modo Demo)");
            return;
        }
        if (token && (user?.tenant_slug || user?.tenant_id)) {
            await updatePricing(user.tenant_slug || user.tenant_id, token, prices);
            alert("Configuración de precios actualizada con éxito");
        }
    };

    const handleSaveBankInfo = async () => {
        if (isDemo) {
            alert("Datos bancarios guardados localmente (Modo Demo)");
            return;
        }
        if (token && (user?.tenant_slug || user?.tenant_id)) {
            await updateBankInfo(user.tenant_slug || user.tenant_id, token, bankData);
            alert("Datos bancarios actualizados con éxito");
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token || (!user?.tenant_slug && !user?.tenant_id)) return;

        const result: any = await updateLogo(user.tenant_slug || user.tenant_id, token, file);
        if (result?.logo_url && branding) {
            setBranding({
                ...branding,
                id: String(branding.id),
                logo: String(result.logo_url)
            });
            alert("Logo actualizado con éxito");
        }
    };

    // --- VISTAS DE LA APP ---

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

    const loadFees = async () => {
        setFeesLoading(true);
        const data = await getFees(branding?.slug || '', token || '');
        setFeesList(data?.fees || []);
        if (data?.fees) {
            const total = data.fees.length;
            const pending = data.fees.reduce((a: number, f: any) => a + (f.total_count - f.paid_count - f.review_count), 0);
            const review = data.fees.reduce((a: number, f: any) => a + (f.review_count || 0), 0);
            setFeesSummary({ total, pending, review });
        }
        setFeesLoading(false);
    };

    const openFee = async (fee: any) => {
        setSelectedFee(fee);
        setFeeDetailLoading(true);
        const data = await getFeeDetail(branding?.slug || '', token || '', fee.id);
        setFeePayments(data?.payments || []);
        setFeeDetailLoading(false);
    };

    const handleCreateFee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feeForm.title || !feeForm.amount) { setFeeFormError('Completa todos los campos requeridos'); return; }
        if (feeForm.type === 'once' && !feeForm.due_date) { setFeeFormError('La fecha límite es requerida'); return; }
        if (feeForm.type === 'recurring' && !feeForm.recurring_day) { setFeeFormError('Indica el día del mes'); return; }
        setFeeSubmitting(true); setFeeFormError('');
        const result = await createFee(branding?.slug || '', token || '', {
                ...feeForm,
                amount: parseFloat(feeForm.amount),
                recurring_day: feeForm.type === 'recurring' ? parseInt(feeForm.recurring_day) : undefined,
                due_date: feeForm.type === 'once' ? feeForm.due_date : undefined,
            });
        setFeeSubmitting(false);
        if (result?.fee) {
            setShowCreateFee(false);
            setFeeForm({ title: '', description: '', amount: '', due_date: '', target: 'all', type: 'once', recurring_day: '' });
            loadFees();
        } else {
            setFeeFormError(result?.message || 'Error al crear cuota');
        }
    };

    const handleDeleteFee = async (feeId: number) => {
        if (!confirm('¿Eliminar esta cuota y todos sus pagos?')) return;
        await deleteFee(branding?.slug || '', token || '', feeId);
        loadFees();
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

    const STATUS_LABEL: Record<string, { label: string; color: string }> = {
        pending: { label: 'Pendiente', color: 'bg-rose-50 text-rose-600 border-rose-100' },
        review:  { label: 'En revisión', color: 'bg-amber-50 text-amber-600 border-amber-100' },
        paid:    { label: 'Pagado', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    };

    const renderFees = () => (
        <div className="space-y-3 pb-24">
            <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{feesList.length} cuotas creadas</p>
                <button onClick={() => { loadFees(); setShowCreateFee(true); }}
                    className="flex items-center gap-2 h-9 px-4 bg-zinc-950 text-white text-[10px] font-black uppercase rounded-xl active:scale-95 transition-all">
                    <Plus size={14} /> Nueva
                </button>
            </div>

            {feesLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-zinc-300" size={24} /></div>
            ) : feesList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                        <DollarSign size={28} className="text-zinc-300" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Sin cuotas creadas</p>
                    <button onClick={() => setShowCreateFee(true)}
                        className="h-10 px-6 bg-zinc-950 text-white text-[10px] font-black uppercase rounded-xl active:scale-95">
                        Crear primera cuota
                    </button>
                </div>
            ) : feesList.map(fee => {
                const paidCount = fee.paid_count || 0;
                const reviewCount = fee.review_count || 0;
                const totalCount = fee.total_count || 0;
                const pendingCount = totalCount - paidCount - reviewCount;
                const progress = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;
                return (
                    <div key={fee.id} className="bg-white border border-zinc-100 rounded-[1.8rem] p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-black text-zinc-900 uppercase leading-tight">{fee.title}</h3>
                                {fee.description && <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{fee.description}</p>}
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-base font-black text-zinc-950">{formatMoney(fee.amount)}</span>
                                    {fee.type === 'recurring' ? (
                                        <span className="flex items-center gap-1 text-[9px] font-bold text-violet-500 uppercase bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full">
                                            <RefreshCw size={9} /> Día {fee.recurring_day} c/mes
                                        </span>
                                    ) : fee.due_date ? (
                                        <span className="flex items-center gap-1 text-[9px] font-bold text-zinc-400 uppercase">
                                            <Calendar size={10} /> Vence {new Date(fee.due_date + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                            <button onClick={() => handleDeleteFee(fee.id)}
                                className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-400 active:scale-95 border border-rose-100 shrink-0">
                                <Trash2 size={14} />
                            </button>
                        </div>
                        <div className="mb-3">
                            <div className="flex justify-between text-[9px] font-black uppercase text-zinc-400 mb-1">
                                <span>{paidCount} pagados</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                            {paidCount > 0 && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">{paidCount} pagados</span>}
                            {reviewCount > 0 && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">{reviewCount} en revisión</span>}
                            {pendingCount > 0 && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">{pendingCount} pendientes</span>}
                        </div>
                        <button onClick={() => openFee(fee)}
                            className="w-full h-9 bg-zinc-50 border border-zinc-100 rounded-xl text-[10px] font-black uppercase text-zinc-600 flex items-center justify-center gap-2 active:scale-95 transition-all">
                            <Users size={13} /> Ver apoderados
                        </button>
                    </div>
                );
            })}

            {/* Modal crear cuota */}
            {showCreateFee && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center p-0 animate-in fade-in duration-200" onClick={() => setShowCreateFee(false)}>
                    <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-center mb-4"><div className="w-10 h-1.5 bg-zinc-200 rounded-full" /></div>
                        <h2 className="text-base font-black uppercase tracking-tighter text-zinc-900 mb-5">Nueva Cuota</h2>
                        <form onSubmit={handleCreateFee} className="space-y-3">
                            {feeFormError && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{feeFormError}</p>}

                            {/* Tipo: Única / Recurrente */}
                            <div className="grid grid-cols-2 gap-2">
                                {(['once', 'recurring'] as const).map(t => (
                                    <button key={t} type="button"
                                        onClick={() => setFeeForm({ ...feeForm, type: t, due_date: '', recurring_day: '' })}
                                        className={`h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                            feeForm.type === t
                                                ? 'bg-zinc-950 text-white border-zinc-950'
                                                : 'bg-zinc-50 text-zinc-400 border-zinc-100'
                                        }`}>
                                        <span className="flex items-center justify-center gap-1.5">{t === 'once' ? <><CalendarCheck size={12} /> Única</> : <><RefreshCw size={12} /> Recurrente</>}</span>
                                    </button>
                                ))}
                            </div>

                            <input placeholder="Título (ej: Gira de estudios)" value={feeForm.title}
                                onChange={e => setFeeForm({ ...feeForm, title: e.target.value })}
                                className="w-full h-11 bg-zinc-50 rounded-xl px-4 text-sm font-bold text-zinc-900 placeholder:text-zinc-300 border border-zinc-100 outline-none focus:ring-2 ring-zinc-950" />

                            {/* Monto + Fecha/Día */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-black uppercase text-zinc-400 ml-1">Monto ($)</label>
                                    <input type="text" inputMode="numeric" placeholder="$ 0" value={feeForm.amount ? formatCLP(parseInt(feeForm.amount)) : ''}
                                        onChange={e => setFeeForm({ ...feeForm, amount: String(parseCLP(e.target.value)) })}
                                        className="w-full h-11 bg-zinc-50 rounded-xl px-4 text-sm font-black text-zinc-900 placeholder:text-zinc-300 border border-zinc-100 outline-none focus:ring-2 ring-zinc-950 mt-1" />
                                </div>
                                <div>
                                    {feeForm.type === 'once' ? (
                                        <>
                                            <label className="text-[9px] font-black uppercase text-zinc-400 ml-1">Fecha límite</label>
                                            <input type="date" value={feeForm.due_date}
                                                onChange={e => setFeeForm({ ...feeForm, due_date: e.target.value })}
                                                className="w-full h-11 bg-zinc-50 rounded-xl px-4 text-sm font-bold text-zinc-900 border border-zinc-100 outline-none focus:ring-2 ring-zinc-950 mt-1" />
                                        </>
                                    ) : (
                                        <>
                                            <label className="text-[9px] font-black uppercase text-zinc-400 ml-1">Día del mes</label>
                                            <select value={feeForm.recurring_day}
                                                onChange={e => setFeeForm({ ...feeForm, recurring_day: e.target.value })}
                                                className="w-full h-11 bg-zinc-50 rounded-xl px-4 text-sm font-bold text-zinc-900 border border-zinc-100 outline-none focus:ring-2 ring-zinc-950 mt-1">
                                                <option value="">Día...</option>
                                                {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                                                    <option key={d} value={d}>Día {d}</option>
                                                ))}
                                            </select>
                                        </>
                                    )}
                                </div>
                            </div>

                            {feeForm.type === 'recurring' && feeForm.recurring_day && (
                                <p className="text-[10px] text-zinc-400 bg-zinc-50 rounded-xl px-3 py-2 border border-zinc-100 flex items-center gap-1.5">
                                    <RefreshCw size={10} /> Se cobrará el <strong>día {feeForm.recurring_day}</strong> de cada mes.
                                </p>
                            )}

                            <button type="submit" disabled={feeSubmitting}
                                className="w-full h-12 bg-zinc-950 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40">
                                {feeSubmitting ? <Loader2 className="animate-spin" size={16} /> : <><Plus size={16} /> Crear Cuota</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal detalle cuota */}
            {selectedFee && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200" onClick={() => setSelectedFee(null)}>
                    <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-4 duration-200 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-zinc-100 shrink-0">
                            <div className="flex justify-center mb-3"><div className="w-10 h-1.5 bg-zinc-200 rounded-full" /></div>
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-base font-black uppercase tracking-tighter text-zinc-900">{selectedFee.title}</h2>
                                    <p className="text-[10px] text-zinc-400 font-bold mt-0.5">{formatMoney(selectedFee.amount)} · {selectedFee.type === 'recurring' ? `Día ${selectedFee.recurring_day} c/mes` : selectedFee.due_date ? `Vence ${new Date(selectedFee.due_date + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}` : ''}</p>
                                </div>
                                <button onClick={() => setSelectedFee(null)} className="w-8 h-8 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 p-4 space-y-2">
                            {feeDetailLoading ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-zinc-300" size={20} /></div>
                            ) : feePayments.length === 0 ? (
                                <p className="text-center text-[10px] text-zinc-400 font-black uppercase py-10">Sin apoderados asignados</p>
                            ) : feePayments.map(p => {
                                const st = STATUS_LABEL[p.status] || STATUS_LABEL.pending;
                                return (
                                    <div key={p.id} className="bg-zinc-50 rounded-2xl p-3 border border-zinc-100 flex items-center gap-3">
                                        <img src={p.guardian?.photo || '/icon.webp'} className="w-10 h-10 rounded-full object-cover border border-white shadow-sm shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-zinc-900 uppercase leading-none truncate">{p.guardian?.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                                                {p.payment_method && <span className="text-[8px] text-zinc-400 font-bold uppercase">{p.payment_method === 'cash' ? 'Efectivo' : 'Transferencia'}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {p.proof_url && (
                                                <button onClick={() => setFeeProofUrl(p.proof_url)}
                                                    className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 active:scale-95">
                                                    <Eye size={14} />
                                                </button>
                                            )}
                                            {p.status !== 'paid' && (
                                                <button onClick={() => { setApprovingFeePayment(p); setFeeApproveMethod('cash'); }}
                                                    className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 active:scale-95">
                                                    <CheckCircle2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal aprobar pago */}
            {approvingFeePayment && (
                <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setApprovingFeePayment(null)}>
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <h3 className="text-sm font-black uppercase tracking-tighter text-zinc-900 mb-1">Confirmar Pago</h3>
                        <p className="text-[10px] text-zinc-400 font-bold mb-5">{approvingFeePayment.guardian?.name}</p>
                        <div className="space-y-3 mb-5">
                            <p className="text-[9px] font-black uppercase text-zinc-400">Método de pago</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setFeeApproveMethod('cash')}
                                    className={`h-12 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase border transition-all ${feeApproveMethod === 'cash' ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-zinc-50 text-zinc-400 border-zinc-200'}`}>
                                    <Banknote size={16} /> Efectivo
                                </button>
                                <button onClick={() => setFeeApproveMethod('transfer')}
                                    className={`h-12 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase border transition-all ${feeApproveMethod === 'transfer' ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-zinc-50 text-zinc-400 border-zinc-200'}`}>
                                    <RefreshCw size={16} /> Transferencia
                                </button>
                            </div>
                            <input placeholder="Notas (opcional)" value={feeApproveNotes}
                                onChange={e => setFeeApproveNotes(e.target.value)}
                                className="w-full h-10 bg-zinc-50 rounded-xl px-4 text-sm text-zinc-900 placeholder:text-zinc-300 border border-zinc-100 outline-none" />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setApprovingFeePayment(null)}
                                className="flex-1 h-11 bg-zinc-50 text-zinc-400 text-[10px] font-black uppercase rounded-xl border border-zinc-100 active:scale-95">
                                Cancelar
                            </button>
                            <button onClick={handleApproveFeePayment} disabled={feeApprovingLoading}
                                className="flex-[2] h-11 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40">
                                {feeApprovingLoading ? <Loader2 className="animate-spin" size={14} /> : <><CheckCircle2 size={14} /> Marcar Pagado</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox comprobante */}
            {feeProofUrl && (
                <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setFeeProofUrl(null)}>
                    <div className="relative max-w-sm w-full" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setFeeProofUrl(null)} className="absolute -top-12 right-0 w-10 h-10 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white">
                            <X size={20} />
                        </button>
                        <div className="rounded-3xl overflow-hidden border border-white/10">
                            <img src={feeProofUrl} alt="Comprobante" className="w-full object-contain max-h-[85vh]" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const EXPENSE_CATEGORIES = [
        { id: 'alimentacion', label: 'Alimentación' },
        { id: 'materiales', label: 'Materiales' },
        { id: 'infraestructura', label: 'Infraestructura' },
        { id: 'actividades', label: 'Actividades' },
        { id: 'administrativo', label: 'Administrativo' },
        { id: 'insumos', label: 'Insumos' },
        { id: 'otros', label: 'Otros' },
    ];
    const EXPENSE_CAT_COLORS: Record<string, string> = {
        alimentacion: 'bg-orange-100 text-orange-700',
        materiales: 'bg-blue-100 text-blue-700',
        infraestructura: 'bg-slate-100 text-slate-700',
        actividades: 'bg-purple-100 text-purple-700',
        administrativo: 'bg-zinc-100 text-zinc-700',
        insumos: 'bg-green-100 text-green-700',
        otros: 'bg-rose-100 text-rose-700',
    };

    const renderExpenses = () => {
        // Arqueo: recaudado = suma de fee_payments aprobados
        const recaudado = feesList.reduce((acc: number, f: any) => acc + (f.paid_amount || 0), 0);
        const gastado = expensesTotal;
        const saldo = recaudado - gastado;

        return (
            <div className="space-y-4 pb-24">
                {/* Arqueo de caja */}
                <div className="bg-zinc-950 rounded-[24px] p-5 text-white">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">Arqueo de Caja</p>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Recaudado</p>
                            <p className="text-base font-black text-emerald-400">{formatCLP(recaudado)}</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Gastado</p>
                            <p className="text-base font-black text-rose-400">{formatCLP(gastado)}</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Saldo</p>
                            <p className={`text-base font-black ${saldo >= 0 ? 'text-white' : 'text-rose-400'}`}>{formatCLP(saldo)}</p>
                        </div>
                    </div>
                    {expensesSummary.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {expensesSummary.map((s: any) => (
                                <div key={s.category} className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                                    <span className="text-[9px] font-black uppercase tracking-wider">{s.category}</span>
                                    <span className="text-[9px] font-bold text-zinc-300">{formatCLP(s.total)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Header compras */}
                <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{expensesList.length} compras registradas</p>
                    <button
                        onClick={() => setShowCreateExpense(true)}
                        className="flex items-center gap-1.5 bg-zinc-950 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl"
                    >
                        <Plus size={13} /> Nueva
                    </button>
                </div>

                {/* Lista */}
                {expensesLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin text-zinc-300" size={24} /></div>
                ) : expensesList.length === 0 ? (
                    <div className="text-center py-12 text-zinc-300">
                        <ShoppingCart size={32} className="mx-auto mb-2" />
                        <p className="text-xs font-bold">Sin compras registradas</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {expensesList.map((exp: any) => (
                            <ExpenseCard
                                key={exp.id}
                                exp={exp}
                                onLightbox={setExpenseLightbox}
                                onDelete={() => handleDeleteExpense(exp.id)}
                                deleting={expenseDeletingId === exp.id}
                            />
                        ))}
                    </div>
                )}

                {/* Form modal */}
                {showCreateExpense && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
                        <div className="bg-white rounded-[28px] w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
                                <h2 className="text-sm font-black uppercase tracking-widest">Nueva Compra</h2>
                                <button onClick={() => setShowCreateExpense(false)} className="p-2 rounded-xl hover:bg-zinc-100"><X size={16} /></button>
                            </div>
                            <form onSubmit={handleCreateExpense} className="p-5 space-y-4">
                                {expenseFormError && <div className="bg-rose-50 text-rose-600 text-[10px] font-black uppercase p-3 rounded-xl">{expenseFormError}</div>}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Descripción</label>
                                    <input required value={expenseForm.title}
                                        onChange={e => setExpenseForm(p => ({ ...p, title: e.target.value }))}
                                        placeholder="Ej: Toallas Nova, agua, cloro..."
                                        className="w-full h-12 bg-zinc-50 rounded-xl px-4 text-sm font-bold text-zinc-900 outline-none focus:ring-2 ring-zinc-200"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Monto</label>
                                        <input required type="text" inputMode="numeric"
                                            value={expenseForm.amount ? formatCLP(parseInt(expenseForm.amount)) : ''}
                                            onChange={e => setExpenseForm(p => ({ ...p, amount: String(parseCLP(e.target.value)) }))}
                                            placeholder="$ 0"
                                            className="w-full h-12 bg-zinc-50 rounded-xl px-4 text-sm font-bold text-zinc-900 outline-none focus:ring-2 ring-zinc-200"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Fecha</label>
                                        <input required type="date" value={expenseForm.expense_date}
                                            onChange={e => setExpenseForm(p => ({ ...p, expense_date: e.target.value }))}
                                            className="w-full h-12 bg-zinc-50 rounded-xl px-4 text-sm font-bold text-zinc-900 outline-none focus:ring-2 ring-zinc-200"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Categoría</label>
                                    <select value={expenseForm.category}
                                        onChange={e => setExpenseForm(p => ({ ...p, category: e.target.value }))}
                                        className="w-full h-12 bg-zinc-50 rounded-xl px-4 text-sm font-bold text-zinc-900 outline-none focus:ring-2 ring-zinc-200"
                                    >
                                        {EXPENSE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Notas (opcional)</label>
                                    <textarea value={expenseForm.description}
                                        onChange={e => setExpenseForm(p => ({ ...p, description: e.target.value }))}
                                        placeholder="Detalle adicional..."
                                        rows={2}
                                        className="w-full bg-zinc-50 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 outline-none focus:ring-2 ring-zinc-200 resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <ExpensePhotoInput label="Foto boleta" icon={Receipt} onChange={setExpenseReceiptPhoto} />
                                    <ExpensePhotoInput label="Foto producto" icon={Package} onChange={setExpenseProductPhoto} />
                                </div>
                                <button type="submit" disabled={expenseSubmitting}
                                    className="w-full h-14 bg-zinc-950 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {expenseSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Guardar Compra'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Lightbox */}
                {expenseLightbox && (
                    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setExpenseLightbox(null)}>
                        <img src={expenseLightbox} className="max-w-full max-h-full rounded-2xl object-contain" />
                        <button className="absolute top-4 right-4 p-2 bg-white/20 rounded-full"><X size={18} className="text-white" /></button>
                    </div>
                )}
            </div>
        );
    };

    const renderDashboard = () => {
        const totalStudents = allStudents.length;
        const paidStudents = allStudents.filter(s => s.payerStatus === 'paid').length;
        const pendingStudents = totalStudents - paidStudents;
        const presentToday = attendance.size;

        // Agrupar historial por fecha, filtrado por mes seleccionado
        const historyByDate: Record<string, any[]> = {};
        attendanceHistory.forEach((r: any) => {
            const d = r.date || r.created_at?.split('T')[0] || 'Sin fecha';
            const dateObj = new Date(d + 'T12:00:00');
            if (dateObj.getMonth() === historyMonth && dateObj.getFullYear() === historyYear) {
                if (!historyByDate[d]) historyByDate[d] = [];
                historyByDate[d].push(r);
            }
        });
        const historyDates = Object.keys(historyByDate).sort((a, b) => b.localeCompare(a));

        return (
            <div className="space-y-6 text-zinc-950">
                {/* Dashboard Summary - Sistema de Tarjetas Premium */}
                {/* Dashboard Summary - Sistema de Tarjetas Premium Horizontal Grid 2x2 */}
                <div className="grid grid-cols-4 gap-2">
                    {/* Total */}
                    <div className="bg-white rounded-[1.8rem] px-4 py-3 border border-zinc-100 shadow-sm flex items-center justify-between min-h-[75px]">
                        <div className="flex flex-col gap-1.5 shrink-0">
                            <Users style={{ color: branding?.primaryColor || '#6366f1' }} size={18} strokeWidth={2.5} />
                            <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest leading-none">Total</p>
                        </div>
                        <p className="text-xl font-black text-zinc-950 tracking-tighter leading-none shrink-0">{totalStudents}</p>
                    </div>

                    {/* Pagados */}
                    <div className="bg-emerald-50/40 rounded-[1.8rem] px-4 py-3 border border-emerald-100/60 shadow-sm flex items-center justify-between min-h-[75px]">
                        <div className="flex flex-col gap-1.5 shrink-0">
                            <CheckCircle2 className="text-emerald-600" size={18} strokeWidth={2.5} />
                            <p className="text-[7px] font-black text-emerald-600/60 uppercase tracking-widest leading-none">Pagados</p>
                        </div>
                        <p className="text-xl font-black text-emerald-700 tracking-tighter leading-none shrink-0">{paidStudents}</p>
                    </div>

                    {/* Revisión */}
                    <div className="bg-amber-50/40 rounded-[1.8rem] px-4 py-3 border border-amber-100/60 shadow-sm flex items-center justify-between min-h-[75px]">
                        <div className="flex flex-col gap-1.5 shrink-0">
                            <RefreshCw className="text-amber-600 animate-spin-slow" size={18} strokeWidth={2.5} />
                            <p className="text-[7px] font-black text-amber-600/60 uppercase tracking-widest leading-none">Revisión</p>
                        </div>
                        <p className="text-xl font-black text-amber-700 tracking-tighter leading-none shrink-0">{allStudents.filter(s => s.payerStatus === 'review').length}</p>
                    </div>

                    {/* Deuda */}
                    <div className="bg-rose-50/40 rounded-[1.8rem] px-4 py-3 border border-rose-100/60 shadow-sm flex items-center justify-between min-h-[75px]">
                        <div className="flex flex-col gap-1.5 shrink-0">
                            <XCircle className="text-rose-600" size={18} strokeWidth={2.5} />
                            <p className="text-[7px] font-black text-rose-600/60 uppercase tracking-widest leading-none">Deuda</p>
                        </div>
                        <p className="text-xl font-black text-rose-700 tracking-tighter leading-none shrink-0">{allStudents.filter(s => s.payerStatus === 'pending').length}</p>
                    </div>
                </div>

                {branding?.industry !== 'school_treasury' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tarjeta de Asistencia Hoy */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-sm font-black text-zinc-800 flex items-center gap-2 uppercase tracking-tighter">
                                    <CalendarCheck style={{ color: branding?.primaryColor || '#6366f1' }} size={18} />
                                    Asistencia Hoy
                                </h3>
                                <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase tracking-widest">
                                    {now.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' })}
                                </p>
                            </div>
                            <span 
                                className="px-4 py-1.5 rounded-full text-xs font-black transition-colors"
                                style={{ 
                                    backgroundColor: `${branding?.primaryColor || '#6366f1'}15`,
                                    color: branding?.primaryColor || '#6366f1' 
                                }}
                            >
                                {presentToday} / {totalStudents}
                            </span>
                        </div>

                        {presentToday > 0 ? (
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                {allStudents.filter(s => attendance.has(String(s.id))).slice(0, 5).map(s => (
                                    <img
                                        key={s.id}
                                        className="inline-block h-10 w-10 rounded-full border-2 border-white shadow-sm object-cover shrink-0"
                                        src={s.photo}
                                        alt={s.name}
                                    />
                                ))}
                                {presentToday > 5 && (
                                    <div className="h-10 w-10 rounded-full bg-zinc-100 border-2 border-white flex items-center justify-center shrink-0 shadow-sm">
                                        <span className="text-[10px] font-black text-zinc-500">+{presentToday - 5}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-3 py-6 px-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 w-full">
                                <CalendarCheck size={20} className="text-zinc-300 shrink-0" />
                                <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Sin registros hoy</p>
                            </div>
                        )}
                    </div>
                </div>
                )}

                {/* HISTORIAL DE ASISTENCIA - oculto para school_treasury */}
                {branding?.industry !== 'school_treasury' && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-black text-zinc-800 flex items-center gap-2 uppercase tracking-tighter">
                            <RefreshCw className="text-zinc-400" size={18} />
                            Historial Reciente
                        </h3>
                        <div className="flex items-center gap-2">
                            <button onClick={() => {
                                if (historyMonth === 0) { setHistoryMonth(11); setHistoryYear(y => y - 1); }
                                else setHistoryMonth(m => m - 1);
                                setHistoryPage(0);
                            }} className="w-8 h-8 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center active:scale-95 transition-all hover:bg-zinc-100">
                                <ChevronLeft size={16} className="text-zinc-500" />
                            </button>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider min-w-[80px] text-center">
                                {new Date(historyYear, historyMonth).toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })}
                            </span>
                            <button onClick={() => {
                                const now = nowCL();
                                if (historyMonth === now.getMonth() && historyYear === now.getFullYear()) return;
                                if (historyMonth === 11) { setHistoryMonth(0); setHistoryYear(y => y + 1); }
                                else setHistoryMonth(m => m + 1);
                                setHistoryPage(0);
                            }} className="w-8 h-8 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center active:scale-95 transition-all hover:bg-zinc-100 disabled:opacity-30"
                                disabled={historyMonth === nowCL().getMonth() && historyYear === nowCL().getFullYear()}
                            >
                                <ChevronRight size={16} className="text-zinc-500" />
                            </button>
                        </div>
                    </div>

                    {historyDates.length === 0 ? (
                        <div className="flex items-center gap-3 py-10 px-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 justify-center">
                            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Sin registros este mes</p>
                        </div>
                    ) : (
                        <div className="max-h-[320px] overflow-y-auto space-y-3 pr-1">
                            {historyDates.map(date => {
                                const records: any[] = historyByDate[date];
                                const presentCount = records.filter(r => r.status === 'present').length;
                                const dateObj = new Date(date + 'T12:00:00');
                                const dateStr = dateObj.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });
                                const students = records.filter(r => r.status === 'present' && r.student);

                                return (
                                    <div 
                                        key={date} 
                                        onClick={() => setSelectedHistoryDate(date)}
                                        className="bg-white hover:bg-zinc-50 rounded-[2rem] p-3 border border-zinc-100 transition-all active:scale-[0.98] cursor-pointer group"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-zinc-50 border border-zinc-100 flex flex-col items-center justify-center shrink-0 shadow-sm">
                                                    <span className="text-[7px] font-black uppercase leading-none mb-0.5" style={{ color: branding?.primaryColor || '#6366f1' }}>{dateObj.toLocaleDateString('es-CL', { month: 'short' })}</span>
                                                    <span className="text-sm font-black text-zinc-900 leading-none">{dateObj.getDate()}</span>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest leading-none">{dateStr}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase" style={{ color: branding?.primaryColor || '#6366f1' }}>
                                                            {presentCount} presentes
                                                        </span>
                                                        {records[0]?.created_at && (
                                                            <span className="text-[8px] text-zinc-400 font-bold opacity-60">
                                                                {new Date(records[0].created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {students.length > 0 && (
                                                    <div className="flex -space-x-1.5 overflow-hidden">
                                                        {students.slice(0, 5).map((r: any) => (
                                                            <img key={r.id} src={r.student?.photo} className="h-7 w-7 rounded-full border-2 border-white object-cover shrink-0 shadow-sm" alt={r.student?.name} />
                                                        ))}
                                                        {students.length > 5 && (
                                                            <div className="h-7 w-7 rounded-full border-2 border-white bg-zinc-100 flex items-center justify-center shrink-0">
                                                                <span className="text-[7px] font-black text-zinc-500">+{students.length - 5}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                )} {/* fin historial school_treasury */}

                {/* HORARIO DEL DÍA — solo school_treasury */}
                {branding?.industry === 'school_treasury' && <TodaySchedule schedules={schedulesList} primaryColor={branding?.primaryColor} />}

            </div>
        );
    };

    const renderAttendance = () => {
        const filteredStudents = allStudents.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
        const presentCount = allStudents.filter(s => attendance.has(String(s.id))).length;

        return (
            <div className="space-y-4 px-0 pb-32">
                {/* Buscador Neumórfico con Profundidad */}
                <div className="relative group focus-within:scale-[1.01] transition-all duration-300">
                    <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 group-focus-within:text-zinc-950 text-zinc-300 transition-colors z-10" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar participante..."
                        className="w-full bg-white pl-16 pr-6 py-3 rounded-[2.5rem] text-base font-black text-zinc-950 placeholder:text-zinc-300 placeholder:font-black placeholder:uppercase placeholder:tracking-widest focus:outline-none transition-all duration-300 shadow-[8px_8px_16px_#e5e5e5,-8px_-8px_16px_#ffffff] focus:shadow-[inset_4px_4px_8px_#e5e5e5,inset_-4px_-4px_8px_#ffffff] border-2 border-zinc-100 focus:border-zinc-300"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <button
                    onClick={() => setShowQRModal(true)}
                    style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}
                    className="w-full text-white rounded-2xl p-4 flex items-center justify-center gap-3 shadow-md border-b-4 border-black/20 transition-all active:scale-95 active:border-b-0"
                >
                    <QrCode size={20} className="text-white" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-white">ACTIVAR ASISTENCIA DINÁMICA QR</span>
                </button>

                {/* VISTA DESKTOP: TABLA */}
                <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Participante</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Categoría / Rango</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Estado Hoy</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {filteredStudents.map(student => {
                                const isPresent = attendance.has(String(student.id));                                return (
                                    <tr key={student.id} className="hover:bg-zinc-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img src={student.photo} className="w-10 h-10 rounded-full object-cover border border-zinc-100" />
                                                <span className="text-sm font-black text-zinc-900 uppercase">{student.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {student.label && branding?.industry === 'martial_arts' ? (
                                                <span className={`text-[9px] px-2 py-1 rounded font-black uppercase tracking-widest ${getBeltColor(student.label)}`}>{student.label}</span>
                                            ) : (
                                                <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400">{student.category === 'kids' ? vocab.cat1 : student.category === 'adult' ? vocab.cat2 : student.category || ''}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {isPresent ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-2 text-emerald-600">
                                                        <CheckCircle2 size={18} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Presente</span>
                                                    </div>
                                                    {student.method === 'qr' && (
                                                        <span className="bg-emerald-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-lg flex items-center gap-1">
                                                            <QrCode size={10} />
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Ausente</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => toggleAttendance(student.id)}
                                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isPresent ? 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-100'}`}
                                            >
                                                {isPresent ? 'Quitar' : 'Marcar'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* VISTA MOBILE: GRID DE TARJETAS */}
                <div className="grid grid-cols-3 gap-3 md:hidden">
                    {filteredStudents.map(student => {
                        const isPresent = attendance.has(String(student.id));
                        return (
                            <div key={student.id} className="relative">
                                <button
                                    onClick={() => toggleAttendance(student.id)}
                                    className={`relative flex flex-col items-center p-3 rounded-2xl transition-all w-full ${isPresent ? 'bg-emerald-50 text-emerald-900 border-2 border-emerald-400 shadow-lg scale-105 z-10' : 'bg-white shadow-sm border border-zinc-100 active:scale-95'
                                        }`}
                                >
                                    <div className="relative mb-2">
                                        <img
                                            src={student.photo}
                                            alt={student.name}
                                            className={`w-16 h-16 rounded-full object-cover transition-all ${isPresent ? 'ring-4 ring-emerald-400' : ''}`}
                                        />
                                        {isPresent && (
                                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-1 border-2 border-emerald-50 shadow-lg">
                                                {student.method === 'qr' ? <QrCode size={16} className="text-white" /> : <CheckCircle2 className="text-white" size={16} />}
                                            </div>
                                        )}
                                        {!isPresent && student.payerStatus && student.payerStatus !== 'paid' && (
                                            <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow ${
                                                student.payerStatus === 'review' ? 'bg-amber-400' : 'bg-rose-500'
                                            }`} />
                                        )}
                                    </div>
                                    <p className={`font-black text-[9px] text-center leading-tight line-clamp-2 w-full uppercase mt-1 ${isPresent ? 'text-emerald-900' : 'text-zinc-800'}`}>
                                        {student.name.split(' ')[0]}
                                    </p>
                                    {student.label && branding?.industry === 'martial_arts' ? (
                                        <span className={`text-[7px] mt-0.5 px-1.5 py-0.5 rounded font-black uppercase tracking-widest ${getBeltColor(student.label)}`}>{student.label}</span>
                                    ) : (
                                        <span className="text-[7px] mt-0.5 uppercase tracking-widest font-bold text-zinc-400">{student.category === 'kids' ? vocab.cat1 : student.category === 'adult' ? vocab.cat2 : student.category || ''}</span>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>

            </div>
        );
    };

    const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false);
    const [longPressPayerId, setLongPressPayerId] = useState<string | null>(null);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [bubbleModalPayer, setBubbleModalPayer] = useState<any>(null);

    const handleLongPressStart = (payerId: string) => {
        longPressTimer.current = setTimeout(() => {
            const payer = payers.find(p => p.id === payerId);
            if (payer) setBubbleModalPayer(payer);
        }, 600);
    };
    const handleLongPressEnd = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };

    const renderPayments = () => {
        const filteredPayers = payers.filter(p => {
            if (paymentFilter === 'pending') return p.status === 'pending' || p.status === 'review';
            // En 'history' mostramos todo lo que devuelve el backend para ese periodo
            return true;
        }).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

        const getPayerRealStats = (payer: any) => {
            const reviewAmount = payer.payments?.filter((p: any) => p.status === 'review').reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
            const pendingAmount = payer.payments?.filter((p: any) => p.status === 'pending' || p.status === 'overdue').reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
            const approvedAmount = payer.payments?.filter((p: any) => p.status === 'approved').reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
            
            const hasReview = reviewAmount > 0;
            const numEnrollments = payer.enrolledStudents.length;
            const displayAmount = paymentFilter === 'history' 
                ? (approvedAmount + reviewAmount + pendingAmount)
                : ((hasReview || (paymentFilter === 'pending' && reviewAmount > 0)) ? reviewAmount : (pendingAmount || 0));
                
            return { displayAmount, reviewAmount, pendingAmount, approvedAmount, numEnrollments, hasReview };
        };

        const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const years = [new Date().getFullYear(), new Date().getFullYear() - 1];

        return (
            <div className="space-y-6 px-0 pb-24">
                {/* Buscador + opciones */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 group focus-within:scale-[1.01] transition-all duration-300">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-zinc-950 transition-colors z-10" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="w-full bg-white pl-12 pr-4 py-3 rounded-[2rem] text-sm font-black text-zinc-950 placeholder:text-zinc-300 placeholder:font-black placeholder:uppercase placeholder:tracking-widest focus:outline-none shadow-[6px_6px_12px_#e5e5e5,-6px_-6px_12px_#ffffff] focus:shadow-[inset_3px_3px_6px_#e5e5e5,inset_-3px_-3px_6px_#ffffff] border-2 border-zinc-100 focus:border-zinc-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative shrink-0">
                        <button
                            onClick={() => setPaymentDropdownOpen(v => !v)}
                            className="w-12 h-12 bg-white rounded-2xl border-2 border-zinc-100 flex items-center justify-center shadow-[4px_4px_8px_#e5e5e5,-4px_-4px_8px_#ffffff] active:scale-95 transition-all"
                        >
                            <span className="text-zinc-500 font-black text-lg leading-none">···</span>
                        </button>
                        {paymentDropdownOpen && (
                            <div className="absolute right-0 top-14 w-48 bg-white rounded-2xl shadow-2xl border border-zinc-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                {[
                                    { label: 'Pendientes', value: 'pending' },
                                    { label: 'Por aprobar', value: 'review' },
                                    { label: 'Pagados', value: 'paid' },
                                    { label: 'Historial', value: 'history' },
                                ].map(opt => (
                                    <button key={opt.value}
                                        onClick={() => { setPaymentFilter(opt.value); setPaymentDropdownOpen(false); setExpandedPayerId(null); }}
                                        className={`w-full text-left px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-colors hover:bg-zinc-50 ${
                                            paymentFilter === opt.value ? 'text-zinc-950' : 'text-zinc-400'
                                        }`}
                                    >
                                        {paymentFilter === opt.value && <span className="mr-2">✓</span>}{opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs Selector — oculto, reemplazado por dropdown */}
                <div className="hidden flex bg-zinc-100 p-1.5 rounded-[2.2rem] gap-1 shadow-inner">
                    {['pending', 'history'].map((f) => (
                        <button
                            key={f}
                            onClick={() => {
                                setPaymentFilter(f);
                                setExpandedPayerId(null);
                            }}
                            className={`flex-1 py-3 px-2 rounded-[2rem] text-[9px] font-black uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${paymentFilter === f 
                                ? "bg-white text-zinc-950 shadow-md scale-[1.02] ring-1 ring-black/5" 
                                : "text-zinc-400 hover:text-zinc-600"
                            }`}
                        >
                            {f === 'pending' ? 'Pendientes' : 'Historial'}
                        </button>
                    ))}
                </div>

                {/* Mes/Año Selector (Solo para Historial) */}
                {paymentFilter === 'history' && (
                    <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-4 shadow-sm animate-in slide-in-from-top-2 duration-300">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
                                {months.map((m, idx) => (
                                    <button
                                        key={m}
                                        onClick={() => setSelectedMonth(idx + 1)}
                                        className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                                            selectedMonth === idx + 1 
                                            ? "text-white shadow-lg" 
                                            : "bg-zinc-50 text-zinc-400 hover:bg-zinc-100"
                                        }`}
                                        style={selectedMonth === idx + 1 ? { backgroundColor: branding?.primaryColor || '#6366f1' } : {}}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center justify-between border-t border-zinc-50 pt-3">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-zinc-400" />
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Año de Gestión:</span>
                                </div>
                                <div className="relative">
                                    <select 
                                        value={selectedYear} 
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                        className="appearance-none bg-zinc-50 border border-zinc-100 rounded-lg pl-3 pr-8 py-1 text-[10px] font-black text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-200"
                                    >
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={12} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* VISTA DESKTOP: TABLA DE PAGOS */}
                <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Titular</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Inscritos</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Monto</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Estado</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {filteredPayers.map(payer => {
                                const { displayAmount, reviewAmount, pendingAmount, approvedAmount, numEnrollments, hasReview } = getPayerRealStats(payer);
                                const isPaid = (payer.status === 'paid') || (paymentFilter === 'history' && approvedAmount > 0 && pendingAmount === 0 && reviewAmount === 0);
                                return (
                                    <tr key={payer.id} className="hover:bg-zinc-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img src={payer.photo} className="w-10 h-10 rounded-full object-cover border border-zinc-100" />
                                                <span className="text-sm font-black text-zinc-900 uppercase">{payer.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-zinc-500">
                                            {numEnrollments} {numEnrollments === 1 ? 'Participante' : 'Participantes'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-zinc-950">{formatMoney(displayAmount)}</span>
                                                {hasReview && (payer.payments?.some((p: any) => p.status === 'pending') ?? false) && (
                                                    <span className="text-[8px] text-rose-500 font-black uppercase tracking-widest">Tiene Deuda</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {isPaid || (paymentFilter === 'history' && approvedAmount > 0 && pendingAmount === 0 && reviewAmount === 0) ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                                    <CheckCircle2 size={12} /> {paymentFilter === 'history' ? 'Cerrado' : 'Al Día'}
                                                </span>
                                            ) : payer.status === 'review' || (paymentFilter === 'history' && reviewAmount > 0) ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest">
                                                    <RefreshCw size={14} className="animate-spin-slow" /> {paymentFilter === 'history' ? 'Revisiones' : 'Por Aprobar'}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest">
                                                    <XCircle size={12} /> {paymentFilter === 'history' ? 'Deuda Mes' : 'Pendiente'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {payer.proof_image && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setProofModalUrl(payer.proof_image); }}
                                                        className="p-2 bg-amber-50 text-amber-500 rounded-xl hover:bg-amber-100 transition-all border border-amber-100 shadow-sm"
                                                        title="Ver Comprobante"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                )}
                                                {isPaid ? null : (payer.status === 'review' || (paymentFilter === 'history' && reviewAmount > 0)) ? (
                                                    <button
                                                        onClick={() => {
                                                            const firstReview = payer.payments?.find((p: any) => p.status === 'review');
                                                            if (firstReview) handlePaymentApprove(payer.id);
                                                        }}
                                                        className="px-5 py-2 rounded-xl bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-md shadow-amber-100 flex items-center gap-2"
                                                    >
                                                        <RefreshCw size={12} className="animate-spin-slow" />
                                                        Aprobar
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handlePaymentApprove(payer.id)}
                                                        style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}
                                                        className="px-5 py-2 rounded-xl text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md"
                                                    >
                                                        Pagar
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* VISTA MOBILE: GLOBOS POR ESTUDIANTE */}
                <div className="md:hidden">
                    {filteredPayers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Users size={32} className="text-zinc-200" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Sin resultados</p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-4 justify-start px-1 pb-6">
                            {filteredPayers.flatMap(payer => {
                                const { reviewAmount, pendingAmount, approvedAmount } = getPayerRealStats(payer);
                                const isPaid = (payer.status === 'paid') || (paymentFilter === 'history' && approvedAmount > 0 && pendingAmount === 0 && reviewAmount === 0);
                                const isReview = !isPaid && (payer.status === 'review' || reviewAmount > 0);

                                // Mostrar un globo por cada estudiante inscrito
                                return payer.enrolledStudents.map((student: any) => {
                                    // Buscar el payment específico de este estudiante
                                    const studentPayment = payer.payments?.find((p: any) => p.student_id === student.id || p.student_name === student.name);
                                    const studentStatus = studentPayment?.status || (isPaid ? 'paid' : isReview ? 'review' : 'pending');
                                    const isStudentPaid = studentStatus === 'approved' || studentStatus === 'paid';
                                    const isStudentReview = studentStatus === 'review';

                                    const ringColor = isStudentPaid
                                        ? 'ring-4 ring-emerald-400 shadow-emerald-100'
                                        : isStudentReview
                                        ? 'ring-4 ring-amber-400 shadow-amber-100'
                                        : 'ring-4 ring-rose-400 shadow-rose-100';

                                    const dotColor = isStudentPaid
                                        ? 'bg-emerald-500'
                                        : isStudentReview
                                        ? 'bg-amber-400'
                                        : 'bg-rose-500';

                                    return (
                                        <div
                                            key={`${payer.id}-${student.id}`}
                                            className="flex flex-col items-center gap-1.5 cursor-pointer select-none active:scale-95 transition-transform"
                                            onMouseDown={() => handleLongPressStart(payer.id)}
                                            onMouseUp={handleLongPressEnd}
                                            onMouseLeave={handleLongPressEnd}
                                            onTouchStart={() => handleLongPressStart(payer.id)}
                                            onTouchEnd={handleLongPressEnd}
                                            onClick={() => setBubbleModalPayer({ ...payer, _focusStudent: student })}
                                        >
                                            <div className="relative">
                                                <img
                                                    src={student.photo || payer.photo}
                                                    className={`w-16 h-16 rounded-full object-cover shadow-md ${ringColor}`}
                                                    alt={student.name}
                                                />
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${dotColor}`} />
                                            </div>
                                            <p className="text-[9px] font-black uppercase text-zinc-700 text-center leading-tight max-w-[72px] line-clamp-2">
                                                {student.name.split(' ')[0]}
                                            </p>
                                        </div>
                                    );
                                });
                            })}
                        </div>
                    )}
                </div>

                {/* Modal desglose por globo — ancho completo + swipe para cerrar */}
                {bubbleModalPayer && (
                    <BubblePaymentModal
                        payer={bubbleModalPayer}
                        vocab={vocab}
                        formatMoney={formatMoney}
                        primaryColor={branding?.primaryColor || '#6366f1'}
                        getPayerRealStats={getPayerRealStats}
                        onClose={() => setBubbleModalPayer(null)}
                        onApprove={(payerId) => { setBubbleModalPayer(null); handlePaymentApprove(payerId); }}
                        onViewProof={(url) => { setBubbleModalPayer(null); setProofModalUrl(url); }}
                    />
                )}
            </div>
        );
    };

    const renderSchedule = () => (
        <div className="space-y-4 pb-24">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-zinc-900">Horario de Clases</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-0.5">Toca una celda para editar</p>
                </div>
            </div>
            {schedulesLoading ? (
                <div className="flex justify-center py-12"><span className="animate-spin text-zinc-300">&#9696;</span></div>
            ) : (
                <div className="bg-white rounded-[20px] p-4 border border-zinc-100 shadow-sm">
                    <WeeklySchedule
                        schedules={schedulesList}
                        editable
                        onSave={async (entry) => {
                            await createSchedule(branding?.slug || '', token || '', entry);
                            await loadSchedules();
                        }}
                        onUpdate={async (id, entry) => {
                            await updateSchedule(branding?.slug || '', token || '', id, entry);
                            await loadSchedules();
                        }}
                        onDelete={async (id) => {
                            await deleteSchedule(branding?.slug || '', token || '', id);
                            await loadSchedules();
                        }}
                    />
                </div>
            )}
        </div>
    );

    const renderSettings = () => {
        return (
            <div className="space-y-3 px-0 pb-10">
                {/* BRANDING */}
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-zinc-100 flex items-center gap-3">
                    <div className="relative shrink-0">
                        <img src={branding?.logo || "/icon.webp"} className="w-10 h-10 rounded-full object-cover border border-zinc-100" alt="Logo" />
                        <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 bg-white text-zinc-950 p-0.5 rounded-full border border-zinc-200 shadow active:scale-90">
                            <Camera size={10} />
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-black uppercase tracking-tighter text-zinc-950 truncate leading-none">{branding?.name || 'Academy'}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Plataforma de Gestión v4.7</p>
                            <button onClick={handleLoadDemo} className="text-[7px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded-full active:scale-95 transition-all">Demo</button>
                        </div>
                    </div>
                </div>

                {/* LINK DE REGISTRO */}
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-zinc-100">
                    <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-2">Link de Registro Titulares</p>
                    {regPageCode ? (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <p className="flex-1 text-[9px] font-bold text-zinc-500 truncate bg-zinc-50 rounded-xl px-3 py-2 border border-zinc-100">
                                    {`https://app.digitalizatodo.cl/r/${regPageCode}`}
                                </p>
                                <button onClick={() => { navigator.clipboard.writeText(`https://app.digitalizatodo.cl/r/${regPageCode}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                                    className={`shrink-0 text-[8px] font-black uppercase px-3 py-2 rounded-xl border transition-all active:scale-95 ${copied ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-zinc-50 text-zinc-600 border-zinc-200'}`}>
                                    {copied ? '✓ Copiado' : 'Copiar'}
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={async () => { setGeneratingPage(true); await deleteRegistrationPage(user.tenant_slug || user.tenant_id, token ?? ''); const r = await generateRegistrationPage(user.tenant_slug || user.tenant_id, token ?? ''); setGeneratingPage(false); if (r?.code) setRegPageCode(r.code); }}
                                    disabled={generatingPage}
                                    className="flex-1 h-8 bg-zinc-100 text-zinc-600 text-[8px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all disabled:opacity-40">
                                    {generatingPage ? <Loader2 className="animate-spin" size={10} /> : '↺ Nuevo link'}
                                </button>
                                <button onClick={async () => { await deleteRegistrationPage(user.tenant_slug || user.tenant_id, token ?? ''); setRegPageCode(null); }}
                                    className="flex-1 h-8 bg-red-50 text-red-400 text-[8px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all border border-red-100">
                                    Eliminar link
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={async () => { setGeneratingPage(true); const r = await generateRegistrationPage(user.tenant_slug || user.tenant_id, token ?? ''); setGeneratingPage(false); if (r?.code) setRegPageCode(r.code); }}
                            disabled={generatingPage}
                            style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}
                            className="w-full h-9 text-white text-[9px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40">
                            {generatingPage ? <Loader2 className="animate-spin" size={12} /> : <><Sparkles size={12} /> Generar página de registro</>}
                        </button>
                    )}
                </div>

                {/* PRECIOS + DESCUENTO — oculto para school_treasury */}
                {branding?.industry !== 'school_treasury' && (
                    <>
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
                    <div className="px-4 py-2 border-b border-zinc-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CreditCard size={14} style={{ color: branding?.primaryColor || '#6366f1' }} />
                            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Configurar Mensualidad</span>
                        </div>
                        <Edit2 size={10} className="text-zinc-300" />
                    </div>
                    <div className="divide-y divide-zinc-50">
                        {[{ label: vocab.cat1, field: 'kids' as const }, { label: vocab.cat2, field: 'adult' as const }].map(({ label, field }) => (
                            <div key={field} className="flex items-center px-4 py-2">
                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest w-20 shrink-0">{label}</span>
                                <input type="text" inputMode="numeric" className="flex-1 bg-transparent text-xs font-black text-zinc-950 focus:ring-0 outline-none text-right"
                                    value={formatCLP(prices[field])} onChange={e => handlePriceInput(field, e.target.value)} placeholder="$ 0" />
                            </div>
                        ))}
                        <div className="flex items-center px-4 py-2">
                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest w-20 shrink-0">Desc. desde</span>
                            <input type="text" inputMode="numeric" className="flex-1 bg-transparent text-xs font-black text-zinc-950 focus:ring-0 outline-none text-right"
                                value={prices.discountThreshold === 0 ? '' : prices.discountThreshold} onChange={e => { const v = e.target.value.replace(/\D/g, ''); setPrices(p => ({ ...p, discountThreshold: v === '' ? 0 : parseInt(v) })); }} placeholder="0 inscritos" />
                        </div>
                        <div className="flex items-center px-4 py-2">
                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest w-20 shrink-0">Descuento</span>
                            <input type="text" inputMode="numeric" className="flex-1 bg-transparent text-xs font-black text-zinc-950 focus:ring-0 outline-none text-right"
                                value={prices.discountPercentage === 0 ? '' : `${prices.discountPercentage}%`} onChange={e => { const v = e.target.value.replace(/\D/g, ''); setPrices(p => ({ ...p, discountPercentage: v === '' ? 0 : Math.min(100, parseInt(v)) })); }} placeholder="0%" />
                        </div>
                    </div>
                </div>

                <button onClick={handleSavePrices} 
                    style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}
                    className="w-full text-white font-black py-4 rounded-2xl active:scale-95 transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                    <Save size={16} /> Guardar Configuración de Precios
                </button>
                    </>
                )}

                {/* DATOS DE TRANSFERENCIA */}
                {/* DATOS DE TRANSFERENCIA */}
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden mt-6">
                    <div className="px-4 py-3 border-b border-zinc-50 flex items-center justify-between">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <CreditCard size={14} style={{ color: branding?.primaryColor || '#6366f1' }} /> Datos Bancarios <Edit2 size={10} className="ml-1 text-zinc-300" />
                        </span>
                        <button
                            onClick={async () => {
                                try {
                                    const text = await navigator.clipboard.readText();
                                    if (!text) return;
                                    
                                    // Heurística simple para adivinar campos desde un texto copiado estándar
                                    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
                                    let newBankData = { ...bankData };
                                    
                                    const typeKeywords = ['vista', 'corriente', 'ahorro', 'rut'];
                                    const bankKeywords = ['banco', 'santander', 'scotiabank', 'itaú', 'itau', 'bci', 'falabella', 'mercado pago', 'mercadopago', 'tenpo', 'mach', 'coopeuch', 'security', 'bice', 'consorcio'];
                                    
                                    for (const line of lines) {
                                        const lowerLine = line.toLowerCase();
                                        
                                        // 1. Tipo de Cuenta
                                        if (typeKeywords.some(k => lowerLine.includes(k)) && (lowerLine.includes('cuenta') || lowerLine === 'cuentarut')) {
                                            if (lowerLine.includes('vista') || lowerLine.includes('rut')) newBankData.account_type = 'Cuenta Vista';
                                            else if (lowerLine.includes('corriente')) newBankData.account_type = 'Cuenta Corriente';
                                            else if (lowerLine.includes('ahorro')) newBankData.account_type = 'Cuenta de Ahorro';
                                            
                                            // Si además viene el número en la misma línea (ej: "Cuenta Corriente 123456")
                                            const digits = line.replace(/\D/g, '');
                                            if (digits.length >= 6) {
                                                newBankData.account_number = digits;
                                            }
                                            continue;
                                        }

                                        // 2. Banco
                                        if (bankKeywords.some(k => lowerLine.includes(k))) {
                                            const parts = line.split(':');
                                            newBankData.bank_name = (parts.length > 1 ? parts[1] : line).trim();
                                            continue;
                                        }

                                        // 3. RUT
                                        const rutMatch = line.match(/\b\d{1,2}\.?\d{3}\.?\d{3}[-][0-9kK]\b/);
                                        if (rutMatch) {
                                            newBankData.holder_rut = rutMatch[0];
                                            continue;
                                        }
                                        if (lowerLine.startsWith('rut')) {
                                            const parts = line.split(':');
                                            const val = (parts.length > 1 ? parts[1] : line.replace(/rut/i, '')).trim();
                                            if (val.replace(/\D/g, '').length >= 7) {
                                                newBankData.holder_rut = val;
                                            }
                                            continue;
                                        }

                                        // 4. Número de Cuenta
                                        if (lowerLine.includes('cuenta') || lowerLine.includes('nro') || lowerLine.includes('número') || lowerLine.includes('numero')) {
                                            // Ignorar si es la línea de "Tipo de cuenta:"
                                            if (!lowerLine.includes('tipo')) {
                                                const digits = line.replace(/\D/g, '');
                                                if (digits.length >= 6) {
                                                    newBankData.account_number = digits;
                                                    continue;
                                                }
                                            }
                                        }
                                        
                                        // Número suelto (ej: 17638433)
                                        if (/^\d{6,20}$/.test(line.replace(/\s/g, ''))) {
                                            if (!newBankData.account_number) {
                                                newBankData.account_number = line.replace(/\s/g, '');
                                            }
                                            continue;
                                        }

                                        // 5. Ignorar correos
                                        if (lowerLine.includes('@') && lowerLine.includes('.')) {
                                            continue;
                                        }

                                        // 6. Asumir Nombre 
                                        if (!newBankData.holder_name) {
                                            if (lowerLine.startsWith('nombre')) {
                                                const parts = line.split(':');
                                                newBankData.holder_name = (parts.length > 1 ? parts[1] : line.replace(/nombre/i, '')).trim();
                                            } else if (line.split(' ').length >= 2 && line.split(' ').length <= 6 && !/\d/.test(line)) {
                                                const parts = line.split(':');
                                                newBankData.holder_name = (parts.length > 1 ? parts[1] : line).trim();
                                            }
                                        }
                                    }
                                    
                                    setBankData(newBankData);
                                    alert("Datos copiados del portapapeles. Por favor revisa que estén correctos.");
                                } catch (err) {
                                    alert("No se pudo acceder al portapapeles o no hay texto copiado.");
                                }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-full text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
                        >
                            <ClipboardPaste size={14} /> Pegar Copiado
                        </button>
                    </div>
                    <div className="divide-y divide-zinc-50">
                        {([
                            { label: 'Banco', field: 'bank_name', placeholder: 'Ej: Banco Estado' },
                            { label: 'Tipo Cta.', field: 'account_type', placeholder: 'Cuenta Corriente / Vista' },
                            { label: 'N° Cuenta', field: 'account_number', placeholder: '00000000' },
                            { label: 'Titular', field: 'holder_name', placeholder: 'Nombre del titular' },
                            { label: 'RUT', field: 'holder_rut', placeholder: '12.345.678-9' },
                        ] as const).map(({ label, field, placeholder }) => (
                            <div key={field} className="flex items-center px-4 py-2">
                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest w-20 shrink-0">{label}</span>
                                <input
                                    type="text"
                                    className="flex-1 bg-transparent text-xs font-black text-zinc-950 focus:ring-0 outline-none text-right"
                                    value={bankData[field] || ''}
                                    onChange={e => setBankData((b: any) => ({ ...b, [field]: e.target.value }))}
                                    placeholder={placeholder}
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <button 
                    onClick={handleSaveBankInfo} 
                    className="w-full text-white font-black py-4 rounded-2xl active:scale-95 transition-all text-[10px] uppercase tracking-widest shadow-lg"
                    style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}
                >
                    Guardar Datos Bancarios
                </button>

                <button 
                    className="w-full text-rose-400 font-black py-4 rounded-2xl hover:bg-rose-50 uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-2 border border-rose-100" 
                    onClick={() => { 
                        // Logout selectivo: limpiamos tokens pero preservamos el contexto visual de la academia
                        const slug = localStorage.getItem("tenant_slug");
                        const branding = localStorage.getItem("tenant_branding");
                        localStorage.clear(); 
                        if (slug) localStorage.setItem("tenant_slug", slug);
                        if (branding) localStorage.setItem("tenant_branding", branding);
                        window.location.href = "/"; 
                    }}
                >
                    <LogOut size={16} /> Cerrar Sesión Staff
                </button>
            </div>
        );
    };

    const renderProfile = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Perfil Card */}
            <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 text-center shadow-sm">
                <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden border-4 border-zinc-50 shadow-md">
                    <img src={user?.photo || '/DLogo-v2.webp'} className="w-full h-full object-cover" alt="" />
                </div>
                <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">{user?.name || 'Admin'}</h3>
                <p className="text-xs text-zinc-400 font-bold mb-2">{user?.email}</p>
                <span className="inline-block bg-zinc-900 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Staff</span>
            </div>

            {/* Menú */}
            <div className="bg-white border border-zinc-100 rounded-3xl p-2">
                <button onClick={() => changeTab('settings')} className="w-full flex items-center justify-between p-4 hover:bg-stone-50 rounded-2xl transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-zinc-700 transition-colors"><Settings size={20} /></div>
                        <span className="font-black text-sm text-zinc-700">Ajustes</span>
                    </div>
                    <ChevronRight size={18} className="text-zinc-300" />
                </button>
                {branding?.industry === 'school_treasury' && (
                    <button onClick={() => changeTab('fees')} className="w-full flex items-center justify-between p-4 hover:bg-stone-50 rounded-2xl transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-zinc-700 transition-colors"><DollarSign size={20} /></div>
                            <span className="font-black text-sm text-zinc-700">Cuotas</span>
                        </div>
                        <ChevronRight size={18} className="text-zinc-300" />
                    </button>
                )}
                {branding?.industry === 'school_treasury' && (
                    <button onClick={() => changeTab('expenses')} className="w-full flex items-center justify-between p-4 hover:bg-stone-50 rounded-2xl transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-zinc-700 transition-colors"><ShoppingCart size={20} /></div>
                            <span className="font-black text-sm text-zinc-700">Compras</span>
                        </div>
                        <ChevronRight size={18} className="text-zinc-300" />
                    </button>
                )}
            </div>

            {/* Changelog */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <Sparkles size={14} className="text-zinc-300" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Actualizaciones</span>
                </div>
                <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1">
                    {appUpdates.length > 0 ? appUpdates.map((u: any) => (
                        <div key={u.id} className="bg-white border border-zinc-100 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-black bg-zinc-900 text-white px-2 py-0.5 rounded-full">v{u.version}</span>
                                <span className="text-[8px] font-bold text-zinc-300">{u.published_at}</span>
                            </div>
                            <h4 className="text-sm font-black text-zinc-800 mt-2">{u.title}</h4>
                            <p className="text-xs text-zinc-400 mt-1 leading-relaxed whitespace-pre-wrap">{u.description}</p>
                        </div>
                    )) : (
                        <p className="text-xs text-zinc-300 text-center py-4">Sin actualizaciones</p>
                    )}
                </div>
            </div>

            {/* Logout */}
            <button
                onClick={() => {
                    const slug = localStorage.getItem("tenant_slug");
                    const brandingData = localStorage.getItem("tenant_branding");
                    localStorage.clear();
                    if (slug) localStorage.setItem("tenant_slug", slug);
                    if (brandingData) localStorage.setItem("tenant_branding", brandingData);
                    window.location.href = "/";
                }}
                className="w-full h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] hover:bg-red-100 transition-all active:scale-[0.98]"
            >
                <LogOut size={18} /> Cerrar Sesión
            </button>

            <div className="pt-6 text-center space-y-1">
                <a href="https://digitalizatodo.cl" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors">
                    DIGITALIZA TODO® 2026
                </a>
                <p className="text-[9px] text-zinc-300">Software Factory a la Medida</p>
            </div>
        </div>
    );

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
            <div className="h-24 bg-zinc-100 rounded-[2rem]" />
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-white font-sans relative overflow-hidden text-zinc-950">
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
                                    if (token && branding?.slug) subscribeToPush(branding.slug, token);
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
            <header className="bg-white px-2 py-3 flex items-center justify-between sticky top-0 z-50 border-b border-zinc-50 shrink-0 md:hidden">
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
                            <h1 className="text-lg font-black uppercase tracking-tighter text-zinc-950 leading-none">{branding?.name || 'Academy'}</h1>
                            <button onClick={() => setShowPushModal(true)} className="shrink-0 mt-0.5">
                                <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm transition-colors duration-500 ${
                                    pushPermission === 'granted' ? 'bg-emerald-500 animate-pulse' :
                                    pushPermission === 'denied'  ? 'bg-red-500' :
                                    'bg-amber-400'
                                }`} />
                            </button>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: branding?.primaryColor || '#6366f1' }}>{activeTab === 'dashboard' ? 'Resumen' : activeTab === 'attendance' ? vocab.attendance : activeTab === 'payments' ? 'Pagos' : activeTab === 'settings' ? 'Ajustes' : 'Perfil'}</span>
                            {isDemo && <span className="bg-emerald-500/10 text-emerald-600 text-[6px] font-black px-1 py-0.5 rounded uppercase tracking-widest">DEMO</span>}
                        </div>
                    </div>
                </div>
                {/* Notification Bell */}
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative w-10 h-10 flex items-center justify-center rounded-full border border-zinc-100 shadow-sm bg-white"
                >
                    <Bell size={20} className="text-zinc-600" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                </button>
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
                                <h2 className="text-sm font-black uppercase tracking-tighter text-zinc-950 truncate leading-none">{branding?.name || 'Academy'}</h2>
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
                        <SidebarButton icon={CreditCard} label="Pagos" active={activeTab === 'payments'} onClick={() => changeTab('payments')} primaryColor={branding?.primaryColor} />
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
                <main className="flex-1 overflow-y-auto pb-28 md:pb-8 hide-scrollbar relative bg-white">
                    <div className="max-w-6xl mx-auto py-2 md:py-8 px-2 md:px-8">
                        <div key={activeTab} className="w-full animate-in fade-in duration-150">
                            <div className="hidden md:flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-zinc-950">
                                    {activeTab === 'dashboard' ? 'Resumen General' : activeTab === 'attendance' ? vocab.attendance : activeTab === 'payments' ? 'Estado de Pagos' : activeTab === 'settings' ? 'Configuración' : 'Mi Perfil'}
                                </h2>
                                {isDemo && <span className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Modo Demo Activo</span>}
                            </div>
                            {activeTab === 'dashboard' && renderDashboard()}
                            {activeTab === 'attendance' && renderAttendance()}
                            {activeTab === 'payments' && renderPayments()}
                            {activeTab === 'settings' && renderSettings()}
                            {activeTab === 'profile' && renderProfile()}
                            {activeTab === 'fees' && renderFees()}
                            {activeTab === 'expenses' && renderExpenses()}
                            {activeTab === 'schedule' && renderSchedule()}
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
                <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-end justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowPushModal(false)}>
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-4 h-4 rounded-full shrink-0 ${
                                pushPermission === 'granted' ? 'bg-emerald-500' :
                                pushPermission === 'denied'  ? 'bg-red-500' :
                                'bg-amber-400'
                            }`} />
                            <h3 className="text-sm font-black uppercase tracking-tighter text-zinc-900">
                                {pushPermission === 'granted' ? 'Notificaciones activas' :
                                 pushPermission === 'denied'  ? 'Notificaciones bloqueadas' :
                                 'Notificaciones desactivadas'}
                            </h3>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                            {pushPermission === 'granted'
                                ? 'Recibirás alertas de pagos y asistencia aunque la app esté cerrada.'
                                : pushPermission === 'denied'
                                ? 'Bloqueaste las notificaciones. Para activarlas ve a Ajustes → Safari → Notificaciones.'
                                : 'Activa las notificaciones para recibir alertas de pagos y asistencia aunque la app esté cerrada.'}
                        </p>
                        {pushPermission === 'default' && (
                            <button
                                onClick={handleActivatePush}
                                style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}
                                className="w-full py-4 rounded-2xl text-white font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all"
                            >
                                Activar notificaciones
                            </button>
                        )}
                        <button onClick={() => setShowPushModal(false)} className="w-full py-3 text-zinc-400 font-black text-[9px] uppercase tracking-widest mt-2">
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

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
                    branding={branding}
                    onClose={() => setSelectedHistoryDate(null)}
                />
            )}

            {/* MODAL DE ACCIÓN DE PAGO */}
            {paymentActionPayer && (
                <PaymentActionModal 
                    payer={paymentActionPayer} 
                    onConfirm={handleConfirmPayment} 
                    onCancel={() => setPaymentActionPayer(null)} 
                    primaryColor={branding?.primaryColor || '#6366f1'}
                    formatMoney={formatMoney}
                />
            )}

            {/* NAV CON ESTILO PREMIUM - Solo visible en Mobile */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-50 pt-3 pb-8 px-6 flex justify-between items-center h-22 z-50 md:hidden text-zinc-950">
                <TabButton icon={LayoutDashboard} label="Inicio" active={activeTab === 'dashboard'} onClick={() => changeTab('dashboard')} primaryColor={branding?.primaryColor} />
                {branding?.industry !== 'school_treasury' && (
                    <TabButton icon={Users} label={vocab.attendance} active={activeTab === 'attendance'} onClick={() => changeTab('attendance')} primaryColor={branding?.primaryColor} />
                )}
                <TabButton icon={CreditCard} label="Pagos" active={activeTab === 'payments'} onClick={() => changeTab('payments')} primaryColor={branding?.primaryColor} />
                {branding?.industry === 'school_treasury' && (
                    <TabButton icon={ShoppingCart} label="Compras" active={activeTab === 'expenses'} onClick={() => changeTab('expenses')} primaryColor={branding?.primaryColor} />
                )}
                {branding?.industry === 'school_treasury' && (
                    <TabButton icon={Calendar} label="Horario" active={activeTab === 'schedule'} onClick={() => changeTab('schedule')} primaryColor={branding?.primaryColor} />
                )}
                {/* Profile tab con foto */}
                <button
                    onClick={() => changeTab('profile')}
                    className={`flex flex-col items-center gap-0.5 transition-all duration-150 ${activeTab === 'profile' ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}
                >
                    <div className={`w-7 h-7 rounded-full overflow-hidden border-2 ${activeTab === 'profile' ? '' : 'border-transparent'}`} style={activeTab === 'profile' ? { borderColor: branding?.primaryColor || '#6366f1' } : {}}>
                        <img src={user?.photo || '/DLogo-v2.webp'} className="w-full h-full object-cover" alt="" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest" style={activeTab === 'profile' ? { color: branding?.primaryColor || '#6366f1' } : {}}>Perfil</span>
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

function DynamicQRModal({ onClose, tenantSlug, authToken, primaryColor, payers, checkedInStudent, onStudentAcknowledged }: { onClose: () => void; tenantSlug: string; authToken: string; primaryColor: string; payers: any[]; checkedInStudent?: any; onStudentAcknowledged?: () => void }) {
    const [qrData, setQrData] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(60);
    const [loading, setLoading] = useState(true);
    const [detectedStudent, setDetectedStudent] = useState<any>(null);
    const currentTokenRef = useRef<string | null>(null);

    const fetchToken = useCallback(async () => {
        if (detectedStudent) return;
        try {
            setLoading(true);
            const API = process.env.NEXT_PUBLIC_API_URL || "https://admin.digitalizatodo.cl/api";
            const res = await fetch(`${API}/${tenantSlug}/attendance/qr-token`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            
            if (!res.ok) return;

            const data = await res.json();
            if (data.token) {
                setQrData(data.token);
                currentTokenRef.current = data.token;
                setTimeLeft(data.expires_in || 60);
            }
        } catch (error) {
            console.error("Error fetching QR token:", error);
        } finally {
            setLoading(false);
        }
    }, [tenantSlug, authToken, detectedStudent]);

    useEffect(() => {
        fetchToken();
    }, [fetchToken]);

    useEffect(() => {
        if (loading || detectedStudent) return;
        if (timeLeft <= 0) {
            fetchToken();
            return;
        }
        
        const t = setTimeout(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearTimeout(t);
    }, [timeLeft, loading, fetchToken, detectedStudent]);

    // Recibir estudiante detectado desde el dashboard (WebSocket)
    useEffect(() => {
        if (checkedInStudent) {
            setDetectedStudent(checkedInStudent);
            setContinueCountdown(7);
            if (window.navigator?.vibrate) window.navigator.vibrate(200);
        }
    }, [checkedInStudent?._ts]);

    // Fallback: verificar si el token fue usado (por si WebSocket falla en móvil)
    // Consulta ligera cada 3s SOLO mientras el QR está visible
    useEffect(() => {
        if (detectedStudent || !qrData) return;
        const API = process.env.NEXT_PUBLIC_API_URL || "https://admin.digitalizatodo.cl/api";
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${API}/${tenantSlug}/attendance/qr-status?token=${currentTokenRef.current}`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                if (!res.ok) return;
                const data = await res.json();
                if (data.scanned && data.student) {
                    setDetectedStudent({ id: data.student.id, name: data.student.name, photo: data.student.photo, _ts: Date.now() });
                    setContinueCountdown(7);
                    if (window.navigator?.vibrate) window.navigator.vibrate(200);
                }
            } catch {}
        }, 3000);
        return () => clearInterval(interval);
    }, [detectedStudent, qrData, tenantSlug, authToken]);

    // Auto-continuar después de 7 segundos
    const [continueCountdown, setContinueCountdown] = useState(0);
    useEffect(() => {
        if (!detectedStudent || continueCountdown <= 0) return;
        const t = setTimeout(() => {
            if (continueCountdown === 1) {
                setDetectedStudent(null);
                onStudentAcknowledged?.();
                fetchToken();
            } else {
                setContinueCountdown(prev => prev - 1);
            }
        }, 1000);
        return () => clearTimeout(t);
    }, [detectedStudent, continueCountdown, fetchToken, onStudentAcknowledged]);

    const progressPercent = (timeLeft / 60) * 100;

    return (
        <div className="fixed inset-0 z-[100] bg-zinc-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl scale-in-center border-2 border-white/20">
                
                {detectedStudent ? (
                    <div className="p-8 text-center animate-in zoom-in-95 duration-300">
                        <div className="relative mx-auto w-32 h-32 mb-6">
                            <div className="relative w-full h-full rounded-full border-4 border-emerald-500 overflow-hidden bg-zinc-100 shadow-xl">
                                {detectedStudent.photo ? (
                                    <img src={detectedStudent.photo} className="w-full h-full object-cover" alt={detectedStudent.name} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                        <User size={48} />
                                    </div>
                                )}
                            </div>
                            <div className="absolute -right-2 -bottom-2 w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                                <Check size={20} />
                            </div>
                        </div>

                        <h2 className="text-2xl font-black text-zinc-950 tracking-tighter mb-1">¡Hola, {detectedStudent.name.split(' ')[0]}!</h2>
                        <p className="text-xl font-bold text-emerald-600 mb-6">Bienvenid@ 😊</p>

                        <div className="bg-emerald-50 rounded-2xl p-4 mb-8 border border-emerald-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Asistencia Registrada</p>
                            <p className="text-xs font-bold text-emerald-800 mt-1">
                                {new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} • Dojo Arica
                            </p>
                        </div>

                        <button
                            onClick={() => { setDetectedStudent(null); onStudentAcknowledged?.(); setContinueCountdown(0); fetchToken(); }}
                            className="relative w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all overflow-hidden"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <div className="absolute inset-0 bg-black/15 origin-right transition-transform duration-1000 ease-linear" style={{ transform: `scaleX(${continueCountdown / 7})` }} />
                            <span className="relative z-10">Siguiente ({continueCountdown}s)</span>
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="p-6 text-center relative border-b border-zinc-100 bg-zinc-50/50">
                            <button onClick={onClose} className="absolute right-4 top-4 p-2 bg-white rounded-full text-zinc-400 hover:text-zinc-600 shadow-sm transition-all active:scale-95 border border-zinc-100">
                                <XCircle size={24} />
                            </button>
                            <div className="w-12 h-12 bg-white text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md border border-zinc-100">
                                <QrCode size={24} />
                            </div>
                            <h2 className="text-xl font-black text-zinc-900 leading-tight">Punto de Marcación</h2>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mt-1">Escanea el código para ingresar</p>
                        </div>
                        
                        <div className="p-8 flex flex-col items-center">
                            <div className="relative p-6 bg-white rounded-3xl shadow-xl border border-zinc-100 mb-8 flex items-center justify-center group overflow-hidden">
                                {qrData ? (
                                    <QRCodeCanvas value={qrData} size={200} level="H" includeMargin={false} fgColor={primaryColor} />
                                ) : (
                                    <div className="w-[200px] h-[200px] flex items-center justify-center bg-zinc-50 rounded-xl">
                                        <Loader2 className="animate-spin text-zinc-300" size={32} />
                                    </div>
                                )}
                                
                                {/* Overlay de luz scanner */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-400/10 to-transparent h-full w-full pointer-events-none line-scan-animation" />
                            </div>
                            
                            <div className="w-full space-y-3">
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-zinc-500 px-1">
                                    <span className="flex items-center gap-1.5"><RefreshCw size={10} className={loading ? "animate-spin" : ""} /> Código Dinámico</span>
                                    <span className={timeLeft <= 5 ? "text-red-500 font-black animate-pulse" : "font-black"}>{timeLeft}s</span>
                                </div>
                                <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ease-linear rounded-full ${timeLeft <= 5 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-emerald-500'}`}
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>

                            <p className="mt-8 text-[9px] text-zinc-400 font-bold uppercase tracking-widest text-center leading-relaxed">
                                El código se actualiza automáticamente<br/>por seguridad cada 1 minuto.
                            </p>
                        </div>
                    </>
                )}
            </div>
            <style>{`
                @keyframes scanLine {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
                .line-scan-animation {
                    animation: scanLine 3s linear infinite;
                    border-top: 2px solid rgba(16, 185, 129, 0.4);
                }
            `}</style>
        </div>
    );
}
