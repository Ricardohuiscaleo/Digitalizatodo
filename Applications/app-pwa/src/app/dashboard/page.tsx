"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
    Plus
} from 'lucide-react';
import { useBranding } from "@/context/BrandingContext";
import {
    getProfile,
    getPayers,
    storeAttendance,
    approvePayment,
    updateLogo,
    updatePricing,
    getAttendanceHistory
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
        fitness:      { attendance: 'Clase',  cat1: 'Mensual', cat2: 'Trimestral', memberLabel: 'Socio', placeLabel: 'Clientes' },
        dance:        { attendance: 'Sala',   cat1: 'Infantil', cat2: 'Adultos', memberLabel: 'Alumno', placeLabel: 'Clientes' },
        music:        { attendance: 'Sala',   cat1: 'Infantil', cat2: 'Adultos', memberLabel: 'Alumno', placeLabel: 'Clientes' },
        default:      { attendance: 'Clase',  cat1: 'Categoría 1', cat2: 'Categoría 2', memberLabel: 'Miembro', placeLabel: 'Clientes' },
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

    const [searchTerm, setSearchTerm] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [expandedPayerId, setExpandedPayerId] = useState<string | null>(null);
    const [historyPage, setHistoryPage] = useState(0);
    const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
    const [now, setNow] = useState(new Date());
    const [copied, setCopied] = useState(false);

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
    };

    // --- PERSISTENCE & DATA FETCHING ---

    useEffect(() => {
        const storedToken = localStorage.getItem("staff_token") || localStorage.getItem("auth_token");
        const tenantId = localStorage.getItem("tenant_id")?.trim();

        if (!storedToken || !tenantId) {
            window.location.href = "/";
            return;
        }

        setToken(storedToken);

        const fetchData = async () => {
            const [profile, payersData]: [any, any] = await Promise.all([
                getProfile(tenantId, storedToken),
                getPayers(tenantId, storedToken)
            ]);

            if (profile) {
                setUser({ ...profile, tenant_id: profile.tenant_id || tenantId });
                if (profile.tenant?.data?.pricing) {
                    setPrices(profile.tenant.data.pricing);
                }
                if (profile.tenant && (!branding?.name || !branding?.industry)) {
                    setBranding({
                        id: String(profile.tenant.id),
                        name: profile.tenant.name,
                        industry: profile.tenant.industry,
                        logo: profile.tenant.logo,
                        primaryColor: profile.tenant.primary_color
                    });
                }
                setPayers(payersData?.payers || []);

                const historyData = await getAttendanceHistory(tenantId, storedToken);
                if (historyData?.attendance) {
                    setAttendanceHistory(historyData.attendance);
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

        fetchData();
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

    const formatCLP = (value: number) =>
        value === 0 ? '' : `$ ${new Intl.NumberFormat('es-CL').format(value)}`;

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
            total += student.category === 'adults' ? prices.adult : prices.kids;
        });

        let hasDiscount = false;
        const numEnrollments = payer.enrolledStudents.length;

        if (numEnrollments > prices.discountThreshold) {
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

        if (!isDemo && token && user?.tenant_id) {
            await storeAttendance(user.tenant_id, token, { student_id: studentId, status: newStatus });
        }
    };

    const handlePaymentApprove = async (payerId: string) => {
        if (isDemo) {
            setPayers(payers.map(p => p.id === payerId ? { ...p, status: 'paid' } : p));
            return;
        }

        if (token && user?.tenant_id && confirm('¿Confirmar registro de pago?')) {
            await approvePayment(user.tenant_id, token, payerId);
            const payersData = await getPayers(user.tenant_id, token);
            setPayers(payersData?.payers || []);
        }
    };

    const handleSavePrices = async () => {
        if (isDemo) {
            alert("Precios guardados localmente (Modo Demo)");
            return;
        }
        if (token && user?.tenant_id) {
            await updatePricing(user.tenant_id, token, prices);
            alert("Configuración de precios actualizada con éxito");
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token || !user?.tenant_id) return;

        const result: any = await updateLogo(user.tenant_id, token, file);
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
            <div className="space-y-4 px-4">
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-sm font-medium opacity-90 mb-1">Total Alumnos Participantes</h2>
                        <p className="text-4xl font-bold mb-4">{totalStudents}</p>
                        <div className="flex justify-between items-center text-sm bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={18} className="text-green-300" />
                                <span>{paidStudents} Pagados</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <XCircle size={18} className="text-red-300" />
                                <span>{pendingStudents} Pendientes</span>
                            </div>
                        </div>
                        {isDemo && <p className="text-[10px] font-black uppercase text-center mt-3 text-white/50 tracking-widest text-zinc-950">MODO DEMO ACTIVO</p>}
                    </div>
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                </div>

                <div className="bg-white rounded-3xl p-4 shadow-sm border border-zinc-100">
                    <div className="flex justify-between items-center mb-3">
                        <div>
                            <h3 className="text-sm font-black text-zinc-800 flex items-center gap-1.5 uppercase tracking-tighter">
                                <CalendarCheck className="text-indigo-500" size={16} />
                                Asistencia Hoy
                            </h3>
                            <p className="text-[10px] text-zinc-400 font-bold mt-0.5 capitalize">
                                {now.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' })} · {now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-black">
                                {presentToday} / {totalStudents}
                            </span>
                            <button onClick={() => changeTab('attendance')} className="flex items-center gap-1 text-indigo-500 text-[10px] font-black uppercase tracking-widest active:opacity-70 transition-all">
                                Ir al {vocab.placeLabel} <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>

                    {presentToday > 0 ? (
                        <div className="space-y-3">
                            <div className="flex -space-x-2 overflow-x-auto pb-1">
                                {allStudents.filter(s => attendance.has(s.id)).map(s => (
                                    <img
                                        key={s.id}
                                        className="inline-block h-10 w-10 rounded-full border-2 border-white shadow-sm object-cover shrink-0"
                                        src={s.photo}
                                        alt={s.name}
                                    />
                                ))}
                            </div>
                            <button onClick={() => changeTab('attendance')} className="w-full py-3 rounded-2xl bg-zinc-950 text-white text-xs font-black uppercase tracking-widest active:scale-95 transition-all">
                                Registrar Asistencia 👇
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 py-3 px-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                            <CalendarCheck size={16} className="text-zinc-300 shrink-0" />
                            <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Sin registros aún</p>
                        </div>
                    )}
                </div>

                {/* HISTORIAL DE ASISTENCIA */}
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-zinc-100">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-black text-zinc-800 flex items-center gap-1.5 uppercase tracking-tighter">
                            <CalendarCheck className="text-zinc-400" size={16} />
                            Historial
                        </h3>
                        {totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <button disabled={historyPage === 0} onClick={() => setHistoryPage(p => p - 1)} className="w-7 h-7 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all">
                                    <ChevronUp size={14} className="text-zinc-500" />
                                </button>
                                <span className="text-[10px] font-black text-zinc-400">{historyPage + 1}/{totalPages}</span>
                                <button disabled={historyPage >= totalPages - 1} onClick={() => setHistoryPage(p => p + 1)} className="w-7 h-7 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all">
                                    <ChevronDown size={14} className="text-zinc-500" />
                                </button>
                            </div>
                        )}
                    </div>

                    {pagedDates.length === 0 ? (
                        <div className="flex items-center gap-3 py-3 px-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                            <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Sin historial disponible</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pagedDates.map(date => {
                                const records: any[] = historyByDate[date];
                                const presentCount = records.filter(r => r.status === 'present').length;
                                const sampleTime = records[0]?.created_at;
                                const timeStr = sampleTime ? new Date(sampleTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '';
                                const dateObj = new Date(date + 'T12:00:00');
                                const dateStr = dateObj.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });
                                const students = records.filter(r => r.status === 'present' && r.student);

                                return (
                                    <div key={date} className="bg-zinc-50 rounded-2xl p-3 border border-zinc-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <div>
                                                <p className="text-[11px] font-black text-zinc-800 capitalize">{dateStr}</p>
                                                {timeStr && <p className="text-[9px] text-zinc-400 font-bold">{timeStr}</p>}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full text-[10px] font-black">
                                                    {presentCount} presentes
                                                </span>
                                                <button
                                                    onClick={() => changeTab('attendance')}
                                                    className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center active:scale-95 transition-all"
                                                    title="Editar"
                                                >
                                                    <span className="text-amber-500 text-[9px] font-black">✎</span>
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm('¿Borrar asistencia de este día?')) return;
                                                        const token = localStorage.getItem('staff_token');
                                                        if (token && user?.tenant_id) {
                                                            for (const r of records) {
                                                                await storeAttendance(user.tenant_id, token, { student_id: r.student_id || r.student?.id, status: 'absent' });
                                                            }
                                                            setAttendanceHistory(prev => prev.filter(r => (r.date || r.created_at?.split('T')[0]) !== date));
                                                        }
                                                    }}
                                                    className="w-7 h-7 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center active:scale-95 transition-all"
                                                    title="Borrar"
                                                >
                                                    <span className="text-red-400 text-[9px] font-black">✕</span>
                                                </button>
                                            </div>
                                        </div>
                                        {students.length > 0 && (
                                            <div className="flex -space-x-2 overflow-x-auto">
                                                {students.slice(0, 8).map((r: any) => (
                                                    <img key={r.id} src={r.student?.photo} className="h-8 w-8 rounded-full border-2 border-white object-cover shrink-0 shadow-sm" alt={r.student?.name} />
                                                ))}
                                                {students.length > 8 && (
                                                    <div className="h-8 w-8 rounded-full border-2 border-white bg-zinc-200 flex items-center justify-center shrink-0">
                                                        <span className="text-[8px] font-black text-zinc-500">+{students.length - 8}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
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

                <div className="grid grid-cols-3 gap-3">
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

                <div className="space-y-3 pb-6">
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
        const registerLink = `https://app.digitalizatodo.cl/${branding?.id || ''}/register`;
        const copyLink = () => { navigator.clipboard.writeText(registerLink); setCopied(true); setTimeout(() => setCopied(false), 2000); };

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
                    <div className="flex items-center gap-2">
                        <p className="flex-1 text-[9px] font-bold text-zinc-500 truncate bg-zinc-50 rounded-xl px-3 py-2 border border-zinc-100">{registerLink}</p>
                        <button onClick={copyLink} className={`shrink-0 text-[8px] font-black uppercase px-3 py-2 rounded-xl border transition-all active:scale-95 ${copied ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-zinc-50 text-zinc-600 border-zinc-200'}`}>
                            {copied ? '✓ Copiado' : 'Copiar'}
                        </button>
                    </div>
                </div>

                {/* PRECIOS + DESCUENTO en una sola tarjeta */}
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
                    <div className="px-4 py-2 border-b border-zinc-50 flex items-center gap-2">
                        <CreditCard size={12} className="text-zinc-400" />
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Mensualidad</span>
                    </div>
                    <div className="divide-y divide-zinc-50">
                        {[{label: vocab.cat1, field: 'kids' as const}, {label: vocab.cat2, field: 'adult' as const}].map(({label, field}) => (
                            <div key={field} className="flex items-center px-4 py-2">
                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest w-20 shrink-0">{label}</span>
                                <input type="text" inputMode="numeric" className="flex-1 bg-transparent text-xs font-black text-zinc-950 focus:ring-0 outline-none text-right"
                                    value={formatCLP(prices[field])} onChange={e => handlePriceInput(field, e.target.value)} placeholder="$ 0" />
                            </div>
                        ))}
                        <div className="flex items-center px-4 py-2">
                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest w-20 shrink-0">Desc. desde</span>
                            <input type="text" inputMode="numeric" className="flex-1 bg-transparent text-xs font-black text-zinc-950 focus:ring-0 outline-none text-right"
                                value={prices.discountThreshold || ''} onChange={e => { const v = e.target.value.replace(/\D/g,''); setPrices(p => ({ ...p, discountThreshold: v === '' ? 0 : parseInt(v) })); }} placeholder="0 inscritos" />
                        </div>
                        <div className="flex items-center px-4 py-2">
                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest w-20 shrink-0">Descuento</span>
                            <input type="text" inputMode="numeric" className="flex-1 bg-transparent text-xs font-black text-zinc-950 focus:ring-0 outline-none text-right"
                                value={prices.discountPercentage ? `${prices.discountPercentage}%` : ''} onChange={e => { const v = e.target.value.replace(/\D/g,''); setPrices(p => ({ ...p, discountPercentage: v === '' ? 0 : Math.min(100, parseInt(v)) })); }} placeholder="0%" />
                        </div>
                    </div>
                </div>

                <button onClick={handleSavePrices} className="w-full bg-zinc-950 text-white font-black py-4 rounded-2xl active:scale-95 transition-all text-[10px] uppercase tracking-widest">
                    Guardar Configuración
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
        <div className="flex flex-col h-screen bg-white font-sans sm:max-w-lg sm:mx-auto relative overflow-hidden text-zinc-950">

            {/* HEADER DINÁMICO */}
            <header className="bg-white px-8 py-8 flex items-center justify-between sticky top-0 z-50 border-none shrink-0">
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

            {/* CONTENIDO CON ANIMACIÓN LATERAL */}
            <main className="flex-1 overflow-y-auto pb-32 hide-scrollbar relative">
                <div key={activeTab} className="w-full animate-in fade-in duration-150">
                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'attendance' && renderAttendance()}
                    {activeTab === 'payments' && renderPayments()}
                    {activeTab === 'settings' && renderSettings()}
                </div>
            </main>

            {/* NAV CON ESTILO PREMIUM */}
            <nav className="fixed bottom-0 left-0 right-0 sm:max-w-lg sm:mx-auto bg-white border-t border-zinc-100 pt-3 pb-8 px-10 flex justify-between items-center h-24 z-50">
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
