"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
    QrCode
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
    updateBankInfo
} from "@/lib/api";

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
        negro: 'bg-zinc-950 text-white',
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
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [expandedPayerId, setExpandedPayerId] = useState<string | null>(null);
    const [historyPage, setHistoryPage] = useState(0);
    const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
    const [now, setNow] = useState(new Date());
    const [copied, setCopied] = useState(false);
    const [regPageCode, setRegPageCode] = useState<string | null>(null);
    const [generatingPage, setGeneratingPage] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(t);
    }, []);

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

    // --- PERSISTENCE & DATA FETCHING ---

    useEffect(() => {
        const init = async () => {
            let storedToken = localStorage.getItem("staff_token") || localStorage.getItem("auth_token");
            let tenantSlug = localStorage.getItem("tenant_slug")?.trim();
            const tenantId = localStorage.getItem("tenant_id")?.trim();

            // Intentar renovar sesión con remember_token si no hay token activo
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

            setToken(storedToken);

            const [profile, payersData, attendanceHistoryData]: [any, any, any] = await Promise.all([
                getProfile(tenantSlug, storedToken),
                getPayers(tenantSlug, storedToken),
                getAttendanceHistory(tenantSlug, storedToken)
            ]);

            if (profile) {
                // Redirección si es apoderado
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

    const calculatePrice = (payer: any) => {
        let total = 0;
        payer.enrolledStudents.forEach((student: any) => {
            const cat = student.category?.toLowerCase();
            total += (cat === 'adult' || cat === 'adults') ? prices.adult : prices.kids;
        });

        const numEnrollments = payer.enrolledStudents.length;
        let hasDiscount = false;

        if (numEnrollments >= prices.discountThreshold && prices.discountThreshold > 0 && prices.discountPercentage > 0) {
            total = total * (1 - prices.discountPercentage / 100);
            hasDiscount = true;
        }

        return { amount: total, hasDiscount, numEnrollments };
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
        const newStatus = isPresent ? 'absent' : 'present';

        const newAttendance = new Set(attendance);
        if (isPresent) newAttendance.delete(studentId);
        else newAttendance.add(studentId);
        setAttendance(newAttendance);

        if (!isDemo && token && (user?.tenant_slug || user?.tenant_id)) {
            await storeAttendance(user.tenant_slug || user.tenant_id, token, { student_id: studentId, status: newStatus });
        }
    };

    const handlePaymentApprove = async (payerId: string) => {
        if (isDemo) {
            setPayers(payers.map(p => p.id === payerId ? { ...p, status: 'paid' } : p));
            return;
        }

        if (token && (user?.tenant_slug || user?.tenant_id) && confirm('¿Confirmar registro de pago?')) {
            await approvePayment(user.tenant_slug || user.tenant_id, token, payerId);
            const payersData = await getPayers(user.tenant_slug || user.tenant_id, token);
            setPayers(payersData?.payers || []);
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
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-sm font-medium opacity-90 mb-1 leading-none uppercase tracking-widest text-[10px]">Total Alumnos Participantes</h2>
                            <p className="text-4xl font-black mb-4 tracking-tighter">{totalStudents}</p>
                            <div className="flex justify-between items-center text-[11px] bg-white/20 rounded-xl p-4 backdrop-blur-sm font-black uppercase tracking-widest">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-green-300 border-none" />
                                    <span>{paidStudents} Pagados</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <XCircle size={16} className="text-red-300 border-none" />
                                    <span>{pendingStudents} Pendientes</span>
                                </div>
                            </div>
                            {isDemo && <p className="text-[10px] font-black uppercase text-center mt-4 text-white/50 tracking-[0.3em]">MODO DEMO ACTIVO</p>}
                        </div>
                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-sm font-black text-zinc-800 flex items-center gap-2 uppercase tracking-tighter">
                                    <CalendarCheck className="text-indigo-500" size={18} />
                                    Asistencia Hoy
                                </h3>
                                <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase tracking-widest">
                                    {now.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' })}
                                </p>
                            </div>
                            <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-black">
                                {presentToday} / {totalStudents}
                            </span>
                        </div>

                        {presentToday > 0 ? (
                            <div className="space-y-4">
                                <div className="flex -space-x-2 overflow-x-auto pb-1 scrollbar-hide">
                                    {allStudents.filter(s => attendance.has(s.id)).map(s => (
                                        <img
                                            key={s.id}
                                            className="inline-block h-10 w-10 rounded-full border-2 border-white shadow-sm object-cover shrink-0"
                                            src={s.photo}
                                            alt={s.name}
                                        />
                                    ))}
                                </div>
                                <button onClick={() => changeTab('attendance')} className="w-full py-4 rounded-2xl bg-zinc-950 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-zinc-200">
                                    Registrar Asistencia 👇
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => changeTab('attendance')} className="flex items-center justify-center gap-3 py-6 px-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 w-full group transition-all hover:bg-zinc-100">
                                <CalendarCheck size={20} className="text-zinc-300 shrink-0 group-hover:scale-110 transition-transform" />
                                <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Sin registros · Empezar Ahora</p>
                            </button>
                        )}
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
                                    <ChevronUp size={16} className="text-zinc-500" />
                                </button>
                                <span className="text-[10px] font-black text-zinc-400 tracking-widest">{historyPage + 1} / {totalPages}</span>
                                <button disabled={historyPage >= totalPages - 1} onClick={() => setHistoryPage(p => p + 1)} className="w-9 h-9 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all hover:bg-zinc-100">
                                    <ChevronDown size={16} className="text-zinc-500" />
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
                                    <div key={date} className="bg-zinc-50/50 hover:bg-zinc-50 rounded-2xl p-4 border border-zinc-100 transition-colors">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-white border border-zinc-100 flex flex-col items-center justify-center shrink-0 shadow-sm">
                                                    <span className="text-[8px] font-black uppercase text-indigo-500 leading-none mb-1">{dateObj.toLocaleDateString('es-CL', { month: 'short' })}</span>
                                                    <span className="text-lg font-black text-zinc-900 leading-none">{dateObj.getDate()}</span>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-zinc-800 uppercase tracking-widest leading-none">{dateStr}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="inline-flex items-center gap-1 text-indigo-600 text-[9px] font-black uppercase">
                                                            {presentCount} presentes
                                                        </span>
                                                        {records[0]?.created_at && (
                                                            <span className="text-[9px] text-zinc-400 font-bold">
                                                                🕐 {new Date(records[0].created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {students.length > 0 && (
                                                    <div className="flex -space-x-2 overflow-hidden px-2">
                                                        {students.slice(0, 10).map((r: any) => (
                                                            <img key={r.id} src={r.student?.photo} className="h-8 w-8 rounded-full border-2 border-white object-cover shrink-0 shadow-sm" alt={r.student?.name} />
                                                        ))}
                                                        {students.length > 10 && (
                                                            <div className="h-8 w-8 rounded-full border-2 border-white bg-zinc-200 flex items-center justify-center shrink-0">
                                                                <span className="text-[8px] font-black text-zinc-500">+{students.length - 10}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2 ml-auto">
                                                    <button
                                                        onClick={() => changeTab('attendance')}
                                                        className="h-9 px-4 rounded-xl bg-white border border-zinc-200 text-zinc-600 text-[9px] font-black uppercase tracking-widest hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all active:scale-95"
                                                    >
                                                        Registrar
                                                    </button>
                                                </div>
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
            <div className="space-y-4 px-4 pb-32">
                <div className="relative">
                    <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-zinc-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar participante..."
                        className="w-full bg-zinc-50 pl-14 pr-6 py-5 rounded-2xl shadow-sm border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-950 text-base font-bold text-zinc-950"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <button
                    onClick={() => setShowQRModal(true)}
                    className="w-full bg-zinc-950 hover:bg-zinc-800 text-white rounded-2xl p-4 flex items-center justify-center gap-3 shadow-md transition-all active:scale-95"
                >
                    <QrCode size={20} className="text-emerald-400" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-white">Modo Escáner: Mostrar QR Dinámico</span>
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
                                                <div className="flex items-center gap-2 text-emerald-600">
                                                    <CheckCircle2 size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Presente</span>
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
                                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-1 border-2 border-emerald-50">
                                                <CheckCircle2 className="text-white" size={14} />
                                            </div>
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

    const renderPayments = () => {
        const filteredPayers = payers.filter(p => {
            if (paymentFilter === 'paid') return p.status === 'paid';
            if (paymentFilter === 'pending') return p.status === 'pending';
            return true;
        }).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

        return (
            <div className="space-y-4 px-4">
                <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-zinc-100 overflow-x-auto hide-scrollbar">
                    {['all', 'pending', 'paid'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setPaymentFilter(f)}
                            className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-colors ${paymentFilter === f ? 'bg-zinc-950 text-white shadow-md' : 'text-zinc-400'
                                }`}
                        >
                            {f === 'all' ? 'Ver Todos' : f === 'pending' ? 'Pendientes' : 'Al Día'}
                        </button>
                    ))}
                </div>

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
                                const { amount, hasDiscount, numEnrollments } = calculatePrice(payer);
                                const isPaid = payer.status === 'paid';
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
                                                <span className="text-sm font-black text-indigo-600">{formatMoney(amount)}</span>
                                                {hasDiscount && <span className="text-[8px] text-emerald-600 font-black uppercase tracking-widest">Con Descuento</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {isPaid ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                                    <CheckCircle2 size={12} /> Al Día
                                                </span>
                                            ) : payer.status === 'review' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest">
                                                    <RefreshCw size={12} className="animate-spin-slow" /> Por Aprobar
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest">
                                                    <XCircle size={12} /> Pendiente
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {!isPaid && (
                                                <button
                                                    onClick={() => handlePaymentApprove(payer.id)}
                                                    className="px-5 py-2 rounded-xl bg-zinc-950 text-white text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-md shadow-zinc-100"
                                                >
                                                    Pagar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* VISTA MOBILE: LISTA DE TARJETAS */}
                <div className="space-y-3 pb-6 md:hidden">
                    {filteredPayers.map(payer => {
                        const { amount, hasDiscount, numEnrollments } = calculatePrice(payer);
                        const isPaid = payer.status === 'paid';
                        const isExpanded = expandedPayerId === payer.id;

                        return (
                            <div
                                key={payer.id}
                                className={`bg-white rounded-[2rem] shadow-sm border transition-all duration-200 overflow-hidden ${isExpanded ? 'border-zinc-300 ring-1 ring-zinc-100 mb-6' : 'border-zinc-100'
                                    }`}
                            >
                                <div className="p-5 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedPayerId(isExpanded ? null : payer.id)}>
                                    <div className="relative">
                                        <img src={payer.photo} className="w-16 h-16 rounded-full object-cover shadow-sm" />
                                        <div className="absolute -bottom-2 -right-2 bg-zinc-950 text-white text-[8px] font-black px-1.5 py-0.5 rounded border-2 border-white uppercase">Titular</div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-black text-zinc-900 text-sm uppercase truncate pr-4 leading-tight">{payer.name}</h4>
                                            {isExpanded ? <ChevronUp size={20} className="text-zinc-300" /> : <ChevronDown size={20} className="text-zinc-300" />}
                                        </div>

                                        <div className="flex items-center gap-2 mt-1.5">
                                            <div className="flex -space-x-2">
                                                {payer.enrolledStudents.slice(0, 3).map((s: any) => (
                                                    <img key={s.id} src={s.photo} className="w-6 h-6 rounded-full border-2 border-white object-cover shadow-sm" />
                                                ))}
                                            </div>
                                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{numEnrollments} Inscritos</span>
                                        </div>

                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="font-black text-indigo-600 text-base tracking-tighter">{formatMoney(amount)}</span>
                                            {hasDiscount && <span className="text-[8px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg font-black uppercase tracking-widest">Descuento</span>}
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        {isPaid ? (
                                            <div className="bg-emerald-500 rounded-2xl p-2.5 shadow-lg shadow-emerald-100">
                                                <CheckCircle2 size={24} className="text-white" />
                                            </div>
                                        ) : payer.status === 'review' ? (
                                            <button
                                                className="bg-amber-50 hover:bg-amber-100 text-amber-600 px-5 py-3 rounded-2xl text-[10px] font-black uppercase shadow-sm border border-amber-100 transition-all active:scale-95 flex flex-col items-center"
                                                onClick={(e) => { e.stopPropagation(); handlePaymentApprove(payer.id); }}
                                            >
                                                <RefreshCw size={14} className="mb-1 animate-spin-slow" />
                                                <span>Aprobar</span>
                                            </button>
                                        ) : (
                                            <button
                                                className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-5 py-3 rounded-2xl text-[10px] font-black uppercase shadow-sm border border-rose-100 transition-all active:scale-95"
                                                onClick={(e) => { e.stopPropagation(); handlePaymentApprove(payer.id); }}
                                            >
                                                Pagar
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="px-6 pb-6 pt-4 bg-zinc-50 border-t border-zinc-100 animate-in slide-in-from-top-4 duration-300">
                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Detalle de Participantes:</p>
                                        <div className="space-y-2.5">
                                            {payer.enrolledStudents.map((s: any) => (
                                                <div key={s.id} className="flex items-center justify-between bg-white p-3 rounded-2xl border border-zinc-100 shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <img src={s.photo} className="w-10 h-10 rounded-full object-cover" />
                                                        <span className="text-xs font-black uppercase text-zinc-800">{s.name}</span>
                                                    </div>
                                                    {s.label && branding?.industry === 'martial_arts' ? (
                                                        <span className={`text-[8px] font-black px-3 py-1.5 rounded-xl uppercase ${getBeltColor(s.label)}`}>{s.label}</span>
                                                    ) : (
                                                        <span className="text-[8px] font-black px-3 py-1.5 rounded-xl uppercase bg-zinc-50 text-zinc-400">{s.category || vocab.cat1}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
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
            <div className="space-y-3 px-4 pb-24">
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
                            className="w-full h-9 bg-zinc-950 text-white text-[9px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40">
                            {generatingPage ? <Loader2 className="animate-spin" size={12} /> : '✦ Generar página de registro'}
                        </button>
                    )}
                </div>

                {/* PRECIOS + DESCUENTO en una sola tarjeta */}
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
                    <div className="px-4 py-2 border-b border-zinc-50 flex items-center gap-2">
                        <CreditCard size={12} className="text-zinc-400" />
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Mensualidad</span>
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

                <button onClick={handleSavePrices} className="w-full bg-zinc-950 text-white font-black py-4 rounded-2xl active:scale-95 transition-all text-[10px] uppercase tracking-widest">
                    Guardar Configuración de Precios
                </button>

                {/* DATOS DE TRANSFERENCIA */}
                {/* DATOS DE TRANSFERENCIA */}
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden mt-6">
                    <div className="px-4 py-3 border-b border-zinc-50 flex items-center justify-between">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <CreditCard size={12} /> Datos Bancarios
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
                            <ClipboardPaste size={10} /> Pegar Copiado
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
                <button onClick={handleSaveBankInfo} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl active:scale-95 transition-all text-[10px] uppercase tracking-widest">
                    Guardar Datos Bancarios
                </button>

                <button className="w-full text-rose-400 font-black py-3 rounded-2xl hover:bg-rose-50 uppercase tracking-widest text-[8px] transition-all" onClick={() => { localStorage.clear(); window.location.href = "/"; }}>
                    <LogOut className="inline-block mr-1.5" size={12} /> Cerrar Sesión Staff
                </button>
            </div>
        );
    };

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center p-12 bg-white text-zinc-950">
            <RefreshCw className="animate-spin mb-6 text-indigo-600" size={32} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Sincronizando Sistema</p>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-white font-sans relative overflow-hidden text-zinc-950">
            {/* HEADER DINÁMICO - Oculto en Desktop ya que se integra en el Content */}
            <header className="bg-white px-8 py-8 flex items-center justify-between sticky top-0 z-50 border-none shrink-0 md:hidden">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0 rounded-full overflow-hidden border-2 border-zinc-100">
                        {branding?.logo ? (
                            <img src={branding.logo} className="w-full h-full object-cover" alt="L" />
                        ) : (
                            <span className="font-black text-2xl uppercase tracking-tighter text-zinc-950">{branding?.name?.[0] || 'D'}</span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black uppercase tracking-tighter text-zinc-950 leading-none">{branding?.name || 'Academy'}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{activeTab === 'dashboard' ? 'Resumen' : activeTab === 'attendance' ? vocab.attendance : activeTab === 'payments' ? 'Pagos' : 'Ajustes'}</span>
                            {isDemo && <span className="bg-emerald-500/10 text-emerald-600 text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">DEMO</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-black text-zinc-950 leading-none">{user?.name || 'Admin'}</span>
                        <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">Admin</span>
                    </div>
                    <div className="w-12 h-12 flex items-center justify-center shrink-0 rounded-full overflow-hidden border-2 border-zinc-100">
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
                            <p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest mt-1">Software de Gestión</p>
                        </div>
                    </div>

                    <nav className="flex flex-col gap-2">
                        <SidebarButton icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => changeTab('dashboard')} />
                        <SidebarButton icon={Users} label={vocab.attendance} active={activeTab === 'attendance'} onClick={() => changeTab('attendance')} />
                        <SidebarButton icon={CreditCard} label="Pagos" active={activeTab === 'payments'} onClick={() => changeTab('payments')} />
                        <SidebarButton icon={Settings} label="Ajustes" active={activeTab === 'settings'} onClick={() => changeTab('settings')} />
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
                <main className="flex-1 overflow-y-auto pb-32 md:pb-8 hide-scrollbar relative bg-zinc-50/30">
                    <div className="max-w-6xl mx-auto py-4 md:py-8 px-4 md:px-8">
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
                    tenantSlug={user?.tenant_slug ?? ''} 
                    authToken={token ?? ''} 
                    onClose={() => setShowQRModal(false)}
                    primaryColor={branding?.primaryColor || '#a855f7'}
                />
            )}

            {/* NAV CON ESTILO PREMIUM - Solo visible en Mobile */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 pt-3 pb-8 px-10 flex justify-between items-center h-24 z-50 md:hidden text-zinc-950">
                <TabButton icon={LayoutDashboard} label="Inicio" active={activeTab === 'dashboard'} onClick={() => changeTab('dashboard')} />
                <TabButton icon={Users} label={vocab.attendance} active={activeTab === 'attendance'} onClick={() => changeTab('attendance')} />
                <TabButton icon={CreditCard} label="Pagos" active={activeTab === 'payments'} onClick={() => changeTab('payments')} />
                <TabButton icon={Settings} label="Ajustes" active={activeTab === 'settings'} onClick={() => changeTab('settings')} />
            </nav>

            <style dangerouslySetInnerHTML={{
                __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
        </div>
    );
}

function SidebarButton({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
    return (
        <button onClick={onClick} className={`flex items- center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 w-full group ${active ? 'bg-zinc-950 text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600'}`}>
            <Icon size={20} strokeWidth={active ? 3 : 2} className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
            <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );
}

function TabButton({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
    return (
        <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative ${active ? 'text-zinc-950 scale-110' : 'text-zinc-300 hover:text-zinc-400'}`}>
            <div className={`p-2 rounded-2xl transition-all duration-500 ${active ? 'bg-zinc-50 shadow-inner' : 'bg-transparent'}`}>
                <Icon size={24} strokeWidth={active ? 3 : 2} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">{label}</span>
            {active && <div className="absolute -bottom-2 w-1 h-1 bg-zinc-950 rounded-full" />}
        </button>
    );
}

function DynamicQRModal({ onClose, tenantSlug, authToken, primaryColor }: { onClose: () => void; tenantSlug: string; authToken: string; primaryColor: string }) {
    const [qrData, setQrData] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(30);
    const [loading, setLoading] = useState(true);

    const fetchToken = useCallback(async () => {
        try {
            setLoading(true);
            const API = process.env.NEXT_PUBLIC_API_URL || "https://admin.digitalizatodo.cl/api";
            const res = await fetch(`${API}/${tenantSlug}/attendance/qr-token`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            
            if (!res.ok) {
                const errorText = await res.text();
                console.error("Server error response:", errorText);
                return;
            }

            const data = await res.json();
            if (data.token) {
                setQrData(data.token);
                setTimeLeft(data.expires_in || 30);
            }
        } catch (error) {
            console.error("Error fetching QR token:", error);
        } finally {
            setLoading(false);
        }
    }, [tenantSlug, authToken]);

    useEffect(() => {
        fetchToken();
    }, [fetchToken]);

    useEffect(() => {
        if (loading) return;
        if (timeLeft <= 0) {
            fetchToken();
            return;
        }
        
        const t = setTimeout(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearTimeout(t);
    }, [timeLeft, loading, fetchToken]);

    const progressPercent = (timeLeft / 30) * 100;

    return (
        <div className="fixed inset-0 z-[100] bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl scale-in-center">
                <div className="p-6 text-center relative border-b border-zinc-100">
                    <button onClick={onClose} className="absolute right-4 top-4 p-2 bg-zinc-50 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors active:scale-95">
                        <XCircle size={24} />
                    </button>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <QrCode size={24} />
                    </div>
                    <h2 className="text-xl font-black text-zinc-900 leading-tight">Registrar Ingreso</h2>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mt-1">Acerca la cámara del apoderado</p>
                </div>
                
                <div className="p-8 flex flex-col items-center">
                    <div className="relative p-4 bg-white rounded-3xl shadow-[0_0_20px_rgba(0,0,0,0.05)] border border-zinc-100 mb-6 flex items-center justify-center">
                        {qrData ? (
                            <QRCodeCanvas value={qrData} size={200} level="H" includeMargin={false} fgColor={primaryColor} />
                        ) : (
                            <div className="w-[200px] h-[200px] flex items-center justify-center bg-zinc-50 rounded-xl">
                                <Loader2 className="animate-spin text-zinc-300" size={32} />
                            </div>
                        )}
                        
                        {/* Indicador visual del tiempo (Overlay) */}
                        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none border-4 border-transparent transition-all duration-1000" style={{ borderColor: timeLeft <= 5 ? 'rgba(239,68,68,0.3)' : 'transparent' }} />
                    </div>
                    
                    <div className="w-full space-y-2">
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-zinc-500">
                            <span>Actualizando en:</span>
                            <span className={timeLeft <= 5 ? "text-red-500" : ""}>{timeLeft}s</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-1000 ease-linear rounded-full ${timeLeft <= 5 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
