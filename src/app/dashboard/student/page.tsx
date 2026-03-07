"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Calendar,
    CreditCard,
    User,
    ChevronRight,
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowUpRight,
    LogOut,
    QrCode,
    Loader2
} from "lucide-react";
import { useBranding } from "@/context/BrandingContext";
import { getProfile, markAttendanceViaQR } from "@/lib/api";

function StudentQRScanner({ studentId, onComplete, onCancel, primaryColor }: { studentId: string, onComplete: () => void, onCancel: () => void, primaryColor: string }) {
    const [scannedData, setScannedData] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!scannedData) return;

        setLoading(true);
        setError("");
        const token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
        const tenantId = localStorage.getItem("tenant_id");

        if (token && tenantId) {
            const res = await markAttendanceViaQR(tenantId, token, scannedData, studentId);
            if (res.attendance) {
                onComplete();
            } else {
                setError(res.message || "Error al validar el código");
            }
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col p-6 items-center justify-center animate-in fade-in duration-300">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center mx-auto mb-4">
                        <QrCode className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white">Marcar Asistencia</h2>
                    <p className="text-sm text-gray-500">Escanea el código QR del profesor</p>
                </div>

                <form onSubmit={handleScan} className="space-y-4">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Pega el código o escanea aquí..."
                            autoFocus
                            className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm text-white focus:outline-none focus:border-white/20"
                            value={scannedData}
                            onChange={(e) => setScannedData(e.target.value)}
                        />
                    </div>
                    {error && <p className="text-xs text-red-500 font-bold text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading || !scannedData}
                        className="w-full h-16 rounded-2xl text-black font-black uppercase tracking-widest disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        style={{ backgroundColor: primaryColor }}
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Confirmar Ingreso"}
                    </button>

                    <button
                        type="button"
                        onClick={onCancel}
                        className="w-full h-16 text-gray-500 text-xs font-bold uppercase tracking-widest"
                    >
                        Cancelar
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function StudentDashboard() {
    const { branding } = useBranding();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeScanner, setActiveScanner] = useState<string | null>(null);

    const refreshData = async () => {
        const token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
        const tenantId = localStorage.getItem("tenant_id");
        if (token && tenantId) {
            const profile = await getProfile(tenantId, token);
            setData(profile);
        }
    };

    useEffect(() => {
        refreshData().then(() => setLoading(false));
    }, []);

    const primaryColor = branding?.primaryColor || "#a855f7";

    if (loading) return null;

    const guardian = data?.guardian || { name: "Usuario" };
    const students = data?.students || [];

    return (
        <div className="max-w-md mx-auto min-h-screen pb-24 relative overflow-hidden">
            {/* Header / Profile Section */}
            <div className="p-6 pt-12 relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                            <User className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Hola, {guardian.name.split(' ')[0]}</h1>
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">Panel del Apoderado</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { localStorage.clear(); window.location.href = "/login"; }}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 transition-all text-gray-500 hover:text-red-500"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>

                {/* Global Stats / Total Due */}
                {data?.total_due > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-500/10 border border-red-500/20 rounded-3xl p-5 mb-8 flex items-center justify-between"
                    >
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-red-500/80 mb-1">Deuda Pendiente</p>
                            <p className="text-2xl font-black text-white">${Number(data.total_due).toLocaleString('es-CL')}</p>
                        </div>
                        <button
                            className="bg-red-500 text-white rounded-xl px-4 py-2 text-xs font-bold shadow-lg shadow-red-500/20 flex items-center gap-1 active:scale-95 transition-all"
                        >
                            Pagar Ahora
                            <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}

                {/* Students List */}
                <div className="space-y-6">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Mis Alumnos</h2>

                    {students.map((student: any, idx: number) => (
                        <motion.div
                            key={student.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white/[0.03] border border-white/[0.08] rounded-[2.5rem] p-6 backdrop-blur-sm relative overflow-hidden group hover:bg-white/[0.05] transition-all"
                        >
                            <div className="flex items-start gap-4 relative z-10">
                                <div className="w-16 h-16 rounded-3xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                                    {student.photo ? (
                                        <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white/20">
                                            {student.name[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold mb-1">{student.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] bg-white/5 py-1 px-2 rounded-full border border-white/10 text-gray-400 uppercase font-bold tracking-wider">{student.category}</span>
                                        {student.pending_payments > 0 && (
                                            <span className="text-[10px] bg-red-500/10 py-1 px-2 rounded-full border border-red-500/20 text-red-500 uppercase font-black tracking-wider flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                {student.pending_payments} pendiente
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Attendance Action */}
                            <button
                                onClick={() => setActiveScanner(student.id)}
                                className="mt-6 w-full h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                            >
                                <QrCode className="w-5 h-5" style={{ color: primaryColor }} />
                                Registrar Ingreso (QR)
                            </button>

                            {/* Attendance Quick Info */}
                            <div className="mt-6 grid grid-cols-2 gap-3 relative z-10">
                                <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Última Clase</span>
                                    </div>
                                    {student.recent_attendance && student.recent_attendance[0] ? (
                                        <p className="text-xs font-bold">
                                            {student.recent_attendance[0].status === 'present' ? '✅ Presente' : '❌ Ausente'}
                                            <span className="block text-[10px] text-gray-500 font-medium">{student.recent_attendance[0].date}</span>
                                        </p>
                                    ) : (
                                        <p className="text-[10px] text-gray-600 italic">Sin registros aún</p>
                                    )}
                                </div>
                                <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                                        <CreditCard className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Estado Plan</span>
                                    </div>
                                    <p className="text-xs font-bold text-emerald-500">Activo</p>
                                    <p className="text-[10px] text-gray-500">Sin deudas</p>
                                </div>
                            </div>

                            {/* View Detail Button */}
                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-gray-400 group-hover:text-white transition-colors cursor-pointer">
                                <span className="text-[10px] font-black uppercase tracking-widest">Ver Historial Completo</span>
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>

                            {/* Background Decoration */}
                            <div
                                className="absolute top-0 right-0 w-32 h-32 opacity-10 blur-3xl pointer-events-none rounded-full"
                                style={{ backgroundColor: primaryColor }}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 p-6 z-50">
                <nav className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-2 flex items-center justify-around shadow-2xl shadow-black">
                    <button
                        className="flex flex-col items-center gap-1 p-3 transition-all"
                        style={{ color: primaryColor }}
                    >
                        <User className="w-6 h-6" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Perfil</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 p-3 text-gray-500 hover:text-white transition-all">
                        <Calendar className="w-6 h-6" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Clases</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 p-3 text-gray-500 hover:text-white transition-all relative">
                        <CreditCard className="w-6 h-6" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Pagos</span>
                        {data?.total_due > 0 && (
                            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0a0a0a]" />
                        )}
                    </button>
                </nav>
            </div>

            {activeScanner && (
                <StudentQRScanner
                    studentId={activeScanner}
                    primaryColor={primaryColor}
                    onComplete={() => {
                        setActiveScanner(null);
                        refreshData();
                    }}
                    onCancel={() => setActiveScanner(null)}
                />
            )}
        </div>
    );
}
