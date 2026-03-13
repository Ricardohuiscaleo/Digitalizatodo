"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
    Calendar,
    User,
    AlertCircle,
    LogOut,
    QrCode,
    Loader2,
    Upload,
    CheckCircle2,
    Clock,
    Eye,
    X,
    Copy,
    Check,
    Camera
} from "lucide-react";
import { useBranding } from "@/context/BrandingContext";
import { getProfile, markAttendanceViaQR } from "@/lib/api";
import jsQR from "jsqr";

/* ─── QR Camera Scanner ─── */
function StudentQRScanner({
    studentId,
    onComplete,
    onCancel,
    primaryColor,
}: {
    studentId: string;
    onComplete: () => void;
    onCancel: () => void;
    primaryColor: string;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<number>(0);
    const [status, setStatus] = useState<"scanning" | "loading" | "success" | "error" | "denied">("scanning");
    const [errorMsg, setErrorMsg] = useState("");

    const stopCamera = useCallback(() => {
        cancelAnimationFrame(rafRef.current);
        streamRef.current?.getTracks().forEach((t) => t.stop());
    }, []);

    const playBeep = (type: 'success' | 'error') => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            if (type === 'success') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, ctx.currentTime);     // A5
                gain.gain.setValueAtTime(0.5, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.1);
            } else {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, ctx.currentTime);     // Low note
                gain.gain.setValueAtTime(0.5, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.3);
            }
        } catch(e) { console.error("Audio error", e) }
    };

    const processFrame = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
            rafRef.current = requestAnimationFrame(processFrame);
            return;
        }
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });
        if (code?.data) {
            stopCamera();
            setStatus("loading");
            const token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
            const tenantId = localStorage.getItem("tenant_id");
            if (token && tenantId) {
                markAttendanceViaQR(tenantId, token, code.data, studentId).then((res) => {
                    if (res?.attendance) {
                        playBeep('success');
                        setStatus("success");
                        setTimeout(onComplete, 1500);
                    } else {
                        playBeep('error');
                        setStatus("error");
                        setErrorMsg(res?.message || "Código inválido o expirado");
                    }
                });
            }
        } else {
            rafRef.current = requestAnimationFrame(processFrame);
        }
    }, [studentId, stopCamera, onComplete]);

    useEffect(() => {
        navigator.mediaDevices
            .getUserMedia({ video: { facingMode: "environment" } })
            .then((stream) => {
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().then(() => {
                        rafRef.current = requestAnimationFrame(processFrame);
                    });
                }
            })
            .catch(() => setStatus("denied"));
        return () => stopCamera();
    }, [processFrame, stopCamera]);

    return (
        <div className="fixed inset-0 z-[100] bg-black/98 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="w-full max-w-sm space-y-6 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center mx-auto">
                    <QrCode className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-white">Marcar Asistencia</h2>
                    <p className="text-sm text-gray-500 mt-1">Apunta al QR del profesor</p>
                </div>

                {status === "scanning" && (
                    <div className="relative rounded-3xl overflow-hidden border-2 border-white/10 aspect-square">
                        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                        <canvas ref={canvasRef} className="hidden" />
                        {/* Viewfinder corners */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-4 left-4 w-10 h-10 border-l-4 border-t-4 border-white/60 rounded-tl-lg" />
                            <div className="absolute top-4 right-4 w-10 h-10 border-r-4 border-t-4 border-white/60 rounded-tr-lg" />
                            <div className="absolute bottom-4 left-4 w-10 h-10 border-l-4 border-b-4 border-white/60 rounded-bl-lg" />
                            <div className="absolute bottom-4 right-4 w-10 h-10 border-r-4 border-b-4 border-white/60 rounded-br-lg" />
                            {/* Scanning line */}
                            <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-60 animate-[scan_2s_ease-in-out_infinite]" style={{ top: "50%" }} />
                        </div>
                    </div>
                )}

                {status === "loading" && (
                    <div className="flex flex-col items-center gap-4 py-12">
                        <Loader2 className="w-12 h-12 text-white animate-spin" />
                        <p className="text-gray-400 text-sm">Validando asistencia...</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center gap-4 py-12">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                        </div>
                        <p className="text-white font-bold text-lg">¡Asistencia registrada!</p>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center gap-4 py-8">
                        <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-red-400" />
                        </div>
                        <p className="text-red-400 font-bold">{errorMsg}</p>
                        <button
                            onClick={() => setStatus("scanning")}
                            className="text-xs text-gray-400 underline"
                        >
                            Intentar de nuevo
                        </button>
                    </div>
                )}

                {status === "denied" && (
                    <div className="flex flex-col items-center gap-4 py-8">
                        <p className="text-red-400 text-sm">Sin acceso a la cámara. Activa los permisos en tu navegador.</p>
                    </div>
                )}

                <button
                    onClick={() => { stopCamera(); onCancel(); }}
                    className="w-full h-14 text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
}

/* ─── Payment Proof Modal ─── */
function ProofModal({ url, onClose }: { url: string; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute -top-4 -right-4 z-10 w-9 h-9 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                    <X className="w-4 h-4" />
                </button>
                <div className="rounded-3xl overflow-hidden border border-white/10">
                    <img src={url} alt="Comprobante de pago" className="w-full object-contain max-h-[70vh]" />
                </div>
                <p className="text-center text-xs text-gray-500 mt-3">Comprobante de transferencia</p>
            </div>
        </div>
    );
}

/* ─── Main Dashboard ─── */
export default function StudentDashboard() {
    const { branding } = useBranding();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeScanner, setActiveScanner] = useState<string | null>(null);
    const [uploadingPayment, setUploadingPayment] = useState<string | null>(null);
    const [proofModalUrl, setProofModalUrl] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
    const [copiedBank, setCopiedBank] = useState(false);
    
    // Subida de foto de perfil
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [uploadingPhotoFor, setUploadingPhotoFor] = useState<string | null>(null);

    const refreshData = async () => {
        const token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
        const tenantId = localStorage.getItem("tenant_id");
        if (token && tenantId) {
            const profile = await getProfile(tenantId, token);
            if (profile) setData(profile);
        }
    };

    useEffect(() => {
        refreshData().then(() => setLoading(false));
    }, []);

    const handleUploadProof = async (paymentId: string, file: File) => {
        setUploadingPayment(paymentId);
        const token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
        const tenantId = localStorage.getItem("tenant_id");
        if (!token || !tenantId) return;

        const formData = new FormData();
        formData.append("proof", file);

        try {
            const API = process.env.NEXT_PUBLIC_API_URL || "https://admin.digitalizatodo.cl/api";
            const tenantSlug = localStorage.getItem("tenant_slug");
            const res = await fetch(`${API}/${tenantSlug}/payments/${paymentId}/upload-proof`, {
                method: "POST",
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: formData,
            });
            if (res.ok) {
                setUploadSuccess(paymentId);
                setTimeout(() => { setUploadSuccess(null); refreshData(); }, 2000);
            } else {
                const err = await res.text();
                console.error("Error subiendo comprobante:", err);
                alert("No se pudo subir el comprobante. Por favor intenta de nuevo.");
            }
        } finally {
            setUploadingPayment(null);
        }
    };

    const handleUploadPhoto = async (studentId: string, file: File) => {
        setUploadingPhotoFor(studentId);
        const token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
        const tenantId = localStorage.getItem("tenant_id");
        if (!token || !tenantId) return;

        const formData = new FormData();
        formData.append("photo", file);

        try {
            const API = process.env.NEXT_PUBLIC_API_URL || "https://admin.digitalizatodo.cl/api";
            const tenantSlug = localStorage.getItem("tenant_slug") || tenantId; // Fallback a ID si no hay slug
            const res = await fetch(`${API}/${tenantSlug}/students/${studentId}/photo`, {
                method: "POST",
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: formData,
            });
            if (res.ok) {
                alert("¡Foto actualizada con éxito!");
                refreshData();
            } else {
                const err = await res.text();
                console.error("Error subiendo foto:", err);
                alert(`Error al subir la foto: ${err.substring(0, 100)}`);
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Error de conexión al subir foto.");
        } finally {
            setUploadingPhotoFor(null);
        }
    };

    const primaryColor = branding?.primaryColor || "#a855f7";

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-orange-50">
            <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
        </div>
    );

    const guardian = data?.guardian || { name: "Usuario" };
    const students = data?.students || [];
    const paymentHistory = data?.payment_history || [];
    const bankInfo = data?.bank_info;

    return (
        <div className="max-w-7xl mx-auto min-h-screen bg-stone-50 text-zinc-900 pb-32 md:pb-12 md:px-8">
            <div className="md:grid md:grid-cols-12 md:gap-8 md:mt-8">
                
                {/* Columna Izquierda (Fija en PC): Perfil y Deuda */}
                <div className="md:col-span-4 md:sticky md:top-8 md:self-start space-y-6">
                    {/* Header */}
                    <div className="p-6 md:p-0 md:bg-white md:rounded-[2rem] md:shadow-sm md:border md:border-zinc-100 md:p-6 transition-all pt-12 md:pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-zinc-200 shadow-sm shrink-0">
                                    <User className="w-6 h-6 text-orange-500" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold tracking-tight text-zinc-800 break-words line-clamp-2">Hola, {guardian.name.split(' ')[0]}</h1>
                                    <p className="text-xs text-orange-600/80 uppercase tracking-widest font-black">Portal del Apoderado</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { localStorage.clear(); window.location.href = "/login"; }}
                                className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-zinc-200 shadow-sm hover:bg-red-50 hover:border-red-200 transition-all text-zinc-400 hover:text-red-500 shrink-0"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Deuda banner */}
                    {data?.total_due > 0 && (
                        <div className="mx-4 md:mx-0 bg-gradient-to-br from-red-50 to-orange-50 border border-red-100/50 rounded-3xl p-5 shadow-sm animate-in fade-in duration-200 relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Saldo Pendiente</p>
                                <p className="text-3xl font-black text-red-950">${Number(data.total_due).toLocaleString("es-CL")}</p>
                                {bankInfo && (
                                    <div className="mt-4 pt-4 border-t border-red-200/50">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-[10px] font-black uppercase text-red-600/70">Datos para transferencia</p>
                                            <button
                                                onClick={() => {
                                                    const text = `Banco: ${bankInfo.bank_name}\nTipo: ${bankInfo.account_type}\nCta: ${bankInfo.account_number}\nTitular: ${bankInfo.holder_name}\nRUT: ${bankInfo.holder_rut}`;
                                                    navigator.clipboard.writeText(text);
                                                    setCopiedBank(true);
                                                    setTimeout(() => setCopiedBank(false), 2000);
                                                }}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ${
                                                    copiedBank ? 'bg-emerald-500 text-white border border-emerald-600' : 'bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200'
                                                }`}
                                            >
                                                {copiedBank ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                {copiedBank ? 'Copiado' : 'Copiar info'}
                                            </button>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-red-950/70 font-bold break-words">{bankInfo.bank_name} · {bankInfo.account_type}</p>
                                            <p className="text-sm font-black text-red-950 break-all">Cta: {bankInfo.account_number}</p>
                                            <p className="text-xs text-red-950/60 font-medium break-words">{bankInfo.holder_name} · RUT: {bankInfo.holder_rut}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
                        </div>
                    )}
                </div>

                {/* Columna Derecha (Scroll fluído en PC): Alumnos e Historial */}
                <div className="md:col-span-8 space-y-8 mt-8 md:mt-0">
                    {/* Alumnos */}
                    <div className="space-y-6 px-4 md:px-0">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Mis Alumnos</h2>

                    {students.map((student: any) => (
                        <div
                            key={student.id}
                            className="bg-white border border-zinc-100 rounded-[2.5rem] p-6 shadow-sm relative overflow-hidden transition-all hover:shadow-md"
                        >
                            {/* Student header */}
                            <div className="flex items-start gap-4 relative z-10">
                                <div 
                                    className="w-16 h-16 rounded-3xl overflow-hidden bg-zinc-100 border border-zinc-200 shadow-sm shrink-0 relative group cursor-pointer hover:border-orange-200 transition-all"
                                    onClick={() => {
                                        photoInputRef.current?.setAttribute('data-student-id', student.id);
                                        photoInputRef.current?.click();
                                    }}
                                >
                                    {uploadingPhotoFor === student.id ? (
                                        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center z-20 animate-in fade-in duration-200">
                                            <Loader2 className="animate-spin text-orange-500" size={18} />
                                            <span className="text-[7px] font-black text-orange-600 uppercase mt-1 tracking-tighter">Procesando</span>
                                        </div>
                                    ) : null}
                                    
                                    {student.photo ? (
                                        <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl font-black text-zinc-300">
                                            {student.name[0]}
                                        </div>
                                    )}
                                    
                                    {/* Botón flotante de cámara (Siempre visible pero sutil) */}
                                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-white rounded-full shadow-md border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-orange-500 group-hover:scale-110 transition-all z-10">
                                        <Camera className="w-3.5 h-3.5" />
                                    </div>
                                    
                                    {/* Overlay al pasar el mouse */}
                                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-black text-zinc-900 mb-1 truncate">{student.name}</h3>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[10px] bg-zinc-100 py-1 px-2 rounded-full border border-zinc-200 text-zinc-500 uppercase font-black tracking-wider">
                                            {student.category}
                                        </span>
                                        {student.belt_rank && (
                                            <span className="text-[10px] bg-zinc-100 py-1 px-2 rounded-full border border-zinc-200 text-zinc-500 uppercase font-black tracking-wider shadow-sm">
                                                🥋 {student.belt_rank}
                                            </span>
                                        )}
                                        {student.pending_payments > 0 && (
                                            <span className="text-[10px] bg-red-50 py-1 px-2 rounded-full border border-red-200 text-red-600 uppercase font-black tracking-wider flex items-center gap-1 shadow-sm">
                                                <AlertCircle className="w-3 h-3" />
                                                {student.pending_payments} pendiente{student.pending_payments > 1 ? "s" : ""}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Attendance quick */}
                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <div className="bg-orange-50/50 rounded-2xl p-3 border border-orange-100">
                                    <div className="flex items-center gap-2 mb-2 text-orange-600">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Última Clase</span>
                                    </div>
                                    {student.recent_attendance?.[0] ? (
                                        <p className="text-xs font-bold text-zinc-900">
                                            {student.recent_attendance[0].status === "present" ? "✅ Presente" : "❌ Ausente"}
                                            <span className="block text-[10px] text-zinc-500 font-bold mt-0.5">{student.recent_attendance[0].date}</span>
                                        </p>
                                    ) : (
                                        <p className="text-[10px] text-zinc-400 font-bold italic">Sin registros</p>
                                    )}
                                </div>
                                <div className="bg-orange-50/50 rounded-2xl p-3 border border-orange-100">
                                    <div className="flex items-center gap-2 mb-2 text-orange-600">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Asistencias</span>
                                    </div>
                                    <p className="text-lg font-black text-zinc-900 leading-none">{student.attendance_count}</p>
                                    <p className="text-[9px] font-bold text-zinc-500 mt-1 uppercase tracking-widest">clases total</p>
                                </div>
                            </div>

                            {/* QR Button */}
                            <button
                                onClick={() => setActiveScanner(student.id)}
                                className="mt-4 w-full h-14 bg-zinc-950 text-white rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-md shadow-zinc-200 active:scale-95"
                            >
                                <QrCode className="w-5 h-5 text-orange-400" />
                                Registrar Ingreso QR
                            </button>

                            {/* Payments for this student */}
                            {student.payments && student.payments.length > 0 && (
                                <div className="mt-5 space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Mensualidades</p>
                                    {student.payments.map((payment: any) => (
                                        <PaymentRow
                                            key={payment.id}
                                            payment={payment}
                                            primaryColor={primaryColor}
                                            uploading={uploadingPayment === String(payment.id)}
                                            uploadSuccess={uploadSuccess === String(payment.id)}
                                            onUpload={(file) => handleUploadProof(String(payment.id), file)}
                                            onViewProof={(url) => setProofModalUrl(url)}
                                        />
                                    ))}
                                </div>
                            )}

                            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 blur-3xl pointer-events-none rounded-full" style={{ backgroundColor: primaryColor }} />
                        </div>
                    ))}
                </div>

                {/* Payment History */}
                {paymentHistory.length > 0 && (
                    <div className="mt-8 space-y-3">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Historial de Pagos</h2>
                        {paymentHistory.map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between bg-white border border-zinc-100 rounded-2xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
                                <div>
                                    <p className="text-sm font-black text-zinc-900">${Number(p.amount).toLocaleString("es-CL")}</p>
                                    <p className="text-[10px] text-zinc-400 font-bold">{p.paid_at || p.due_date}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {p.status === "approved" && <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full px-2 py-0.5 font-black uppercase shadow-sm">Pagado</span>}
                                    {p.status === "pending_review" && <span className="text-[10px] bg-yellow-50 text-yellow-600 border border-yellow-200 rounded-full px-2 py-0.5 font-black uppercase shadow-sm">En Revisión</span>}
                                    {p.proof_url && (
                                        <button onClick={() => setProofModalUrl(p.proof_url)} className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 bg-zinc-50 rounded-full border border-zinc-200">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                </div>
            </div>

            {/* Hidden Photo Input */}
            <input 
                type="file" 
                ref={photoInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    const studentId = photoInputRef.current?.getAttribute('data-student-id');
                    if (file && studentId) {
                        handleUploadPhoto(studentId, file);
                    }
                    if (photoInputRef.current) photoInputRef.current.value = ""; // reset
                }}
            />

            {/* QR Scanner modal */}
            {activeScanner && (
                <StudentQRScanner
                    studentId={activeScanner}
                    primaryColor={primaryColor}
                    onComplete={() => { setActiveScanner(null); refreshData(); }}
                    onCancel={() => setActiveScanner(null)}
                />
            )}

            {/* Proof image modal */}
            {proofModalUrl && <ProofModal url={proofModalUrl} onClose={() => setProofModalUrl(null)} />}
        </div>
    );
}

/* ─── Payment Row Component ─── */
function PaymentRow({
    payment,
    primaryColor,
    uploading,
    uploadSuccess,
    onUpload,
    onViewProof,
}: {
    payment: any;
    primaryColor: string;
    uploading: boolean;
    uploadSuccess: boolean;
    onUpload: (file: File) => void;
    onViewProof: (url: string) => void;
}) {
    const fileRef = useRef<HTMLInputElement>(null);

    const statusConfig: Record<string, { label: string; color: string }> = {
        pending: { label: "Pendiente", color: "text-red-500 bg-red-50 border-red-200" },
        pending_review: { label: "En Revisión", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
        approved: { label: "Pagado", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    };
    const sc = statusConfig[payment.status] || statusConfig.pending;

    return (
        <div className="bg-white border border-zinc-100 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-zinc-900">${Number(payment.amount).toLocaleString("es-CL")}</p>
                <p className="text-[10px] text-zinc-400 font-bold truncate">Vence: {payment.due_date || "—"}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[9px] border rounded-full px-2 py-0.5 font-black uppercase shadow-sm ${sc.color}`}>{sc.label}</span>

                {uploadSuccess && (
                    <span className="text-emerald-500"><CheckCircle2 className="w-5 h-5" /></span>
                )}

                {payment.status === "pending" && !uploadSuccess && (
                    <>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }}
                        />
                        <button
                            onClick={() => fileRef.current?.click()}
                            disabled={uploading}
                            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-200 rounded-xl px-3 py-1.5 hover:bg-orange-100 transition-all disabled:opacity-50 shadow-sm"
                        >
                            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                            {uploading ? "..." : "Comprobante"}
                        </button>
                    </>
                )}

                {payment.status === "pending_review" && payment.proof_url && (
                    <button
                        onClick={() => onViewProof(payment.proof_url)}
                        className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider bg-zinc-50 border border-zinc-200 text-zinc-500 rounded-xl px-3 py-1.5 hover:bg-zinc-100 transition-all shadow-sm"
                    >
                        <Eye className="w-3 h-3" />
                        Ver
                    </button>
                )}

                {payment.status === "approved" && payment.proof_url && (
                    <button
                        onClick={() => onViewProof(payment.proof_url)}
                        className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 bg-zinc-50 rounded-full border border-zinc-200"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
