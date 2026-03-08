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
    QrCode,
    ArrowRight,
    TrendingUp,
    AlertCircle
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

// --- REUSABLE PREMIUM COMPONENTS ---

const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`glass-card rounded-[2.5rem] p-6 shadow-2xl shadow-black/20 ${className}`}>
        {children}
    </div>
);

const IconButton = ({ icon: Icon, onClick, active, label }: { icon: any, onClick: () => void, active: boolean, label: string }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center gap-1.5 transition-all duration-500 group ${active ? "text-primary scale-110" : "text-gray-500 hover:text-gray-300"}`}
    >
        <div className={`p-3 rounded-2xl transition-all duration-500 ${active ? "bg-primary shadow-[0_0_20px_rgba(99,102,241,0.4)] text-white" : "bg-white/5 group-hover:bg-white/10"}`}>
            <Icon size={22} strokeWidth={active ? 3 : 2} />
        </div>
        <span className={`text-[9px] font-black uppercase tracking-[0.15em] transition-opacity duration-500 ${active ? "opacity-100" : "opacity-40"}`}>{label}</span>
    </button>
);

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
        <GlassCard className="mt-4 ring-1 ring-white/5">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2 uppercase tracking-tighter">
                        <QrCode className="text-emerald-500" size={20} />
                        Acceso Rápido
                    </h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Generar código de ingreso</p>
                </div>
                {!qrData && !loading && (
                    <button
                        onClick={generateQR}
                        className="bg-emerald-500 text-black px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-tighter shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 active:scale-95 transition-all"
                    >
                        Activar
                    </button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center py-8"
                    >
                        <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
                        <p className="text-[10px] text-gray-500 mt-4 font-black uppercase tracking-widest">Encriptando datos...</p>
                    </motion.div>
                ) : qrData ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col items-center gap-6 py-4 bg-white/5 rounded-[2rem] border border-white/5"
                    >
                        <div className="p-5 bg-white rounded-[2.5rem] shadow-2xl shadow-emerald-500/10">
                            <QRCodeSVG value={qrData} size={160} />
                        </div>
                        <div className="text-center">
                            <div className="inline-flex items-center gap-2 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Expira en {expires}s</p>
                            </div>
                            <button onClick={generateQR} className="block w-full text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-3 hover:text-white transition-colors">Regenerar ahora</button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="py-2 px-4 rounded-2xl bg-white/[0.02] border border-white/[0.02]">
                        <p className="text-[10px] text-gray-500 text-center italic font-medium leading-relaxed">
                            Los alumnos pueden escanear este código desde su PWA para registrar su entrada de forma autónoma.
                        </p>
                    </div>
                )}
            </AnimatePresence>
        </GlassCard>
    );
}

export default function PremiumAdminDojo() {
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

    // --- ACTIONS ---

    const handleToggleAttendance = async (studentId: string, currentStatus: string | null) => {
        if (!token || !user?.tenant_id) return;
        const newStatus = currentStatus === 'present' ? 'absent' : 'present';
        setMarkingId(studentId);
        const res = await storeAttendance(user.tenant_id, token, { student_id: studentId, status: newStatus });
        setMarkingId(null);
        if (res.attendance) {
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
        if (res.message) alert("Configuración guardada correctamente");
    };

    const toggleExpandPayer = (payerId: string) => {
        setExpandedPayerId(expandedPayerId === payerId ? null : payerId);
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/";
    };

    // --- VIEWS ---

    const renderDashboard = () => {
        const totalStudents = allStudents.length;
        const totalPayers = payers.length;
        const paidCuentas = payers.filter(p => p.status === 'paid').length;
        const reviewCuentas = payers.filter(p => p.status === 'review').length;
        const pendingCuentas = totalPayers - paidCuentas - reviewCuentas;
        const attendanceCount = allStudents.filter((s: any) => s.today_status === 'present').length;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-accent rounded-[3rem] p-8 text-white shadow-2xl shadow-indigo-900/30 ring-1 ring-white/20">
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60 mb-2">Estado Academia</h2>
                            <p className="text-5xl font-black tracking-tighter leading-none mb-6">{totalStudents}<span className="text-xl font-bold ml-1 opacity-60">Alumnos</span></p>
                        </div>
                        <div className="h-12 w-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                            <TrendingUp size={24} />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                            <CheckCircle2 size={20} className="text-emerald-400 mb-2" />
                            <p className="text-lg font-black leading-none mb-1">{paidCuentas}</p>
                            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Al día</p>
                        </div>
                        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                            <Clock size={20} className="text-amber-400 mb-2" />
                            <p className="text-lg font-black leading-none mb-1">{reviewCuentas}</p>
                            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Revisión</p>
                        </div>
                        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                            <AlertCircle size={20} className="text-rose-400 mb-2" />
                            <p className="text-lg font-black leading-none mb-1">{pendingCuentas}</p>
                            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Deuda</p>
                        </div>
                    </div>

                    <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-[80px]" />
                </div>

                <GlassCard>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-base font-black text-white flex items-center gap-2 uppercase tracking-tighter">
                                <CalendarCheck className="text-primary" size={20} />
                                Tatami Activo
                            </h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Presencia en tiempo real</p>
                        </div>
                        <div className="bg-primary/10 text-primary px-4 py-2 rounded-2xl border border-primary/20">
                            <span className="text-sm font-black">{attendanceCount} / {totalStudents}</span>
                        </div>
                    </div>

                    {attendanceCount > 0 ? (
                        <div className="flex -space-x-3 overflow-x-auto pb-4 hide-scrollbar">
                            {allStudents.filter((s: any) => s.today_status === 'present').map((s: any) => (
                                <div key={s.id} className="relative ring-4 ring-background rounded-full overflow-hidden shadow-xl shrink-0">
                                    <img
                                        className="h-16 w-16 object-cover"
                                        src={s.photo}
                                        alt={s.name}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                </div>
                            ))}
                            <div className="w-10 shrink-0" /> {/* Spacer */}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white/[0.02] rounded-[2rem] border border-dashed border-white/10">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Tatami disponible</p>
                            <button
                                onClick={() => setActiveTab('attendance')}
                                className="text-primary font-black text-xs uppercase tracking-widest border-b-2 border-primary/20 pb-1 hover:border-primary transition-all"
                            >
                                Abrir pase de lista
                            </button>
                        </div>
                    )}
                </GlassCard>

                {token && user?.tenant_id && <QRGenerator tenantId={user.tenant_id} token={token} />}
            </motion.div>
        );
    };

    const renderAttendance = () => {
        const filteredStudents = allStudents.filter((s: any) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
            >
                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="BUSCAR ALUMNO..."
                        className="w-full bg-white/5 pl-14 pr-6 py-5 rounded-[2rem] border border-white/5 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/20 text-[11px] font-black tracking-widest placeholder:text-gray-600"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <AnimatePresence>
                        {filteredStudents.map((student: any) => {
                            const isPresent = student.today_status === 'present';
                            const isMarking = markingId === student.id;

                            return (
                                <motion.button
                                    layout
                                    key={student.id}
                                    onClick={() => handleToggleAttendance(student.id, student.today_status)}
                                    disabled={isMarking}
                                    className={`relative flex flex-col items-center p-3 rounded-[2.5rem] transition-all duration-700 ${isPresent ? 'bg-primary shadow-[0_20px_40px_-10px_rgba(99,102,241,0.3)] ring-2 ring-white/20' : 'bg-white/5 border border-white/5 active:scale-95'
                                        }`}
                                >
                                    <div className="relative mb-3">
                                        <div className={`h-16 w-16 rounded-[1.8rem] overflow-hidden transition-all duration-700 ${isPresent ? 'scale-105' : 'grayscale-[0.5]'}`}>
                                            <img src={student.photo} alt={student.name} className={`w-full h-full object-cover transition-all ${isMarking ? 'opacity-20 translate-y-2' : ''}`} />
                                        </div>
                                        {isMarking && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                                            </div>
                                        )}
                                        {isPresent && !isMarking && (
                                            <motion.div
                                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-2xl"
                                            >
                                                <Check className="text-primary" size={12} strokeWidth={4} />
                                            </motion.div>
                                        )}
                                    </div>
                                    <p className={`font-black text-[9px] text-center leading-tight uppercase tracking-widest w-full line-clamp-1 ${isPresent ? 'text-white' : 'text-gray-300'}`}>
                                        {student.name.split(' ')[0]}
                                    </p>
                                    {!isPresent && <span className="text-[7px] text-gray-500 mt-1 uppercase font-black tracking-[0.2em]">{student.belt}</span>}
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </motion.div>
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
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="space-y-6"
            >
                <div className="flex gap-2 p-2 rounded-[2rem] bg-white/5 border border-white/5 overflow-x-auto hide-scrollbar">
                    {['all', 'review', 'pending', 'paid'].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setPaymentFilter(filter)}
                            className={`px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-500 ${paymentFilter === filter
                                    ? 'bg-primary text-white shadow-xl shadow-primary/20'
                                    : 'bg-transparent text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            {filter === 'all' ? 'Ver Todo' : filter === 'pending' ? 'Impago' : filter === 'review' ? 'Validar' : 'Activos'}
                        </button>
                    ))}
                </div>

                <div className="space-y-4 pb-12">
                    {filteredPayers.map((payer: any) => {
                        const { amount, hasDiscount, numEnrollments } = calculatePrice(payer);
                        const isExpanded = expandedPayerId === payer.id;
                        const isReview = payer.status === 'review';

                        return (
                            <div
                                key={payer.id}
                                className={`group rounded-[3rem] transition-all duration-700 overflow-hidden ${isExpanded ? 'bg-indigo-600/10 ring-2 ring-indigo-500/30' :
                                        isReview ? 'bg-amber-500/5 ring-1 ring-amber-500/20' : 'bg-white/5 border border-white/5'
                                    }`}
                            >
                                <div
                                    className="p-6 flex items-center gap-5 cursor-pointer active:bg-white/5 transition-colors"
                                    onClick={() => toggleExpandPayer(payer.id)}
                                >
                                    <div className="relative shrink-0">
                                        <div className={`w-16 h-16 rounded-[2rem] overflow-hidden shadow-2xl transition-transform duration-700 ${isExpanded ? 'scale-110' : ''}`}>
                                            <img src={payer.photo} alt={payer.name} className="w-full h-full object-cover" />
                                        </div>
                                        {isReview && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-background animate-pulse" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-white text-sm uppercase tracking-widest truncate mb-1">{payer.name}</h4>
                                        <div className="flex items-center gap-3">
                                            <div className="flex -space-x-2">
                                                {payer.enrolledStudents.slice(0, 3).map((student: any) => (
                                                    <img key={student.id} src={student.photo} className="w-6 h-6 rounded-full border-2 border-background object-cover" />
                                                ))}
                                            </div>
                                            <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{numEnrollments} Alumnos</span>
                                        </div>
                                        <div className="mt-3 flex items-center gap-3">
                                            <span className="font-black text-white text-lg tracking-tight">{formatMoney(amount)}</span>
                                            {hasDiscount && <span className="text-[7px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-emerald-500/20">Descuento</span>}
                                        </div>
                                    </div>

                                    <div className="shrink-0">
                                        {payer.status === 'paid' ? (
                                            <div className="h-10 w-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                                <Check size={20} strokeWidth={4} />
                                            </div>
                                        ) : isReview ? (
                                            <button
                                                onClick={(e) => handleApprovePaymentAction(e, payer.id)}
                                                className="bg-amber-500 text-black h-14 w-14 rounded-full flex flex-col items-center justify-center gap-1 shadow-2xl shadow-amber-500/30 active:scale-90 transition-all group-hover:bg-amber-400"
                                            >
                                                <Check size={20} strokeWidth={4} />
                                                <span className="text-[7px] font-black uppercase tracking-widest">OK</span>
                                            </button>
                                        ) : (
                                            <div className="h-10 w-10 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-500/20">
                                                <XCircle size={20} strokeWidth={2.5} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            className="px-6 pb-6 pt-2 bg-black/20"
                                        >
                                            <div className="grid gap-3 pt-4 border-t border-white/5">
                                                {payer.enrolledStudents.map((student: any) => (
                                                    <div key={student.id} className="flex items-center justify-between bg-white/[0.03] p-4 rounded-3xl border border-white/5">
                                                        <div className="flex items-center gap-4">
                                                            <img src={student.photo} className="w-10 h-10 rounded-2xl object-cover shadow-lg" />
                                                            <div>
                                                                <p className="text-[10px] font-black text-white uppercase tracking-widest mb-0.5">{student.name}</p>
                                                                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-[0.2em]">{student.type === 'kids' ? 'Infantil' : 'Adulto'} • {student.belt}</p>
                                                            </div>
                                                        </div>
                                                        <ArrowRight className="text-white/10" size={16} />
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
            </motion.div>
        );
    };

    const renderSettings = () => {
        const InputField = ({ label, value, onChange, type = "number", suffix = "" }: any) => (
            <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.25em] px-2">{label}</label>
                <div className="relative group">
                    <input
                        type={type} value={value} onChange={onChange}
                        className="w-full bg-white/5 px-6 py-5 rounded-3xl border border-white/5 focus:bg-white/[0.08] focus:border-primary/30 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-black text-white text-base tracking-tight"
                    />
                    {suffix && <span className="absolute right-6 top-1/2 -translate-y-1/2 text-primary font-black opacity-40">{suffix}</span>}
                </div>
            </div>
        );

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                <GlassCard className="space-y-8 ring-1 ring-white/5">
                    <div className="border-b border-white/5 pb-4">
                        <h3 className="text-base font-black text-white uppercase tracking-tighter">Mensualidades</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Configura valores base para cobros</p>
                    </div>

                    <div className="grid gap-6">
                        <InputField label="Categoría Infantil ($)" value={prices.kids} onChange={(e: any) => setPrices({ ...prices, kids: Number(e.target.value) })} suffix="CLP" />
                        <InputField label="Categoría Adultos ($)" value={prices.adult} onChange={(e: any) => setPrices({ ...prices, adult: Number(e.target.value) })} suffix="CLP" />
                    </div>
                </GlassCard>

                <GlassCard className="space-y-8 ring-1 ring-white/5 text-center">
                    <div className="inline-flex h-16 w-16 bg-primary/10 rounded-3xl items-center justify-center text-primary mb-2">
                        <Settings size={32} />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-white uppercase tracking-tighter">Descuento Multigrupo</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 px-4 text-center">Incentiva inscripciones familiares</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Mínimo Alumnos" value={prices.discountThreshold} onChange={(e: any) => setPrices({ ...prices, discountThreshold: Number(e.target.value) })} />
                        <InputField label="Porcentaje (%)" value={prices.discountPercentage} onChange={(e: any) => setPrices({ ...prices, discountPercentage: Number(e.target.value) })} suffix="%" />
                    </div>

                    <button
                        onClick={handleSaveSettings}
                        className="w-full bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.25em] py-6 rounded-[2.5rem] shadow-2xl shadow-indigo-900/40 active:scale-[0.98] transition-all"
                    >
                        Guardar Configuración
                    </button>
                </GlassCard>

                <div className="pb-12" />
            </motion.div>
        );
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="h-16 w-16 bg-primary/20 rounded-3xl flex items-center justify-center border border-primary/30"
                >
                    <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-background font-sans max-w-lg mx-auto relative overflow-hidden selection:bg-primary selection:text-white">

            {/* HEADER */}
            <header className="px-8 py-8 flex items-center justify-between sticky top-0 z-50 bg-background/60 backdrop-blur-3xl border-b border-white/[0.04]">
                <div className="flex items-center gap-5">
                    <motion.div
                        whileTap={{ scale: 0.9, rotate: -5 }}
                        className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-accent rounded-[1.8rem] flex items-center justify-center shadow-2xl shadow-indigo-600/30 p-2.5"
                    >
                        <img src={branding?.logo || "/icon.webp"} alt="Logo" className="w-full h-full object-contain" />
                    </motion.div>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-widest uppercase leading-none mb-1.5">{branding?.name}</h1>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.15em]">{activeTab === 'dashboard' ? 'Overview' : activeTab === 'attendance' ? 'Attendance' : activeTab === 'payments' ? 'Accounts' : 'Vault Settings'}</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 hover:text-rose-500 transition-all duration-500 hover:bg-rose-500/10 border border-white/5"
                >
                    <LogOut size={22} />
                </button>
            </header>

            {/* MAIN VIEW */}
            <main className="flex-1 overflow-y-auto p-8 pb-32 hide-scrollbar">
                <AnimatePresence mode="wait">
                    {activeTab === 'dashboard' && <div key="dash">{renderDashboard()}</div>}
                    {activeTab === 'attendance' && <div key="att">{renderAttendance()}</div>}
                    {activeTab === 'payments' && <div key="pay">{renderPayments()}</div>}
                    {activeTab === 'settings' && <div key="set">{renderSettings()}</div>}
                </AnimatePresence>
            </main>

            {/* FLOAT NAV */}
            <nav className="fixed bottom-10 left-8 right-8 z-50 glass-nav rounded-[2.5rem] p-4 flex justify-around items-center h-24 border border-white/10 shadow-2xl shadow-black/50 max-w-sm mx-auto">
                <IconButton icon={LayoutDashboard} onClick={() => { setActiveTab('dashboard'); setSearchTerm(''); }} active={activeTab === 'dashboard'} label="Resumen" />
                <IconButton icon={Users} onClick={() => { setActiveTab('attendance'); setSearchTerm(''); }} active={activeTab === 'attendance'} label="Tatami" />
                <IconButton icon={CreditCard} onClick={() => { setActiveTab('payments'); setSearchTerm(''); }} active={activeTab === 'payments'} label="Cuentas" />
                <IconButton icon={Settings} onClick={() => { setActiveTab('settings'); setSearchTerm(''); }} active={activeTab === 'settings'} label="Vault" />

                {/* Notification Bubble for accounts */}
                {payers.some(p => p.status === 'review') && (
                    <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute right-[28%] top-6 w-3 h-3 bg-amber-500 rounded-full border-2 border-background shadow-lg shadow-amber-500/50"
                    />
                )}
            </nav>

        </div>
    );
}
