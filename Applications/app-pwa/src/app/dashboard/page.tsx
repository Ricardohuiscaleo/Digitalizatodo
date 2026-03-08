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
    Bell,
    Plus,
    Zap
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

// --- DATOS DE PRUEBA ACTUALIZADOS (Reference Style) ---
const demoData = [
    {
        id: 'p1',
        name: 'Javier Muñoz',
        photo: 'https://i.pravatar.cc/150?u=7',
        status: 'paid',
        enrolledStudents: [
            { id: 's1', name: 'Ana Muñoz', category: 'kids', photo: 'https://i.pravatar.cc/150?img=1', today_status: 'present' },
            { id: 's2', name: 'Luis Muñoz', category: 'kids', photo: 'https://i.pravatar.cc/150?img=2', today_status: 'absent' },
            { id: 's3', name: 'Mía Muñoz', category: 'kids', photo: 'https://i.pravatar.cc/150?img=3', today_status: 'present' }
        ]
    },
    {
        id: 'p2',
        name: 'Valentina Rojas',
        photo: 'https://i.pravatar.cc/150?u=4',
        status: 'pending',
        enrolledStudents: [
            { id: 's4', name: 'Valentina Rojas', category: 'adults', photo: 'https://i.pravatar.cc/150?u=4', today_status: 'present' },
            { id: 's5', name: 'Pedro Rojas', category: 'kids', photo: 'https://i.pravatar.cc/150?img=5', today_status: 'present' }
        ]
    },
    {
        id: 'p3',
        name: 'Carlos Soto',
        photo: 'https://i.pravatar.cc/150?u=3',
        status: 'paid',
        enrolledStudents: [
            { id: 's6', name: 'Carlos Soto', category: 'adults', photo: 'https://i.pravatar.cc/150?u=3', today_status: 'absent' }
        ]
    }
];

