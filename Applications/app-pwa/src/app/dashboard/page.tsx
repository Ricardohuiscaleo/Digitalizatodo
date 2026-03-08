"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
    Camera,
    LogOut,
    Zap,
    RefreshCw,
    ChevronRight,
    Plus
} from 'lucide-react';
import { useBranding } from "@/context/BrandingContext";
import {
    getProfile,
    getPayers,
    storeAttendance,
    approvePayment,
    updateLogo,
    updatePricing
} from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

export default function App() {
    const { branding, setBranding } = useBranding();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [tabDirection, setTabDirection] = useState(0);
    const [payers, setPayers] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [isDemo, setIsDemo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [prices, setPrices] = useState({
        kids: 25000,
        adult: 35000,
        discountThreshold: 2,
        discountPercentage: 15
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [expandedPayerId, setExpandedPayerId] = useState<string | null>(null);

    const tabs = ['dashboard', 'attendance', 'payments', 'settings'];

    const changeTab = (newTab: string) => {
        const currentIndex = tabs.indexOf(activeTab);
        const newIndex = tabs.indexOf(newTab);
        setTabDirection(newIndex > currentIndex ? 1 : -1);
        setActiveTab(newTab);
    };

    // --- PERSISTENCE & DATA FETCHING ---

    useEffect(() => {
        const storedToken = localStorage.getItem("staff_token") || localStorage.getItem("auth_token");
        const tenantId = localStorage.getItem("tenant_id")?.trim();

        if (!storedToken || !tenantId) {
            window.location.href = "/";
            return;
        }

        setToken(storedToken);

        const fetchData = async () => {
            const [profile, payersData]: [any, any] = await Promise.all([
                getProfile(tenantId, storedToken),
                getPayers(tenantId, storedToken)
            ]);

            if (profile) {
                setUser(profile);
                if (profile.tenant?.data?.pricing) {
                    setPrices(profile.tenant.data.pricing);
                }
                if (profile.tenant && !branding?.name) {
                    setBranding({
                        id: String(profile.tenant.id),
                        name: profile.tenant.name,
                        industry: profile.tenant.industry,
                        logo: profile.tenant.logo,
                        primaryColor: profile.tenant.primary_color
                    });
                }
                setPayers(payersData?.payers || []);

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
    }, [setBranding]);

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

    const handleSavePrices = async () => {
        if (isDemo) {
            alert("Precios guardados localmente (Modo Demo)");
            return;
        }
        if (token && user?.tenant_id) {
            await updatePricing(user.tenant_id, token, prices);
            alert("Configuración de precios actualizada con éxito");
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token || !user?.tenant_id) return;

        const result: any = await updateLogo(user.tenant_id, token, file);
        if (result?.logo_url && branding) {
            setBranding({
                ...branding,
                id: String(branding.id),
                logo: String(result.logo_url)
            });
            alert("Logo actualizado con éxito");
        }
    };

    // --- VISTAS DE LA APP ---

    const renderDashboard = () => {
        const totalStudents = allStudents.length;
        const paidStudents = allStudents.filter(s => s.payerStatus === 'paid').length;
        const pendingStudents = totalStudents - paidStudents;
        const presentToday = attendance.size;

        return (
            <div className="space-y-4 px-4">
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
                        {isDemo && <p className="text-[10px] font-black uppercase text-center mt-3 text-white/50 tracking-widest text-zinc-950">MODO DEMO ACTIVO</p>}
                    </div>
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                </div>

                <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-black text-zinc-800 flex items-center gap-2 uppercase tracking-tighter">
                            <CalendarCheck className="text-indigo-500" size={22} />
                            Asistencia Hoy
                        </h3>
                        <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-black">
                            {presentToday} / {totalStudents}
                        </span>
                    </div>

                    {presentToday > 0 ? (
                        <div className="flex -space-x-3 overflow-x-auto pb-2">
                            {allStudents.filter(s => attendance.has(s.id)).map(s => (
                                <img
                                    key={s.id}
                                    className="inline-block h-14 w-14 rounded-2xl border-4 border-white shadow-sm object-cover"
                                    src={s.photo}
                                    alt={s.name}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                            <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Sin registros de asistencia</p>
                            <button onClick={() => changeTab('attendance')} className="mt-3 text-indigo-600 font-black text-xs uppercase underline">Tomar asistencia</button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderAttendance = () => {
        const filteredStudents = allStudents.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

        return (
            <div className="space-y-4 px-4">
                <div className="relative">
                    <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-zinc-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar participante..."
                        className="w-full bg-zinc-50 pl-14 pr-6 py-5 rounded-2xl shadow-sm border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-950 text-base font-bold text-zinc-950"
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
                                className={`relative flex flex-col items-center p-3 rounded-2xl transition-all ${isPresent ? 'bg-zinc-950 text-white shadow-lg scale-105 z-10' : 'bg-white shadow-sm border border-zinc-100 active:scale-95'
                                    }`}
                            >
                                <div className="relative mb-2">
                                    <img
                                        src={student.photo}
                                        alt={student.name}
                                        className={`w-16 h-16 rounded-2xl object-cover transition-all ${isPresent ? 'ring-4 ring-white/20' : ''}`}
                                    />
                                    {isPresent && (
                                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-1 border-2 border-zinc-950">
                                            <CheckCircle2 className="text-white" size={14} />
                                        </div>
                                    )}
                                </div>
                                <p className={`font-black text-[9px] text-center leading-tight line-clamp-2 w-full uppercase mt-1 ${isPresent ? 'text-white' : 'text-zinc-800'}`}>
                                    {student.name.split(' ')[0]}
                                </p>
                                <span className={`text-[7px] mt-0.5 uppercase tracking-widest font-bold ${isPresent ? 'text-zinc-400' : 'text-zinc-400'}`}>{student.category || 'TATAMI'}</span>
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
            <div className="space-y-4 px-4">
                <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-zinc-100 overflow-x-auto hide-scrollbar">
                    {['all', 'pending', 'paid'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setPaymentFilter(f)}
                            className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-colors ${paymentFilter === f ? 'bg-zinc-950 text-white shadow-md' : 'text-zinc-400'
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
                                className={`bg-white rounded-[2rem] shadow-sm border transition-all duration-200 overflow-hidden ${isExpanded ? 'border-zinc-300 ring-1 ring-zinc-100 mb-6' : 'border-zinc-100'
                                    }`}
                            >
                                <div className="p-5 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedPayerId(isExpanded ? null : payer.id)}>
                                    <div className="relative">
                                        <img src={payer.photo} className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
                                        <div className="absolute -bottom-2 -right-2 bg-zinc-950 text-white text-[8px] font-black px-1.5 py-0.5 rounded border-2 border-white uppercase">Titular</div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-black text-zinc-900 text-sm uppercase truncate pr-4 leading-tight">{payer.name}</h4>
                                            {isExpanded ? <ChevronUp size={20} className="text-zinc-300" /> : <ChevronDown size={20} className="text-zinc-300" />}
                                        </div>

                                        <div className="flex items-center gap-2 mt-1.5">
                                            <div className="flex -space-x-2">
                                                {payer.enrolledStudents.slice(0, 3).map((s: any) => (
                                                    <img key={s.id} src={s.photo} className="w-6 h-6 rounded-full border-2 border-white object-cover shadow-sm" />
                                                ))}
                                            </div>
                                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{numEnrollments} Inscritos</span>
                                        </div>

                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="font-black text-indigo-600 text-base tracking-tighter">{formatMoney(amount)}</span>
                                            {hasDiscount && <span className="text-[8px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg font-black uppercase tracking-widest">Descuento</span>}
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        {isPaid ? (
                                            <div className="bg-emerald-500 rounded-2xl p-2.5 shadow-lg shadow-emerald-100">
                                                <CheckCircle2 size={24} className="text-white" />
                                            </div>
                                        ) : (
                                            <button
                                                className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-5 py-3 rounded-2xl text-[10px] font-black uppercase shadow-sm border border-rose-100 transition-all active:scale-95"
                                                onClick={(e) => { e.stopPropagation(); handlePaymentApprove(payer.id); }}
                                            >
                                                Pagar
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="px-6 pb-6 pt-4 bg-zinc-50 border-t border-zinc-100 animate-in slide-in-from-top-4 duration-300">
                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Detalle de Participantes:</p>
                                        <div className="space-y-2.5">
                                            {payer.enrolledStudents.map((s: any) => (
                                                <div key={s.id} className="flex items-center justify-between bg-white p-3 rounded-2xl border border-zinc-100 shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <img src={s.photo} className="w-10 h-10 rounded-xl object-cover" />
                                                        <span className="text-xs font-black uppercase text-zinc-800">{s.name}</span>
                                                    </div>
                                                    <span className="text-[8px] font-black px-3 py-1.5 rounded-xl uppercase bg-zinc-50 text-zinc-400">{s.category || 'Kids'}</span>
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
            <div className="space-y-6 px-4 pb-24">
                {/* BRANDING CARD */}
                <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-zinc-100 text-center relative group">
                    <div className="relative inline-block mb-6">
                        <img src={branding?.logo || "/icon.webp"} className="w-32 h-32 rounded-[2rem] object-contain bg-zinc-950 p-6 mx-auto shadow-2xl transition-transform group-hover:scale-105 duration-500" alt="Logo" />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-3 -right-3 bg-white text-zinc-950 p-3 rounded-2xl border-4 border-zinc-50 shadow-xl hover:bg-zinc-950 hover:text-white transition-all transform active:scale-90"
                        >
                            <Camera size={20} />
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-zinc-950 leading-none">{branding?.name || 'Academy'}</h3>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mt-3">Plataforma de Gestión v4.7</p>
                </div>

                {/* PRICING VALUES */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-zinc-100 space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                        <CreditCard size={16} /> Valores Mensualidad
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 bg-zinc-50 p-2 rounded-2xl border border-zinc-100">
                            <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-zinc-300 font-black">$</div>
                            <div className="flex-1">
                                <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-2">Categoría Kids</label>
                                <input
                                    type="number"
                                    className="w-full bg-transparent border-none text-zinc-950 font-black p-1 focus:ring-0 outline-none"
                                    value={prices.kids}
                                    onChange={e => setPrices({ ...prices, kids: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-zinc-50 p-2 rounded-2xl border border-zinc-100">
                            <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-zinc-300 font-black">$</div>
                            <div className="flex-1">
                                <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-2">Categoría Adultos</label>
                                <input
                                    type="number"
                                    className="w-full bg-transparent border-none text-zinc-950 font-black p-1 focus:ring-0 outline-none"
                                    value={prices.adult}
                                    onChange={e => setPrices({ ...prices, adult: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* DISCOUNT RULES */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-zinc-100 space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                        <Zap size={16} /> Reglas de Descuento
                    </h3>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-4 leading-none">Aplicar si cuenta tiene más de X inscritos:</label>
                            <input
                                type="number"
                                className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl px-6 font-black text-zinc-950 focus:ring-2 ring-zinc-950 transition-all outline-none"
                                value={prices.discountThreshold}
                                onChange={e => setPrices({ ...prices, discountThreshold: Number(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-4 leading-none">Porcentaje a descontar (%) del total:</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl px-6 font-black text-zinc-950 focus:ring-2 ring-zinc-950 transition-all outline-none"
                                    value={prices.discountPercentage}
                                    onChange={e => setPrices({ ...prices, discountPercentage: Number(e.target.value) })}
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-300 font-black">%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <button onClick={handleSavePrices} className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-zinc-200 mt-4 active:scale-95 transition-all text-xs uppercase tracking-widest">
                    Guardar Configuración
                </button>

                <button onClick={handleLoadDemo} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-emerald-100 flex items-center justify-between px-8 text-xs group transition-all active:scale-95 mt-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-2 rounded-xl group-hover:rotate-12 transition-transform"><Zap size={20} fill="white" /></div>
                        <span className="uppercase tracking-widest">Activar Datos Demo</span>
                    </div>
                    <ChevronRight size={20} />
                </button>

                <button className="w-full text-rose-500 font-black py-6 rounded-3xl hover:bg-rose-50 uppercase tracking-widest text-[9px] mt-8" onClick={() => { localStorage.clear(); window.location.href = "/"; }}>
                    <LogOut className="inline-block mr-2" size={14} /> Cerrar Sesión Staff
                </button>
            </div>
        );
    };

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center p-12 bg-white text-zinc-950">
            <RefreshCw className="animate-spin mb-6 text-indigo-600" size={32} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Sincronizando Sistema</p>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-white font-sans sm:max-w-lg sm:mx-auto relative overflow-hidden text-zinc-950">

            {/* HEADER DINÁMICO */}
            <header className="bg-white px-8 py-8 flex items-center justify-between sticky top-0 z-50 border-none shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-950 rounded-2xl flex items-center justify-center shadow-xl overflow-hidden shrink-0">
                        {branding?.logo ? (
                            <img src={branding.logo} className="w-full h-full object-contain p-2" alt="L" />
                        ) : (
                            <span className="text-white font-black text-xl uppercase tracking-tighter">{branding?.name?.[0] || 'D'}</span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black uppercase tracking-tighter text-zinc-950 leading-none">{branding?.name || 'Academy'}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{activeTab === 'dashboard' ? 'Resumen' : activeTab === 'attendance' ? 'Tatami' : activeTab === 'payments' ? 'Pagos' : 'Ajustes'}</span>
                            {isDemo && <span className="bg-emerald-500/10 text-emerald-600 text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">DEMO</span>}
                        </div>
                    </div>
                </div>
                <div className="w-10 h-10 bg-zinc-100 rounded-2xl border-2 border-white shadow-xl ring-1 ring-zinc-50 overflow-hidden shrink-0">
                    <img src="/prof.webp" alt="P" className="w-full h-full object-cover" />
                </div>
            </header>

            {/* CONTENIDO CON ANIMACIÓN LATERAL */}
            <main className="flex-1 overflow-y-auto pb-32 hide-scrollbar relative">
                <AnimatePresence initial={false} mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className="w-full"
                    >
                        {activeTab === 'dashboard' && renderDashboard()}
                        {activeTab === 'attendance' && renderAttendance()}
                        {activeTab === 'payments' && renderPayments()}
                        {activeTab === 'settings' && renderSettings()}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* NAV CON ESTILO PREMIUM */}
            <nav className="fixed bottom-0 left-0 right-0 sm:max-w-lg sm:mx-auto bg-white/80 backdrop-blur-xl border-t border-zinc-100 pt-3 pb-8 px-10 flex justify-between items-center h-24 z-50">
                <TabButton icon={LayoutDashboard} label="Inicio" active={activeTab === 'dashboard'} onClick={() => changeTab('dashboard')} />
                <TabButton icon={Users} label="Tatami" active={activeTab === 'attendance'} onClick={() => changeTab('attendance')} />
                <TabButton icon={CreditCard} label="Pagos" active={activeTab === 'payments'} onClick={() => changeTab('payments')} />
                <TabButton icon={Settings} label="Ajustes" active={activeTab === 'settings'} onClick={() => changeTab('settings')} />
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
        <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative ${active ? 'text-zinc-950 scale-110' : 'text-zinc-300 hover:text-zinc-400'}`}>
            <div className={`p-2 rounded-2xl transition-all duration-500 ${active ? 'bg-zinc-50 shadow-inner' : 'bg-transparent'}`}>
                <Icon size={24} strokeWidth={active ? 3 : 2} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">{label}</span>
            {active && <motion.div layoutId="nav-dot" className="absolute -bottom-2 w-1 h-1 bg-zinc-950 rounded-full" />}
        </button>
    );
}
