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
    Image as ImageIcon,
    MoreVertical,
    ChevronRight,
    Trophy
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

// Shadcn UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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
        cat1_name: 'Infantil',
        cat1_price: 25000,
        cat2_name: 'Adulto',
        cat2_price: 35000,
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

    const getLabels = useMemo(() => {
        const ind = branding?.industry || 'martial_arts';
        switch (ind) {
            case 'clinic':
                return { place: 'MÓDULO', subject: 'PACIENTES', summary: 'ADMIN CLÍNICA', unit: 'Atenciones' };
            case 'music_school':
                return { place: 'AULA', subject: 'ALUMNOS', summary: 'ADMIN ESCUELA', unit: 'Lecciones' };
            case 'generic_service':
                return { place: 'SERVICIO', subject: 'CLIENTES', summary: 'ADMIN NEGOCIO', unit: 'Servicios' };
            default:
                return { place: 'TATAMI', subject: 'ALUMNOS', summary: 'ADMIN DOJO', unit: 'Entrenamientos' };
        }
    }, [branding?.industry]);

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
            // Check if student category matches one of our dynamic categories
            if (student.category === 'category_2' || student.category === 'adults') {
                total += prices.cat2_price;
            } else {
                total += prices.cat1_price;
            }
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
        if (window.confirm('¿Confirmas el pago del titular?')) {
            const res = await approvePayment(user.tenant_id, token, payerId);
            if (res.message) {
                const payersData = await getPayers(user.tenant_id, token);
                setPayers(payersData?.payers || []);
            }
        }
    };

    const handleSaveSettings = async () => {
        if (!token || !user?.tenant_id) return;
        // Sync industry along with pricing data
        const res = await updatePricing(user.tenant_id, token, {
            ...prices,
            industry: branding?.industry || 'martial_arts'
        });
        if (res.message) alert("Configuración guardada correctamente");
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token || !user?.tenant_id) return;

        setUploading(true);
        const res = await updateLogo(user.tenant_id, token, file);
        setUploading(false);

        if (res.logo_url) {
            const tenantId = branding?.id || user?.tenant_id || localStorage.getItem("tenant_id") || "";
            setBranding({
                id: tenantId,
                name: branding?.name || user?.name || "Mi Negocio",
                logo: res.logo_url,
                primaryColor: branding?.primaryColor || "#6366f1",
                industry: branding?.industry
            });
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

    // --- VIEWS ---

    const renderInicio = () => {
        const totalStudents = allStudents.length;
        const paidStudents = allStudents.filter((s: any) => s.payerStatus === 'paid').length;
        const reviewStudents = allStudents.filter((s: any) => s.payerStatus === 'review').length;
        const pendingStudents = totalStudents - paidStudents - reviewStudents;
        const attendanceCount = allStudents.filter((s: any) => s.today_status === 'present').length;

        return (
            <div className="space-y-4">
                {/* Resumen Maestro (Siguiendo Prototype) */}
                <Card className="border-none bg-indigo-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden ring-1 ring-white/20">
                    <div className="relative z-10">
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-indigo-100 mb-2">Total {getLabels.subject} en {getLabels.place}</h2>
                        <div className="flex items-baseline gap-2 mb-6">
                            <p className="text-5xl font-black">{totalStudents}</p>
                            <span className="text-xs font-bold text-indigo-100 uppercase tracking-tighter">Registrados</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 bg-black/10 rounded-3xl p-4 backdrop-blur-sm border border-white/10">
                            <div className="flex flex-col items-center gap-1">
                                <div className="p-1 bg-white/20 rounded-lg"><CheckCircle2 size={14} className="text-white" /></div>
                                <span className="text-lg font-black">{paidStudents}</span>
                                <span className="text-[8px] font-black text-indigo-100 uppercase">AL DÍA</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 border-x border-white/10">
                                <div className="p-1 bg-white/20 rounded-lg"><Clock size={14} className="text-white" /></div>
                                <span className="text-lg font-black">{reviewStudents}</span>
                                <span className="text-[8px] font-black text-indigo-100 uppercase">REVISIÓN</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <div className="p-1 bg-white/20 rounded-lg"><XCircle size={14} className="text-white" /></div>
                                <span className="text-lg font-black">{pendingStudents}</span>
                                <span className="text-[8px] font-black text-indigo-100 uppercase">DEUDA</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Asistencia de Hoy (Siguiendo Prototype) */}
                <Card className="border-slate-100 bg-white rounded-[2rem] shadow-sm overflow-hidden">
                    <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                <CalendarCheck size={18} className="text-indigo-600" />
                            </div>
                            <CardTitle className="text-sm font-black uppercase tracking-tight text-slate-800">Presentes Hoy</CardTitle>
                        </div>
                        <Badge className="bg-indigo-600 text-[10px] font-black rounded-full px-3">{attendanceCount} / {totalStudents}</Badge>
                    </CardHeader>
                    <CardContent className="p-5">
                        {attendanceCount > 0 ? (
                            <div className="flex -space-x-3 overflow-x-auto pb-1 scrollbar-hide">
                                {allStudents.filter((s: any) => s.today_status === 'present').map((s: any) => (
                                    <Avatar key={s.id} className="h-12 w-12 border-4 border-white shadow-sm ring-1 ring-slate-100">
                                        <AvatarImage src={s.photo} className="object-cover" />
                                        <AvatarFallback className="text-xs bg-slate-50">{s.name[0]}</AvatarFallback>
                                    </Avatar>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{getLabels.place} vacío aún</p>
                                <Button
                                    variant="link"
                                    onClick={() => setActiveTab('alumnos')}
                                    className="text-indigo-600 text-xs font-black uppercase tracking-tight p-0 h-auto mt-2"
                                >
                                    Pasar Asistencia
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Control QR Lite */}
                {token && user?.tenant_id && (
                    <QRGenerator tenantId={user.tenant_id} token={token} />
                )}
            </div>
        );
    };

    const renderAsistencia = () => {
        const filteredStudents = allStudents.filter((s: any) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

        return (
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                        placeholder={`BUSCAR ${getLabels.subject}...`}
                        className="pl-11 h-14 bg-white border-slate-200 text-sm font-black tracking-tight uppercase placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-600/20 rounded-2xl shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-3 gap-3 pb-24">
                    {filteredStudents.map((student: any) => {
                        const isPresent = student.today_status === 'present';
                        const isMarking = markingId === student.id;

                        return (
                            <button
                                key={student.id}
                                className={`relative flex flex-col items-center p-2 rounded-2xl transition-all ${isPresent ? 'bg-indigo-50 shadow-inner ring-2 ring-indigo-200' : 'bg-white shadow-sm border border-slate-100 active:scale-95'
                                    }`}
                                onClick={() => handleToggleAttendance(student.id, student.today_status)}
                                disabled={isMarking}
                            >
                                <div className="relative mb-2">
                                    <Avatar className={`h-16 w-16 border-2 transition-all ${isPresent ? 'border-indigo-500 ring-2 ring-indigo-400 ring-offset-2' : 'border-white'}`}>
                                        <AvatarImage src={student.photo} className="object-cover" />
                                        <AvatarFallback className="bg-slate-50">{student.name[0]}</AvatarFallback>
                                    </Avatar>
                                    {isMarking && (
                                        <div className="absolute inset-0 bg-white/60 rounded-full flex items-center justify-center">
                                            <RefreshCw size={16} className="animate-spin text-indigo-600" />
                                        </div>
                                    )}
                                    {isPresent && !isMarking && (
                                        <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-1 border-2 border-white shadow-md">
                                            <Check size={10} strokeWidth={4} />
                                        </div>
                                    )}
                                </div>
                                <p className={`text-[10px] font-black text-center leading-tight line-clamp-2 w-full uppercase ${isPresent ? 'text-indigo-700' : 'text-slate-800'}`}>
                                    {student.name.split(' ')[0]}
                                </p>
                                <span className="text-[8px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">{student.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
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
            <div className="space-y-4">
                <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto scrollbar-hide">
                    {['all', 'review', 'pending', 'paid'].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setPaymentFilter(filter)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${paymentFilter === filter
                                ? 'bg-slate-900 text-white shadow-lg'
                                : 'bg-transparent text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            {filter === 'all' ? 'Todas' : filter === 'pending' ? 'Deuda' : filter === 'review' ? 'Validar' : 'Al Día'}
                        </button>
                    ))}
                </div>

                <div className="space-y-3 pb-24">
                    {filteredPayers.map((payer: any) => {
                        const { amount, hasDiscount, numEnrollments } = calculatePrice(payer);
                        const isExpanded = expandedPayerId === payer.id;

                        return (
                            <Card key={payer.id} className={`border-none transition-all duration-200 overflow-hidden ${isExpanded ? 'ring-2 ring-indigo-200' :
                                payer.status === 'review' ? 'ring-2 ring-amber-200' : 'shadow-sm'
                                }`}>
                                <div
                                    className="p-4 flex items-center gap-3 cursor-pointer bg-white"
                                    onClick={() => toggleExpandPayer(payer.id)}
                                >
                                    <div className="relative">
                                        <Avatar className="h-14 w-14 border border-slate-100 shadow-sm">
                                            <AvatarImage src={payer.photo} className="object-cover" />
                                            <AvatarFallback className="bg-slate-50">{payer.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1.5 -right-1.5 bg-slate-800 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md border-2 border-white uppercase">
                                            Titular
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-black text-slate-800 uppercase truncate pr-2 tracking-tight">{payer.name}</h4>
                                            {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex -space-x-1.5">
                                                {payer.enrolledStudents.slice(0, 3).map((s: any) => (
                                                    <Avatar key={s.id} className="h-5 w-5 border-2 border-white ring-1 ring-slate-100">
                                                        <AvatarImage src={s.photo} />
                                                        <AvatarFallback />
                                                    </Avatar>
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{numEnrollments} Insc.</span>
                                        </div>
                                        <div className="flex items-baseline gap-1 mt-1">
                                            <span className="text-xs font-black text-slate-900">{formatMoney(amount)}</span>
                                            {hasDiscount && <Badge className="bg-emerald-50 text-emerald-700 text-[8px] font-black px-1 leading-none h-4 border-emerald-100">DCTO</Badge>}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end">
                                        {payer.status === 'review' ? (
                                            <Button
                                                size="sm"
                                                className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black px-3 h-8 rounded-xl shadow-md border-b-2 border-amber-700"
                                                onClick={(e) => handleApprovePaymentAction(e, payer.id)}
                                            >
                                                APROBAR
                                            </Button>
                                        ) : payer.status === 'paid' ? (
                                            <div className="flex items-center gap-1 text-emerald-600 font-black text-[10px] uppercase">
                                                <CheckCircle2 size={12} />
                                                <span>Al Día</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-rose-500 font-black text-[10px] uppercase">
                                                <XCircle size={12} />
                                                <span>Deuda</span>
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
                                            className="bg-slate-50 border-t border-slate-100"
                                        >
                                            <CardContent className="p-4 pt-2">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Detalle de {getLabels.subject}:</p>
                                                <div className="space-y-1.5">
                                                    {payer.enrolledStudents.map((s: any) => (
                                                        <div key={s.id} className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-7 w-7 border border-slate-100">
                                                                    <AvatarImage src={s.photo} />
                                                                    <AvatarFallback>{s.name[0]}</AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <span className="text-[10px] font-black text-slate-800 uppercase block leading-none">{s.name}</span>
                                                                    <span className="text-[8px] text-slate-400 font-bold uppercase">{s.label}</span>
                                                                </div>
                                                            </div>
                                                            <Badge variant="secondary" className="text-[8px] font-black uppercase">
                                                                {(s.category === 'category_2' || s.category === 'adults') ? prices.cat2_name : prices.cat1_name}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Card>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderAjustes = () => {
        return (
            <div className="space-y-6 pb-32">
                {/* Perfil Academia */}
                <div className="flex flex-col items-center py-6 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 text-center">
                    <div className="relative mb-4 group scale-110">
                        <Avatar className="h-24 w-24 border-4 border-slate-50 shadow-inner p-1 bg-white">
                            {uploading ? (
                                <div className="w-full h-full flex items-center justify-center"><RefreshCw size={24} className="animate-spin text-indigo-600" /></div>
                            ) : (
                                <>
                                    <AvatarImage src={branding?.logo} className="object-contain" />
                                    <AvatarFallback className="bg-slate-50"><ImageIcon size={32} className="text-slate-200" /></AvatarFallback>
                                </>
                            )}
                        </Avatar>
                        <Button
                            size="icon"
                            variant="secondary"
                            className="absolute -bottom-1 -right-1 h-9 w-9 rounded-2xl shadow-xl border-4 border-white bg-slate-900 text-white hover:bg-slate-800"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Camera size={14} />
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                    </div>

                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{branding?.name}</h3>

                    <div className="flex flex-col items-center gap-2 mt-4 px-6 w-full">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Giro del Negocio</label>
                        <select
                            value={branding?.industry || 'martial_arts'}
                            onChange={(e) => setBranding({ ...branding, industry: e.target.value } as any)}
                            className="w-full bg-slate-50 border border-slate-200 text-xs font-black text-slate-800 uppercase tracking-widest px-4 py-3 rounded-2xl outline-none text-center appearance-none shadow-inner"
                        >
                            <option value="martial_arts">Escuela de Artes Marciales</option>
                            <option value="clinic">Centro Médico / Box</option>
                            <option value="music_school">Escuela de Música</option>
                            <option value="generic_service">Servicios Generales</option>
                        </select>
                    </div>
                </div>

                {/* Valores y Reglas */}
                <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-6">
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-900 uppercase border-b border-slate-100 pb-3">{getLabels.subject}: Valores</h4>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-slate-500 uppercase px-1">Categoría 1</label>
                                    <Input
                                        value={prices.cat1_name}
                                        onChange={(e) => setPrices({ ...prices, cat1_name: e.target.value })}
                                        className="h-12 bg-slate-50 border-slate-100 text-xs font-black rounded-2xl focus-visible:bg-white shadow-inner"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-slate-500 uppercase px-1">Precio ($)</label>
                                    <Input
                                        type="number"
                                        value={prices.cat1_price}
                                        onChange={(e) => setPrices({ ...prices, cat1_price: Number(e.target.value) })}
                                        className="h-12 bg-slate-50 border-slate-100 text-xs font-black rounded-2xl focus-visible:bg-white shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-slate-500 uppercase px-1">Categoría 2</label>
                                    <Input
                                        value={prices.cat2_name}
                                        onChange={(e) => setPrices({ ...prices, cat2_name: e.target.value })}
                                        className="h-12 bg-slate-50 border-slate-100 text-xs font-black rounded-2xl focus-visible:bg-white shadow-inner"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-slate-500 uppercase px-1">Precio ($)</label>
                                    <Input
                                        type="number"
                                        value={prices.cat2_price}
                                        onChange={(e) => setPrices({ ...prices, cat2_price: Number(e.target.value) })}
                                        className="h-12 bg-slate-50 border-slate-100 text-xs font-black rounded-2xl focus-visible:bg-white shadow-inner"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-900 uppercase border-b border-slate-100 pb-3">Reglas de Descuento</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[8px] font-black text-slate-500 uppercase px-1">Más de X inscritos</label>
                                <Input
                                    type="number"
                                    value={prices.discountThreshold}
                                    onChange={(e) => setPrices({ ...prices, discountThreshold: Number(e.target.value) })}
                                    className="h-12 bg-slate-50 border-slate-100 text-xs font-black rounded-2xl shadow-inner"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[8px] font-black text-slate-500 uppercase px-1">Porcentaje (%)</label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={prices.discountPercentage}
                                        onChange={(e) => setPrices({ ...prices, discountPercentage: Number(e.target.value) })}
                                        className="h-12 bg-slate-50 border-slate-100 text-xs font-black rounded-2xl shadow-inner pr-8"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleSaveSettings}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-sm py-6 rounded-3xl shadow-xl shadow-slate-200 transition-all active:scale-95 border-b-4 border-slate-950"
                    >
                        GUARDAR CONFIGURACIÓN
                    </Button>
                </div>

                <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full h-14 text-rose-500 hover:text-rose-600 hover:bg-rose-50 text-[10px] font-black uppercase tracking-widest rounded-2xl"
                >
                    <LogOut size={16} className="mr-2" />
                    Cerrar Sesión Profesional
                </Button>
            </div>
        );
    };

    if (loading) return <div className="h-screen flex flex-col items-center justify-center bg-white gap-4"><RefreshCw className="animate-spin text-indigo-600" size={32} /><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando {getLabels.summary}...</p></div>;

    return (
        <div className="flex flex-col h-screen bg-slate-50 font-sans max-w-lg mx-auto overflow-hidden selection:bg-indigo-500 selection:text-white">

            {/* HEADER COMPACTO SUPREMO */}
            <header className="px-5 h-14 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-2.5">
                    <div className="h-6 w-6 bg-slate-100 rounded-lg flex items-center justify-center">
                        <img src={branding?.logo || "/icon.webp"} className="h-4 w-4 object-contain" alt="Logo" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 truncate max-w-[120px]">{branding?.name}</span>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <Input
                        placeholder={`BUSCAR...`}
                        className="pl-9 h-11 bg-slate-50 border-none text-[10px] font-black tracking-widest uppercase placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-indigo-600/40 rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                    <Trophy size={10} className="text-indigo-600" />
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{activeTab === 'alumnos' ? getLabels.place : activeTab}</span>
                </div>
            </header>

            {/* CONTENIDO PRINCIPAL - MAXIMIZADO */}
            <main className="flex-1 overflow-y-auto px-4 pt-4 hide-scrollbar">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'inicio' && renderInicio()}
                        {activeTab === 'alumnos' && renderAsistencia()}
                        {activeTab === 'pagos' && renderPagos()}
                        {activeTab === 'ajustes' && renderAjustes()}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* NAVBAR INFERIOR STANDARD COMPACT */}
            <nav className="h-16 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-3 flex items-center justify-around sticky bottom-0 z-50">
                <NavItem icon={LayoutDashboard} onClick={() => setActiveTab('inicio')} active={activeTab === 'inicio'} label="RESUMEN" />
                <NavItem icon={Users} onClick={() => setActiveTab('alumnos')} active={activeTab === 'alumnos'} label={getLabels.place} />
                <NavItem icon={CreditCard} onClick={() => setActiveTab('pagos')} active={activeTab === 'pagos'} label="CUENTAS" />
                <NavItem icon={Settings} onClick={() => setActiveTab('ajustes')} active={activeTab === 'ajustes'} label="AJUSTES" />

                {/* Notificación de Validación */}
                {payers.some(p => p.status === 'review') && (
                    <div className="absolute right-[33%] top-4 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-lg shadow-amber-500/50" />
                )}
            </nav>

        </div>
    );
}

function NavItem({ icon: Icon, onClick, active, label }: { icon: any, onClick: () => void, active: boolean, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center flex-1 transition-all duration-300 relative py-2 ${active ? "text-indigo-600" : "text-slate-400"}`}
        >
            <div className={`p-2 rounded-xl transition-all ${active ? 'bg-indigo-50' : 'bg-transparent'}`}>
                <Icon size={22} strokeWidth={active ? 3 : 2} />
            </div>
            <span className={`text-[8px] font-black mt-1 transition-all ${active ? "opacity-100 translate-y-0" : "opacity-60 translate-y-0.5"}`}>{label}</span>
            {active && <motion.div layoutId="nav-pill" className="absolute -top-px left-1/4 right-1/4 h-1 bg-indigo-600 rounded-full" />}
        </button>
    );
}

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
        <Card className="border-none bg-indigo-50/30 overflow-hidden">
            <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
                    <QrCode size={12} /> Acceso QR
                </CardTitle>
                {qrData && (
                    <Badge variant="outline" className="h-5 border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-1.5">
                        VENCE EN {expires}S
                    </Badge>
                )}
            </CardHeader>
            <CardContent className="p-4 flex flex-col items-center">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin my-4" />
                    ) : qrData ? (
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-2 rounded-xl shadow-2xl">
                            <QRCodeSVG value={qrData} size={130} />
                        </motion.div>
                    ) : (
                        <Button
                            onClick={generateQR}
                            className="w-full h-12 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-xl"
                        >
                            Activar Control de Ingreso
                        </Button>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}