export default function PremiumStaffDashboard() {
    const { branding, setBranding } = useBranding();
    const [activeTab, setActiveTab] = useState('inicio');
    const [user, setUser] = useState<any>(null);
    const [payers, setPayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [markingId, setMarkingId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDemo, setIsDemo] = useState(false);

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
            total += student.category === 'adults' ? prices.adult : prices.kids;
        });

        if (payer.enrolledStudents.length > prices.discountThreshold) {
            total = total * (1 - prices.discountPercentage / 100);
        }

        return { amount: total };
    };

    // --- ACTIONS ---

    const handleLoadDemo = () => {
        setIsDemo(true);
        setPayers(demoData);
        setUser({ name: 'Admin Demo', tenant_id: 'DEMO-123' });
    };

    const handleToggleAttendance = async (studentId: string, currentStatus: string | null) => {
        if (isDemo) {
            setMarkingId(studentId);
            setTimeout(() => {
                const newPayers = payers.map(p => ({
                    ...p,
                    enrolledStudents: p.enrolledStudents.map((s: any) =>
                        s.id === studentId ? { ...s, today_status: currentStatus === 'present' ? 'absent' : 'present' } : s
                    )
                }));
                setPayers(newPayers);
                setMarkingId(null);
            }, 500);
            return;
        }

        if (!token || !user?.tenant_id) return;
        const newStatus = currentStatus === 'present' ? 'absent' : 'present';
        setMarkingId(studentId);
        await storeAttendance(user.tenant_id, token, { student_id: studentId, status: newStatus });
        setMarkingId(null);
        const payersData = await getPayers(user.tenant_id, token);
        setPayers(payersData?.payers || []);
    };

    const handleApprovePayment = async (payerId: string) => {
        if (isDemo) {
            setPayers(payers.map(p => p.id === payerId ? { ...p, status: 'paid' } : p));
            return;
        }

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
                <div className="h-9 w-9 bg-zinc-950 flex items-center justify-center rounded-xl shadow-sm overflow-hidden">
                    <img src={branding?.logo || "/icon.webp"} className="h-2/3 w-2/3 object-contain invert" alt="Logo" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-tight text-slate-900 leading-none">{branding?.name}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{isDemo ? 'MODO DEMO' : 'Staff Dashboard'}</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {isDemo && <Badge className="bg-emerald-100 text-emerald-700 text-[8px] font-black border-none px-2 h-5">DEMO</Badge>}
                <Avatar className="h-9 w-9 border-2 border-slate-100 shadow-sm ring-1 ring-white">
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
                {/* HERO CARD - Reference Style Gradient */}
                <Card className="col-span-6 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 border-none text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between h-[220px]">
                    <div className="relative z-10">
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-200">Total Participantes</span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <h2 className="text-7xl font-black tracking-tighter">{totalNum}</h2>
                            <span className="text-[10px] font-medium text-indigo-300 uppercase tracking-widest leading-none">Alumnos</span>
                        </div>
                    </div>

                    <div className="relative z-10 flex items-center justify-between bg-white/10 backdrop-blur-md rounded-[1.5rem] p-4 border border-white/20">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 bg-emerald-400/20 rounded-xl flex items-center justify-center">
                                <CheckCircle2 size={18} className="text-emerald-300" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black block text-white leading-none">{paidNum}</span>
                                <span className="text-[8px] font-bold text-indigo-200 uppercase">Al Día</span>
                            </div>
                        </div>
                        <Separator orientation="vertical" className="h-8 bg-white/20" />
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 bg-rose-400/20 rounded-xl flex items-center justify-center">
                                <XCircle size={18} className="text-rose-300" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black block text-white leading-none">{debtNum}</span>
                                <span className="text-[8px] font-bold text-indigo-200 uppercase">Pendientes</span>
                            </div>
                        </div>
                    </div>

                    <div className="absolute top-[-20%] right-[-10%] opacity-10">
                        <Users size={220} strokeWidth={3} />
                    </div>
                </Card>

                {/* ACTIVITY TRACKER */}
                <Card className="col-span-3 bg-white border-none rounded-[2rem] p-6 shadow-bento h-[140px] flex flex-col justify-between group active:scale-95 transition-all">
                    <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <CalendarCheck size={22} />
                    </div>
                    <div>
                        <span className="text-3xl font-black text-zinc-950 block leading-tight">{attendanceNow}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">En {getLabels.place}</span>
                    </div>
                </Card>

                <Card className="col-span-3 bg-zinc-950 border-none rounded-[2rem] p-6 shadow-bento h-[140px] flex flex-col justify-between text-white relative overflow-hidden">
                    <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                        <TrendingUp size={22} className="text-emerald-400" />
                    </div>
                    <div className="z-10">
                        <span className="text-3xl font-black block leading-tight">100%</span>
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Eficiencia</span>
                    </div>
                    <div className="absolute -bottom-4 -right-4 bg-emerald-500/10 w-24 h-24 rounded-full blur-2xl"></div>
                </Card>
            </div>
        );
    };

    const renderFooterNav = () => (
        <nav className="h-20 bg-white/95 backdrop-blur-md border-t border-slate-100 flex items-center justify-around px-4 pb-4 sticky bottom-0 z-50">
            <NavItem icon={LayoutDashboard} label="Admin" active={activeTab === 'inicio'} onClick={() => setActiveTab('inicio')} />
            <NavItem icon={Users} label={getLabels.place} active={activeTab === 'alumnos'} onClick={() => setActiveTab('alumnos')} />
            <NavItem icon={CreditCard} label="Pagos" active={activeTab === 'pagos'} onClick={() => setActiveTab('pagos')} />
            <NavItem icon={Settings} label="Ops" active={activeTab === 'ajustes'} onClick={() => setActiveTab('ajustes')} />
        </nav>
    );

    function NavItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
        return (
            <button onClick={onClick} className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${active ? 'text-zinc-950 scale-110' : 'text-slate-300'}`}>
                <div className={`p-2.5 rounded-[1.2rem] transition-all ${active ? 'bg-zinc-100 shadow-sm' : ''}`}>
                    <Icon size={22} strokeWidth={active ? 3 : 2} />
                </div>
                <span className={`text-[8px] font-black uppercase tracking-widest transition-opacity ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
            </button>
        );
    }

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center p-12 bg-white">
            <RefreshCw className="animate-spin text-zinc-950 mb-6" size={32} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Sincronizando</p>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-white font-sans max-w-lg mx-auto overflow-hidden">
            {renderHeader()}

            <main className="flex-1 overflow-y-auto hide-scrollbar">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'inicio' && renderBentoSummary()}

                        {activeTab === 'alumnos' && (
                            <div className="p-6 space-y-6 pb-20">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-zinc-950 transition-colors" size={18} />
                                    <Input
                                        placeholder={`Buscar ${getLabels.subject}...`}
                                        className="h-14 bg-white border-none rounded-[1.2rem] shadow-bento pl-12 text-sm font-bold placeholder:text-slate-400 focus-visible:ring-zinc-950"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {allStudents.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(student => (
                                        <button
                                            key={student.id}
                                            onClick={() => handleToggleAttendance(student.id, student.today_status)}
                                            className={`flex flex-col items-center gap-3 p-4 rounded-[2.5rem] transition-all border-none ${student.today_status === 'present' ? 'bg-zinc-950 text-white shadow-2xl scale-105 z-10' : 'bg-white text-slate-900 shadow-sm active:scale-95'}`}
                                        >
                                            <div className="relative">
                                                <Avatar className={`h-16 w-16 border-2 transform transition-transform ${student.today_status === 'present' ? 'border-emerald-500 scale-110' : 'border-slate-100'}`}>
                                                    <AvatarImage src={student.photo} className="object-cover" />
                                                    <AvatarFallback className="font-black text-xs">{student.name[0]}</AvatarFallback>
                                                </Avatar>
                                                {markingId === student.id && (
                                                    <div className="absolute inset-0 bg-white/80 rounded-full flex items-center justify-center animate-spin"><RefreshCw size={14} /></div>
                                                )}
                                                {student.today_status === 'present' && !markingId && (
                                                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1.5 rounded-full border-2 border-zinc-950 text-white shadow-xl"><Check size={8} strokeWidth={6} /></div>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-center truncate w-full tracking-tighter">{student.name.split(' ')[0]}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'pagos' && (
                            <div className="p-6 space-y-4 pb-24">
                                <div className="flex gap-2 bg-white p-1.5 rounded-[1.5rem] mb-4 shadow-sm border border-slate-100">
                                    {['all', 'pending', 'paid'].map((f) => (
                                        <button key={f} onClick={() => setPaymentFilter(f)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap ${paymentFilter === f ? 'bg-zinc-950 text-white shadow-lg' : 'text-slate-400'}`}>
                                            {f === 'all' ? 'Ver Todos' : f === 'pending' ? 'Deuda' : 'Al Día'}
                                        </button>
                                    ))}
                                </div>
                                {payers.filter(p => {
                                    if (paymentFilter === 'paid') return p.status === 'paid';
                                    if (paymentFilter === 'pending') return p.status === 'pending';
                                    return true;
                                }).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(payer => {
                                    const { amount } = calculatePrice(payer);
                                    const isExpanded = expandedPayerId === payer.id;
                                    return (
                                        <Card key={payer.id} className={`border-none shadow-bento rounded-[2.5rem] overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-2 ring-zinc-950/5 mb-6' : 'mb-3'}`}>
                                            <div className="p-5 flex items-center justify-between cursor-pointer bg-white" onClick={() => setExpandedPayerId(isExpanded ? null : payer.id)}>
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <Avatar className="h-14 w-14 rounded-2xl border-2 border-slate-50 shadow-sm">
                                                            <AvatarImage src={payer.photo} className="object-cover" />
                                                            <AvatarFallback className="font-black text-xs">{payer.name[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="absolute -bottom-2 -right-2 bg-zinc-950 text-white text-[7px] font-black px-1.5 py-0.5 rounded-lg border-2 border-white uppercase lg:hidden">ADMIN</div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5 mb-1.5">
                                                            <h4 className="text-sm font-black uppercase text-slate-900 leading-none">{payer.name}</h4>
                                                            {isExpanded ? <ChevronUp size={14} className="text-slate-300" /> : <ChevronDown size={14} className="text-slate-300" />}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex -space-x-1.5">
                                                                {payer.enrolledStudents.slice(0, 3).map((s: any) => (
                                                                    <Avatar key={s.id} className="h-4 w-4 border-2 border-white">
                                                                        <AvatarImage src={s.photo} />
                                                                    </Avatar>
                                                                ))}
                                                            </div>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase">{payer.enrolledStudents.length} Insc.</span>
                                                            <span className="text-xs font-black text-emerald-600">{formatMoney(amount)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {payer.status === 'paid' ? (
                                                    <CheckCircle2 size={24} className="text-emerald-500" />
                                                ) : (
                                                    <Button onClick={(e) => { e.stopPropagation(); handleApprovePayment(payer.id); }} className="rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-500 font-black text-[10px] uppercase px-5 shadow-none border border-rose-100">Pagar</Button>
                                                )}
                                            </div>
                                            {isExpanded && (
                                                <div className="p-5 bg-white border-t border-slate-100 space-y-2 animate-in slide-in-from-top-2">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">Participantes en esta cuenta:</p>
                                                    {payer.enrolledStudents.map((s: any) => (
                                                        <div key={s.id} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-8 w-8 rounded-lg overflow-hidden">
                                                                    <AvatarImage src={s.photo} className="object-cover" />
                                                                </Avatar>
                                                                <span className="text-[10px] font-black uppercase text-slate-700">{s.name}</span>
                                                            </div>
                                                            <Badge variant="secondary" className="text-[8px] font-black uppercase bg-slate-100">{s.category || 'Regular'}</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </Card>
                                    )
                                })}
                            </div>
                        )}

                        {activeTab === 'ajustes' && (
                            <div className="p-6 space-y-6 pb-24">
                                <Card className="border-none shadow-bento rounded-[3rem] p-10 flex flex-col items-center bg-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6">
                                        <Badge className="bg-zinc-100 text-zinc-400 text-[8px] font-black uppercase tracking-[0.3em] px-3 py-1 border-none">Versión 4.2</Badge>
                                    </div>
                                    <div className="relative mb-6 group">
                                        <Avatar className="h-28 w-28 border-4 border-slate-50 shadow-inner group-hover:scale-110 transition-transform">
                                            <AvatarImage src={branding?.logo} className="object-contain" />
                                            <AvatarFallback><ImageIcon className="text-slate-200" size={32} /></AvatarFallback>
                                        </Avatar>
                                        <Button size="icon" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 rounded-2xl h-11 w-11 bg-zinc-950 text-white shadow-xl border-4 border-white active:scale-90 transition-all"><Camera size={18} /></Button>
                                    </div>
                                    <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tighter leading-none">{branding?.name}</h3>
                                    <Badge variant="secondary" className="mt-3 text-[9px] font-black uppercase tracking-[0.2em] px-4 h-6 border-none">{getLabels.summary}</Badge>
                                </Card>

                                <div className="space-y-4">
                                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-3">Entorno Profesional</h5>

                                    {/* MODO DEMO BUTTON - Reference Style */}
                                    <Card className="border-none shadow-bento rounded-[2.5rem] p-4 bg-white hover:ring-2 ring-emerald-500/20 transition-all">
                                        <Button
                                            onClick={handleLoadDemo}
                                            className="w-full h-18 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-black rounded-[1.8rem] flex items-center justify-between px-6 transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-11 w-11 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-emerald-100 group-hover:rotate-12 transition-transform">
                                                    <Zap size={22} className="fill-emerald-500 text-emerald-500" />
                                                </div>
                                                <div className="text-left">
                                                    <span className="block text-[13px] uppercase leading-none tracking-tight">Cargar Datos de Prueba</span>
                                                    <span className="text-[9px] font-bold opacity-50 uppercase tracking-widest mt-1 block">Modo Demo Activado</span>
                                                </div>
                                            </div>
                                            <ChevronRight size={20} className="opacity-40" />
                                        </Button>
                                    </Card>

                                    <Card className="border-none shadow-bento rounded-[2.5rem] p-10 bg-white space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase text-slate-400">Precios Kids</span>
                                                <span className="text-sm font-black text-zinc-950">{formatMoney(prices.kids)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase text-slate-400">Precios Adultos</span>
                                                <span className="text-sm font-black text-zinc-950">{formatMoney(prices.adult)}</span>
                                            </div>
                                        </div>
                                        <Separator className="bg-slate-50" />
                                        <Button className="w-full h-14 bg-zinc-950 text-white font-black rounded-2xl shadow-xl shadow-zinc-100 uppercase tracking-wider text-[10px]">Guardar Cambios</Button>
                                    </Card>
                                </div>

                                <Button variant="ghost" className="w-full py-12 text-rose-500 font-black uppercase tracking-[0.4em] hover:bg-rose-50 rounded-[2.5rem] transition-all" onClick={handleLogout}>
                                    <LogOut className="mr-3" size={18} />
                                    Cerrar Sesión Staff
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
