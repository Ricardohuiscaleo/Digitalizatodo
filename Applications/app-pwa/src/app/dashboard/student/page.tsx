"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
    Calendar,
    CreditCard,
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
                        setStatus("success");
                        setTimeout(onComplete, 1500);
                    } else {
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
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (res.ok) {
                setUploadSuccess(paymentId);
                setTimeout(() => { setUploadSuccess(null); refreshData(); }, 2000);
            }
        } finally {
            setUploadingPayment(null);
        }
    };

    const primaryColor = branding?.primaryColor || "#a855f7";

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
            <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
        </div>
    );

    const guardian = data?.guardian || { name: "Usuario" };
    const students = data?.students || [];
    const paymentHistory = data?.payment_history || [];
    const bankInfo = data?.bank_info;

    return (
        <div className="max-w-md mx-auto min-h-screen bg-[#0a0a0a] text-white pb-32">
            {/* Header */}
            <div className="p-6 pt-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                            <User className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Hola, {guardian.name.split(' ')[0]}</h1>
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">Portal del Apoderado</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { localStorage.clear(); window.location.href = "/login"; }}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 transition-all text-gray-500 hover:text-red-500"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>

                {/* Deuda banner */}
                {data?.total_due > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-5 mb-8 animate-in fade-in duration-200">
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-500/80 mb-1">Saldo Pendiente</p>
                        <p className="text-3xl font-black text-white">${Number(data.total_due).toLocaleString("es-CL")}</p>
                        {bankInfo && (
                            <div className="mt-4 pt-4 border-t border-red-500/20 space-y-1">
                                <p className="text-[10px] font-black uppercase text-red-400/70">Datos para transferencia</p>
                                <p className="text-xs text-white/70">{bankInfo.bank_name} · {bankInfo.account_type}</p>
                                <p className="text-sm font-bold text-white">Cta: {bankInfo.account_number}</p>
                                <p className="text-xs text-white/60">{bankInfo.holder_name} · RUT: {bankInfo.holder_rut}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Students */}
                <div className="space-y-6">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Mis Alumnos</h2>

                    {students.map((student: any) => (
                        <div
                            key={student.id}
                            className="bg-white/[0.03] border border-white/[0.08] rounded-[2.5rem] p-6 backdrop-blur-sm relative overflow-hidden"
                        >
                            {/* Student header */}
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
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[10px] bg-white/5 py-1 px-2 rounded-full border border-white/10 text-gray-400 uppercase font-bold tracking-wider">
                                            {student.category}
                                        </span>
                                        {student.belt_rank && (
                                            <span className="text-[10px] bg-white/5 py-1 px-2 rounded-full border border-white/10 text-gray-400 uppercase font-bold tracking-wider">
                                                🥋 {student.belt_rank}
                                            </span>
                                        )}
                                        {student.pending_payments > 0 && (
                                            <span className="text-[10px] bg-red-500/10 py-1 px-2 rounded-full border border-red-500/20 text-red-400 uppercase font-black tracking-wider flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                {student.pending_payments} pendiente{student.pending_payments > 1 ? "s" : ""}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Attendance quick */}
                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Última Clase</span>
                                    </div>
                                    {student.recent_attendance?.[0] ? (
                                        <p className="text-xs font-bold">
                                            {student.recent_attendance[0].status === "present" ? "✅ Presente" : "❌ Ausente"}
                                            <span className="block text-[10px] text-gray-500 font-medium">{student.recent_attendance[0].date}</span>
                                        </p>
                                    ) : (
                                        <p className="text-[10px] text-gray-600 italic">Sin registros aún</p>
                                    )}
                                </div>
                                <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Asistencias</span>
                                    </div>
                                    <p className="text-lg font-black text-white">{student.attendance_count}</p>
                                    <p className="text-[10px] text-gray-500">clases registradas</p>
                                </div>
                            </div>

                            {/* QR Button */}
                            <button
                                onClick={() => setActiveScanner(student.id)}
                                className="mt-4 w-full h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                            >
                                <QrCode className="w-5 h-5" style={{ color: primaryColor }} />
                                Registrar Ingreso con QR
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
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Historial de Pagos</h2>
                        {paymentHistory.map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3">
                                <div>
                                    <p className="text-sm font-bold text-white">${Number(p.amount).toLocaleString("es-CL")}</p>
                                    <p className="text-[10px] text-gray-500">{p.paid_at || p.due_date}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {p.status === "approved" && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5 font-black uppercase">Pagado</span>}
                                    {p.status === "pending_review" && <span className="text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full px-2 py-0.5 font-black uppercase">En Revisión</span>}
                                    {p.proof_url && (
                                        <button onClick={() => setProofModalUrl(p.proof_url)} className="text-gray-500 hover:text-white transition-colors">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

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
        pending: { label: "Pendiente", color: "text-red-400 bg-red-500/10 border-red-500/20" },
        pending_review: { label: "En Revisión", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
        approved: { label: "Pagado", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    };
    const sc = statusConfig[payment.status] || statusConfig.pending;

    return (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">${Number(payment.amount).toLocaleString("es-CL")}</p>
                <p className="text-[10px] text-gray-500 truncate">Vence: {payment.due_date || "—"}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] border rounded-full px-2 py-0.5 font-black uppercase ${sc.color}`}>{sc.label}</span>

                {uploadSuccess && (
                    <span className="text-emerald-400"><CheckCircle2 className="w-4 h-4" /></span>
                )}

                {payment.status === "pending" && !uploadSuccess && (
                    <>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }}
                        />
                        <button
                            onClick={() => fileRef.current?.click()}
                            disabled={uploading}
                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 hover:bg-white/10 transition-all disabled:opacity-50"
                            style={{ color: primaryColor }}
                        >
                            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                            {uploading ? "Subiendo..." : "Comprobante"}
                        </button>
                    </>
                )}

                {payment.status === "pending_review" && payment.proof_url && (
                    <button
                        onClick={() => onViewProof(payment.proof_url)}
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 hover:bg-white/10 transition-all text-gray-400"
                    >
                        <Eye className="w-3 h-3" />
                        Ver
                    </button>
                )}

                {payment.status === "approved" && payment.proof_url && (
                    <button
                        onClick={() => onViewProof(payment.proof_url)}
                        className="text-gray-600 hover:text-gray-400 transition-colors"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
