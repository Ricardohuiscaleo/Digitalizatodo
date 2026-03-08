"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
    AlertCircle,
    Camera,
    Upload,
    Image as ImageIcon
} from 'lucide-react';
import { useBranding } from "@/context/BrandingContext";
import {
    getProfile,
    getPayers,
    storeAttendance,
    approvePayment,
    updatePricing,
    getAttendanceQR,
    updateLogo
} from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";

// --- COMPONENTES MINIMALISTAS ---

const MiniCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white/[0.03] rounded-3xl p-4 border border-white/[0.05] ${className}`}>
        {children}
    </div>
);

const NavItem = ({ icon: Icon, onClick, active, label }: { icon: any, onClick: () => void, active: boolean, label: string }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center flex-1 transition-all duration-300 ${active ? "text-primary" : "text-gray-500"}`}
    >
        <div className={`p-2 rounded-xl transition-all ${active ? "bg-primary/10" : ""}`}>
            <Icon size={24} strokeWidth={active ? 2.5 : 2} />
        </div>
        <span className="text-[10px] font-bold mt-1">{label}</span>
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
        <MiniCard className="mt-2 text-center">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-white/50 uppercase tracking-widest flex items-center gap-2">
                    <QrCode size={14} /> Asistencia QR
                </h3>
                {qrData && (
                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">{expires}s</span>
                )}
            </div>

            <AnimatePresence mode="wait">
                {loading ? (
                    <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto my-4" />
                ) : qrData ? (
                    <div className="bg-white p-3 rounded-2xl inline-block shadow-2xl">
                        <QRCodeSVG value={qrData} size={140} />
                    </div>
                ) : (
                    <button
                        onClick={generateQR}
                        className="w-full bg-primary/10 text-primary border border-primary/20 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all"
                    >
                        Generar Código de Ingreso
                    </button>
                )}
            </AnimatePresence>
        </MiniCard>
    );
}

