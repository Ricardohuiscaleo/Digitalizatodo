"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useBranding } from "@/context/BrandingContext";
import { getEcho } from '@/lib/echo';
import { getProfile, getPayers, getSchedules, getStudents, getAttendanceHistory } from "@/lib/api";
import { unlockAudio, playNotificationSound, playDebtorSound } from "@/lib/audio";
import { QRCodeCanvas } from 'qrcode.react';
import { 
    Loader2, RefreshCw, User, Check, XCircle, 
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
    const [timeToNextFormatted, setTimeToNextFormatted] = useState<string | null>(null);
    const [checkedInIds, setCheckedInIds] = useState<Set<string>>(new Set());

    // Initial Load
    useEffect(() => {
        const init = async () => {
            const storedToken = localStorage.getItem("staff_token") || localStorage.getItem("auth_token");
            const tenantSlug = localStorage.getItem("tenant_slug")?.trim();
            if (!storedToken || !tenantSlug) { window.location.href = "/"; return; }
            setToken(storedToken);

            const today = nowCL().toISOString().split('T')[0];

            const [profile, payersData, schedsRes, studentsRes, attendanceRes] = await Promise.all([
                getProfile(tenantSlug, storedToken),
                getPayers(tenantSlug, storedToken, { month: nowCL().getMonth() + 1, year: nowCL().getFullYear() }),
                getSchedules(tenantSlug, storedToken),
                getStudents(tenantSlug, storedToken),
                getAttendanceHistory(tenantSlug, storedToken, undefined, today)
            ]);

            if (attendanceRes?.attendance) {
                const ids = new Set(attendanceRes.attendance.map((a: any) => String(a.student_id)));
                setCheckedInIds(ids as Set<string>);
            }

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

    // Active & Next Schedule Logic
    useEffect(() => {
        if (schedules.length === 0) return;
        const findSchedules = () => {
            const now = nowCL();
            const dow = now.getDay(); 
            const curH = now.getHours();
            const curM = now.getMinutes();
            const curTime = curH.toString().padStart(2, '0') + ':' + curM.toString().padStart(2, '0');
            
            // 1. Current Active
            const active = schedules.find(s => 
                s.day_of_week === dow && 
                curTime >= s.start_time.slice(0, 5) && 
                curTime <= s.end_time.slice(0, 5)
            );
            setActiveSchedule(active || null);

            // 2. Find Next
            let foundNext: any = null;
            let diffMs = 0;

            const todayUpcoming = schedules
                .filter(s => s.day_of_week === dow && s.start_time.slice(0, 5) > curTime)
                .sort((a, b) => a.start_time.localeCompare(b.start_time))[0];

            if (todayUpcoming) {
                foundNext = todayUpcoming;
                const [h, m] = todayUpcoming.start_time.split(':').map(Number);
                const startToday = new Date(now);
                startToday.setHours(h, m, 0, 0);
                diffMs = startToday.getTime() - now.getTime();
            } else {
                for (let i = 1; i <= 6; i++) {
                    const nextDay = (dow + i) % 7;
                    const dayMatch = schedules
                        .filter(s => s.day_of_week === nextDay)
                        .sort((a, b) => a.start_time.localeCompare(b.start_time))[0];
                    if (dayMatch) {
                        foundNext = dayMatch;
                        const targetDate = new Date(now);
                        targetDate.setDate(now.getDate() + i);
                        const [h, m] = dayMatch.start_time.split(':').map(Number);
                        targetDate.setHours(h, m, 0, 0);
                        diffMs = targetDate.getTime() - now.getTime();
                        break;
                    }
                }
            }

            if (foundNext) {
                setNextSchedule(foundNext);
                const totalMins = Math.floor(diffMs / 60000);
                setMinsToNext(totalMins);
                if (totalMins < 60) setTimeToNextFormatted(`${totalMins} MIN`);
                else if (totalMins < 1440) {
                    const h = Math.floor(totalMins / 60);
                    const m = totalMins % 60;
                    setTimeToNextFormatted(`${h}H ${m > 0 ? m + 'M' : ''}`);
                } else {
                    const d = Math.floor(totalMins / 1440);
                    const h = Math.floor((totalMins % 1440) / 60);
                    setTimeToNextFormatted(`${d} ${d === 1 ? 'DÍA' : 'DÍAS'}${h > 0 ? ' y ' + h + 'H' : ''}`);
                }
            } else {
                setNextSchedule(null);
                setMinsToNext(null);
                setTimeToNextFormatted(null);
            }
        };
        findSchedules();
        const t = setInterval(findSchedules, 30000);
        return () => clearInterval(t);
    }, [schedules]);

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

    useEffect(() => { if (!loading) fetchToken(); }, [loading, fetchToken]);

    useEffect(() => {
        if (!qrData || detectedStudent) return;
        if (timeLeft <= 0) { fetchToken(); return; }
        const t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearTimeout(t);
    }, [timeLeft, qrData, fetchToken, detectedStudent]);

    useEffect(() => {
        if (!branding?.slug) return;
        const echo = getEcho();
        if (!echo) return;
        const channel = echo.channel(`attendance.${branding.slug}`);
        channel.listen('.student.checked-in', (data: any) => {
            handleCheckin(data);
        });
        const pusher = (echo.connector as any)?.pusher;
        if (pusher) {
            setWsConnected(pusher.connection.state === 'connected');
            pusher.connection.bind('state_change', (states: any) => {
                setWsConnected(states.current === 'connected');
            });
        }
        return () => { echo.leave(`attendance.${branding.slug}`); };
    }, [branding?.slug, allStudents]);

    const handleCheckin = (data: any) => {
        const studentInfo = allStudents.find(s => String(s.id) === String(data.studentId));
        const normalized = {
            ...studentInfo,
            ...data,
            name: data.studentName || studentInfo?.name || 'Atleta',
            photo: data.studentPhoto || studentInfo?.photo || null,
            payerStatus: studentInfo?.payerStatus || 'pending',
            total_due: studentInfo?.total_due || 0,
            modality: (data.modality || studentInfo?.modality || 'gi').toLowerCase()
        };
        if (normalized.modality === 'ambas') normalized.modality = 'both';
        
        setCheckedInIds(prev => new Set([...Array.from(prev), String(data.studentId)]));

        setDetectedStudent(normalized);
        setCountdown(8);
        if (normalized.payerStatus === 'pending') playDebtorSound();
        else playNotificationSound();
    };

    useEffect(() => {
        if (!detectedStudent || countdown <= 0) return;
        const t = setTimeout(() => {
            if (countdown === 1) {
                setDetectedStudent(null);
                fetchToken();
            } else setCountdown(prev => prev - 1);
        }, 1000);
        return () => clearTimeout(t);
    }, [detectedStudent, countdown, fetchToken]);

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-500">
                <Loader2 className="animate-spin mb-4" size={48} />
                <p className="text-[10px] uppercase font-black tracking-[0.4em]">Iniciando Terminal...</p>
            </div>
        );
    }

    const isDebtor = detectedStudent?.payerStatus === 'pending';
    const primaryColor = branding?.primaryColor || '#6366f1';
    const BELT_LABELS: Record<string, string> = { white: 'Blanco', blue: 'Azul', purple: 'Morado', brown: 'Café', black: 'Negro' };
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
            {/* Header */}
            <div className={`flex items-center justify-between px-10 py-6 border-b transition-colors ${
                detectedStudent ? 'border-white/10 bg-black/10' : 'border-zinc-800 bg-zinc-900/10'
            }`}>
                <div className="flex items-center gap-6">
                    <button onClick={() => window.location.href = '/dashboard'} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/10 p-1">
                            <img src={branding?.logo || "/icon.webp"} className="w-full h-full object-cover rounded-xl" alt="" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white uppercase tracking-tighter leading-none">{branding?.name}</h1>
                            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                <Monitor size={12} /> Terminal Punto de Marcación
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="text-right">
                        <p className="text-3xl font-black text-white tabular-nums tracking-tighter leading-none">
                            {now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <div className="flex items-center gap-2 mt-1 justify-end">
                            <Users size={12} className="text-emerald-500" />
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">
                                {checkedInIds.size} MARCADOS
                            </p>
                        </div>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                        wsConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    }`}>
                        <Wifi size={16} className={wsConnected ? "" : "animate-pulse"} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{wsConnected ? 'Conectado' : 'Sin Conexión'}</span>
                    </div>
                </div>
            </div>

            {/* Main */}
            <div className="flex-1 flex items-center justify-center p-10">
                {detectedStudent ? (
                    <div className="w-full max-w-7xl animate-in zoom-in-95 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
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
                            <div className="space-y-10 text-white">
                                <div className="space-y-2">
                                    <p className="text-xl font-black uppercase tracking-[0.3em] opacity-60">
                                        {isDebtor ? 'Estado: Pago Pendiente' : 'Ingreso Autorizado'}
                                    </p>
                                    <h2 className="text-8xl font-black tracking-tighter uppercase leading-none break-words">
                                        {detectedStudent.name}
                                    </h2>
                                </div>
                                <div className="flex items-center gap-8">
                                    {detectedStudent.belt_rank && (
                                        <div className="flex flex-col gap-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Cinturón</p>
                                            <div className={`flex h-16 w-64 rounded-xl overflow-hidden border-2 border-white/20 ${getBeltStyles(detectedStudent.belt_rank).bg}`}>
                                                <div className="flex-1 flex flex-col justify-center px-4">
                                                    <span className={`text-lg font-black uppercase tracking-tighter ${getBeltStyles(detectedStudent.belt_rank).text}`}>
                                                        {BELT_LABELS[detectedStudent.belt_rank]}
                                                    </span>
                                                </div>
                                                <div className={`w-16 flex items-center justify-center relative ${getBeltStyles(detectedStudent.belt_rank).bar}`}>
                                                    <div className="flex flex-col gap-1 justify-center h-full py-2">
                                                        {[...Array(detectedStudent.degrees || 0)].map((_, i) => (
                                                            <div key={i} className="w-10 h-1.5 bg-white rounded-sm shadow-sm" />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="bg-white/10 border border-white/10 p-6 rounded-3xl">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Clases</p>
                                        <p className="text-4xl font-black">
                                            {(detectedStudent.previous_classes || 0) + Math.max(0, (detectedStudent.total_attendances || 0) - (detectedStudent.previous_classes || 0))}
                                        </p>
                                    </div>
                                    <div className="bg-white/10 border border-white/10 p-6 rounded-3xl">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Membresía</p>
                                        <p className={`text-2xl font-black uppercase ${isDebtor ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            {isDebtor ? 'Deudor' : 'Vigente'}
                                        </p>
                                    </div>
                                    <div className="bg-white/10 border border-white/10 p-6 rounded-3xl">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Categoría</p>
                                        <p className="text-3xl font-black uppercase">
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
                    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] gap-12 items-center w-full max-w-[1400px]">
                        <div className="space-y-10">
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    {activeSchedule ? (
                                        <div className="px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Clase en Curso
                                        </div>
                                    ) : (
                                        <div className="px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-widest flex items-center gap-3">
                                            <Clock size={16} className="animate-pulse" />
                                            PRÓXIMA CLASE EN {timeToNextFormatted}
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
                                        ? <>{activeSchedule.start_time.slice(0, 5)} — {activeSchedule.end_time.slice(0, 5)}</>
                                        : nextSchedule 
                                            ? <>{['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'][nextSchedule.day_of_week]} A LAS {nextSchedule.start_time.slice(0, 5)}</>
                                            : 'Abre tu app para marcar ingreso'}
                                </p>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] flex items-center gap-2">
                                    <Users size={12} /> {activeSchedule ? 'PARTICIPANTES EN CLASE' : 'PARTICIPANTES PROGRAMADOS'} — {checkedInIds.size} PRESENTES
                                </h3>
                                {(() => {
                                    const sched = activeSchedule || nextSchedule;
                                    let displayList = sched?.students || sched?.enrolled_students || [];
                                    if (displayList.length === 0 && sched && allStudents.length > 0) {
                                        const scheduleCat = (sched as any).category?.toLowerCase() || '';
                                        const nameLower = (sched as any).name?.toLowerCase() || '';
                                        if (scheduleCat.includes('kids') || nameLower.includes('kids')) {
                                            displayList = allStudents.filter(s => (s.category || '').toLowerCase().includes('kids'));
                                        } else {
                                            displayList = allStudents.filter(s => !(s.category || '').toLowerCase().includes('kids'));
                                        }
                                    }
                                    const avatarSize = displayList.length > 20 ? 48 : 72;
                                    const nameSizeClass = displayList.length > 20 ? 'text-[7px]' : 'text-[10px]';
                                    const gapClass = displayList.length > 20 ? 'gap-x-4 gap-y-12' : 'gap-x-8 gap-y-14';

                                    return (
                                        <div className={`grid grid-cols-10 ${gapClass}`}>
                                            {displayList.slice(0, 50).map((student: any) => {
                                                const fullInfo = allStudents.find(s => String(s.id) === String(student.id)) || student;
                                                const isCheckedIn = checkedInIds.has(String(fullInfo.id));
                                                return (
                                                    <div key={student.id} className="flex flex-col items-center">
                                                        <StudentAvatar 
                                                            photo={fullInfo.photo}
                                                            name={fullInfo.name}
                                                            size={avatarSize}
                                                            beltRank={fullInfo.belt_rank}
                                                            degrees={fullInfo.degrees}
                                                            classesCount={(fullInfo.previous_classes || 0) + Math.max(0, (fullInfo.total_attendances || 0) - (fullInfo.previous_classes || 0))}
                                                            payerStatus={fullInfo.payerStatus}
                                                            showPayerDot={true}
                                                            isDark={true}
                                                            checkedIn={isCheckedIn}
                                                        />
                                                        <p 
                                                            className={`mt-3 ${nameSizeClass} font-black uppercase tracking-tighter text-center line-clamp-1 ${isCheckedIn ? 'text-emerald-400 font-black' : 'text-zinc-600'}`}
                                                            style={{ maxWidth: avatarSize + 10 }}
                                                        >
                                                            {fullInfo.name.split(' ')[0]}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="relative p-12 bg-white rounded-[4rem] border-[16px] border-zinc-900 overflow-hidden">
                                {qrData ? (
                                    <div className="relative z-10 p-2">
                                        <QRCodeCanvas value={qrData} size={380} level="H" fgColor={primaryColor} />
                                    </div>
                                ) : (
                                    <div className="w-[380px] h-[380px] flex flex-col items-center justify-center gap-4 text-zinc-300">
                                        <Loader2 className="animate-spin" size={48} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent h-full w-full pointer-events-none line-scan-animation z-20" />
                            </div>
                            <div className="mt-8 w-full max-w-sm">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 px-1">
                                    <span>Seguridad</span>
                                    <span>{timeLeft}s</span>
                                </div>
                                <div className="h-2 w-full bg-zinc-950 rounded-full border border-zinc-800">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(timeLeft / 60) * 100}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="px-12 py-10 border-t border-zinc-900 flex justify-between items-center bg-black/20">
                <img src="/DLogo-v2.webp" className="h-6 opacity-20 grayscale" alt="" />
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Digitalizatodo Core v5.1</span>
                </div>
            </div>

            <style jsx>{`
                @keyframes scanLine { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
                .line-scan-animation { animation: scanLine 4s linear infinite; border-top: 2px solid rgba(99, 102, 241, 0.4); }
            `}</style>
        </div>
    );
}
