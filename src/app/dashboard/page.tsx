"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
    Users,
    CreditCard,
    Settings,
    LayoutDashboard,
    CheckCircle2,
    XCircle,
    Clock,
    CalendarCheck,
    Search,
    ChevronDown,
    ChevronUp,
    Check,
    RefreshCw,
    LogOut,
    QrCode
} from 'lucide-react';
import { useBranding } from "@/context/BrandingContext";
import {
    getProfile,
    getPayers,
    storeAttendance,
    approvePayment,
    updatePricing,
    getAttendanceQR
} from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";

function QRGenerator({ tenantId, token }: { tenantId: string, token: string }) {
    const [qrData, setQrData] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [expires, setExpires] = useState(0);

    const generateQR = async () => {
        if (!tenantId || !token) return;
        setLoading(true);
        const res = await getAttendanceQR(tenantId, token);
        if (res && res.qr_data) {
            setQrData(res.qr_data);
            setExpires(res.expires_in);
        }
        setLoading(false);
    };

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (expires > 0) {
            timer = setInterval(() => {
                setExpires(prev => prev - 1);
            }, 1000);
        } else if (qrData) {
            setQrData(null);
        }
        return () => clearInterval(timer);
    }, [expires, qrData]);

    return (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mt-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <QrCode className="text-emerald-600" size={22} />
                    Asistencia vía QR
                </h3>
                {!qrData && !loading && (
                    <button
                        onClick={generateQR}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-emerald-700 active:scale-95 transition-all"
                    >
                        Generar
                    </button>
                )}
            </div>

            {loading && (
                <div className="flex flex-col items-center py-6">
                    <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                    <p className="text-xs text-gray-400 mt-2 font-medium">Generando código seguro...</p>
                </div>
            )}

            {qrData && (
                <div className="flex flex-col items-center gap-4 py-4 bg-gray-50 rounded-2xl animate-in fade-in zoom-in duration-300">
                    <div className="p-4 bg-white rounded-3xl shadow-xl border border-gray-100">
                        <QRCodeSVG value={qrData} size={140} />
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Expira en {expires}s</p>
                        <button onClick={generateQR} className="text-[10px] text-gray-400 underline mt-1">Regenerar ahora</button>
                    </div>
                </div>
            )}

            {!qrData && !loading && (
                <p className="text-xs text-gray-400 text-center py-2 italic font-medium">Usa el QR para que los alumnos marquen con su propio celular.</p>
            )}
        </div>
    );
}