export default function CompactStaffDashboard() {
    const { branding, setBranding } = useBranding();
    const [activeTab, setActiveTab] = useState('inicio');
    const [user, setUser] = useState<any>(null);
    const [payers, setPayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [markingId, setMarkingId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

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

    // --- ACCIONES ---

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
        if (window.confirm('¿Confirmas el pago del apoderado?')) {
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
        if (res.message) alert("Precios actualizados");
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token || !user?.tenant_id) return;

        setUploading(true);
        const res = await updateLogo(user.tenant_id, token, file);
        setUploading(false);

        if (res.logo_url) {
            setBranding({ ...branding, logo: res.logo_url });
            alert("Logo actualizado con éxito");
        } else {
            alert("Error al subir el logo");
        }
    };

    const toggleExpandPayer = (payerId: string) => {
        setExpandedPayerId(expandedPayerId === payerId ? null : payerId);
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/";
    };

    // --- VISTAS ---

    const renderInicio = () => {
        const totalStudents = allStudents.length;
        const paidCuentas = payers.filter(p => p.status === 'paid').length;
        const reviewCuentas = payers.filter(p => p.status === 'review').length;
        const attendanceCount = allStudents.filter((s: any) => s.today_status === 'present').length;

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-primary/10 rounded-3xl p-6 border border-primary/20">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Estado de hoy</span>
                        <span className="bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">{attendanceCount} / {totalStudents}</span>
                    </div>
                    <div className="flex -space-x-2 overflow-x-auto pb-2 hide-scrollbar">
                        {allStudents.filter((s: any) => s.today_status === 'present').map((s: any) => (
                            <img key={s.id} className="h-10 w-10 rounded-full border-2 border-background object-cover ring-1 ring-white/10" src={s.photo} alt={s.name} />
                        ))}
                        {attendanceCount === 0 && <p className="text-gray-500 text-[10px] font-bold uppercase py-2">Sin alumnos aún</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <MiniCard>
                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Cuentas al día</p>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-black text-white">{paidCuentas}</span>
                            <CheckCircle2 size={18} className="text-emerald-500" />
                        </div>
                    </MiniCard>
                    <MiniCard>
                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Por Validar</p>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-black text-white">{reviewCuentas}</span>
                            <Clock size={18} className="text-amber-500" />
                        </div>
                    </MiniCard>
                </div>

                {token && user?.tenant_id && <QRGenerator tenantId={user.tenant_id} token={token} />}
            </motion.div>
        );
    };

    const renderAsistencia = () => {
        const filteredStudents = allStudents.filter((s: any) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type="text" placeholder="Buscar alumno..."
                        className="w-full bg-white/5 pl-12 pr-4 py-4 rounded-2xl border border-white/5 focus:outline-none focus:border-primary/50 text-[11px] font-bold uppercase tracking-wider"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-3 gap-2 pb-24">
                    {filteredStudents.map((student: any) => {
                        const isPresent = student.today_status === 'present';
                        const isMarking = markingId === student.id;

                        return (
                            <button
                                key={student.id}
                                onClick={() => handleToggleAttendance(student.id, student.today_status)}
                                disabled={isMarking}
                                className={`relative flex flex-col items-center p-2 rounded-2xl transition-all ${isPresent ? 'bg-primary/20 ring-1 ring-primary/40' : 'bg-white/5 opacity-60 active:scale-95'
                                    }`}
                            >
                                <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-2">
                                    <img src={student.photo} className="w-full h-full object-cover" />
                                    {isMarking && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><RefreshCw size={16} className="animate-spin text-white" /></div>}
                                    {isPresent && !isMarking && <div className="absolute top-1 right-1 bg-primary text-white p-0.5 rounded-md"><Check size={10} strokeWidth={4} /></div>}
                                </div>
                                <p className="text-[9px] font-black uppercase truncate w-full text-center text-white/80">{student.name.split(' ')[0]}</p>
                            </button>
                        );
                    })}
                </div>
            </motion.div>
        );
    };

    const renderPagos = () => {
        const filteredPayers = payers.filter(p => {
            if (paymentFilter === 'paid') return p.status === 'paid';
            if (paymentFilter === 'pending') return p.status === 'pending';
            if (paymentFilter === 'review') return p.status === 'review';
            return true;
        }).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex gap-2 pb-1 overflow-x-auto hide-scrollbar">
                    {['all', 'review', 'pending', 'paid'].map((f) => (
                        <button
                            key={f} onClick={() => setPaymentFilter(f)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${paymentFilter === f ? 'bg-primary text-white shadow-lg' : 'bg-white/5 text-gray-500'
                                }`}
                        >
                            {f === 'all' ? 'Ver Todo' : f === 'pending' ? 'Impago' : f === 'review' ? 'Revisión' : 'Activos'}
                        </button>
                    ))}
                </div>

                <div className="space-y-2 pb-24">
                    {filteredPayers.map((payer: any) => {
                        const { amount } = calculatePrice(payer);
                        const isExpanded = expandedPayerId === payer.id;

                        return (
                            <div key={payer.id} className="bg-white/5 rounded-2xl overflow-hidden border border-white/[0.03]">
                                <div className="p-4 flex items-center gap-3" onClick={() => toggleExpandPayer(payer.id)}>
                                    <img src={payer.photo} className="w-10 h-10 rounded-xl object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-black text-white/90 uppercase truncate">{payer.name}</p>
                                        <p className="text-[9px] font-bold text-gray-500 uppercase">{formatMoney(amount)}</p>
                                    </div>
                                    {payer.status === 'review' ? (
                                        <button onClick={(e) => handleApprovePaymentAction(e, payer.id)} className="bg-amber-500 text-black px-3 py-1.5 rounded-lg text-center active:scale-95 transition-all">
                                            <Check size={16} strokeWidth={3} />
                                        </button>
                                    ) : payer.status === 'paid' ? (
                                        <CheckCircle2 size={18} className="text-emerald-500" />
                                    ) : (
                                        <XCircle size={18} className="text-rose-500" />
                                    )}
                                </div>
                                {isExpanded && (
                                    <div className="px-4 pb-4 border-t border-white/5 pt-3 grid gap-2">
                                        {payer.enrolledStudents.map((s: any) => (
                                            <div key={s.id} className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase">
                                                <span>{s.name}</span>
                                                <span className="text-[8px] bg-white/5 px-2 py-0.5 rounded">{s.type === 'adult' ? 'Adulto' : 'Kids'}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        );
    };

    const renderAjustes = () => {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-24">
                {/* Branding Section */}
                <MiniCard className="text-center py-6">
                    <div className="relative inline-block mb-4">
                        <div className="w-20 h-20 bg-white/5 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center p-2">
                            {uploading ? (
                                <RefreshCw className="animate-spin text-primary" size={24} />
                            ) : branding?.logo ? (
                                <img src={branding.logo} className="w-full h-full object-contain" />
                            ) : (
                                <ImageIcon className="text-gray-600" size={32} />
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-xl shadow-xl active:scale-90 transition-all border-2 border-background"
                        >
                            <Upload size={14} />
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                    </div>
                    <h4 className="text-[11px] font-black uppercase text-white tracking-widest leading-none mb-1">{branding?.name}</h4>
                    <p className="text-[9px] font-bold text-gray-500 uppercase">Logo de la Academia</p>
                </MiniCard>

                <MiniCard className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1">Mens. Kids</label>
                            <input type="number" value={prices.kids} onChange={(e) => setPrices({ ...prices, kids: Number(e.target.value) })} className="w-full bg-white/5 p-4 rounded-xl text-xs font-black text-white outline-none border border-white/5 focus:border-primary/30" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1">Mens. Adulto</label>
                            <input type="number" value={prices.adult} onChange={(e) => setPrices({ ...prices, adult: Number(e.target.value) })} className="w-full bg-white/5 p-4 rounded-xl text-xs font-black text-white outline-none border border-white/5 focus:border-primary/30" />
                        </div>
                    </div>
                    <button onClick={handleSaveSettings} className="w-full bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-2xl active:scale-95 transition-all">Guardar Cambios</button>
                </MiniCard>

                <button onClick={handleLogout} className="w-full text-rose-500/60 text-[10px] font-black uppercase tracking-widest py-4 border border-rose-500/10 rounded-2xl flex items-center justify-center gap-2">
                    <LogOut size={14} /> Cerrar Sesión
                </button>
            </motion.div>
        );
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-background"><RefreshCw className="animate-spin text-primary" /></div>;

    return (
        <div className="flex flex-col h-screen bg-background font-sans max-w-lg mx-auto overflow-hidden">

            {/* HEADER COMPACTO */}
            <header className="px-6 py-4 flex items-center justify-between border-b border-white/[0.03] bg-background">
                <div className="flex items-center gap-3">
                    <img src={branding?.logo || "/icon.webp"} className="h-7 w-7 object-contain" alt="Logo" />
                    <span className="text-xs font-black uppercase tracking-widest text-white/50">{branding?.name}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black text-white/60 uppercase">{activeTab}</span>
                </div>
            </header>

            {/* CONTENIDO PRINCIPAL */}
            <main className="flex-1 overflow-y-auto p-6 hide-scrollbar">
                <AnimatePresence mode="wait">
                    {activeTab === 'inicio' && <div key="inicio">{renderInicio()}</div>}
                    {activeTab === 'asistencia' && <div key="asistencia">{renderAsistencia()}</div>}
                    {activeTab === 'pagos' && <div key="pagos">{renderPagos()}</div>}
                    {activeTab === 'ajustes' && <div key="ajustes">{renderAjustes()}</div>}
                </AnimatePresence>
            </main>

            {/* NAVBAR INFERIOR ESTÁNDAR */}
            <nav className="h-20 bg-background/80 backdrop-blur-xl border-t border-white/[0.05] p-2 flex items-center justify-around sticky bottom-0 z-50">
                <NavItem icon={LayoutDashboard} onClick={() => setActiveTab('inicio')} active={activeTab === 'inicio'} label="Inicio" />
                <NavItem icon={Users} onClick={() => setActiveTab('asistencia')} active={activeTab === 'asistencia'} label="Alumnos" />
                <NavItem icon={CreditCard} onClick={() => setActiveTab('pagos')} active={activeTab === 'pagos'} label="Pagos" />
                <NavItem icon={Settings} onClick={() => setActiveTab('ajustes')} active={activeTab === 'ajustes'} label="Ajustes" />
            </nav>

        </div>
    );
}
