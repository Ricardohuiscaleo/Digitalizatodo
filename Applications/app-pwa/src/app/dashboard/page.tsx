"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { getEcho } from '@/lib/echo';
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
    User
} from 'lucide-react';
import { useBranding } from "@/context/BrandingContext";
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
    deleteAttendance
} from "@/lib/api";

/* ─── Proof Modal Component ─── */
/* ─── Payment Action Modal ─── */
/* ─── Payment Action Modal ─── */
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
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [expandedPayerId, setExpandedPayerId] = useState<string | null>(null);
    const [historyPage, setHistoryPage] = useState(0);
    const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
    const [now, setNow] = useState(new Date());
    const [copied, setCopied] = useState(false);
    const [regPageCode, setRegPageCode] = useState<string | null>(null);
    const [generatingPage, setGeneratingPage] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [proofModalUrl, setProofModalUrl] = useState<string | null>(null);
    const [paymentActionPayer, setPaymentActionPayer] = useState<any>(null);
    const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(null);

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
                        if (s.today_status === 'present') currentAttendance.add(s.id);
                    });
                }
            });
            setAttendance(currentAttendance);
        }
    }, [token, paymentFilter, selectedMonth, selectedYear]);

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(t);
    }, []);

    // POLLING REAL-TIME: detectar nuevos check-ins cuando el modal QR está abierto
    const knownAttendanceRef = useRef<Set<string>>(new Set());
    const pollInitializedRef = useRef(false);
    useEffect(() => {
        if (!showQRModal) {
            pollInitializedRef.current = false;
            return;
        }
        // Snapshot de quiénes ya están presentes al abrir el modal
        knownAttendanceRef.current = new Set(attendance);
        pollInitializedRef.current = true;

        const poll = setInterval(async () => {
            const slug = localStorage.getItem('tenant_slug')?.trim();
            const t = token || localStorage.getItem('staff_token') || localStorage.getItem('auth_token');
            if (!slug || !t) return;
            const h = await getAttendanceHistory(slug, t);
            if (!h?.attendance) return;
            setAttendanceHistory(h.attendance);
            const today = new Date().toISOString().split('T')[0];
            const todayRecords = h.attendance.filter((r: any) => (r.date || r.created_at?.split('T')[0]) === today && r.status === 'present');
            const currentIds = new Set(todayRecords.map((r: any) => String(r.student_id)));
            // Detectar SOLO los nuevos desde que se abrió el modal
            for (const id of currentIds) {
                if (!knownAttendanceRef.current.has(id)) {
                    const rec = todayRecords.find((r: any) => String(r.student_id) === id);
                    if (rec?.student) {
                        setLastCheckedInStudent({
                            id: rec.student.id,
                            name: rec.student.name,
                            photo: rec.student.photo,
                            _ts: Date.now()
                        });
                    }
                    // Agregar al set conocido para no detectarlo de nuevo
                    knownAttendanceRef.current.add(id);
                }
            }
            setAttendance(currentIds);
        }, 3000);
        return () => clearInterval(poll);
    }, [showQRModal, token]);

    // Estado para estudiante detectado via QR (se pasa al modal)
    const [lastCheckedInStudent, setLastCheckedInStudent] = useState<any>(null);

    // REAL-TIME DE VERDAD CON WEBSOCKETS (LARAVEL REVERB)
    useEffect(() => {
        const key = process.env.NEXT_PUBLIC_REVERB_APP_KEY;
        
        if (!key || !branding?.slug) return;

        const echo = getEcho();
        if (!echo) return;

        const channel = echo.channel(`attendance.${branding.slug}`);
        
        channel.listen('.student.checked-in', (data: { studentId: string | number; studentName?: string; studentPhoto?: string }) => {
            console.log('Real-time check-in received:', data);
            setAttendance(prev => {
                const next = new Set(prev);
                next.add(String(data.studentId));
                return next;
            });
            // Notificar al modal QR si está abierto
            setLastCheckedInStudent({
                id: data.studentId,
                name: data.studentName || 'Alumno',
                photo: data.studentPhoto,
                _ts: Date.now()
            });
            refreshPayers();
            getAttendanceHistory(branding.slug!, token!).then(h => {
                if (h?.attendance) setAttendanceHistory(h.attendance);
            });
        });

        // Pagos Real-Time
        const paymentsChannel = echo.channel(`payments.${branding.slug}`);
        paymentsChannel.listen('.payment.updated', (data: any) => {
            console.log('Real-time payment update received:', data);
            refreshPayers();
        });

        // Registros Real-Time
        const dashboardChannel = echo.channel(`dashboard.${branding.slug}`);
        dashboardChannel.listen('.student.registered', (data: any) => {
            console.log('Real-time registration received:', data);
            refreshPayers();
        });

        return () => {
            echo.leaveChannel(`attendance.${branding.slug}`);
            echo.leaveChannel(`payments.${branding.slug}`);
            echo.leaveChannel(`dashboard.${branding.slug}`);
        };
    }, [branding?.slug, refreshPayers, token]);

    const tabs = ['dashboard', 'attendance', 'payments', 'settings'];

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

            let [profile, payersData, attendanceHistoryData]: [any, any, any] = await Promise.all([
                getProfile(tenantSlug, storedToken!),
                getPayers(tenantSlug, storedToken!, { month: selectedMonth, year: selectedYear, history: paymentFilter === 'history' }),
                getAttendanceHistory(tenantSlug, storedToken!)
            ]);

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
                        [profile, payersData, attendanceHistoryData] = await Promise.all([
                            getProfile(tenantSlug, newToken),
                            getPayers(tenantSlug, newToken, { month: selectedMonth, year: selectedYear, history: paymentFilter === 'history' }),
                            getAttendanceHistory(tenantSlug, newToken)
                        ]);
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
                if (profile.tenant && (!branding?.name || !branding?.industry)) {
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

                if (attendanceHistoryData?.attendance) {
                    setAttendanceHistory(attendanceHistoryData.attendance);
                }

                if (payersData?.payers) {
                    const currentAttendance = new Set<string>();
                    payersData.payers.forEach((p: any) => {
                        if (p.enrolledStudents) {
                            p.enrolledStudents.forEach((s: any) => {
                                if (s.today_status === 'present') currentAttendance.add(s.id);
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

    useEffect(() => {
        if (activeTab === 'payments' && !loading) {
            refreshPayers();
        }
    }, [paymentFilter, selectedMonth, selectedYear, activeTab]);

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

    const toggleAttendance = async (studentId: string) => {
        const isPresent = attendance.has(studentId);

        const newAttendance = new Set(attendance);
        if (isPresent) newAttendance.delete(studentId);
        else newAttendance.add(studentId);
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

    const renderDashboard = () => {
        const totalStudents = allStudents.length;
        const paidStudents = allStudents.filter(s => s.payerStatus === 'paid').length;
        const pendingStudents = totalStudents - paidStudents;
        const presentToday = attendance.size;

        // Agrupar historial por fecha
        const historyByDate: Record<string, any[]> = {};
        attendanceHistory.forEach((r: any) => {
            const d = r.date || r.created_at?.split('T')[0] || 'Sin fecha';
            if (!historyByDate[d]) historyByDate[d] = [];
            historyByDate[d].push(r);
        });
        const historyDates = Object.keys(historyByDate).sort((a, b) => b.localeCompare(a));
        const PAGE_SIZE = 5;
        const totalPages = Math.ceil(historyDates.length / PAGE_SIZE);
        const pagedDates = historyDates.slice(historyPage * PAGE_SIZE, (historyPage + 1) * PAGE_SIZE);

        return (
            <div className="space-y-6 text-zinc-950">
                {/* Dashboard Summary - Sistema de Tarjetas Premium */}
                {/* Dashboard Summary - Sistema de Tarjetas Premium Horizontal Grid 2x2 */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {/* Total */}
                    <div className="bg-white rounded-[1.8rem] px-4 py-3 border border-zinc-100 shadow-sm flex items-center justify-between min-h-[75px]">
                        <div className="flex flex-col gap-1.5 shrink-0">
                            <Users style={{ color: branding?.primaryColor || '#6366f1' }} size={22} strokeWidth={2.5} />
                            <p className="text-[7.5px] font-black text-zinc-400 uppercase tracking-widest leading-none">Total</p>
                        </div>
                        <p className="text-2xl font-black text-zinc-950 tracking-tighter leading-none shrink-0">{totalStudents}</p>
                    </div>

                    {/* Pagados */}
                    <div className="bg-emerald-50/40 rounded-[1.8rem] px-4 py-3 border border-emerald-100/60 shadow-sm flex items-center justify-between min-h-[75px]">
                        <div className="flex flex-col gap-1.5 shrink-0">
                            <CheckCircle2 className="text-emerald-600" size={26} strokeWidth={2.5} />
                            <p className="text-[7.5px] font-black text-emerald-600/60 uppercase tracking-widest leading-none">Pagados</p>
                        </div>
                        <p className="text-2xl font-black text-emerald-700 tracking-tighter leading-none shrink-0">{paidStudents}</p>
                    </div>

                    {/* Revisión */}
                    <div className="bg-amber-50/40 rounded-[1.8rem] px-4 py-3 border border-amber-100/60 shadow-sm flex items-center justify-between min-h-[75px]">
                        <div className="flex flex-col gap-1.5 shrink-0">
                            <RefreshCw className="text-amber-600 animate-spin-slow" size={24} strokeWidth={2.5} />
                            <p className="text-[7.5px] font-black text-amber-600/60 uppercase tracking-widest leading-none">Revisión</p>
                        </div>
                        <p className="text-2xl font-black text-amber-700 tracking-tighter leading-none shrink-0">{allStudents.filter(s => s.payerStatus === 'review').length}</p>
                    </div>

                    {/* Deuda */}
                    <div className="bg-rose-50/40 rounded-[1.8rem] px-4 py-3 border border-rose-100/60 shadow-sm flex items-center justify-between min-h-[75px]">
                        <div className="flex flex-col gap-1.5 shrink-0">
                            <XCircle className="text-rose-600" size={24} strokeWidth={2.5} />
                            <p className="text-[7.5px] font-black text-rose-600/60 uppercase tracking-widest leading-none">Deuda</p>
                        </div>
                        <p className="text-2xl font-black text-rose-700 tracking-tighter leading-none shrink-0">{allStudents.filter(s => s.payerStatus === 'pending').length}</p>
                    </div>
                </div>

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
                                {allStudents.filter(s => attendance.has(s.id)).slice(0, 5).map(s => (
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

                    {/* Tarjeta de Actividad del Día */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 flex flex-col justify-between">
                        <h3 className="text-sm font-black text-zinc-800 flex items-center gap-2 uppercase tracking-tighter mb-4">
                            <Clock style={{ color: branding?.primaryColor || '#6366f1' }} size={18} />
                            Actividad
                        </h3>
                        {(() => {
                            const today = now.toISOString().split('T')[0];
                            const todayRecords = attendanceHistory.filter((r: any) => (r.date || r.created_at?.split('T')[0]) === today && r.status === 'present');
                            if (todayRecords.length === 0) return (
                                <div className="flex flex-col items-center justify-center gap-2 py-6 px-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                                    <p className="text-zinc-500 text-[11px] font-black uppercase tracking-widest">{now.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                                    <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Sin registros</p>
                                </div>
                            );
                            const lastRecord = todayRecords[todayRecords.length - 1];
                            return (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                                        <img src={lastRecord.student?.photo} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-black text-emerald-900 uppercase truncate leading-none">{lastRecord.student?.name}</p>
                                            <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest mt-1">
                                                Último ingreso • {new Date(lastRecord.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        {lastRecord.registration_method === 'qr' && (
                                            <div className="bg-emerald-500 p-1.5 rounded-xl shrink-0"><QrCode size={12} className="text-white" /></div>
                                        )}
                                    </div>
                                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest text-center">{todayRecords.length} registro{todayRecords.length !== 1 ? 's' : ''} hoy</p>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* HISTORIAL DE ASISTENCIA - RE-ESTILIZADO PARA DESKTOP */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-black text-zinc-800 flex items-center gap-2 uppercase tracking-tighter">
                            <RefreshCw className="text-zinc-400" size={18} />
                            Historial Reciente
                        </h3>
                        {totalPages > 1 && (
                            <div className="flex items-center gap-3">
                                <button disabled={historyPage === 0} onClick={() => setHistoryPage(p => p - 1)} className="w-9 h-9 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all hover:bg-zinc-100">
                                    <ChevronUp size={18} className="text-zinc-500" />
                                </button>
                                <span className="text-[10px] font-black text-zinc-400 tracking-widest">{historyPage + 1} / {totalPages}</span>
                                <button disabled={historyPage >= totalPages - 1} onClick={() => setHistoryPage(p => p + 1)} className="w-9 h-9 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all hover:bg-zinc-100">
                                    <ChevronDown size={18} className="text-zinc-500" />
                                </button>
                            </div>
                        )}
                    </div>

                    {pagedDates.length === 0 ? (
                        <div className="flex items-center gap-3 py-10 px-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 justify-center">
                            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">No hay historial disponible aún</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                            {pagedDates.map(date => {
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
            </div>
        );
    };

    const renderAttendance = () => {
        const filteredStudents = allStudents.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
        const presentCount = allStudents.filter(s => attendance.has(s.id)).length;

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
                                const isPresent = attendance.has(student.id);
                                return (
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
                        const isPresent = attendance.has(student.id);
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
                                        {/* QR badge removed */}
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
                {/* Tabs Selector Premium (Neumorphic Style) */}
                <div className="flex bg-zinc-100 p-1.5 rounded-[2.2rem] gap-1 shadow-inner">
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

                {/* VISTA MOBILE: LISTA DE TARJETAS */}
                <div className="space-y-3 pb-6">
                    {filteredPayers.map(payer => {
                        const { displayAmount, reviewAmount, pendingAmount, approvedAmount, numEnrollments } = getPayerRealStats(payer);
                        const isExpanded = expandedPayerId === payer.id;
                        const isPaid = (payer.status === 'paid') || (paymentFilter === 'history' && approvedAmount > 0 && pendingAmount === 0 && reviewAmount === 0);
                        const hasReview = reviewAmount > 0;
                        const proofUrl = payer.proof_image;

                        return (
                            <div
                                key={payer.id}
                                className={`bg-white rounded-[2.2rem] shadow-sm border transition-all duration-150 overflow-hidden ${
                                    isExpanded ? 'border-zinc-300 ring-1 ring-zinc-100 mb-6' : 
                                    isPaid ? 'border-emerald-300 bg-emerald-100 shadow-emerald-50' : 
                                    (payer.status === 'review' || reviewAmount > 0) ? 'border-amber-300 bg-amber-100 shadow-amber-50' : 
                                    'border-rose-300 bg-rose-100 shadow-rose-50'
                                }`}
                            >
                                <div className="p-4 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedPayerId(isExpanded ? null : payer.id)}>
                                    <div className="relative shrink-0">
                                        <img src={payer.photo} className="w-14 h-14 rounded-full object-cover shadow-sm grayscale-[0.3]" />
                                        <div className="absolute -bottom-1.5 -right-1 text-white text-[7px] font-black px-1 py-0.5 rounded border border-white uppercase" style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}>Titular</div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-black text-zinc-900 text-[13px] uppercase truncate pr-2 leading-tight">{payer.name}</h4>
                                            {isExpanded ? <ChevronUp size={18} className="text-zinc-300" /> : <ChevronDown size={18} className="text-zinc-300" />}
                                        </div>

                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex items-center -space-x-3">
                                                {payer.enrolledStudents.slice(0, 5).map((r: any) => (
                                                    <img 
                                                        key={r.id} 
                                                        src={r.photo} 
                                                        className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm group-hover:translate-y-[-2px] transition-transform" 
                                                        alt={r.name}
                                                    />
                                                ))}
                                                {payer.enrolledStudents.length > 5 && (
                                                    <div className="w-8 h-8 rounded-full bg-zinc-100 border-2 border-white flex items-center justify-center shrink-0 shadow-sm z-10">
                                                        <span className="text-[8px] font-black text-zinc-500">+{payer.enrolledStudents.length - 5}</span>
                                                    </div>
                                                )}
                                                <ChevronRight size={14} className="text-zinc-300 ml-2 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest leading-none">{numEnrollments} {vocab.memberLabel}s</span>
                                        </div>

                                        <div className="flex items-center gap-2 mt-1.5 overflow-x-auto hide-scrollbar">
                                            <span className="font-black text-zinc-950 text-sm tracking-tighter shrink-0">
                                                {formatMoney(displayAmount)}
                                            </span>
                                            {!isPaid && !(payer.status === 'review' || reviewAmount > 0) && (
                                                <span className="text-[7px] font-black text-rose-600 uppercase tracking-widest whitespace-nowrap px-1.5 py-0.5 rounded bg-rose-50 border border-rose-100">
                                                    Deuda pendiente
                                                </span>
                                            )}
                                            {(payer.status === 'review' || reviewAmount > 0) && !isPaid && (
                                                <span className="text-[7px] font-black text-amber-600 uppercase tracking-widest whitespace-nowrap px-1.5 py-0.5 rounded bg-amber-50 border border-amber-100">
                                                    Por validar
                                                </span>
                                            )}
                                            {isPaid && (
                                                <span className="text-[7px] font-black text-emerald-600 uppercase tracking-widest whitespace-nowrap px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100">
                                                    Pagado
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {isPaid ? (
                                            <div className="bg-emerald-500 rounded-xl p-1.5 shadow-sm">
                                                <CheckCircle2 size={16} className="text-white" />
                                            </div>
                                        ) : (payer.status === 'review' || reviewAmount > 0) ? (
                                            <div className="bg-amber-500 rounded-xl p-1.5 shadow-sm">
                                                <RefreshCw size={16} className="text-white" />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                                                <Clock size={14} className="text-zinc-400" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="px-4 pb-5 pt-4 bg-zinc-50 border-t border-zinc-100 animate-in slide-in-from-top-2 duration-150">
                                        <div className="flex justify-between items-center mb-3">
                                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Desglose del Pago:</p>
                                            {payer.status === 'review' && (
                                                <span className="text-[8px] font-black bg-amber-50 text-amber-600 px-2 py-1 rounded-full uppercase">Esperando Validación</span>
                                            )}
                                        </div>
                                        <div className="space-y-2 mb-4">
                                            {payer.payments?.map((payment: any) => (
                                                <div key={payment.id} className="flex items-center justify-between bg-white p-3 rounded-2xl border border-zinc-100 shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            {payment.student_photo ? (
                                                                <img src={payment.student_photo} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                                                            ) : (
                                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${payment.status === 'review' ? 'bg-amber-500 text-white' : 'bg-rose-50 text-rose-500'}`}>
                                                                    {payment.status === 'review' ? <RefreshCw size={14} className="animate-spin-slow" /> : <Clock size={14} />}
                                                                </div>
                                                            )}
                                                            {payment.status === 'review' && (
                                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                                                                    <RefreshCw size={8} className="text-white animate-spin-slow" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black uppercase text-zinc-900 leading-none">{payment.student_name}</span>
                                                            <span className="text-[8px] text-zinc-400 font-bold uppercase mt-1">
                                                                Vence: {payment.due_date} • {
                                                                    payment.status === 'review' ? 'En Revisión' : 
                                                                    payment.status === 'approved' ? 'Pagado' : 
                                                                    'Por Pagar'
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex flex-col items-end gap-1">
                                                        <span className="text-xs font-black text-zinc-900">{formatMoney(payment.amount)}</span>
                                                        {(payment.status === 'review' || payment.status === 'approved') && payment.proof_url && (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setProofModalUrl(payment.proof_url); }}
                                                                style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}
                                                                className="text-[7px] font-black text-white px-3 py-1.5 rounded-lg uppercase flex items-center gap-1 shadow-md active:scale-95 transition-all"
                                                            >
                                                                <Eye size={10} /> Ver Boucher
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* ACCIONES DEL PIE - Solo si no está pagado */}
                                        {!isPaid && (
                                            <div className="flex gap-2 pt-3 border-t border-zinc-200/60">
                                                {proofUrl && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setProofModalUrl(proofUrl); }}
                                                        className="flex-1 h-12 bg-white border-2 border-zinc-200 text-zinc-500 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-50 active:scale-95 transition-all shadow-sm font-black text-[9px] uppercase tracking-widest"
                                                    >
                                                        <Eye size={18} /> Ver Comprobante
                                                    </button>
                                                )}
                                                <button
                                                    className="flex-[2] h-12 text-white rounded-xl text-[10px] font-black uppercase shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                                                    style={{ backgroundColor: (payer.status === 'review' || reviewAmount > 0) ? '#f59e0b' : (branding?.primaryColor || '#6366f1') }}
                                                    onClick={(e) => { e.stopPropagation(); handlePaymentApprove(payer.id); }}
                                                >
                                                    {(payer.status === 'review' || reviewAmount > 0) ? (
                                                        <>
                                                            <RefreshCw size={18} className="animate-spin-slow" />
                                                            <span>Aprobar Pago</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <DollarSign size={18} />
                                                            <span>Marcar como Pagado</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

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

                {/* PRECIOS + DESCUENTO en una sola tarjeta */}
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

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center p-12 bg-white text-zinc-950">
            <RefreshCw className="animate-spin mb-6" style={{ color: branding?.primaryColor || '#6366f1' }} size={32} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Sincronizando Sistema</p>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-white font-sans relative overflow-hidden text-zinc-950">
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
                        <h1 className="text-lg font-black uppercase tracking-tighter text-zinc-950 leading-none">{branding?.name || 'Academy'}</h1>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: branding?.primaryColor || '#6366f1' }}>{activeTab === 'dashboard' ? 'Resumen' : activeTab === 'attendance' ? vocab.attendance : activeTab === 'payments' ? 'Pagos' : 'Ajustes'}</span>
                            {isDemo && <span className="bg-emerald-500/10 text-emerald-600 text-[6px] font-black px-1 py-0.5 rounded uppercase tracking-widest">DEMO</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 bg-white pl-3 pr-1 py-1 rounded-full border border-zinc-100 shadow-sm">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-zinc-900 leading-none truncate max-w-[80px]">{user?.name?.split(' ')[0] || 'Admin'}</span>
                        <span className="text-[7px] font-black uppercase tracking-[0.2em] mt-0.5" style={{ color: branding?.primaryColor || '#6366f1' }}>Staff</span>
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center shrink-0 rounded-full overflow-hidden border-2" style={{ borderColor: branding?.primaryColor || '#6366f1' }}>
                        <img src="/DLogo-v2.webp" className="w-full h-full object-cover" alt="D" />
                    </div>
                </div>
            </header>

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
                            <h2 className="text-sm font-black uppercase tracking-tighter text-zinc-950 truncate leading-none">{branding?.name || 'Academy'}</h2>
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
                                    {activeTab === 'dashboard' ? 'Resumen General' : activeTab === 'attendance' ? vocab.attendance : activeTab === 'payments' ? 'Estado de Pagos' : 'Configuración'}
                                </h2>
                                {isDemo && <span className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Modo Demo Activo</span>}
                            </div>
                            {activeTab === 'dashboard' && renderDashboard()}
                            {activeTab === 'attendance' && renderAttendance()}
                            {activeTab === 'payments' && renderPayments()}
                            {activeTab === 'settings' && renderSettings()}
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
                <TabButton icon={Users} label={vocab.attendance} active={activeTab === 'attendance'} onClick={() => changeTab('attendance')} primaryColor={branding?.primaryColor} />
                <TabButton icon={CreditCard} label="Pagos" active={activeTab === 'payments'} onClick={() => changeTab('payments')} primaryColor={branding?.primaryColor} />
                <TabButton icon={Settings} label="Ajustes" active={activeTab === 'settings'} onClick={() => changeTab('settings')} primaryColor={branding?.primaryColor} />
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

    // Recibir estudiante detectado desde el dashboard (listener centralizado)
    useEffect(() => {
        if (checkedInStudent) {
            setDetectedStudent(checkedInStudent);
            setContinueCountdown(7);
            if (window.navigator?.vibrate) window.navigator.vibrate(200);
        }
    }, [checkedInStudent?._ts]);

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
