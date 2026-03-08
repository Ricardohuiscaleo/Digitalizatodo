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
            const tenantId = branding?.id || user?.tenant_id || localStorage.getItem("tenant_id") || "";
            setBranding({
                id: tenantId,
                name: branding?.name || user?.name || "Mi Academia",
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
        const paidCuentas = payers.filter(p => p.status === 'paid').length;
        const reviewCuentas = payers.filter(p => p.status === 'review').length;
        const attendanceCount = allStudents.filter((s: any) => s.today_status === 'present').length;

        return (
            <div className="space-y-3">
                {/* Banner de Bienvenida Compacto */}
                <Card className="border-none bg-gradient-to-br from-indigo-950 to-slate-950 shadow-xl">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Resumen del día</h2>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-white">{attendanceCount}</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">/ {totalStudents} Presentes</span>
                            </div>
                        </div>
                        <div className="flex -space-x-2">
                            {allStudents.filter((s: any) => s.today_status === 'present').slice(0, 4).map((s: any) => (
                                <Avatar key={s.id} className="h-8 w-8 border-2 border-slate-950">
                                    <AvatarImage src={s.photo} className="object-cover" />
                                    <AvatarFallback className="text-[10px]">{s.name[0]}</AvatarFallback>
                                </Avatar>
                            ))}
                            {attendanceCount > 4 && (
                                <div className="h-8 w-8 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[8px] font-black text-white">
                                    +{attendanceCount - 4}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Métricas en Grid */}
                <div className="grid grid-cols-2 gap-2">
                    <Card className="border-none bg-white/[0.03] shadow-sm">
                        <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Cuentas al día</p>
                                <CheckCircle2 size={12} className="text-emerald-500" />
                            </div>
                            <p className="text-xl font-black text-white mt-1">{paidCuentas}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none bg-white/[0.03] shadow-sm">
                        <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Por Validar</p>
                                <Clock size={12} className="text-amber-500" />
                            </div>
                            <p className="text-xl font-black text-white mt-1">{reviewCuentas}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Generador QR Minimalista */}
                {token && user?.tenant_id && (
                    <QRGenerator tenantId={user.tenant_id} token={token} />
                )}
            </div>
        );
    };

    const renderAsistencia = () => {
        const filteredStudents = allStudents.filter((s: any) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

        return (
            <div className="space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                    <Input
                        placeholder="BUSCAR ALUMNO..."
                        className="pl-9 h-11 bg-white/5 border-none text-[10px] font-black tracking-widest uppercase placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-primary/40 rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <ScrollArea className="h-[calc(100vh-180px)] pr-2">
                    <div className="grid grid-cols-3 gap-1.5 pb-24">
                        {filteredStudents.map((student: any) => {
                            const isPresent = student.today_status === 'present';
                            const isMarking = markingId === student.id;

                            return (
                                <Button
                                    key={student.id}
                                    variant="ghost"
                                    className={`h-auto flex flex-col items-center p-1.5 rounded-xl transition-all relative group h-28 ${isPresent ? 'bg-indigo-500/15 ring-1 ring-indigo-500/30' : 'bg-white/[0.02] border border-white/[0.02]'
                                        }`}
                                    onClick={() => handleToggleAttendance(student.id, student.today_status)}
                                    disabled={isMarking}
                                >
                                    <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-1.5">
                                        <img src={student.photo} className={`w-full h-full object-cover transition-all ${isPresent ? 'scale-105' : 'grayscale-[0.3] opacity-80'}`} />
                                        {isMarking && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <RefreshCw size={14} className="animate-spin text-white" />
                                            </div>
                                        )}
                                        {isPresent && !isMarking && (
                                            <div className="absolute top-0.5 right-0.5 bg-indigo-500 text-white rounded-md p-0.5 shadow-lg">
                                                <Check size={8} strokeWidth={4} />
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-[8px] font-black text-center truncate w-full uppercase tracking-tighter ${isPresent ? 'text-indigo-400' : 'text-slate-500'}`}>
                                        {student.name.split(' ')[0]}
                                    </span>
                                </Button>
                            );
                        })}
                    </div>
                </ScrollArea>
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
            <div className="space-y-3">
                <Tabs value={paymentFilter} onValueChange={setPaymentFilter} className="w-full">
                    <TabsList className="w-full h-9 bg-white/5 p-1 rounded-lg">
                        <TabsTrigger value="all" className="flex-1 text-[8px] font-black uppercase rounded-md data-[state=active]:bg-primary data-[state=active]:text-white">Todo</TabsTrigger>
                        <TabsTrigger value="review" className="flex-1 text-[8px] font-black uppercase rounded-md data-[state=active]:bg-amber-500 data-[state=active]:text-black">Validar</TabsTrigger>
                        <TabsTrigger value="pending" className="flex-1 text-[8px] font-black uppercase rounded-md data-[state=active]:bg-rose-500 data-[state=active]:text-white">Deuda</TabsTrigger>
                        <TabsTrigger value="paid" className="flex-1 text-[8px] font-black uppercase rounded-md data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Al Día</TabsTrigger>
                    </TabsList>
                </Tabs>

                <ScrollArea className="h-[calc(100vh-180px)] pr-2">
                    <div className="space-y-1.5 pb-24">
                        {filteredPayers.map((payer: any) => {
                            const { amount } = calculatePrice(payer);
                            const isExpanded = expandedPayerId === payer.id;

                            return (
                                <Card key={payer.id} className="border-none bg-white/[0.03] overflow-hidden">
                                    <div
                                        className="p-3 flex items-center gap-3 cursor-pointer"
                                        onClick={() => toggleExpandPayer(payer.id)}
                                    >
                                        <Avatar className="h-9 w-9 border border-white/5">
                                            <AvatarImage src={payer.photo} className="object-cover" />
                                            <AvatarFallback>{payer.name[0]}</AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black text-white uppercase truncate tracking-tight">{payer.name}</p>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase">{formatMoney(amount)}</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {payer.status === 'review' ? (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 w-7 p-0 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black transition-all rounded-lg"
                                                    onClick={(e) => handleApprovePaymentAction(e, payer.id)}
                                                >
                                                    <Check size={14} strokeWidth={3} />
                                                </Button>
                                            ) : payer.status === 'paid' ? (
                                                <Badge variant="outline" className="h-5 border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-[7px] font-black px-1.5">AL DÍA</Badge>
                                            ) : (
                                                <Badge variant="outline" className="h-5 border-rose-500/20 bg-rose-500/10 text-rose-500 text-[7px] font-black px-1.5">DEUDA</Badge>
                                            )}
                                            <ChevronDown size={14} className={`text-slate-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                            >
                                                <CardContent className="px-3 pb-3 pt-1">
                                                    <Separator className="bg-white/5 mb-2" />
                                                    <div className="grid gap-1">
                                                        {payer.enrolledStudents.map((s: any) => (
                                                            <div key={s.id} className="flex items-center justify-between py-1 px-2 rounded-lg bg-white/[0.01]">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1 h-1 rounded-full bg-slate-700" />
                                                                    <span className="text-[9px] font-bold text-slate-300 uppercase">{s.name}</span>
                                                                </div>
                                                                <span className="text-[7px] text-slate-600 font-black uppercase">
                                                                    {(s.category === 'category_2' || s.category === 'adults') ? prices.cat2_name : prices.cat1_name} • {s.label}
                                                                </span>
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
                </ScrollArea>
            </div>
        );
    };

    const renderAjustes = () => {
        return (
            <ScrollArea className="h-[calc(100vh-100px)] pr-2">
                <div className="space-y-6 pb-24">
                    {/* Perfil Academia */}
                    <div className="flex flex-col items-center py-4 bg-gradient-to-b from-white/[0.04] to-transparent rounded-3xl border border-white/[0.02]">
                        <div className="relative mb-4 group">
                            <Avatar className="h-20 w-20 border-2 border-primary/20 p-1 bg-slate-900">
                                {uploading ? (
                                    <div className="w-full h-full flex items-center justify-center"><RefreshCw size={24} className="animate-spin text-primary" /></div>
                                ) : (
                                    <>
                                        <AvatarImage src={branding?.logo} className="object-contain" />
                                        <AvatarFallback className="bg-slate-800"><ImageIcon size={32} className="text-slate-600" /></AvatarFallback>
                                    </>
                                )}
                            </Avatar>
                            <Button
                                size="icon"
                                variant="secondary"
                                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-lg shadow-xl ring-2 ring-slate-950"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Camera size={12} />
                            </Button>
                            <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                        </div>
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">{branding?.name}</h3>
                        <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Configuración del Negocio</p>
                    </div>

                    {/* Valores de Mensualidad */}
                    <Card className="border-none bg-white/[0.02]">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Planes y Valores</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-slate-500 uppercase px-1">Categoría 1</label>
                                        <Input
                                            value={prices.cat1_name}
                                            onChange={(e) => setPrices({ ...prices, cat1_name: e.target.value })}
                                            className="h-9 bg-white/5 border-none text-[10px] font-black rounded-lg"
                                            placeholder="Ej: Infantil"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-slate-500 uppercase px-1">Precio ($)</label>
                                        <Input
                                            type="number"
                                            value={prices.cat1_price}
                                            onChange={(e) => setPrices({ ...prices, cat1_price: Number(e.target.value) })}
                                            className="h-9 bg-white/5 border-none text-[10px] font-black rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-slate-500 uppercase px-1">Categoría 2</label>
                                        <Input
                                            value={prices.cat2_name}
                                            onChange={(e) => setPrices({ ...prices, cat2_name: e.target.value })}
                                            className="h-9 bg-white/5 border-none text-[10px] font-black rounded-lg"
                                            placeholder="Ej: Adulto"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-slate-500 uppercase px-1">Precio ($)</label>
                                        <Input
                                            type="number"
                                            value={prices.cat2_price}
                                            onChange={(e) => setPrices({ ...prices, cat2_price: Number(e.target.value) })}
                                            className="h-9 bg-white/5 border-none text-[10px] font-black rounded-lg"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-white/5">
                                <p className="text-[9px] font-black text-slate-500 uppercase mb-3">Reglas de Descuento</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-slate-500 uppercase px-1">Más de X inscritos</label>
                                        <Input
                                            type="number"
                                            value={prices.discountThreshold}
                                            onChange={(e) => setPrices({ ...prices, discountThreshold: Number(e.target.value) })}
                                            className="h-9 bg-white/5 border-none text-[10px] font-black rounded-lg"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-slate-500 uppercase px-1">Porcentaje (%)</label>
                                        <Input
                                            type="number"
                                            value={prices.discountPercentage}
                                            onChange={(e) => setPrices({ ...prices, discountPercentage: Number(e.target.value) })}
                                            className="h-9 bg-white/5 border-none text-[10px] font-black rounded-lg"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button onClick={handleSaveSettings} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest h-11 rounded-xl shadow-lg shadow-indigo-500/10">
                                Guardar Cambios
                            </Button>
                        </CardContent>
                    </Card>

                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full h-12 text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/5 text-[10px] font-black uppercase tracking-tighter rounded-xl"
                    >
                        <LogOut size={16} className="mr-2" />
                        Finalizar Sesión
                    </Button>
                </div>
            </ScrollArea>
        );
    };

    if (loading) return <div className="h-screen flex flex-col items-center justify-center bg-slate-950 gap-4"><RefreshCw className="animate-spin text-primary" size={32} /><p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Cargando Dojo...</p></div>;

    return (
        <div className="flex flex-col h-screen bg-slate-950 font-sans max-w-lg mx-auto overflow-hidden selection:bg-indigo-500 selection:text-white">

            {/* HEADER COMPACTO SUPREMO */}
            <header className="px-5 h-14 flex items-center justify-between border-b border-white/[0.02] bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-2.5">
                    <div className="h-6 w-6 bg-indigo-500/10 rounded-lg flex items-center justify-center border border-indigo-500/20">
                        <img src={branding?.logo || "/icon.webp"} className="h-4 w-4 object-contain" alt="Logo" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 truncate max-w-[120px]">{branding?.name}</span>
                </div>

                <div className="flex items-center gap-1.5 bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                    <Trophy size={10} className="text-indigo-400" />
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{activeTab}</span>
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
            <nav className="h-16 bg-slate-950/90 backdrop-blur-xl border-t border-white/[0.03] px-3 flex items-center justify-around sticky bottom-0 z-50">
                <NavItem icon={LayoutDashboard} onClick={() => setActiveTab('inicio')} active={activeTab === 'inicio'} label="INICIO" />
                <NavItem icon={Users} onClick={() => setActiveTab('alumnos')} active={activeTab === 'alumnos'} label="TATAMI" />
                <NavItem icon={CreditCard} onClick={() => setActiveTab('pagos')} active={activeTab === 'pagos'} label="PAGOS" />
                <NavItem icon={Settings} onClick={() => setActiveTab('ajustes')} active={activeTab === 'ajustes'} label="ADMIN" />

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
            className={`flex flex-col items-center justify-center flex-1 transition-all duration-300 relative py-2 ${active ? "text-indigo-400" : "text-slate-600"}`}
        >
            <Icon size={20} strokeWidth={active ? 3 : 2} />
            <span className={`text-[8px] font-black mt-1 transition-all ${active ? "opacity-100 translate-y-0" : "opacity-40 translate-y-0.5"}`}>{label}</span>
            {active && <motion.div layoutId="nav-pill" className="absolute -top-px left-1/4 right-1/4 h-0.5 bg-indigo-500 rounded-full" />}
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
        <Card className="border-none bg-white/[0.03] overflow-hidden">
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
                            className="w-full h-12 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest border border-white/5 rounded-xl"
                        >
                            Activar Control de Ingreso
                        </Button>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}

