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
    UserCircle2,
    ArrowRight,
    TrendingUp,
    ChevronRight,
    Bell
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function PremiumStaffDashboard() {
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
                return { place: 'Módulo', subject: 'Pacientes', summary: 'Clínica', unit: 'Citas' };
            case 'music_school':
                return { place: 'Aula', subject: 'Alumnos', summary: 'Escuela', unit: 'Lecciones' };
            default:
                return { place: 'Tatami', subject: 'Alumnos', summary: 'Dojo', unit: 'Clases' };
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

        if (payer.enrolledStudents.length > prices.discountThreshold) {
            total = total * (1 - prices.discountPercentage / 100);
        }

        return { amount: total };
    };

    // --- ACTIONS ---

    const handleToggleAttendance = async (studentId: string, currentStatus: string | null) => {
        if (!token || !user?.tenant_id) return;
        const newStatus = currentStatus === 'present' ? 'absent' : 'present';
        setMarkingId(studentId);
        await storeAttendance(user.tenant_id, token, { student_id: studentId, status: newStatus });
        setMarkingId(null);
        const payersData = await getPayers(user.tenant_id, token);
        setPayers(payersData?.payers || []);
    };

    const handleApprovePayment = async (payerId: string) => {
        if (!token || !user?.tenant_id) return;
        if (confirm('¿Confirmas el pago del titular?')) {
            await approvePayment(user.tenant_id, token, payerId);
            const payersData = await getPayers(user.tenant_id, token);
            setPayers(payersData?.payers || []);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/";
    };

    // --- SUB-RENDERS ---

    const renderHeader = () => (
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-100 z-50 sticky top-0">
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-slate-50 flex items-center justify-center rounded-xl p-1.5 border border-slate-100 shadow-sm overflow-hidden">
                    <img src={branding?.logo || "/icon.webp"} className="h-full w-full object-contain" alt="Logo" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-tight text-slate-900 leading-none">{branding?.name}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Gestión de Staff</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100 transition-all">
                    <Bell size={18} />
                </Button>
                <Avatar className="h-10 w-10 border-2 border-slate-100 shadow-sm ring-1 ring-white">
                    <AvatarImage src="/prof.webp" className="object-cover" />
                    <AvatarFallback className="text-[10px] font-black bg-slate-50">ST</AvatarFallback>
                </Avatar>
            </div>
        </header>
    );

    const renderBentoSummary = () => {
        const totalNum = allStudents.length;
        const paidNum = allStudents.filter((s: any) => s.payerStatus === 'paid').length;
        const debtNum = totalNum - paidNum;
        const attendanceNow = allStudents.filter((s: any) => s.today_status === 'present').length;

        return (
            <div className="grid grid-cols-6 gap-3 pt-6 px-6">
                {/* BIG CARD */}
                <Card className="col-span-4 bg-zinc-950 border-none text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between h-[200px]">
                    <div className="relative z-10">
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Total Comunidad</span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <h2 className="text-6xl font-black tracking-tighter">{totalNum}</h2>
                            <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest leading-none">Activos</span>
                        </div>
                    </div>
                    <div className="relative z-10 flex items-center gap-2">
                        <TrendingUp size={14} className="text-emerald-400" />
                        <span className="text-[10px] font-bold text-zinc-400">+5 esta semana</span>
                    </div>
                    {/* Visual decoration */}
                    <div className="absolute top-[-20%] right-[-10%] opacity-10">
                        <Users size={180} strokeWidth={3} />
                    </div>
                </Card>

                {/* SMALL CARDS */}
                <Card className="col-span-2 bg-emerald-50 border-none rounded-[2rem] p-6 flex flex-col items-center justify-center text-center h-[200px] shadow-sm">
                    <div className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-3">
                        <CheckCircle2 size={20} className="text-emerald-500" />
                    </div>
                    <span className="text-3xl font-black text-emerald-600 leading-none">{paidNum}</span>
                    <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest mt-2">Al Día</span>
                </Card>

                <Card className="col-span-3 bg-white border-slate-100 rounded-[2rem] p-6 shadow-bento h-[120px] flex items-center gap-5">
                    <div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100 shadow-sm">
                        <XCircle size={22} className="text-rose-500" />
                    </div>
                    <div>
                        <span className="text-2xl font-black text-slate-900 block leading-tight">{debtNum}</span>
                        <span className="text-[9px] font-black text-rose-500/60 uppercase tracking-widest">En Mora</span>
                    </div>
                </Card>

                <Card className="col-span-3 bg-zinc-50 border-zinc-100 rounded-[2rem] p-6 shadow-bento h-[120px] flex items-center gap-5">
                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center border border-zinc-200 shadow-sm">
                        <CalendarCheck size={22} className="text-zinc-950" />
                    </div>
                    <div>
                        <span className="text-2xl font-black text-zinc-950 block leading-tight">{attendanceNow}</span>
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">En {getLabels.place}</span>
                    </div>
                </Card>
            </div>
        );
    };

    const renderFooterNav = () => (
        <nav className="h-20 bg-white border-t border-slate-100 flex items-center justify-around px-4 pb-4 sticky bottom-0 z-50">
            <NavItem icon={LayoutDashboard} label="Admin" active={activeTab === 'inicio'} onClick={() => setActiveTab('inicio')} />
            <NavItem icon={Users} label={getLabels.place} active={activeTab === 'alumnos'} onClick={() => setActiveTab('alumnos')} />
            <NavItem icon={CreditCard} label="Pagos" active={activeTab === 'pagos'} onClick={() => setActiveTab('pagos')} />
            <NavItem icon={Settings} label="Ops" active={activeTab === 'ajustes'} onClick={() => setActiveTab('ajustes')} />
        </nav>
    );

    function NavItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
        return (
            <button onClick={onClick} className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${active ? 'text-zinc-950 scale-110' : 'text-slate-300'}`}>
                <div className={`p-2 rounded-2xl transition-all ${active ? 'bg-slate-50' : ''}`}>
                    <Icon size={22} strokeWidth={active ? 3 : 2} />
                </div>
                <span className={`text-[8px] font-black uppercase tracking-widest transition-opacity ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
            </button>
        );
    }

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center p-12 bg-white">
            <RefreshCw className="animate-spin text-zinc-950 mb-6" size={32} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Iniciando Núcleo</p>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-white font-sans max-w-lg mx-auto overflow-hidden selection:bg-zinc-950 selection:text-white">
            {renderHeader()}

            <main className="flex-1 overflow-y-auto hide-scrollbar bg-slate-50/50">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        transition={{ duration: 0.25, ease: "circOut" }}
                    >
                        {activeTab === 'inicio' && renderBentoSummary()}

                        {activeTab === 'alumnos' && (
                            <div className="p-6 space-y-6">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-zinc-950 transition-colors" size={18} />
                                    <Input
                                        placeholder={`Buscar ${getLabels.subject}...`}
                                        className="h-14 bg-white border-2 border-slate-100 rounded-[1.2rem] shadow-sm pl-12 text-sm font-bold placeholder:text-slate-400 focus-visible:ring-zinc-950"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-3 pb-20">
                                    {allStudents.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(student => (
                                        <button
                                            key={student.id}
                                            onClick={() => handleToggleAttendance(student.id, student.today_status)}
                                            className={`flex flex-col items-center gap-3 p-4 rounded-[2rem] border-2 transition-all ${student.today_status === 'present' ? 'bg-zinc-950 border-zinc-950 shadow-xl scale-105' : 'bg-white border-slate-50 shadow-sm'}`}
                                        >
                                            <div className="relative">
                                                <Avatar className={`h-16 w-16 border-2 ${student.today_status === 'present' ? 'border-zinc-700' : 'border-slate-50'}`}>
                                                    <AvatarImage src={student.photo} className="object-cover" />
                                                    <AvatarFallback className="font-black text-xs">{student.name[0]}</AvatarFallback>
                                                </Avatar>
                                                {markingId === student.id && (
                                                    <div className="absolute inset-0 bg-white/80 rounded-full flex items-center justify-center animate-spin"><RefreshCw size={14} /></div>
                                                )}
                                                {student.today_status === 'present' && !markingId && (
                                                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1 rounded-full border-2 border-zinc-950 text-white shadow-lg"><Check size={8} strokeWidth={5} /></div>
                                                )}
                                            </div>
                                            <span className={`text-[10px] font-black uppercase text-center truncate w-full ${student.today_status === 'present' ? 'text-white' : 'text-slate-900'}`}>{student.name.split(' ')[0]}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'pagos' && (
                            <div className="p-6 space-y-4 pb-24">
                                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl mb-4 overflow-x-auto scrollbar-hide">
                                    {['all', 'review', 'pending', 'paid'].map((f) => (
                                        <button key={f} onClick={() => setPaymentFilter(f)} className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap ${paymentFilter === f ? 'bg-zinc-950 text-white shadow-lg' : 'text-slate-400'}`}>
                                            {f === 'all' ? 'Ver Todos' : f === 'review' ? 'Validar' : f === 'pending' ? 'Deuda' : 'Al Día'}
                                        </button>
                                    ))}
                                </div>
                                {payers.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(payer => {
                                    const { amount } = calculatePrice(payer);
                                    return (
                                        <Card key={payer.id} className="border-none shadow-bento rounded-[2.5rem] overflow-hidden bg-white">
                                            <div className="p-6 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-14 w-14 rounded-2xl border-2 border-slate-50 shadow-sm">
                                                        <AvatarImage src={payer.photo} className="object-cover" />
                                                        <AvatarFallback className="font-black text-xs">{payer.name[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h4 className="text-sm font-black uppercase text-slate-900 leading-none mb-1.5">{payer.name}</h4>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{payer.enrolledStudents.length} Inscritos</span>
                                                            <span className="text-xs font-black text-emerald-600">{formatMoney(amount)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {payer.status === 'review' ? (
                                                    <Button onClick={() => handleApprovePayment(payer.id)} className="rounded-2xl bg-amber-500 hover:bg-amber-600 font-black text-[10px] uppercase px-5 shadow-lg shadow-amber-100">Validar</Button>
                                                ) : payer.status === 'paid' ? (
                                                    <CheckCircle2 size={24} className="text-emerald-500" />
                                                ) : (
                                                    <XCircle size={24} className="text-rose-300" />
                                                )}
                                            </div>
                                        </Card>
                                    )
                                })}
                            </div>
                        )}

                        {activeTab === 'ajustes' && (
                            <div className="p-6 space-y-6 pb-24">
                                <Card className="border-none shadow-bento rounded-[3rem] p-10 flex flex-col items-center bg-white">
                                    <div className="relative mb-6">
                                        <Avatar className="h-28 w-28 border-4 border-slate-50 shadow-inner">
                                            <AvatarImage src={branding?.logo} className="object-contain" />
                                            <AvatarFallback><ImageIcon className="text-slate-200" size={32} /></AvatarFallback>
                                        </Avatar>
                                        <Button size="icon" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 rounded-2xl h-11 w-11 bg-zinc-950 text-white shadow-xl border-4 border-white"><Camera size={18} /></Button>
                                    </div>
                                    <h3 className="text-xl font-black uppercase text-slate-900 tracking-tight">{branding?.name}</h3>
                                    <Badge variant="secondary" className="mt-2 text-[9px] font-black uppercase tracking-[0.2em] px-4">{getLabels.summary}</Badge>
                                </Card>

                                <Button variant="ghost" className="w-full py-8 text-rose-500 font-black uppercase tracking-widest hover:bg-rose-50 rounded-[2rem]" onClick={handleLogout}>
                                    <LogOut className="mr-2" size={18} />
                                    Cerrar Sesión Principal
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {renderFooterNav()}
        </div>
    );
}
