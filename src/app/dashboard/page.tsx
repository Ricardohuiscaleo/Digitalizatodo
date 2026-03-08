"use client";

import { useEffect, useState } from "react";
import { useBranding } from "@/context/BrandingContext";
import { getProfile, getStudents, storeAttendance } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { getAttendanceQR } from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, RefreshCw, UserCheck, Users, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

function QRGenerator({ tenantId, token, primaryColor }: { tenantId: string, token: string, primaryColor?: string }) {
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
        <div className="p-6 bg-white/[0.03] border border-white/10 rounded-[2.5rem] space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
                        <QrCode className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white tracking-tight">QR de Asistencia</h3>
                        <p className="text-[10px] text-gray-500 font-medium">Genera un código para el ingreso</p>
                    </div>
                </div>
                {!qrData && !loading && (
                    <button
                        onClick={generateQR}
                        className="h-10 px-4 bg-emerald-500 text-black text-xs font-black uppercase rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                        Generar
                    </button>
                )}
            </div>

            {loading && (
                <div className="h-48 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
            )}

            {qrData && (
                <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                    <div className="p-4 bg-white rounded-3xl shadow-2xl">
                        <QRCodeSVG value={qrData} size={160} />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Código Válido por {expires}s</p>
                        <button
                            onClick={generateQR}
                            className="text-[10px] text-gray-600 hover:text-white transition-colors underline"
                        >
                            Regenerar ahora
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AcademyDashboardPage() {
    const { branding, setBranding } = useBranding();
    const [user, setUser] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [markingId, setMarkingId] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);
    const [activeTab, setActiveTab] = useState('attendance');

    useEffect(() => {
        const token = localStorage.getItem("staff_token") || localStorage.getItem("student_token");
        const tenantId = localStorage.getItem("tenant_id");

        if (!token || !tenantId) {
            window.location.href = "/";
            return;
        }

        const fetchData = async () => {
            const [profile, studentsData] = await Promise.all([
                getProfile(tenantId, token),
                getStudents(tenantId, token)
            ]);

            if (profile) {
                setUser(profile);
                setStudents(studentsData?.students || []);
            } else {
                localStorage.clear();
                window.location.href = "/";
            }
            setLoading(false);
        };

        fetchData();
    }, []);

    const handleMarkAttendance = async (studentId: string, status: 'present' | 'absent') => {
        const token = localStorage.getItem("staff_token") || localStorage.getItem("student_token");
        const tenantId = localStorage.getItem("tenant_id");
        if (!token || !tenantId) return;

        setMarkingId(studentId);
        const result = await storeAttendance(tenantId, token, { student_id: studentId, status });
        setMarkingId(null);

        if (result.attendance) {
            // Feedback visual simple o recarga
            // Podríamos marcar localmente el estado por hoy
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-white/5 bg-background/80 p-4 backdrop-blur-lg">
                <div className="mx-auto flex max-w-lg items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded-xl shadow-lg shadow-primary/10">
                            <Image
                                src={branding?.logo || "/icon.webp"}
                                alt="Logo"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-foreground">{branding?.name}</h2>
                            <p className="text-[10px] text-primary uppercase tracking-widest font-black" style={{ color: branding?.primaryColor }}>Panel Academia</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            window.location.href = "/";
                        }}
                        className="rounded-full bg-white/5 p-2 text-foreground/60 hover:bg-white/10"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-lg space-y-6 p-4 pt-6">
                {/* Search Bar */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-foreground/30">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar alumno por nombre..."
                        className="h-14 w-full rounded-2xl bg-white/5 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-primary/40 focus:bg-white/10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Stats Quick View */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-3xl bg-white/5 p-4 border border-white/5 shadow-inner">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">Total Alumnos</span>
                        <p className="text-2xl font-black">{students.length}</p>
                    </div>
                    <div className="rounded-3xl bg-emerald-500/10 p-4 border border-emerald-500/10">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/60">Presentes Hoy</span>
                        <p className="text-2xl font-black text-emerald-500">--</p>
                    </div>
                </div>

                {/* Registration Link Share */}
                <div
                    onClick={() => {
                        const link = `https://app.digitalizatodo.cl/${branding?.id}/register`;
                        navigator.clipboard.writeText(link);
                        alert("Link de registro copiado al portapapeles: " + link);
                    }}
                    className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl cursor-pointer hover:bg-indigo-500/20 active:scale-[0.98] transition-all group"
                >
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Canal de Ventas</span>
                            <h3 className="text-sm font-bold text-white">Link de Auto-Registro</h3>
                            <p className="text-xs text-gray-500">Comparte este link para captar nuevos alumnos.</p>
                        </div>
                        <div className="h-10 w-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:rotate-6 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                        </div>
                    </div>
                </div>

                {/* QR Attendance Generator */}
                <QRGenerator tenantId={user?.tenant_id} token={localStorage.getItem("staff_token") || ""} primaryColor={branding?.primaryColor} />

                {/* Students List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-black uppercase tracking-widest text-foreground/40">Pase de Lista</h3>
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                            <button
                                onClick={() => setShowAll(false)}
                                className={cn(
                                    "px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                                    !showAll ? "bg-white/10 text-white shadow-sm" : "text-gray-500"
                                )}
                            >
                                Pendientes
                            </button>
                            <button
                                onClick={() => setShowAll(true)}
                                className={cn(
                                    "px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                                    showAll ? "bg-white/10 text-white shadow-sm" : "text-gray-500"
                                )}
                            >
                                Todos
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {filteredStudents
                            .filter(s => showAll || !s.today_status)
                            .map((student) => (
                                <motion.div
                                    layout
                                    key={student.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={cn(
                                        "relative flex flex-col items-center p-2 rounded-3xl border transition-all duration-300",
                                        student.today_status === 'present' ? 'bg-emerald-500/10 border-emerald-500/20' :
                                            student.today_status === 'absent' ? 'bg-red-500/10 border-red-500/20' :
                                                'bg-white/[0.03] border-white/5'
                                    )}
                                >
                                    {/* Photo */}
                                    <div className="relative h-16 w-16 mb-2 overflow-hidden rounded-2xl bg-white/5 shadow-lg group">
                                        {student.photo ? (
                                            <Image src={student.photo} alt={student.name} fill className="object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-xl font-black text-foreground/10 bg-gradient-to-br from-white/5 to-transparent">
                                                {student.name.charAt(0)}
                                            </div>
                                        )}
                                        {student.has_debt && (
                                            <div className="absolute top-0 right-0 p-1">
                                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Name */}
                                    <h4 className="w-full truncate text-[10px] font-black text-center text-white/90 mb-3 px-1">
                                        {student.name.split(' ')[0]}
                                    </h4>

                                    {/* Actions */}
                                    <div className="grid grid-cols-2 gap-1.5 w-full">
                                        <button
                                            onClick={() => handleMarkAttendance(student.id, 'present')}
                                            disabled={markingId === student.id || student.today_status === 'present'}
                                            className={cn(
                                                "h-8 rounded-xl flex items-center justify-center text-[10px] font-black uppercase transition-all active:scale-90",
                                                student.today_status === 'present'
                                                    ? "bg-emerald-500 text-black opacity-100"
                                                    : "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-black"
                                            )}
                                        >
                                            {markingId === student.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : "SÍ"}
                                        </button>
                                        <button
                                            onClick={() => handleMarkAttendance(student.id, 'absent')}
                                            disabled={markingId === student.id || student.today_status === 'absent'}
                                            className={cn(
                                                "h-8 rounded-xl flex items-center justify-center text-[10px] font-black uppercase transition-all active:scale-90",
                                                student.today_status === 'absent'
                                                    ? "bg-red-500 text-white opacity-100"
                                                    : "bg-white/5 text-gray-500 hover:bg-red-500/20 hover:text-red-500"
                                            )}
                                        >
                                            NO
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                    </div>
                    {filteredStudents.length === 0 && (
                        <div className="py-12 text-center space-y-2">
                            <p className="text-sm text-gray-600 font-medium">No se encontraron alumnos</p>
                            <p className="text-[10px] text-gray-700 uppercase tracking-widest font-bold">Verifica tu búsqueda</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pt-4 bg-background/80 backdrop-blur-2xl border-t border-white/5 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.5)]">
                <div className="mx-auto max-w-lg flex items-center justify-around translate-y-1">
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={cn(
                            "relative flex flex-col items-center gap-1 transition-all duration-300",
                            activeTab === 'attendance' ? "text-primary scale-110" : "text-foreground/30 hover:text-foreground/50"
                        )}
                        style={{ color: activeTab === 'attendance' ? branding?.primaryColor : undefined }}
                    >
                        <UserCheck className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Asist</span>
                        {activeTab === 'attendance' && (
                            <motion.div layoutId="nav-indicator" className="absolute -top-1 w-1 h-1 rounded-full bg-current" />
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('students')}
                        className={cn(
                            "relative flex flex-col items-center gap-1 transition-all duration-300",
                            activeTab === 'students' ? "text-primary scale-110" : "text-foreground/30 hover:text-foreground/50"
                        )}
                        style={{ color: activeTab === 'students' ? branding?.primaryColor : undefined }}
                    >
                        <Users className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Alumnos</span>
                        {activeTab === 'students' && (
                            <motion.div layoutId="nav-indicator" className="absolute -top-1 w-1 h-1 rounded-full bg-current" />
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('info')}
                        className={cn(
                            "relative flex flex-col items-center gap-1 transition-all duration-300",
                            activeTab === 'info' ? "text-primary scale-110" : "text-foreground/30 hover:text-foreground/50"
                        )}
                        style={{ color: activeTab === 'info' ? branding?.primaryColor : undefined }}
                    >
                        <Info className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Ayuda</span>
                        {activeTab === 'info' && (
                            <motion.div layoutId="nav-indicator" className="absolute -top-1 w-1 h-1 rounded-full bg-current" />
                        )}
                    </button>
                </div>
            </nav>
        </div>
    );
}
