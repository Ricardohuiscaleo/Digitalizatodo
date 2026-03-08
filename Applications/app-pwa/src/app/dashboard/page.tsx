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

// --- DATOS DE PRUEBA ---
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
    }
];

export default function StaffDashboard() {
    const { branding, setBranding } = useBranding();
    const [activeTab, setActiveTab] = useState('inicio');
    const [user, setUser] = useState<any>(null);
    const [payers, setPayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [markingId, setMarkingId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDemo, setIsDemo] = useState(false);

    const [prices, setPrices] = useState({ kids: 25000, adult: 35000, discountThreshold: 2, discountPercentage: 15 });
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [expandedPayerId, setExpandedPayerId] = useState<string | null>(null);

    useEffect(() => {
        const storedToken = localStorage.getItem("staff_token") || localStorage.getItem("auth_token");
        const tenantId = localStorage.getItem("tenant_id");
        if (!storedToken || !tenantId) { window.location.href = "/"; return; }
        setToken(storedToken);

        const fetchData = async () => {
            const [profile, payersData] = await Promise.all([getProfile(tenantId, storedToken), getPayers(tenantId, storedToken)]);
            if (profile) {
                setUser(profile);
                if (profile.tenant?.data?.pricing) setPrices(profile.tenant.data.pricing);
                setPayers(payersData?.payers || []);
            } else { localStorage.clear(); window.location.href = "/"; }
            setLoading(false);
        };
        fetchData();
    }, []);

    const allStudents = useMemo(() => payers.flatMap(payer => payer.enrolledStudents.map((s: any) => ({ ...s, payerId: payer.id, payerStatus: payer.status }))), [payers]);

    const handleLoadDemo = () => { setIsDemo(true); setPayers(demoData); setUser({ name: 'Admin Demo', tenant_id: 'DEMO' }); };

    const handleToggleAttendance = async (studentId: string, currentStatus: string | null) => {
        if (isDemo) {
            setMarkingId(studentId);
            setTimeout(() => {
                setPayers(p => p.map(payer => ({ ...payer, enrolledStudents: payer.enrolledStudents.map((s: any) => s.id === studentId ? { ...s, today_status: currentStatus === 'present' ? 'absent' : 'present' } : s) })));
                setMarkingId(null);
            }, 500);
            return;
        }
        if (!token || !user?.tenant_id) return;
        setMarkingId(studentId);
        await storeAttendance(user.tenant_id, token, { student_id: studentId, status: currentStatus === 'present' ? 'absent' : 'present' });
        const data = await getPayers(user.tenant_id, token);
        setPayers(data?.payers || []);
        setMarkingId(null);
    };

    const handleApprovePayment = async (payerId: string) => {
        if (isDemo) { setPayers(p => p.map(payer => payer.id === payerId ? { ...payer, status: 'paid' } : payer)); return; }
        if (token && user?.tenant_id && confirm('¿Confirmar pago?')) { await approvePayment(user.tenant_id, token, payerId); const data = await getPayers(user.tenant_id, token); setPayers(data?.payers || []); }
    };

    return (
        <div className="flex flex-col h-screen bg-white font-sans text-zinc-950 max-w-lg mx-auto overflow-hidden">
            {/* Header */}
            <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-zinc-100 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-black flex items-center justify-center rounded-lg">
                        <img src={branding?.logo || "/icon.webp"} className="h-5 w-5 object-contain invert" alt="L" />
                    </div>
                    <div>
                        <h1 className="text-xs font-black uppercase tracking-tight leading-none">{branding?.name || 'Academy'}</h1>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">{isDemo ? 'MODO DEMO' : 'Staff'}</span>
                    </div>
                </div>
                {isDemo ? <Badge className="bg-emerald-500 text-white text-[8px] font-black border-none px-2 h-5">DEMO</Badge> : <Avatar className="h-8 w-8 border border-zinc-100 shadow-sm"><AvatarImage src="/prof.webp" /><AvatarFallback className="text-[10px] font-black">ST</AvatarFallback></Avatar>}
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>

                        {activeTab === 'inicio' && (
                            <div className="space-y-4">
                                <Card className="bg-gradient-to-br from-indigo-600 to-violet-700 border-none text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden h-[180px] flex flex-col justify-between">
                                    <div className="relative z-10">
                                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">Total Alumnos</span>
                                        <h2 className="text-6xl font-black tracking-tighter">{allStudents.length}</h2>
                                    </div>
                                    <div className="relative z-10 flex gap-4 bg-black/20 p-4 rounded-2xl backdrop-blur-sm border border-white/10 text-[10px] font-black uppercase">
                                        <div className="flex-1">AL DÍA: {allStudents.filter((s: any) => s.payerStatus === 'paid').length}</div>
                                        <div className="flex-1 text-rose-300">DEUDA: {allStudents.filter((s: any) => s.payerStatus !== 'paid').length}</div>
                                    </div>
                                </Card>

                                <div className="grid grid-cols-2 gap-4">
                                    <Card className="bg-white border border-zinc-200 rounded-[1.5rem] p-6 shadow-sm flex flex-col justify-between h-[120px]">
                                        <CalendarCheck className="text-zinc-400" size={20} />
                                        <div><span className="text-2xl font-black block leading-none">{allStudents.filter((s: any) => s.today_status === 'present').length}</span><span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Presentes Hoy</span></div>
                                    </Card>
                                    <Card className="bg-white border border-zinc-200 rounded-[1.5rem] p-6 shadow-sm flex flex-col justify-between h-[120px]">
                                        <Zap className="text-amber-500" size={20} />
                                        <div><span className="text-2xl font-black block leading-none">100%</span><span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Actividad</span></div>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {activeTab === 'alumnos' && (
                            <div className="space-y-6">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                    <Input placeholder="Buscar por nombre..." className="h-12 bg-zinc-50 border-zinc-200 rounded-xl pl-11 font-bold text-zinc-950 focus-visible:ring-black" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {allStudents.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(student => (
                                        <button key={student.id} onClick={() => handleToggleAttendance(student.id, student.today_status)} className={`flex flex-col items-center gap-2 p-4 rounded-[1.5rem] transition-all relative ${student.today_status === 'present' ? 'bg-black text-white' : 'bg-white text-black border border-zinc-200'}`}>
                                            <Avatar className={`h-12 w-12 border-2 ${student.today_status === 'present' ? 'border-emerald-500' : 'border-zinc-100'}`}><AvatarImage src={student.photo} /><AvatarFallback>{student.name[0]}</AvatarFallback></Avatar>
                                            <span className="text-[9px] font-black uppercase truncate w-full text-center">{student.name.split(' ')[0]}</span>
                                            {markingId === student.id && <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-[1.5rem]"><RefreshCw className="animate-spin text-black" size={16} /></div>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'pagos' && (
                            <div className="space-y-4 pb-20">
                                {payers.map(payer => (
                                    <Card key={payer.id} className="bg-white border border-zinc-200 rounded-[1.5rem] p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 rounded-lg border border-zinc-100"><AvatarImage src={payer.photo} /><AvatarFallback>{payer.name[0]}</AvatarFallback></Avatar>
                                            <div><h4 className="text-xs font-black uppercase tracking-tight">{payer.name}</h4><div className="flex items-center gap-2 text-[9px] font-bold text-zinc-400 uppercase"><span>{payer.enrolledStudents.length} INSCRITOS</span><span className={payer.status === 'paid' ? 'text-emerald-600' : 'text-rose-600'}>• {payer.status === 'paid' ? 'AL DÍA' : 'PENDIENTE'}</span></div></div>
                                        </div>
                                        {payer.status !== 'paid' && <Button onClick={() => handleApprovePayment(payer.id)} className="h-8 bg-zinc-100 hover:bg-zinc-200 text-black font-black text-[9px] uppercase px-4 rounded-lg">Pagar</Button>}
                                    </Card>
                                ))}
                            </div>
                        )}

                        {activeTab === 'ajustes' && (
                            <div className="space-y-6 pb-20">
                                <Card className="bg-white border border-zinc-200 rounded-[2rem] p-10 flex flex-col items-center gap-4 text-center">
                                    <Avatar className="h-20 w-20 border-4 border-zinc-100"><AvatarImage src={branding?.logo} /><AvatarFallback><ImageIcon /></AvatarFallback></Avatar>
                                    <div><h3 className="text-lg font-black uppercase leading-none">{branding?.name}</h3><Badge variant="outline" className="mt-2 text-[9px] font-black">PRO VERSION 4.2</Badge></div>
                                </Card>
                                <Button onClick={handleLoadDemo} className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl flex items-center justify-between px-6 shadow-xl shadow-emerald-100"><div className="flex items-center gap-3"><Zap size={20} fill="white" /><span>CARGAR DATOS DEMO</span></div><ChevronRight size={16} /></Button>
                                <Separator className="bg-zinc-100" />
                                <Button variant="ghost" className="w-full py-10 text-rose-500 font-black uppercase tracking-widest hover:bg-rose-50 rounded-2xl" onClick={() => { localStorage.clear(); window.location.href = "/"; }}><LogOut className="mr-2" size={16} /> Cerrar Sesión</Button>
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Nav */}
            <nav className="h-20 bg-white border-t border-zinc-100 flex items-center justify-around px-2 shrink-0">
                <NavItem icon={LayoutDashboard} label="Admin" active={activeTab === 'inicio'} onClick={() => setActiveTab('inicio')} />
                <NavItem icon={Users} label="Tatami" active={activeTab === 'alumnos'} onClick={() => setActiveTab('alumnos')} />
                <NavItem icon={CreditCard} label="Pagos" active={activeTab === 'pagos'} onClick={() => setActiveTab('pagos')} />
                <NavItem icon={Settings} label="Ops" active={activeTab === 'ajustes'} onClick={() => setActiveTab('ajustes')} />
            </nav>
        </div>
    );
}

function NavItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
    return (
        <button onClick={onClick} className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${active ? 'text-black' : 'text-zinc-300'}`}>
            <Icon size={20} strokeWidth={active ? 3 : 2} />
            <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );
}
