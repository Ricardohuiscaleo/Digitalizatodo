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
    Camera,
    Image as ImageIcon,
    Trophy,
    UserCircle2
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function CleanStaffDashboard() {
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
                return { place: 'MÓDULO', subject: 'PACIENTES', summary: 'CLÍNICA', unit: 'Atenciones' };
            case 'music_school':
                return { place: 'AULA', subject: 'ALUMNOS', summary: 'ESCUELA', unit: 'Lecciones' };
            case 'generic_service':
                return { place: 'SERVICIO', subject: 'CLIENTES', summary: 'NEGOCIO', unit: 'Servicios' };
            default:
                return { place: 'TATAMI', subject: 'ALUMNOS', summary: 'DOJO', unit: 'Entrenamientos' };
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

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/";
    };

    // --- RENDER VIEWS ---

    const renderInicio = () => {
        const totalStudents = allStudents.length;
        const paidStudents = allStudents.filter((s: any) => s.payerStatus === 'paid').length;
        const reviewStudents = allStudents.filter((s: any) => s.payerStatus === 'review').length;
        const pendingStudents = totalStudents - paidStudents - reviewStudents;
        const attendanceCount = allStudents.filter((s: any) => s.today_status === 'present').length;

        return (
            <div className="space-y-6">
                {/* Stats Bento Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="col-span-2 border-none bg-zinc-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">Total {getLabels.subject}</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-6xl font-black tracking-tighter">{totalStudents}</span>
                                <span className="text-xs font-bold text-zinc-600 uppercase">Activos</span>
                            </div>
                        </div>
                        <div className="absolute right-[-10%] bottom-[-10%] opacity-10">
                            <Users size={160} strokeWidth={3} />
                        </div>
                    </Card>

                    <Card className="p-6 border-slate-100 bg-emerald-50 rounded-[2rem] shadow-sm flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-black text-emerald-600 leading-none">{paidStudents}</span>
                        <span className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest mt-2">Al Día</span>
                    </Card>

                    <Card className="p-6 border-slate-100 bg-rose-50 rounded-[2rem] shadow-sm flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-black text-rose-600 leading-none">{pendingStudents}</span>
                        <span className="text-[9px] font-black text-rose-600/60 uppercase tracking-widest mt-2">Deuda</span>
                    </Card>
                </div>

                <Card className="border-slate-100 bg-white rounded-[2rem] shadow-bento overflow-hidden">
                    <div className="p-6 flex items-center justify-between border-b border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center text-white">
                                <CalendarCheck size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black uppercase text-slate-900 leading-none mb-1">Presencia de Hoy</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{getLabels.place}</p>
                            </div>
                        </div>
                        <Badge className="bg-emerald-500 font-black text-[10px] rounded-lg">{attendanceCount} PRESENTES</Badge>
                    </div>
                    <CardContent className="p-6">
                        {attendanceCount > 0 ? (
                            <div className="flex -space-x-3">
                                {allStudents.filter((s: any) => s.today_status === 'present').map((s: any) => (
                                    <Avatar key={s.id} className="h-12 w-12 border-4 border-white shadow-sm ring-1 ring-slate-100">
                                        <AvatarImage src={s.photo} className="object-cover" />
                                        <AvatarFallback className="bg-slate-50 text-[10px] font-black">{s.name[0]}</AvatarFallback>
                                    </Avatar>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{getLabels.place} vacío</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    };

    const renderAsistencia = () => {
        const filteredStudents = allStudents.filter((s: any) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

        return (
            <div className="space-y-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-900" size={18} />
                    <Input
                        placeholder={`Filtrar ${getLabels.subject}...`}
                        className="pl-12 h-14 bg-white border-2 border-slate-100 text-sm font-black uppercase tracking-tight rounded-2xl shadow-sm focus-visible:ring-zinc-950"
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
                                className={`flex flex-col items-center p-3 rounded-[2rem] transition-all border-2 ${isPresent ? 'bg-zinc-950 border-zinc-950 shadow-xl scale-105' : 'bg-white border-slate-50 active:scale-95 shadow-sm'}`}
                                onClick={() => handleToggleAttendance(student.id, student.today_status)}
                                disabled={isMarking}
                            >
                                <div className="relative mb-3">
                                    <Avatar className={`h-16 w-16 border-2 ${isPresent ? 'border-zinc-700' : 'border-slate-50'}`}>
                                        <AvatarImage src={student.photo} className="object-cover" />
                                        <AvatarFallback className="font-black">{student.name[0]}</AvatarFallback>
                                    </Avatar>
                                    {isMarking && (
                                        <div className="absolute inset-0 bg-white/80 rounded-full flex items-center justify-center">
                                            <RefreshCw className="animate-spin text-zinc-950" size={16} />
                                        </div>
                                    )}
                                    {isPresent && !isMarking && (
                                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1.5 border-2 border-zinc-950 shadow-lg">
                                            <Check size={10} strokeWidth={5} />
                                        </div>
                                    )}
                                </div>
                                <p className={`text-[10px] font-black text-center uppercase tracking-tighter leading-tight line-clamp-1 w-full ${isPresent ? 'text-white' : 'text-slate-900'}`}>{student.name.split(' ')[0]}</p>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderPagos = () => {
        const filteredPayers = payers.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

        return (
            <div className="space-y-4 pb-24">
                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto scrollbar-hide mb-4">
                    {['all', 'review', 'pending', 'paid'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setPaymentFilter(f)}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${paymentFilter === f ? 'bg-zinc-950 text-white shadow-lg' : 'text-slate-500'}`}
                        >
                            {f === 'all' ? 'Ver Todos' : f === 'pending' ? 'Deuda' : f === 'review' ? 'Validar' : 'Al Día'}
                        </button>
                    ))}
                </div>

                {filteredPayers.map((payer: any) => {
                    const { amount } = calculatePrice(payer);
                    const isExpanded = expandedPayerId === payer.id;
                    return (
                        <Card key={payer.id} className="border-none shadow-bento rounded-[1.5rem] overflow-hidden">
                            <div className="p-5 flex items-center gap-4 cursor-pointer bg-white" onClick={() => setExpandedPayerId(isExpanded ? null : payer.id)}>
                                <Avatar className="h-14 w-14 border border-slate-100 shadow-sm">
                                    <AvatarImage src={payer.photo} className="object-cover" />
                                    <AvatarFallback className="font-black">{payer.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <h5 className="text-sm font-black text-slate-900 uppercase truncate tracking-tight">{payer.name}</h5>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">{payer.enrolledStudents.length} Inscritos</span>
                                        <span className="text-xs font-black text-emerald-600">{formatMoney(amount)}</span>
                                    </div>
                                </div>
                                <div>
                                    {payer.status === 'review' ? (
                                        <Button size="sm" onClick={(e) => handleApprovePaymentAction(e, payer.id)} className="bg-amber-500 text-white font-black text-[10px] rounded-xl hover:bg-amber-600 uppercase">Validar</Button>
                                    ) : payer.status === 'paid' ? (
                                        <CheckCircle2 className="text-emerald-500" size={20} />
                                    ) : (
                                        <XCircle className="text-rose-400" size={20} />
                                    )}
                                </div>
                            </div>
                            {isExpanded && (
                                <div className="p-5 bg-slate-50 border-t border-slate-100 space-y-2">
                                    {payer.enrolledStudents.map((s: any) => (
                                        <div key={s.id} className="flex items-center justify-between text-slate-600">
                                            <span className="text-[10px] font-bold uppercase">{s.name}</span>
                                            <Badge variant="outline" className="text-[8px] font-black uppercase">{s.label || 'Regular'}</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        );
    };

    const renderAjustes = () => {
        return (
            <div className="space-y-6 pb-24">
                <Card className="border-none shadow-bento rounded-[2.5rem] p-8 flex flex-col items-center bg-white">
                    <div className="relative mb-6">
                        <Avatar className="h-24 w-24 border-4 border-slate-50 shadow-inner">
                            <AvatarImage src={branding?.logo} className="object-contain" />
                            <AvatarFallback><ImageIcon className="text-slate-200" size={32} /></AvatarFallback>
                        </Avatar>
                        <Button
                            size="icon"
                            className="absolute bottom-0 right-0 h-10 w-10 bg-zinc-950 text-white rounded-2xl border-4 border-white shadow-xl"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Camera size={16} />
                        </Button>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleLogoUpload} accept="image/*" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{branding?.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">{getLabels.summary}</p>

                    <div className="w-full space-y-2 text-left">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Giro del Negocio</label>
                        <select
                            value={branding?.industry || 'martial_arts'}
                            onChange={(e) => setBranding({ ...branding, industry: e.target.value } as any)}
                            className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-xs font-black uppercase tracking-widest text-slate-800 outline-none focus:ring-2 focus:ring-zinc-950 transition-all appearance-none"
                        >
                            <option value="martial_arts">Artes Marciales</option>
                            <option value="clinic">Clínica / Centro Médico</option>
                            <option value="music_school">Escuela de Música</option>
                            <option value="generic_service">Servicios Generales</option>
                        </select>
                    </div>
                </Card>

                <div className="bg-white rounded-[2.5rem] p-8 shadow-bento space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b pb-4">Estructura de Precios</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 col-span-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Categoría Infantil ($)</label>
                            <Input type="number" value={prices.cat1_price} onChange={(e) => setPrices({ ...prices, cat1_price: Number(e.target.value) })} className="h-12 bg-slate-50 border-none rounded-xl font-black focus-visible:ring-zinc-950" />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Categoría Adulto ($)</label>
                            <Input type="number" value={prices.cat2_price} onChange={(e) => setPrices({ ...prices, cat2_price: Number(e.target.value) })} className="h-12 bg-slate-50 border-none rounded-xl font-black focus-visible:ring-zinc-950" />
                        </div>
                    </div>
                    <Button onClick={handleSaveSettings} className="w-full h-14 bg-zinc-950 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl shadow-zinc-200">GUARDAR CAMBIOS</Button>
                </div>

                <Button variant="ghost" className="w-full text-rose-500 font-black uppercase tracking-widest py-8 rounded-2xl hover:bg-rose-50" onClick={handleLogout}>
                    <LogOut className="mr-2" size={18} />
                    Cerrar Sesión Principal
                </Button>
            </div>
        );
    };

    if (loading) return (
        <div className="h-screen bg-white flex flex-col items-center justify-center p-10 text-center">
            <RefreshCw className="animate-spin text-zinc-950 mb-4" size={32} />
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em]">Cargando Sistema...</p>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-slate-50 font-sans max-w-lg mx-auto overflow-hidden">
            {/* CLEAN HEADER */}
            <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 rounded-md">
                        <AvatarImage src={branding?.logo || "/icon.webp"} />
                        <AvatarFallback>D</AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 truncate max-w-[120px]">{branding?.name}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-zinc-950 text-white rounded-lg">
                    <Trophy size={12} />
                    <span className="text-[9px] font-black uppercase">{activeTab === 'alumnos' ? getLabels.place : activeTab}</span>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1 overflow-y-auto px-6 py-8 hide-scrollbar">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'inicio' && renderInicio()}
                        {activeTab === 'alumnos' && renderAsistencia()}
                        {activeTab === 'pagos' && renderPagos()}
                        {activeTab === 'ajustes' && renderAjustes()}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* MINIMAL BOTTOM NAV */}
            <nav className="h-18 bg-white border-t border-slate-100 flex items-center justify-around px-2 sticky bottom-0 z-50">
                <NavItem icon={LayoutDashboard} label="Admin" active={activeTab === 'inicio'} onClick={() => setActiveTab('inicio')} />
                <NavItem icon={Users} label={getLabels.place} active={activeTab === 'alumnos'} onClick={() => setActiveTab('alumnos')} />
                <NavItem icon={CreditCard} label="Pagos" active={activeTab === 'pagos'} onClick={() => setActiveTab('pagos')} />
                <NavItem icon={Settings} label="Ops" active={activeTab === 'ajustes'} onClick={() => setActiveTab('ajustes')} />
            </nav>
        </div>
    );
}

function NavItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center flex-1 transition-all h-full gap-1 ${active ? 'text-zinc-950' : 'text-slate-400'}`}
        >
            <div className={`p-2 rounded-2xl transition-all ${active ? 'bg-slate-100 shadow-inner' : ''}`}>
                <Icon size={20} strokeWidth={active ? 3 : 2} />
            </div>
            <span className={`text-[8px] font-bold uppercase tracking-widest transition-opacity ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
        </button>
    );
}
