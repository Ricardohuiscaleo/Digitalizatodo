"use client";

import React, { useState, useMemo, useEffect } from 'react';
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
    ChevronRight,
    Camera,
    LogOut,
    Zap,
    RefreshCw
} from 'lucide-react';
import { useBranding } from "@/context/BrandingContext";
import {
    getProfile,
    getPayers,
    storeAttendance,
    approvePayment
} from "@/lib/api";

export default function App() {
    const { branding, setBranding } = useBranding();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [payers, setPayers] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
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

    // --- PERSISTENCE & DATA FETCHING ---

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

                // Sync initial attendance state
                const currentAttendance = new Set<string>();
                payersData?.payers?.forEach((p: any) => {
                    p.enrolledStudents.forEach((s: any) => {
                        if (s.today_status === 'present') currentAttendance.add(s.id);
                    });
                });
                setAttendance(currentAttendance);
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

        // Optimistic UI
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

    // --- VISTAS DE LA APP ---

    const renderDashboard = () => {
        const totalStudents = allStudents.length;
        const paidStudents = allStudents.filter(s => s.payerStatus === 'paid').length;
        const pendingStudents = totalStudents - paidStudents;
        const presentToday = attendance.size;

        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
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
                        {isDemo && <p className="text-[10px] font-black uppercase text-center mt-3 text-white/50 tracking-widest">MODO DEMO ACTIVO</p>}
                    </div>
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                </div>

                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <CalendarCheck className="text-indigo-500" size={22} />
                            Asistencia Hoy
                        </h3>
                        <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-sm font-bold">
                            {presentToday} / {totalStudents}
                        </span>
                    </div>

                    {presentToday > 0 ? (
                        <div className="flex -space-x-3 overflow-x-auto pb-2">
                            {allStudents.filter(s => attendance.has(s.id)).map(s => (
                                <img
                                    key={s.id}
                                    className="inline-block h-14 w-14 rounded-full border-4 border-white shadow-sm object-cover"
                                    src={s.photo}
                                    alt={s.name}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-gray-400 text-sm">Nadie ha registrado asistencia aún.</p>
                            <button onClick={() => setActiveTab('attendance')} className="mt-3 text-indigo-600 font-semibold text-sm">Tomar asistencia ahora</button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderAttendance = () => {
        const filteredStudents = allStudents.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 px-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar participante..."
                        className="w-full bg-white pl-12 pr-4 py-4 rounded-2xl shadow-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {filteredStudents.map(student => {
                        const isPresent = attendance.has(student.id);
                        return (
                            <button
                                key={student.id}
                                onClick={() => toggleAttendance(student.id)}
                                className={`relative flex flex-col items-center p-2 rounded-2xl transition-all ${isPresent ? 'bg-indigo-600 text-white shadow-lg scale-105 z-10' : 'bg-white shadow-sm border border-gray-100 active:scale-95'
                                    }`}
                            >
                                <div className="relative mb-2">
                                    <img
                                        src={student.photo}
                                        alt={student.name}
                                        className={`w-16 h-16 rounded-full object-cover transition-all ${isPresent ? 'ring-4 ring-white/30 ring-offset-2 ring-offset-indigo-600' : ''}`}
                                    />
                                    {isPresent && (
                                        <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-indigo-600">
                                            <CheckCircle2 className="text-white" size={14} />
                                        </div>
                                    )}
                                </div>
                                <p className={`font-bold text-[10px] text-center leading-tight line-clamp-2 w-full uppercase ${isPresent ? 'text-white' : 'text-gray-800'}`}>
                                    {student.name.split(' ')[0]}
                                </p>
                                <span className={`text-[8px] mt-0.5 uppercase tracking-wider font-black ${isPresent ? 'text-indigo-200' : 'text-gray-400'}`}>{student.category || 'STAFF'}</span>
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
            return true;
        }).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 px-4">
                <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto hide-scrollbar">
                    {['all', 'pending', 'paid'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setPaymentFilter(f)}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-colors ${paymentFilter === f ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500'
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
                                className={`bg-white rounded-3xl shadow-sm border transition-all duration-200 overflow-hidden ${isExpanded ? 'border-indigo-300 ring-1 ring-indigo-100 mb-4' : 'border-gray-100'
                                    }`}
                            >
                                <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedPayerId(isExpanded ? null : payer.id)}>
                                    <div className="relative">
                                        <img src={payer.photo} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
                                        <div className="absolute -bottom-2 -right-2 bg-zinc-950 text-white text-[8px] font-black px-1.5 py-0.5 rounded border-2 border-white uppercase">Titular</div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-black text-gray-800 text-sm uppercase truncate">{payer.name}</h4>
                                            {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                        </div>

                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex -space-x-2">
                                                {payer.enrolledStudents.slice(0, 3).map((s: any) => (
                                                    <img key={s.id} src={s.photo} className="w-5 h-5 rounded-full border-2 border-white object-cover" />
                                                ))}
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">{numEnrollments} Inscritos</span>
                                        </div>

                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="font-black text-indigo-700 text-sm">{formatMoney(amount)}</span>
                                            {hasDiscount && <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-black uppercase">Dcto.</span>}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end">
                                        {isPaid ? (
                                            <CheckCircle2 size={24} className="text-green-500" />
                                        ) : (
                                            <button
                                                className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-sm border border-red-100 transition-all"
                                                onClick={(e) => { e.stopPropagation(); handlePaymentApprove(payer.id); }}
                                            >
                                                Pagar
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="px-5 pb-5 pt-3 bg-gray-50 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Detalle de alumnos:</p>
                                        <div className="space-y-2">
                                            {payer.enrolledStudents.map((s: any) => (
                                                <div key={s.id} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-gray-100">
                                                    <div className="flex items-center gap-3">
                                                        <img src={s.photo} className="w-8 h-8 rounded-lg object-cover" />
                                                        <span className="text-[10px] font-black uppercase text-gray-700">{s.name}</span>
                                                    </div>
                                                    <span className="text-[8px] font-black px-2 py-1 rounded-md uppercase bg-gray-100 text-gray-400 text-right">{s.category || 'Kids'}</span>
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
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 px-4">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
                    <div className="relative inline-block mb-4">
                        <img src={branding?.logo || "/icon.webp"} className="w-24 h-24 rounded-3xl object-contain bg-zinc-950 p-4 mx-auto" alt="Logo" />
                        <button className="absolute -bottom-2 -right-2 bg-black text-white p-2 rounded-xl border-4 border-white"><Camera size={16} /></button>
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tighter text-zinc-900">{branding?.name || 'Academy'}</h3>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Gestión Staff v4.5</p>
                </div>

                <button onClick={handleLoadDemo} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-5 rounded-3xl shadow-xl shadow-emerald-100 flex items-center justify-between px-8 text-sm group transition-all active:scale-95">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-2 rounded-xl group-hover:rotate-12 transition-transform"><Zap size={20} fill="white" /></div>
                        <span className="uppercase tracking-widest">Cargar Datos Demo</span>
                    </div>
                    <ChevronRight size={20} />
                </button>

                <button className="w-full bg-zinc-950 text-white font-black py-5 rounded-3xl shadow-xl shadow-zinc-100 uppercase tracking-widest text-xs" onClick={() => { localStorage.clear(); window.location.href = "/"; }}>
                    Cerrar Sesión Staff
                </button>
            </div>
        );
    };

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center p-12 bg-white text-zinc-950">
            <RefreshCw className="animate-spin mb-6" size={32} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sincronizando</p>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-white font-sans sm:max-w-lg sm:mx-auto relative overflow-hidden text-zinc-950">

            <header className="bg-white px-6 py-5 flex items-center justify-between sticky top-0 z-50 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center">
                        <span className="text-white font-black text-xs uppercase tracking-tighter">{branding?.name?.[0] || 'D'}</span>
                    </div>
                    <h1 className="text-lg font-black uppercase tracking-tighter text-zinc-900">{activeTab === 'dashboard' ? 'Resumen' : activeTab === 'attendance' ? 'Tatami' : activeTab === 'payments' ? 'Pagos' : 'Ajustes'}</h1>
                </div>
                <div className="flex items-center gap-2">
                    {isDemo && <Badge text="DEMO" />}
                    <div className="w-9 h-9 bg-zinc-100 rounded-full border-2 border-white shadow-sm ring-1 ring-zinc-100 overflow-hidden"><img src="/prof.webp" alt="P" className="object-cover" /></div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 pb-28 hide-scrollbar">
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'attendance' && renderAttendance()}
                {activeTab === 'payments' && renderPayments()}
                {activeTab === 'settings' && renderSettings()}
            </main>

            <nav className="bg-white border-t border-gray-100 absolute bottom-0 w-full pt-2 px-8 flex justify-between items-center h-20 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-50">
                <TabButton icon={LayoutDashboard} label="Inicio" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <TabButton icon={Users} label="Tatami" active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} />
                <TabButton icon={CreditCard} label="Pagos" active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} />
                <TabButton icon={Settings} label="Ajustes" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
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
        <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-indigo-600 scale-110' : 'text-zinc-300'}`}>
            <Icon size={24} strokeWidth={active ? 3 : 2} />
            <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );
}

function Badge({ text }: { text: string }) {
    return (
        <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-lg border-none uppercase tracking-widest">{text}</span>
    );
}