export default function AppAdminDojo() {
    const { branding } = useBranding();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [user, setUser] = useState<any>(null);
    const [payers, setPayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [markingId, setMarkingId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);

    const [prices, setPrices] = useState({
        kids: 25000,
        adult: 35000,
        discountThreshold: 2,
        discountPercentage: 15
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [expandedPayerId, setExpandedPayerId] = useState<string | null>(null);

    useEffect(() => {
        const storedToken = localStorage.getItem("staff_token") || localStorage.getItem("auth_token");
        const tenantId = localStorage.getItem("tenant_id");

        if (!storedToken || !tenantId) {
            window.location.href = "/";
            return;
        }

        setToken(storedToken);

        const fetchData = async () => {
            const [profile, payersData] = await Promise.all([
                getProfile(tenantId, storedToken),
                getPayers(tenantId, storedToken)
            ]);

            if (profile) {
                setUser(profile);
                if (profile.tenant?.data?.pricing) {
                    setPrices(profile.tenant.data.pricing);
                }
                setPayers(payersData?.payers || []);
            } else {
                localStorage.clear();
                window.location.href = "/";
            }
            setLoading(false);
        };

        fetchData();
    }, []);

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

    const calculatePrice = (payer: any) => {
        let total = 0;
        payer.enrolledStudents.forEach((student: any) => {
            total += student.type === 'adult' ? prices.adult : prices.kids;
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

    const handleToggleAttendance = async (studentId: string, currentStatus: string | null) => {
        if (!token || !user?.tenant_id) return;

        // Si ya está presente, lo marcamos como 'absent' para alternar (o viceversa)
        const newStatus = currentStatus === 'present' ? 'absent' : 'present';

        setMarkingId(studentId);
        const res = await storeAttendance(user.tenant_id, token, { student_id: studentId, status: newStatus });
        setMarkingId(null);

        if (res.attendance) {
            // Recargar payers para ver el cambio de estado (o actualizar localmente)
            const payersData = await getPayers(user.tenant_id, token);
            setPayers(payersData?.payers || []);
        }
    };

    const handleApprovePaymentAction = async (e: React.MouseEvent, payerId: string) => {
        e.stopPropagation();
        if (!token || !user?.tenant_id) return;

        if (window.confirm('¿Confirmas que revisaste el comprobante y el pago está correcto?')) {
            const res = await approvePayment(user.tenant_id, token, payerId);
            if (res.message) {
                const payersData = await getPayers(user.tenant_id, token);
                setPayers(payersData?.payers || []);
            }
        }
    };

    const handleSaveSettings = async () => {
        if (!token || !user?.tenant_id) return;
        const res = await updatePricing(user.tenant_id, token, prices);
        if (res.message) {
            alert("Configuración guardada correctamente");
        }
    };

    const toggleExpandPayer = (payerId: string) => {
        setExpandedPayerId(expandedPayerId === payerId ? null : payerId);
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/";
    };

    // --- VISTAS DE LA APP ---

    const renderDashboard = () => {
        const totalStudents = allStudents.length;
        const totalPayers = payers.length;

        // Status counts
        const paidCuentas = payers.filter(p => p.status === 'paid').length;
        const reviewCuentas = payers.filter(p => p.status === 'review').length;
        const pendingCuentas = totalPayers - paidCuentas - reviewCuentas;

        // Attendance count
        const attendanceCount = allStudents.filter((s: any) => s.today_status === 'present').length;

        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Total Alumnos</h2>
                        <p className="text-4xl font-black mb-4">{totalStudents}</p>
                        <div className="grid grid-cols-3 gap-2 text-sm bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10">
                            <div className="flex flex-col items-center">
                                <CheckCircle2 size={18} className="text-emerald-400 mb-1" />
                                <span className="font-bold">{paidCuentas}</span>
                                <span className="text-[10px] text-slate-300">Al día</span>
                            </div>
                            <div className="flex flex-col items-center border-x border-white/10">
                                <Clock size={18} className="text-amber-400 mb-1" />
                                <span className="font-bold">{reviewCuentas}</span>
                                <span className="text-[10px] text-slate-300">Revisión</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <XCircle size={18} className="text-rose-400 mb-1" />
                                <span className="font-bold">{pendingCuentas}</span>
                                <span className="text-[10px] text-slate-300">Deuda</span>
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 mt-4 text-center uppercase tracking-widest">
                            Agrupados en {totalPayers} cuentas titulares
                        </p>
                    </div>
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-500 opacity-20 rounded-full blur-3xl"></div>
                </div>

                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <CalendarCheck className="text-indigo-600" size={22} />
                            Asistencia Hoy
                        </h3>
                        <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-black">
                            {attendanceCount} / {totalStudents}
                        </span>
                    </div>

                    {attendanceCount > 0 ? (
                        <div className="flex -space-x-3 overflow-x-auto pb-2 scrollbar-none">
                            {allStudents.filter((s: any) => s.today_status === 'present').map((s: any) => (
                                <img
                                    key={s.id}
                                    className="inline-block h-14 w-14 rounded-full border-4 border-white shadow-sm object-cover"
                                    src={s.photo}
                                    alt={s.name}
                                    title={s.name}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Tatami vacío aún</p>
                            <button
                                onClick={() => setActiveTab('attendance')}
                                className="mt-3 text-indigo-600 font-black text-xs uppercase tracking-widest"
                            >
                                Empezar a pasar lista
                            </button>
                        </div>
                    )}
                </div>

                {/* Integration with existing QR Logic */}
                {token && user?.tenant_id && (
                    <QRGenerator tenantId={user.tenant_id} token={token} />
                )}
            </div>
        );
    };

    const renderAttendance = () => {
        const filteredStudents = allStudents.filter((s: any) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        className="w-full bg-white pl-12 pr-4 py-4 rounded-2xl shadow-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/20 text-sm font-bold"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {filteredStudents.map((student: any) => {
                        const isPresent = student.today_status === 'present';
                        const isMarking = markingId === student.id;

                        return (
                            <button
                                key={student.id}
                                onClick={() => handleToggleAttendance(student.id, student.today_status)}
                                disabled={isMarking}
                                className={`relative flex flex-col items-center p-2 rounded-2xl transition-all duration-300 ${isPresent ? 'bg-indigo-50 border-indigo-200 shadow-inner' : 'bg-white shadow-sm border border-gray-100 active:scale-95'
                                    }`}
                            >
                                <div className="relative mb-2">
                                    <div className={`h-16 w-16 rounded-full overflow-hidden transition-all duration-500 ${isPresent ? 'ring-4 ring-indigo-500 ring-offset-2' : 'ring-1 ring-gray-100'}`}>
                                        <img src={student.photo} alt={student.name} className={`w-full h-full object-cover transition-all ${isMarking ? 'opacity-30' : ''}`} />
                                    </div>
                                    {isMarking && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                                        </div>
                                    )}
                                    {isPresent && !isMarking && (
                                        <div className="absolute -bottom-1 -right-1 bg-indigo-600 rounded-full p-1 border-2 border-white shadow-lg">
                                            <CheckCircle2 className="text-white" size={14} />
                                        </div>
                                    )}
                                </div>
                                <p className={`font-black text-[10px] text-center leading-tight uppercase tracking-tighter w-full line-clamp-2 ${isPresent ? 'text-indigo-900' : 'text-gray-800'}`}>
                                    {student.name.split(' ')[0]}
                                </p>
                                <span className="text-[8px] text-gray-400 mt-1 uppercase font-black tracking-widest">{student.belt}</span>
                            </button>
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
            if (paymentFilter === 'review') return p.status === 'review';
            return true;
        }).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto hide-scrollbar">
                    {['all', 'review', 'pending', 'paid'].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setPaymentFilter(filter)}
                            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${paymentFilter === filter
                                    ? 'bg-slate-900 text-white shadow-lg'
                                    : 'bg-transparent text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            {filter === 'all' ? 'Todas' : filter === 'pending' ? 'Deuda' : filter === 'review' ? 'Por Revisar' : 'Al Día'}
                        </button>
                    ))}
                </div>

                <div className="space-y-4 pb-6">
                    {filteredPayers.map((payer: any) => {
                        const { amount, hasDiscount, numEnrollments } = calculatePrice(payer);
                        const isExpanded = expandedPayerId === payer.id;

                        return (
                            <div
                                key={payer.id}
                                className={`bg-white rounded-3xl shadow-sm border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-indigo-400 ring-2 ring-indigo-50' :
                                        payer.status === 'review' ? 'border-amber-400 ring-2 ring-amber-50' : 'border-gray-100'
                                    }`}
                            >
                                <div
                                    className="p-5 flex items-center gap-4 cursor-pointer"
                                    onClick={() => toggleExpandPayer(payer.id)}
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md">
                                            <img src={payer.photo} alt={payer.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="absolute -bottom-2 -right-1 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border-2 border-white">
                                            Titular
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-black text-gray-800 text-sm truncate uppercase tracking-tight">{payer.name}</h4>
                                            {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                                        </div>

                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex -space-x-2">
                                                {payer.enrolledStudents.slice(0, 3).map((student: any) => (
                                                    <div key={student.id} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden shadow-sm">
                                                        <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                                {numEnrollments > 3 && (
                                                    <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-black text-gray-600">
                                                        +{numEnrollments - 3}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{numEnrollments} Alumnos</span>
                                        </div>

                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="font-black text-slate-800 text-lg">{formatMoney(amount)}</span>
                                            {hasDiscount && <span className="text-[8px] bg-emerald-500 text-white px-2 py-0.5 rounded font-black uppercase tracking-widest">Dcto.</span>}
                                        </div>
                                    </div>

                                    <div className="shrink-0 flex flex-col justify-center">
                                        {payer.status === 'paid' && (
                                            <div className="bg-emerald-50 text-emerald-600 h-10 w-10 rounded-xl flex items-center justify-center border border-emerald-100">
                                                <CheckCircle2 size={24} />
                                            </div>
                                        )}
                                        {payer.status === 'review' && (
                                            <button
                                                onClick={(e) => handleApprovePaymentAction(e, payer.id)}
                                                className="bg-amber-500 text-white py-2 px-3 rounded-2xl flex flex-col items-center gap-1 shadow-lg shadow-amber-500/20 active:scale-90 transition-all"
                                            >
                                                <Check size={18} strokeWidth={3} />
                                                <span className="text-[8px] font-black uppercase tracking-widest underline">Aprobar</span>
                                            </button>
                                        )}
                                        {payer.status === 'pending' && (
                                            <div className="bg-rose-50 text-rose-600 h-10 w-10 rounded-xl flex items-center justify-center border border-rose-100">
                                                <XCircle size={24} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="px-5 pb-5 pt-2 bg-slate-50 border-t border-slate-100"
                                        >
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Detalle de Inscripciones:</p>
                                            <div className="grid gap-3">
                                                {payer.enrolledStudents.map((student: any) => (
                                                    <div key={student.id} className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <img src={student.photo} alt={student.name} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                                                            <div className="min-w-0">
                                                                <span className="text-xs font-black text-slate-800 block leading-none truncate uppercase tracking-tighter mb-1">{student.name}</span>
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Cinturón {student.belt}</span>
                                                            </div>
                                                        </div>
                                                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest ${student.type === 'kids' ? 'bg-indigo-500/10 text-indigo-600' : 'bg-slate-200 text-slate-600'
                                                            }`}>
                                                            {student.type === 'kids' ? 'Infantil' : 'Adulto'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderSettings = () => {
        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest border-b border-gray-50 pb-4 mb-6">Configuración de Precios</h3>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Mensualidad Infantil ($)</label>
                            <div className="relative group">
                                <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-indigo-600 font-black">$</span>
                                <input
                                    type="number"
                                    value={prices.kids}
                                    onChange={(e) => setPrices({ ...prices, kids: Number(e.target.value) })}
                                    className="w-full bg-slate-50 pl-10 pr-6 py-4 rounded-2xl border-transparent focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-black text-slate-800"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Mensualidad Adultos ($)</label>
                            <div className="relative group">
                                <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-indigo-600 font-black">$</span>
                                <input
                                    type="number"
                                    value={prices.adult}
                                    onChange={(e) => setPrices({ ...prices, adult: Number(e.target.value) })}
                                    className="w-full bg-slate-50 pl-10 pr-6 py-4 rounded-2xl border-transparent focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-black text-slate-800"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest border-b border-gray-50 pb-4 mb-6">Descuento Multigrupo</h3>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Mínimo de Alumnos para Descuento</label>
                            <input
                                type="number"
                                value={prices.discountThreshold}
                                onChange={(e) => setPrices({ ...prices, discountThreshold: Number(e.target.value) })}
                                className="w-full bg-slate-50 px-6 py-4 rounded-2xl border-transparent focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-black text-slate-800"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Porcentaje de Descuento (%)</label>
                            <div className="relative group">
                                <input
                                    type="number"
                                    value={prices.discountPercentage}
                                    onChange={(e) => setPrices({ ...prices, discountPercentage: Number(e.target.value) })}
                                    className="w-full bg-slate-50 px-6 py-4 rounded-2xl border-transparent focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-black text-slate-800"
                                />
                                <span className="absolute right-6 top-1/2 transform -translate-y-1/2 text-indigo-600 font-black">%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSaveSettings}
                    className="w-full bg-slate-900 text-white font-black text-sm uppercase tracking-widest py-5 rounded-3xl shadow-2xl shadow-slate-300 active:scale-95 transition-all mt-4"
                >
                    Guardar Configuración
                </button>
                <div className="pb-10"></div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50 font-sans max-w-lg mx-auto relative overflow-hidden">

            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl px-6 py-5 flex items-center justify-between sticky top-0 z-50 border-b border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 transform -rotate-3">
                        <img src={branding?.logo || "/icon.webp"} alt="Logo" className="w-8 h-8 object-contain" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 tracking-tighter uppercase leading-none mb-0.5">{branding?.name}</h1>
                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em]">{activeTab === 'dashboard' ? 'Panel de Control' : activeTab === 'attendance' ? 'Tatami / Asistencia' : activeTab === 'payments' ? 'Cuentas Familiares' : 'Ajustes Academia'}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors border border-slate-100 shadow-inner"
                >
                    <LogOut size={20} />
                </button>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-5 pb-28 hide-scrollbar">
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'attendance' && renderAttendance()}
                {activeTab === 'payments' && renderPayments()}
                {activeTab === 'settings' && renderSettings()}
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-10 pt-4 bg-white/90 backdrop-blur-2xl border-t border-slate-100 shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.1)] mx-auto max-w-lg">
                <div className="flex items-center justify-around">
                    <button
                        onClick={() => { setActiveTab('dashboard'); setSearchTerm(''); }}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'dashboard' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}
                    >
                        <div className={`p-2 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-50'}`}>
                            <LayoutDashboard size={22} strokeWidth={activeTab === 'dashboard' ? 3 : 2} />
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest">Resumen</span>
                    </button>

                    <button
                        onClick={() => { setActiveTab('attendance'); setSearchTerm(''); }}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'attendance' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}
                    >
                        <div className={`p-2 rounded-2xl transition-all ${activeTab === 'attendance' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-50'}`}>
                            <Users size={22} strokeWidth={activeTab === 'attendance' ? 3 : 2} />
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest">Tatami</span>
                    </button>

                    <button
                        onClick={() => { setActiveTab('payments'); setSearchTerm(''); }}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'payments' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}
                    >
                        <div className={`p-2 rounded-2xl relative transition-all ${activeTab === 'payments' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-50'}`}>
                            <CreditCard size={22} strokeWidth={activeTab === 'payments' ? 3 : 2} />
                            {payers.some(p => p.status === 'review') && (
                                <span className="absolute top-0 right-0 w-3 h-3 bg-amber-500 border-2 border-white rounded-full animate-pulse shadow-md"></span>
                            )}
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest">Cuentas</span>
                    </button>

                    <button
                        onClick={() => { setActiveTab('settings'); setSearchTerm(''); }}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'settings' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}
                    >
                        <div className={`p-2 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-50'}`}>
                            <Settings size={22} strokeWidth={activeTab === 'settings' ? 3 : 2} />
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest">Ajustes</span>
                    </button>
                </div>
            </nav>

            <style dangerouslySetInnerHTML={{
                __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
      `}} />
        </div>
    );
}
