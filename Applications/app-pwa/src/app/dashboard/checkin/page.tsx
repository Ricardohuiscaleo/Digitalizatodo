"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useBranding } from "@/context/BrandingContext";
import { getEcho } from '@/lib/echo';
import { getProfile, getPayers, getSchedules, getStudents } from "@/lib/api";
import { unlockAudio, playNotificationSound, playDebtorSound } from "@/lib/audio";
import { QRCodeCanvas } from 'qrcode.react';
import { 
    Loader2, QrCode, RefreshCw, User, Check, XCircle, 
    ArrowLeft, ShieldAlert, Monitor, Signal, Clock, Users,
    Wifi
} from 'lucide-react';
import { nowCL } from '@/lib/utils';
import { StudentAvatar } from '@/components/Dashboard/Industries/MartialArts/StudentAvatar';

export default function CheckinPage() {
    const { branding, setBranding } = useBranding();
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [allStudents, setAllStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [qrData, setQrData] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(60);
    const [fetchingQr, setFetchingQr] = useState(false);
    const [detectedStudent, setDetectedStudent] = useState<any>(null);
    const [countdown, setCountdown] = useState(0);
    const [wsConnected, setWsConnected] = useState(false);
    const [now, setNow] = useState(new Date());

    const currentTokenRef = useRef<string | null>(null);

    const [schedules, setSchedules] = useState<any[]>([]);
    const [activeSchedule, setActiveSchedule] = useState<any>(null);
    const [nextSchedule, setNextSchedule] = useState<any>(null);
    const [minsToNext, setMinsToNext] = useState<number | null>(null);

    // Initial Load
    useEffect(() => {
        const init = async () => {
            const storedToken = localStorage.getItem("staff_token") || localStorage.getItem("auth_token");
            const tenantSlug = localStorage.getItem("tenant_slug")?.trim();
            if (!storedToken || !tenantSlug) { window.location.href = "/"; return; }
            setToken(storedToken);

            const [profile, payersData, schedsRes, studentsRes] = await Promise.all([
                getProfile(tenantSlug, storedToken),
                getPayers(tenantSlug, storedToken, { month: nowCL().getMonth() + 1, year: nowCL().getFullYear() }),
                getSchedules(tenantSlug, storedToken),
                getStudents(tenantSlug, storedToken)
            ]);

            if (profile) {
                setUser(profile);
                if (profile.tenant) {
                    setBranding({
                        id: String(profile.tenant.id),
                        slug: profile.tenant.slug,
                        name: profile.tenant.name,
                        industry: profile.tenant.industry,
                        logo: profile.tenant.logo,
                        primaryColor: profile.tenant.primary_color
                    });
                }
            }

            // Integración de Alumnos: Priorizar getStudents y enriquecer con payerStatus
            if (studentsRes?.students) {
                const students = studentsRes.students.map((s: any) => {
                    const payer = payersData?.payers?.find((p: any) => 
                        (p.enrolledStudents || p.students || []).some((es: any) => String(es.id) === String(s.id))
                    );
                    return {
                        ...s,
                        payerStatus: payer?.status || 'unknown',
                        payerId: payer?.id
                    };
                });
                setAllStudents(students);
            } else if (payersData?.payers) {
                // Fallback si getStudents falla
                const students = payersData.payers.flatMap((p: any) => {
                    const sList = p.enrolledStudents || p.students || [];
                    return sList.map((s: any) => ({
                        ...s,
                        payerStatus: p.status,
                        payerId: p.id,
                        total_due: p.total_due || 0
                    }));
                });
                setAllStudents(students);
            }

            if (schedsRes?.schedules) {
                setSchedules(schedsRes.schedules);
            }

            setLoading(false);
        };
        init();
        
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    // Unlock audio on first interaction
    useEffect(() => {
        const unlock = () => unlockAudio();
        document.addEventListener('click', unlock, { once: true });
        return () => document.removeEventListener('click', unlock);
    }, []);

    const fetchToken = useCallback(async () => {
        if (!branding?.slug || !token || detectedStudent) return;
        try {
            setFetchingQr(true);
            const API = process.env.NEXT_PUBLIC_API_URL || "https://admin.digitalizatodo.cl/api";
            const res = await fetch(`${API}/${branding.slug}/attendance/qr-token`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) return;
            const data = await res.json();
            if (data.token) {
                setQrData(data.token);
                currentTokenRef.current = data.token;
                setTimeLeft(data.expires_in || 60);
            }
        } catch (error) {
            console.error("Error fetching QR token:", error);
        } finally {
            setFetchingQr(false);
        }
    }, [branding?.slug, token, detectedStudent]);

    useEffect(() => {
        if (!loading) fetchToken();
    }, [loading, fetchToken]);

    useEffect(() => {
        if (!qrData || detectedStudent) return;
        if (timeLeft <= 0) {
            fetchToken();
            return;
        }
        const t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearTimeout(t);
    }, [timeLeft, qrData, fetchToken, detectedStudent]);

    // Active & Next Schedule Logic
    useEffect(() => {
        if (schedules.length === 0) return;
        const findSchedules = () => {
            const now = nowCL();
            const dow = now.getDay(); // 0-6
            const curH = now.getHours();
            const curM = now.getMinutes();
            const curTime = curH.toString().padStart(2, '0') + ':' + curM.toString().padStart(2, '0');
            const totalMins = curH * 60 + curM;
            
            // Current Active
            const active = schedules.find(s => 
                s.day_of_week === dow && 
                curTime >= s.start_time.slice(0, 5) && 
                curTime <= s.end_time.slice(0, 5)
            );
            setActiveSchedule(active || null);

            // Find Next
            const upcoming = schedules
                .filter(s => s.day_of_week === dow && s.start_time.slice(0, 5) > curTime)
                .sort((a, b) => a.start_time.localeCompare(b.start_time))[0];
            
            if (upcoming) {
                setNextSchedule(upcoming);
                const [h, m] = upcoming.start_time.split(':').map(Number);
                const startMins = h * 60 + m;
                setMinsToNext(startMins - totalMins);
            } else {
                setNextSchedule(null);
                setMinsToNext(null);
            }
        };
        findSchedules();
        const t = setInterval(findSchedules, 60000); // Check every minute
        return () => clearInterval(t);
    }, [schedules]);

    // WebSocket logic
    useEffect(() => {
        if (!branding?.slug) return;
        const echo = getEcho();
        if (!echo) return;

        const channel = echo.channel(`attendance.${branding.slug}`);
        
        channel.listen('.student.checked-in', (data: any) => {
            handleCheckin(data);
        });

        // Monitor connection
        const pusher = (echo.connector as any)?.pusher;
        if (pusher) {
            setWsConnected(pusher.connection.state === 'connected');
            pusher.connection.bind('state_change', (states: any) => {
                setWsConnected(states.current === 'connected');
            });
        }

        return () => {
            echo.leave(`attendance.${branding.slug}`);
        };
    }, [branding?.slug, allStudents]);

    const handleCheckin = (data: any) => {
        // Find student in our local list to get all metadata (belt, modality, payments, etc.)
        const studentInfo = allStudents.find(s => String(s.id) === String(data.studentId));
        
        const normalized = {
            ...studentInfo, // Spreading all local data first
            ...data,        // WS data overrides (like timestamp)
            name: data.studentName || studentInfo?.name || 'Atleta',
            photo: data.studentPhoto || studentInfo?.photo || null,
            payerStatus: studentInfo?.payerStatus || 'pending',
            total_due: studentInfo?.total_due || 0,
            // Normalize modality for the label lookup (e.g. "AMBAS" -> "both")
            modality: (data.modality || studentInfo?.modality || 'gi').toLowerCase()
        };

        // Standardize "ambas" or "both"
        if (normalized.modality === 'ambas') normalized.modality = 'both';

        setDetectedStudent(normalized);
        setCountdown(8);

        if (normalized.payerStatus === 'pending') {
            playDebtorSound();
        } else {
            playNotificationSound();
        }
    };

    // Auto-reset display
    useEffect(() => {
        if (!detectedStudent || countdown <= 0) return;
        const t = setTimeout(() => {
            if (countdown === 1) {
                setDetectedStudent(null);
                fetchToken();
            } else {
                setCountdown(prev => prev - 1);
            }
        }, 1000);
        return () => clearTimeout(t);
    }, [detectedStudent, countdown, fetchToken]);

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-500">
                <Loader2 className="animate-spin mb-4" size={48} />
                <p className="text-[10px] uppercase font-black tracking-[0.4em]">Iniciando Terminal de Punto de Marcación...</p>
            </div>
        );
    }

    const isDebtor = detectedStudent?.payerStatus === 'pending';
    const primaryColor = branding?.primaryColor || '#6366f1';

    const BELT_LABELS: Record<string, string> = { white: 'Blanco', blue: 'Azul', purple: 'Morado', brown: 'Café', black: 'Negro' };
    const MODALITY_LABELS: Record<string, string> = { gi: 'Gi', nogi: 'No-Gi', both: 'Ambos' };
    const CATEGORY_LABELS: Record<string, string> = { adults: 'Adulto', kids: 'Infantil' };

    const getBeltStyles = (belt: string) => {
        const styles: Record<string, { bg: string, text: string, bar: string }> = {
            white: { bg: 'bg-white', text: 'text-zinc-900', bar: 'bg-black' },
            blue: { bg: 'bg-blue-600', text: 'text-white', bar: 'bg-black' },
            purple: { bg: 'bg-purple-700', text: 'text-white', bar: 'bg-black' },
            brown: { bg: 'bg-amber-900', text: 'text-white', bar: 'bg-black' },
            black: { bg: 'bg-zinc-950', text: 'text-white', bar: 'bg-red-600' }
        };
        return styles[belt] || styles.white;
    };

    return (
        <div className={`min-h-screen transition-colors duration-700 overflow-hidden flex flex-col ${
            detectedStudent ? (isDebtor ? 'bg-rose-600' : 'bg-emerald-600') : 'bg-[#09090b]'
        }`}>
            {/* Mobile / Small Screen Block Overlay */}
            <div className="lg:hidden fixed inset-0 z-[1000] bg-zinc-950 flex flex-col items-center justify-center p-10 text-center">
                <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-8 animate-pulse">
                    <Monitor size={40} />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Terminal Exclusiva</h2>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] leading-relaxed max-w-xs">
                    El "Punto de Marcación V2.0" está diseñado exclusivamente para monitores de alta resolución en la entrada del dojo.
                </p>
                <button 
                    onClick={() => window.location.href = '/dashboard'}
                    className="mt-10 px-8 py-3 bg-zinc-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-zinc-700"
                >
                    Volver al Dashboard
                </button>
            </div>

            {/* Header / StatusBar */}
            <div className={`flex items-center justify-between px-10 py-6 border-b transition-colors ${
                detectedStudent ? 'border-white/10 bg-black/10' : 'border-zinc-800 bg-zinc-900/10'
            }`}>
                <div className="flex items-center gap-6">
                    <button onClick={() => window.location.href = '/dashboard'} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/10 p-1">
                            <img src={branding?.logo || "/icon.webp"} className="w-full h-full object-cover rounded-xl" alt="" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white uppercase tracking-tighter leading-none">{branding?.name}</h1>
                            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                <Monitor size={12} /> Terminal Punto de Marcación v2.0
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="text-right">
                        <p className="text-3xl font-black text-white tabular-nums tracking-tighter leading-none">
                            {now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">
                            {now.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                        wsConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    }`}>
                        <Wifi size={16} className={wsConnected ? "" : "animate-pulse"} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{wsConnected ? 'Conectado' : 'Sin Conexión'}</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex items-center justify-center p-10">
                {detectedStudent ? (
                    <div className="w-full max-w-7xl animate-in zoom-in-95 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            {/* Left: Huge Profile Photo */}
                            <div className="flex flex-col items-center">
                                <div className="relative inline-block scale-110">
                                    <StudentAvatar 
                                        photo={detectedStudent.photo}
                                        name={detectedStudent.name}
                                        size={480}
                                        beltRank={detectedStudent.belt_rank}
                                        degrees={detectedStudent.degrees}
                                        classesCount={(detectedStudent.previous_classes || 0) + Math.max(0, (detectedStudent.total_attendances || 0) - (detectedStudent.previous_classes || 0))}
                                        payerStatus={detectedStudent.payerStatus}
                                        showPayerDot={false}
                                        isDark={true}
                                    />
                                    
                                    <div className={`absolute -right-4 -bottom-4 w-32 h-32 rounded-full flex items-center justify-center shadow-2xl border-[10px] z-20 transition-colors ${
                                        isDebtor ? 'bg-white text-rose-600 border-rose-600' : 'bg-white text-emerald-600 border-emerald-600'
                                    }`}>
                                        {isDebtor ? <ShieldAlert size={64} /> : <Check size={64} />}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Detailed Info */}
                            <div className="space-y-10 text-white">
                                <div className="space-y-2">
                                    <p className="text-xl font-black uppercase tracking-[0.3em] opacity-60">
                                        {isDebtor ? 'Estado: Pago Pendiente' : 'Ingreso Autorizado'}
                                    </p>
                                    <h2 className="text-8xl font-black tracking-tighter uppercase leading-none break-words">
                                        {detectedStudent.name}
                                    </h2>
                                </div>

                                {/* Belt Info */}
                                <div className="flex items-center gap-8">
                                    {detectedStudent.belt_rank && (
                                        <div className="flex flex-col gap-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Cinturón Actual</p>
                                            <div className={`flex h-16 w-64 rounded-xl overflow-hidden border-2 border-white/20 ${getBeltStyles(detectedStudent.belt_rank).bg}`}>
                                                <div className="flex-1 flex flex-col justify-center px-4">
                                                    <span className={`text-lg font-black uppercase tracking-tighter ${getBeltStyles(detectedStudent.belt_rank).text}`}>
                                                        {BELT_LABELS[detectedStudent.belt_rank]}
                                                    </span>
                                                </div>
                                                <div className={`w-16 flex items-center justify-center relative ${getBeltStyles(detectedStudent.belt_rank).bar}`}>
                                                    {/* Degrees/Stripes */}
                                                    <div className="flex flex-col gap-1 justify-center h-full py-2">
                                                        {[...Array(detectedStudent.degrees || 0)].map((_, i) => (
                                                            <div key={i} className="w-10 h-1.5 bg-white rounded-sm shadow-sm" />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Modalidad</p>
                                        <div className="h-16 px-6 bg-white/10 border-2 border-white/20 rounded-xl flex items-center justify-center">
                                            <span className="text-2xl font-black uppercase tracking-tighter">
                                                {MODALITY_LABELS[detectedStudent.modality] || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    <div className="bg-white/10 border border-white/10 p-6 rounded-3xl">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Clases Realizadas</p>
                                        <p className="text-4xl font-black tabular-nums">
                                            {(detectedStudent.previous_classes || 0) + Math.max(0, (detectedStudent.total_attendances || 0) - (detectedStudent.previous_classes || 0))}
                                        </p>
                                    </div>
                                    <div className="bg-white/10 border border-white/10 p-6 rounded-3xl">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Membresía</p>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${isDebtor ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                                            <p className={`text-2xl font-black uppercase tracking-tighter ${isDebtor ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                {isDebtor ? 'Deudor' : 'Vigente'}
                                            </p>
                                        </div>
                                        {isDebtor && detectedStudent.total_due > 0 && (
                                            <p className="text-[10px] font-black text-rose-300/60 uppercase tracking-widest mt-1">
                                                Deuda: ${detectedStudent.total_due.toLocaleString('es-CL')}
                                            </p>
                                        )}
                                    </div>
                                    <div className="bg-white/10 border border-white/10 p-6 rounded-3xl">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Categoría</p>
                                        <p className="text-3xl font-black uppercase tracking-tighter">
                                            {CATEGORY_LABELS[detectedStudent.category] || 'Adulto'}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <p className="text-white/40 text-[11px] font-black uppercase tracking-[0.4em]">Siguiente en {countdown} segundos</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center w-full max-w-7xl">
                        {/* Left Side: Active/Next Schedule & Enrolled Students */}
                        <div className="space-y-10">
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    {activeSchedule ? (
                                        <div className="px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Clase en Curso
                                        </div>
                                    ) : nextSchedule ? (
                                        <div className="px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                                            <Clock size={16} className="animate-pulse" />
                                            PRÓXIMA CLASE EN {minsToNext} MIN
                                        </div>
                                    ) : (
                                        <div className="px-4 py-2 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-zinc-500 text-xs font-black uppercase tracking-widest flex items-center gap-3">
                                            <ShieldAlert size={16} />
                                            FUERA DE HORARIO
                                        </div>
                                    )}
                                </div>
                                <h1 className="text-xl font-black text-white/40 uppercase tracking-[0.3em] mb-3">
                                    {activeSchedule ? 'BIENVENIDOS A' : 'PREPARÁNDOSE PARA'}
                                </h1>
                                <h2 className="text-8xl font-black text-white tracking-tighter leading-[0.9] uppercase break-words">
                                    {activeSchedule?.name || nextSchedule?.name || 'Punto de Marcación'}
                                </h2>
                                <p className="text-2xl font-black text-zinc-500 uppercase tracking-[0.2em] mt-8 flex items-center gap-4">
                                    {activeSchedule 
                                        ? <>
                                            <Clock size={24} className="text-emerald-500" />
                                            {activeSchedule.start_time.slice(0, 5)} — {activeSchedule.end_time.slice(0, 5)}
                                          </>
                                        : nextSchedule 
                                            ? <>
                                                <Clock size={24} className="text-amber-500" />
                                                INICIA A LAS {nextSchedule.start_time.slice(0, 5)}
                                              </>
                                            : 'Abre tu app para marcar ingreso al dojo'}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] flex items-center gap-2">
                                    <Users size={12} /> PARTICIPANTES PROGRAMADOS
                                </h3>
                                <div className="grid grid-cols-5 gap-y-8 gap-x-2">
                                {(() => {
                                    const sched = activeSchedule || nextSchedule;
                                    let displayList = sched?.students || sched?.enrolled_students || [];
                                    
                                    // Fallback: If list is empty, filter participants by class category
                                    if (displayList.length === 0 && sched && allStudents.length > 0) {
                                        const scheduleCat = (sched as any).category?.toLowerCase() || '';
                                        const nameLower = (sched as any).name?.toLowerCase() || '';
                                        
                                        if (scheduleCat.includes('kids') || nameLower.includes('kids') || nameLower.includes('infantil')) {
                                            displayList = allStudents.filter(s => {
                                                const sCat = s.category?.toLowerCase() || '';
                                                return sCat.includes('kids') || sCat.includes('infantil');
                                            });
                                        } else {
                                            // Assume Adult/Iniciantes/General
                                            displayList = allStudents.filter(s => {
                                                const sCat = s.category?.toLowerCase() || '';
                                                return sCat.includes('adult') || sCat.includes('adulto') || !sCat;
                                            });
                                        }
                                    }

                                    return displayList.slice(0, 16).map((student: any) => {
                                        const fullInfo = allStudents.find(s => String(s.id) === String(student.id)) || student;
                                        const isDebtor = fullInfo.payerStatus === 'pending';
                                        
                                        return (
                                            <div key={student.id} className="flex flex-col items-center">
                                                <StudentAvatar 
                                                    photo={fullInfo.photo}
                                                    name={fullInfo.name}
                                                    size={96}
                                                    beltRank={fullInfo.belt_rank}
                                                    degrees={fullInfo.degrees}
                                                    modality={fullInfo.modality}
                                                    classesCount={(fullInfo.previous_classes || 0) + Math.max(0, (fullInfo.total_attendances || 0) - (fullInfo.previous_classes || 0))}
                                                    payerStatus={fullInfo.payerStatus}
                                                    showPayerDot={true}
                                                    isDark={true}
                                                />
                                                <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center line-clamp-1 max-w-[100px]">
                                                    {fullInfo.name.split(' ')[0]}
                                                </p>
                                            </div>
                                        );
                                    });
                                })()}

                                {!((activeSchedule || nextSchedule) && allStudents.length > 0) && (
                                    [...Array(8)].map((_, i) => (
                                        <div key={i} className="aspect-square rounded-[2rem] border-2 border-zinc-900 border-dashed flex items-center justify-center opacity-20">
                                            <User size={24} className="text-zinc-600" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side: QR Container */}
                        <div className="flex flex-col items-center">
                            <div className="relative p-12 bg-white rounded-[4rem] shadow-[0_0_100px_rgba(255,255,255,0.05)] border-[16px] border-zinc-900 relative overflow-hidden group">
                                {qrData ? (
                                    <div className="relative z-10 p-2">
                                        <QRCodeCanvas value={qrData} size={380} level="H" includeMargin={false} fgColor={primaryColor} />
                                    </div>
                                ) : (
                                    <div className="w-[380px] h-[380px] flex flex-col items-center justify-center gap-4 text-zinc-300">
                                        <Loader2 className="animate-spin" size={48} />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Generando Código...</p>
                                    </div>
                                )}
                                
                                {/* Overlay scan animation */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent h-full w-full pointer-events-none line-scan-animation z-20" />
                                
                                {/* Status overlay */}
                                {!qrData && !fetchingQr && (
                                    <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-10 text-center">
                                        <XCircle size={64} className="text-rose-500 mb-4" />
                                        <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">Error de Conexión</h3>
                                        <p className="text-zinc-500 font-bold uppercase text-xs mt-2">No se pudo generar el código dinámico</p>
                                        <button onClick={() => fetchToken()} className="mt-6 px-8 py-3 bg-zinc-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Reintentar</button>
                                    </div>
                                )}
                            </div>

                            <div className="mt-12 w-full max-w-md space-y-4">
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-zinc-500 px-2">
                                    <span className="flex items-center gap-2">
                                        <Signal size={14} className={fetchingQr ? "animate-pulse" : ""} /> 
                                        Código de Seguridad
                                    </span>
                                    <span className={timeLeft <= 10 ? "text-rose-500 font-black animate-pulse" : "text-zinc-400"}>
                                        Actualizando en {timeLeft}s
                                    </span>
                                </div>
                                <div className="h-3 w-full bg-zinc-950 rounded-full border border-zinc-800 p-0.5">
                                    <div 
                                        className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                                            timeLeft <= 10 ? 'bg-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                                        }`}
                                        style={{ width: `${(timeLeft / 60) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-12 py-10 bg-zinc-950/50 border-t border-zinc-900 flex justify-between items-center">
                <div className="flex items-center gap-10">
                    <img src="/DLogo-v2.webp" className="h-8 opacity-20 grayscale" alt="Digitalizatodo" />
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] leading-relaxed">
                        DIGITALIZATODO CORE v5.1 • SISTEMA DE CONTROL DE ASISTENCIA BIOMÉTRICA DIGITAL
                        <br />© 2026 DIGITALIZATODO • TODOS LOS DERECHOS RESERVADOS
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Sistema Operativo</span>
                </div>
            </div>

            <style jsx>{`
                @keyframes scanLine {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
                .line-scan-animation {
                    animation: scanLine 4s linear infinite;
                    border-top: 4px solid rgba(99, 102, 241, 0.3);
                    box-shadow: 0 -20px 40px -10px rgba(99, 102, 241, 0.2);
                }
            `}</style>
        </div>
    );
}
