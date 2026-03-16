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
    Camera,
    CreditCard,
    Settings,
    ShieldCheck,
    ChevronRight,
    MapPin,
    RefreshCw,
    Bell,
    Sparkles,
    Trash2,
    Minus,
    ImageIcon
} from "lucide-react";
import { useBranding } from "@/context/BrandingContext";
import NotificationToast from "@/components/Notifications/NotificationToast";
import { getProfile, markAttendanceViaQR, resumeSession, getNotifications, markAllNotificationsRead, markNotificationRead, getAppUpdates, deletePaymentProof } from "@/lib/api";
import jsQR from "jsqr";
import BottomNav, { NavSection } from "@/components/Navigation/BottomNav";
import { todayCL } from "@/lib/utils";
import StudentCalendar from "@/components/Calendar/StudentCalendar";
import { getEcho, reconnect } from "@/lib/echo";

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
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                gain.gain.setValueAtTime(0.5, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.1);
            } else {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, ctx.currentTime);
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
            const tenantSlug = localStorage.getItem("tenant_slug");
            if (token && tenantSlug) {
                markAttendanceViaQR(tenantSlug, token, code.data, studentId).then((res) => {
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
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-4 left-4 w-10 h-10 border-l-4 border-t-4 border-white/60 rounded-tl-lg" />
                            <div className="absolute top-4 right-4 w-10 h-10 border-r-4 border-t-4 border-white/60 rounded-tr-lg" />
                            <div className="absolute bottom-4 left-4 w-10 h-10 border-l-4 border-b-4 border-white/60 rounded-bl-lg" />
                            <div className="absolute bottom-4 right-4 w-10 h-10 border-r-4 border-b-4 border-white/60 rounded-br-lg" />
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

/* ─── Confirm Dialog ─── */
function ConfirmDialog({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
    return (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={onCancel}>
            <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
                    <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <div className="text-center">
                    <h3 className="text-base font-black text-zinc-900">{title}</h3>
                    <p className="text-xs text-zinc-400 mt-1">{message}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="flex-1 h-11 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all">Cancelar</button>
                    <button onClick={onConfirm} className="flex-1 h-11 bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all">Eliminar</button>
                </div>
            </div>
        </div>
    );
}

/* ─── Payment Proof Modal ─── */
function ProofModal({ url, canDelete, onClose, onDelete }: { url: string; canDelete: boolean; onClose: () => void; onDelete?: () => void }) {
    return (
        <div
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div className="relative max-w-sm w-full space-y-3" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute -top-4 -right-4 z-10 w-9 h-9 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                    <X className="w-4 h-4" />
                </button>
                <div className="rounded-3xl overflow-hidden border border-white/10">
                    <img src={url} alt="Comprobante de pago" className="w-full object-contain max-h-[60vh]" />
                </div>
                {/* Footer con acciones */}
                <div className="flex gap-2">
                    {canDelete && onDelete && (
                        <button
                            onClick={onDelete}
                            className="flex-1 h-12 bg-red-500/20 border border-red-500/30 text-red-400 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/30 transition-all"
                        >
                            <Trash2 size={14} /> Eliminar comprobante
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className={`${canDelete ? '' : 'flex-1'} h-12 bg-white/10 border border-white/20 text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all ${canDelete ? 'flex-1' : 'w-full'}`}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Main Dashboard ─── */
export default function StudentDashboard() {
    const { branding } = useBranding();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<NavSection>("home");
    const [activeScanner, setActiveScanner] = useState<string | null>(null);
    const [uploadingPayment, setUploadingPayment] = useState<string | null>(null);
    const [proofModal, setProofModal] = useState<{ url: string; canDelete: boolean; paymentId: string } | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
    const [copiedBank, setCopiedBank] = useState(false);
    
    // Subida de foto de perfil
    const profileFileInputRef = useRef<HTMLInputElement>(null);
    const bulkFileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [studentPhotoLoadingId, setStudentPhotoLoadingId] = useState<string | null>(null);
    const studentForPhotoRef = useRef<string | null>(null);
    const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
    const [paymentTab, setPaymentTab] = useState<"pending" | "history">("pending");
    const refreshDataRef = useRef<() => void>(() => {});
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [appUpdates, setAppUpdates] = useState<any[]>([]);
    const [toastNotification, setToastNotification] = useState<any>(null);

    const refreshData = useCallback(async () => {
        let token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
        const tenantSlug = localStorage.getItem("tenant_slug");
        
        if (!token && !tenantSlug) return;

        if (!token && tenantSlug) {
            const rememberToken = localStorage.getItem("remember_token");
            if (rememberToken) {
                const resumed = await resumeSession(tenantSlug, rememberToken);
                if (resumed?.token) {
                    token = resumed.token;
                    const key = resumed.user_type === 'staff' ? 'staff_token' : 'auth_token';
                    localStorage.setItem(key, token!);
                }
            }
        }

        if (!token || !tenantSlug) {
            window.location.href = "/";
            return;
        }

        let profile = await getProfile(tenantSlug, token);

        // Si el token falló (ej: expiró) intentamos recuperar con remember_token
        if (!profile) {
            const rememberToken = localStorage.getItem("remember_token");
            if (rememberToken && tenantSlug) {
                const resumed = await resumeSession(tenantSlug, rememberToken);
                if (resumed?.token) {
                    const newToken = resumed.token;
                    const key = resumed.user_type === 'staff' ? 'staff_token' : 'auth_token';
                    localStorage.setItem(key, newToken);
                    profile = await getProfile(tenantSlug, newToken);
                }
            }
        }

        if (profile) {
            setData(profile);
        } else {
            // Si después de intentar reanudar sigue sin haber perfil, al login
            window.location.href = "/";
        }
    }, [resumeSession, getProfile]);

    // Mantener ref actualizado
    refreshDataRef.current = refreshData;

    // REAL-TIME CON WEBSOCKETS (LARAVEL REVERB)
    useEffect(() => {
        const key = process.env.NEXT_PUBLIC_REVERB_APP_KEY;
        if (!key || !branding?.slug) {
            console.log('[Student WS] Skip: key=', !!key, 'slug=', branding?.slug);
            return;
        }

        const echo = getEcho();
        if (!echo) {
            console.log('[Student WS] No echo instance');
            return;
        }

        console.log('[Student WS] Subscribing to attendance.' + branding.slug);

        // Canal de Asistencia
        const attChannel = echo.channel(`attendance.${branding.slug}`);
        attChannel.listen('.student.checked-in', (data: any) => {
            console.log('[Student WS] ✅ checked-in:', data);
            refreshDataRef.current();
        });
        attChannel.listen('.student.checked-out', (data: any) => {
            console.log('[Student WS] ❌ checked-out:', data);
            refreshDataRef.current();
        });

        // Canal de Pagos (Vital para el apoderado: ver aprobación en segundos)
        const payChannel = echo.channel(`payments.${branding.slug}`);
        payChannel.listen('.payment.updated', (data: any) => {
            console.log('Real-time payment update received:', data);
            refreshDataRef.current();
        });

        // Canal de Notificaciones en tiempo real
        const guardianId = data?.guardian?.id;
        if (guardianId) {
            const notifChannel = echo.channel(`notifications.${branding.slug}.${guardianId}`);
            notifChannel.listen('.notification.sent', (ev: any) => {
                console.log('[Student WS] 🔔 notification.sent:', ev);
                setToastNotification({ id: ev.notificationId, title: ev.title, body: ev.body, type: ev.type });
                setUnreadCount(c => c + 1);
                setNotifications(prev => [{ id: ev.notificationId, title: ev.title, body: ev.body, type: ev.type, read: false, created_at: 'Ahora' }, ...prev]);
            });
        }

        // Móvil: reconectar cuando la app vuelve de background
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                reconnect();
                refreshDataRef.current();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            echo.leaveChannel(`attendance.${branding.slug}`);
            echo.leaveChannel(`payments.${branding.slug}`);
            if (data?.guardian?.id) echo.leaveChannel(`notifications.${branding.slug}.${data.guardian.id}`);
        };
    }, [branding?.slug, data?.guardian?.id]);

    useEffect(() => {
        refreshData().then(() => setLoading(false));
    }, [refreshData]);

    // Cargar notificaciones y app updates
    useEffect(() => {
        const token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
        const slug = localStorage.getItem("tenant_slug");
        if (!token || !slug) return;
        getNotifications(slug, token).then(d => {
            if (d?.notifications) setNotifications(d.notifications);
            if (d?.unread !== undefined) setUnreadCount(d.unread);
        });
        getAppUpdates('student').then(d => {
            if (d?.updates) setAppUpdates(d.updates);

        });
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
                alert("No se pudo subir el comprobante. Por favor intenta de nuevo.");
            }
        } finally {
            setUploadingPayment(null);
        }
    };

    const handleDeleteProof = async (paymentId: string) => {
        setConfirmDelete(null);
        setProofModal(null);
        const token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
        const slug = localStorage.getItem("tenant_slug");
        if (!token || !slug) return;
        const result = await deletePaymentProof(slug, token, paymentId);
        if (result) refreshData();
    };


    const handleProfilePhotoUpload = async (file: File) => {
        if (!file) return;
        setIsUploadingPhoto(true);
        const token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
        const tenantSlug = localStorage.getItem("tenant_slug");
        
        try {
            const API = process.env.NEXT_PUBLIC_API_URL || "https://admin.digitalizatodo.cl/api";
            const formData = new FormData();
            formData.append("photo", file);
            
            const response = await fetch(`${API}/${tenantSlug}/me/photo`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json"
                },
                body: formData
            });

            if (!response.ok) throw new Error("Error al subir foto de perfil");
            
            alert("Foto de perfil actualizada con éxito");
            refreshData();
        } catch (error) {
            console.error(error);
            alert("Error al subir la foto de perfil");
        } finally {
            setIsUploadingPhoto(false);
        }
    };
    const handleBulkUploadProof = async (file: File) => {
        if (selectedPayments.length === 0) return;
        setUploadingPayment("bulk");
        const token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
        const tenantId = localStorage.getItem("tenant_id");
        if (!token || !tenantId) return;

        const formData = new FormData();
        formData.append("proof", file);
        selectedPayments.forEach(id => formData.append("payment_ids[]", id));

        try {
            const API = process.env.NEXT_PUBLIC_API_URL || "https://admin.digitalizatodo.cl/api";
            const tenantSlug = localStorage.getItem("tenant_slug");
            const res = await fetch(`${API}/${tenantSlug}/payments/bulk-upload-proof`, {
                method: "POST",
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: formData
            });
            if (res.ok) {
                setUploadSuccess("bulk");
                setSelectedPayments([]);
                setTimeout(() => { setUploadSuccess(null); refreshData(); }, 2000);
            } else {
                alert("Error al subir comprobante masivo.");
            }
        } catch (e) {
            console.error("Bulk upload error", e);
        } finally {
            setUploadingPayment(null);
        }
    };

    const handleUploadPhoto = async (studentId: string, file: File) => {
        setStudentPhotoLoadingId(studentId);
        const token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
        const tenantId = localStorage.getItem("tenant_id");
        if (!token || !tenantId) return;

        const formData = new FormData();
        formData.append("photo", file);

        try {
            const API = process.env.NEXT_PUBLIC_API_URL || "https://admin.digitalizatodo.cl/api";
            const tenantSlug = localStorage.getItem("tenant_slug") || tenantId;
            const res = await fetch(`${API}/${tenantSlug}/students/${studentId}/photo`, {
                method: "POST",
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: formData,
            });
            if (res.ok) {
                refreshData();
            } else {
                const err = await res.text();
                alert(`Error al subir la foto: ${err.substring(0, 100)}`);
            }
        } catch (error) {
            alert("Error de conexión al subir foto.");
        } finally {
            setStudentPhotoLoadingId(null);
        }
    };

    const primaryColor = branding?.primaryColor || "#f97316";

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-stone-50">
            <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
        </div>
    );

    const guardian = data?.guardian || { name: "Usuario", email: "", phone: "" };
    const students = data?.students || [];
    const paymentHistory = data?.payment_history || [];
    const bankInfo = data?.bank_info;
    const totalDue = data?.total_due || 0;

    const hasPendingReview = students.some((s: any) => 
        (s.payments || []).some((p: any) => p.status === 'pending_review')
    );
    const totalDueOrReview = totalDue > 0 || hasPendingReview;

    /* ─── Sections Rendering ─── */

    const renderHome = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Mini */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-black text-zinc-900 leading-tight">Hola, {guardian.name.split(' ')[0]}</h1>
                    <p className="text-[11px] font-bold text-zinc-500 mt-1">Bienvenid@ gestiona tu asistencia y pagos 😊.</p>
                </div>
                <div className="w-14 h-14 bg-white rounded-full border-2 border-zinc-50 shadow-md flex items-center justify-center overflow-hidden shrink-0 relative p-0.5">
                    {branding?.logo ? (
                        <img src={branding.logo} className="w-full h-full object-cover rounded-full" />
                    ) : (
                        <div className="w-full h-full bg-zinc-50 flex items-center justify-center">
                            <User className="text-zinc-200 w-6 h-6" />
                        </div>
                    )}
                </div>
            </div>

            {/* Deuda / Status Card (Sistema de 3 Colores) */}
            {totalDueOrReview ? (
                hasPendingReview ? (
                    /* ESTADO 2: EN REVISIÓN (AMARILLO/NARANJA) */
                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2.5rem] p-6 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-1">
                                <RefreshCw size={12} className="animate-spin" />
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-90">Pago en revisión</p>
                            </div>
                            <h2 className="text-4xl font-black mb-2">${Number(totalDue).toLocaleString("es-CL")}</h2>
                            <p className="text-xs opacity-80 mb-4">Te notificaremos cuando sea aprobado 🔔</p>
                            <button 
                                onClick={() => setActiveSection("payments")}
                                className="bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/30 transition-all flex items-center gap-2"
                            >
                                Ver mis pagos <ChevronRight size={14} />
                            </button>
                        </div>
                        <CreditCard className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
                    </div>
                ) : (
                    /* ESTADO 1: DEUDA CRÍTICA (ROJO) */
                    <div className="bg-gradient-to-br from-red-500 to-orange-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-red-500/20 relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Saldo pendiente</p>
                            <h2 className="text-4xl font-black mb-4">${Number(totalDue).toLocaleString("es-CL")}</h2>
                            <button 
                                onClick={() => setActiveSection("payments")}
                                className="bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/30 transition-all flex items-center gap-2"
                            >
                                Pagar ahora <ChevronRight size={14} />
                            </button>
                        </div>
                        <CreditCard className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
                    </div>
                )
            ) : (
                /* ESTADO 3: AL DÍA (VERDE) */
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
                    <div className="relative z-10">
                        <CheckCircle2 className="w-8 h-8 mb-2" />
                        <h2 className="text-xl font-black">¡Estás al día!</h2>
                        <p className="text-xs opacity-80 mt-1">No tienes mensualidades pendientes.</p>
                    </div>
                    <CreditCard className="absolute -right-4 -bottom-4 w-32 h-32 opacity-5 -rotate-12" />
                </div>
            )}

            {/* Mis Alumnos Cards */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-4 bg-orange-500 rounded-full" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-400">
                        Registrar asistencia {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h3>
                </div>
                {students.map((student: any) => {
                    const todayStr = todayCL();
                    const isPresentToday = (student.recent_attendance || []).some((a: any) => a.date === todayStr && a.status === 'present');
                    return (
                    <div
                        key={student.id}
                        className={`bg-white rounded-[2.5rem] p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all border-2 ${isPresentToday ? 'border-emerald-400 shadow-emerald-50' : 'border-zinc-100'}`}
                    >
                        <div className="flex items-center gap-4 relative z-10">
                            <button 
                                type="button"
                                className={`w-16 h-16 rounded-full overflow-hidden bg-zinc-100 shadow-md shrink-0 relative cursor-pointer z-30 active:scale-95 transition-transform touch-none border-2 ${isPresentToday ? 'border-emerald-400' : 'border-zinc-50'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    studentForPhotoRef.current = student.id;
                                    profileFileInputRef.current?.click();
                                }}
                            >
                                {(isUploadingPhoto && !studentPhotoLoadingId) || studentPhotoLoadingId === student.id ? (
                                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center z-20">
                                        <Loader2 className="animate-spin text-orange-500" size={18} />
                                    </div>
                                ) : null}
                                {student.photo ? (
                                    <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl font-black text-zinc-200">
                                        {student.name[0]}
                                    </div>
                                )}
                                <div className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center text-zinc-400 border border-zinc-100 z-10">
                                    <Camera className="w-3.5 h-3.5" />
                                </div>
                            </button>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-black text-zinc-900 truncate">{student.name}</h4>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-2">{student.category}</p>
                                {isPresentToday ? (
                                    <p className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter flex items-center gap-1.5 bg-emerald-50 w-fit px-2 py-1 rounded-full border border-emerald-200">
                                        <CheckCircle2 size={10} /> Presente
                                    </p>
                                ) : (
                                    <p className="text-[8px] font-black text-indigo-500 uppercase tracking-tighter flex items-center gap-1.5 bg-indigo-50/50 w-fit px-2 py-1 rounded-full border border-indigo-100/50">
                                        Registra tu asistencia 👉🏻
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveScanner(student.id);
                                    }}
                                    className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-lg shadow-zinc-200 active:scale-90 transition-all shrink-0 relative group/qr z-20 border border-zinc-300"
                                >
                                    <QrCode size={28} className="text-orange-400 group-hover/qr:scale-110 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                    );
                })}
            </div>
        </div>
    );

    const renderCalendar = () => {
        // Combinamos la asistencia de todos los alumnos en un solo array, incluyendo sus fotos y categorías
        const combinedAttendance = students.flatMap((s: any) => 
            (s.recent_attendance || []).map((a: any) => ({ 
                ...a, 
                studentName: s.name,
                studentPhoto: s.photo,
                studentCategory: s.category
            }))
        );

        return (
            <div className="h-[calc(100vh-120px)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
                <header className="mb-4 shrink-0 px-1">
                    <h2 className="text-2xl font-black text-zinc-900">Asistencia</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">Actividad de todos tus alumnos</p>
                </header>

                <div className="flex-1 min-h-0">
                    <StudentCalendar 
                        attendance={combinedAttendance} 
                        primaryColor={primaryColor} 
                    />
                </div>
            </div>
        );
    };

    const renderPayments = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-black text-zinc-900">Pagos</h2>
            
            {/* Tabs Selector */}
            <div className="flex bg-zinc-100 p-1.5 rounded-[2.2rem] gap-1 shadow-inner">
                <button 
                    onClick={() => setPaymentTab("pending")}
                    className={`flex-1 py-3 px-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                        paymentTab === "pending" ? "bg-white text-zinc-900 shadow-md scale-[1.02]" : "text-zinc-400 hover:text-zinc-600"
                    }`}
                >
                    Pendientes
                </button>
                <button 
                    onClick={() => setPaymentTab("history")}
                    className={`flex-1 py-3 px-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                        paymentTab === "history" ? "bg-white text-zinc-900 shadow-md scale-[1.02]" : "text-zinc-400 hover:text-zinc-600"
                    }`}
                >
                    Historial
                </button>
            </div>
            
            {paymentTab === "pending" ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Metodos de pago / Banco */}
                    {bankInfo && (
                        <div className="bg-zinc-900 text-white rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden group">
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                                            <ShieldCheck size={20} className="text-orange-400" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Datos de Transferencia</span>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${bankInfo.bank_name}\n${bankInfo.account_type}\n${bankInfo.account_number}\n${bankInfo.holder_name}\n${bankInfo.holder_rut}`);
                                            setCopiedBank(true);
                                            setTimeout(() => setCopiedBank(false), 2000);
                                        }}
                                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/5"
                                    >
                                        {copiedBank ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                        {copiedBank ? 'Copiado' : 'Copiar'}
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-lg font-black">{bankInfo.bank_name}</p>
                                    <p className="text-sm opacity-60">{bankInfo.account_type}</p>
                                    <p className="text-2xl font-mono font-black tracking-wider text-orange-400">{bankInfo.account_number}</p>
                                    <p className="text-xs opacity-60">{bankInfo.holder_name} · {bankInfo.holder_rut}</p>
                                </div>
                            </div>
                            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl" />
                        </div>
                    )}

                    {/* Pendientes List */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between ml-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Mensualidades</h3>
                            {selectedPayments.length > 0 && (
                                <button 
                                    onClick={() => bulkFileInputRef.current?.click()}
                                    disabled={uploadingPayment === "bulk"}
                                    className="bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-orange-200 animate-in zoom-in duration-200 flex items-center gap-2"
                                >
                                    {uploadingPayment === "bulk" ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
                                    Pagar {selectedPayments.length} Masivamente
                                </button>
                            )}
                        </div>
                        {students.flatMap((s: any) => s.payments || []).map((payment: any) => (
                            <PaymentRow
                                key={payment.id}
                                payment={payment}
                                primaryColor={primaryColor}
                                uploading={uploadingPayment === String(payment.id)}
                                uploadSuccess={uploadSuccess === String(payment.id) || (uploadSuccess === "bulk" && selectedPayments.includes(String(payment.id)))}
                                onUpload={(file) => handleUploadProof(String(payment.id), file)}
                                onViewProof={(url) => setProofModal({ url, canDelete: payment.status !== 'approved', paymentId: String(payment.id) })}
                                onDeleteProof={() => setConfirmDelete(String(payment.id))}
                                isSelected={selectedPayments.includes(String(payment.id))}
                                onToggleSelect={() => {
                                    setSelectedPayments(prev => 
                                        prev.includes(String(payment.id)) 
                                            ? prev.filter(id => id !== String(payment.id))
                                            : [...prev, String(payment.id)]
                                    );
                                }}
                            />
                        ))}
                        {students.every((s: any) => (s.payments || []).length === 0) && (
                            <div className="bg-white border border-dashed border-zinc-200 rounded-[2rem] p-8 text-center">
                                <p className="text-sm text-zinc-400 font-bold italic">No hay pagos pendientes</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                    {paymentHistory.length > 0 ? (
                        paymentHistory.map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between bg-white border border-zinc-100 rounded-[2rem] px-6 py-5 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-orange-50 transition-colors">
                                        <CreditCard size={20} />
                                    </div>
                                    <div>
                                        <p className="text-base font-black text-zinc-900">${Number(p.amount).toLocaleString("es-CL")}</p>
                                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{p.paid_at || p.due_date}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border shadow-sm ${
                                        p.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-yellow-50 text-yellow-600 border-yellow-100'
                                    }`}>
                                        {p.status === 'approved' ? 'Pagado' : 'En Revisión'}
                                    </span>
                                    {p.proof_image && (
                                        <button 
                                            onClick={() => setProofModal({ url: p.proof_image, canDelete: false, paymentId: String(p.id) })} 
                                            className="w-10 h-10 flex items-center justify-center bg-zinc-900 text-white rounded-xl hover:bg-orange-500 transition-all shadow-lg shadow-zinc-200"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white border border-dashed border-zinc-200 rounded-[2.5rem] p-12 text-center">
                            <Clock className="w-12 h-12 text-zinc-200 mx-auto mb-3" />
                            <p className="text-sm text-zinc-400 font-bold italic">No hay registro de pagos anteriores</p>
                        </div>
                    )}
                </div>
            )}
            
            <input 
                type="file"
                ref={bulkFileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleBulkUploadProof(file);
                    if (e.target) e.target.value = "";
                }}
            />
        </div>
    );

    const renderProfile = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black text-zinc-900">Mi Perfil</h2>
            
            <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 text-center shadow-sm relative overflow-hidden">
                <div className="relative w-24 h-24 mx-auto mb-4 group">
                    <div 
                        onClick={() => profileFileInputRef.current?.click()}
                        className="w-24 h-24 bg-stone-100 rounded-[2.5rem] flex items-center justify-center border border-zinc-100 text-zinc-300 overflow-hidden cursor-pointer hover:border-orange-200 transition-all"
                    >
                        {guardian.photo ? (
                            <img src={guardian.photo} alt={guardian.name} className="w-full h-full object-cover" />
                        ) : (
                            <User size={40} />
                        )}
                        
                        {isUploadingPhoto && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-[2.5rem]">
                                <Loader2 className="text-white animate-spin" />
                            </div>
                        )}
                    </div>
                    
                    <button 
                        onClick={() => profileFileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 w-8 h-8 bg-orange-500 text-white rounded-xl flex items-center justify-center border-4 border-white shadow-sm active:scale-90 transition-transform"
                    >
                        <Camera size={14} />
                    </button>
                </div>
                <h3 className="text-xl font-black text-zinc-900">{guardian.name}</h3>
                <p className="text-sm text-zinc-400 font-bold mb-2">{guardian.email}</p>
                <span className="inline-block bg-zinc-900 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Apoderado</span>
            </div>

            <div className="space-y-4">
                <div className="bg-white border border-zinc-100 rounded-3xl p-2">
                    <button className="w-full flex items-center justify-between p-4 hover:bg-stone-50 rounded-2xl transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-orange-500 transition-colors">
                                <User size={20} />
                            </div>
                            <span className="font-black text-sm text-zinc-700">Editar Perfil</span>
                        </div>
                        <ChevronRight size={18} className="text-zinc-300" />
                    </button>
                    <div className="h-px bg-zinc-50 mx-4" />
                    <button 
                        onClick={() => setActiveSection("calendar")}
                        className="w-full flex items-center justify-between p-4 hover:bg-stone-50 rounded-2xl transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-orange-500 transition-colors">
                                <Calendar size={20} />
                            </div>
                            <span className="font-black text-sm text-zinc-700">Historial de Asistencia</span>
                        </div>
                        <ChevronRight size={18} className="text-zinc-300" />
                    </button>
                    <div className="h-px bg-zinc-50 mx-4" />
                    <button 
                        onClick={() => { setActiveSection("payments"); setPaymentTab("history"); }}
                        className="w-full flex items-center justify-between p-4 hover:bg-stone-50 rounded-2xl transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-orange-500 transition-colors">
                                <CreditCard size={20} />
                            </div>
                            <span className="font-black text-sm text-zinc-700">Historial de Pagos</span>
                        </div>
                        <ChevronRight size={18} className="text-zinc-300" />
                    </button>
                    <div className="h-px bg-zinc-50 mx-4" />
                    <button className="w-full flex items-center justify-between p-4 hover:bg-stone-50 rounded-2xl transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-orange-500 transition-colors">
                                <Settings size={20} />
                            </div>
                            <span className="font-black text-sm text-zinc-700">Ajustes</span>
                        </div>
                        <ChevronRight size={18} className="text-zinc-300" />
                    </button>
                </div>

                {/* Changelog */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <Sparkles size={14} className="text-zinc-300" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Actualizaciones</span>
                    </div>
                    <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1">
                        {appUpdates.length > 0 ? appUpdates.map((u: any) => (
                            <div key={u.id} className="bg-white border border-zinc-100 rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[9px] font-black bg-zinc-900 text-white px-2 py-0.5 rounded-full">v{u.version}</span>
                                    <span className="text-[8px] font-bold text-zinc-300">{u.published_at}</span>
                                </div>
                                <h4 className="text-sm font-black text-zinc-800 mt-2">{u.title}</h4>
                                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{u.description}</p>
                            </div>
                        )) : (
                            <p className="text-xs text-zinc-300 text-center py-4">Sin actualizaciones</p>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => { localStorage.clear(); window.location.href = "/"; }}
                    className="w-full h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] hover:bg-red-100 transition-all active:scale-[0.98]"
                >
                    <LogOut size={18} />
                    Cerrar Sesión
                </button>
            </div>

            <div className="pt-6 text-center space-y-1">
                <a href="https://digitalizatodo.cl" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors">
                    DIGITALIZA TODO® 2026
                </a>
                <p className="text-[9px] text-zinc-300">Software Factory a la Medida</p>
            </div>

        </div>
    );

    return (
        <>
            <NotificationToast
                notification={toastNotification}
                onDismiss={() => setToastNotification(null)}
                onNavigate={(type) => {
                    if (type === 'attendance') setActiveSection('calendar');
                    else if (type === 'payment') setActiveSection('payments');
                    else setActiveSection('profile');
                }}
            />
            {/* Desktop Only Guard (Fintoc Style Inverso) */}
            <div className="hidden lg:flex fixed inset-0 z-[9999] bg-stone-50 items-center justify-center p-8 text-center animate-in fade-in duration-700">
                <div className="max-w-md space-y-10">
                    <div className="flex justify-center">
                        <div className="h-24 w-24 rounded-[2rem] bg-white border border-zinc-100 flex items-center justify-center overflow-hidden shadow-xl animate-bounce">
                            <img src="/DLogo-v2.webp" className="w-12 h-12 object-contain" alt="logo" />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <h1 className="text-5xl font-black text-zinc-900 tracking-tighter uppercase leading-[0.85]">
                            Ecosistema <br/> <span className="text-indigo-600">Móvil</span>
                        </h1>
                        <p className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em] leading-relaxed max-w-[280px] mx-auto">
                            El portal de apoderados está optimizado para dispositivos móviles.
                        </p>
                        <div className="bg-zinc-900 text-white p-6 rounded-[2rem] shadow-2xl space-y-3">
                             <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Paso a seguir</p>
                             <p className="text-sm font-bold">Por favor, accede desde tu smartphone para una mejor experiencia.</p>
                        </div>
                    </div>
                    <div className="pt-12">
                        <p className="text-[9px] font-black text-zinc-200 uppercase tracking-[0.5em]">DIGITALIZA TODO® 2026</p>
                        <p className="text-[8px] text-zinc-200 mt-1">Software Factory a la Medida</p>
                    </div>
                </div>
            </div>

            <div className="min-h-screen bg-stone-50 text-zinc-900 pb-32 md:pb-12 max-w-lg mx-auto md:max-w-7xl lg:hidden">
            {/* Header */}
            <header className="bg-white px-2 py-3 flex items-center justify-between sticky top-0 z-50 border-b border-zinc-50 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center shrink-0 rounded-full overflow-hidden border border-zinc-100 shadow-sm">
                        {branding?.logo ? (
                            <img src={branding.logo} className="w-full h-full object-cover" alt="L" />
                        ) : (
                            <span className="font-black text-xl uppercase tracking-tighter text-zinc-950">{branding?.name?.[0] || 'D'}</span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-lg font-black uppercase tracking-tighter text-zinc-950 leading-none">{branding?.name || 'Academy'}</h1>
                        <span className="text-[9px] font-black uppercase tracking-widest mt-0.5" style={{ color: primaryColor }}>
                            {activeSection === 'home' ? 'Inicio' : activeSection === 'calendar' ? 'Asistencia' : activeSection === 'payments' ? 'Pagos' : 'Perfil'}
                        </span>
                    </div>
                </div>
                {/* Notification Bell */}
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative w-10 h-10 flex items-center justify-center rounded-full border border-zinc-100 shadow-sm bg-white"
                >
                    <Bell size={20} className="text-zinc-600" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                </button>
            </header>

            {/* Notification Dropdown */}
            {showNotifications && (
                <div className="fixed inset-0 z-[100]" onClick={() => setShowNotifications(false)}>
                    <div className="absolute top-16 right-2 w-80 max-h-96 bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-zinc-50 flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Notificaciones</span>
                            {unreadCount > 0 && (
                                <button onClick={async () => {
                                    const tk = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
                                    const sl = localStorage.getItem("tenant_slug");
                                    if (tk && sl) {
                                        await markAllNotificationsRead(sl, tk);
                                        setUnreadCount(0);
                                        setNotifications(n => n.map(x => ({ ...x, read: true })));
                                    }
                                }} className="text-[9px] font-black text-zinc-400 hover:text-zinc-600">Marcar leídas</button>
                            )}
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                            {notifications.length > 0 ? notifications.map((n: any) => (
                                <div
                                    key={n.id}
                                    onClick={async () => {
                                        if (!n.read) {
                                            const tk = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
                                            const sl = localStorage.getItem("tenant_slug");
                                            if (tk && sl) markNotificationRead(sl, tk, n.id);
                                            setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
                                            setUnreadCount(c => Math.max(0, c - 1));
                                        }
                                        if (n.type === 'attendance') setActiveSection('calendar');
                                        else if (n.type === 'payment') setActiveSection('payments');
                                        setShowNotifications(false);
                                    }}
                                    className={`p-4 border-b border-zinc-50 cursor-pointer hover:bg-zinc-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-zinc-200'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-zinc-800 truncate">{n.title}</p>
                                            <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{n.body}</p>
                                            <p className="text-[9px] text-zinc-300 mt-1">{n.created_at}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center">
                                    <Bell size={24} className="text-zinc-200 mx-auto mb-2" />
                                    <p className="text-xs text-zinc-300">Sin notificaciones</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="px-2 md:px-8 pt-4">
            {/* Dashboard Sections - Mobile Responsive */}
            <div className="animate-in fade-in duration-500">
                {activeSection === "home" && renderHome()}
                {activeSection === "calendar" && renderCalendar()}
                {activeSection === "payments" && renderPayments()}
                {activeSection === "profile" && renderProfile()}
            </div>

            </div>

            {/* Shared Components */}
            <BottomNav 
                activeSection={activeSection} 
                setActiveSection={setActiveSection} 
                primaryColor={primaryColor}
                userPhoto={guardian.photo}
                userName={guardian.name}
            />


            {activeScanner && (
                <StudentQRScanner
                    studentId={activeScanner}
                    primaryColor={primaryColor}
                    onComplete={() => { setActiveScanner(null); refreshData(); }}
                    onCancel={() => setActiveScanner(null)}
                />
            )}

            {proofModal && (
                <ProofModal
                    url={proofModal.url}
                    canDelete={proofModal.canDelete}
                    onClose={() => setProofModal(null)}
                    onDelete={() => setConfirmDelete(proofModal.paymentId)}
                />
            )}

            {confirmDelete && (
                <ConfirmDialog
                    title="¿Eliminar comprobante?"
                    message="Se eliminará la imagen y el pago volverá a estado pendiente."
                    onConfirm={() => handleDeleteProof(confirmDelete)}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}

            {/* Global File Input for Photos */}
            <input 
                type="file"
                ref={profileFileInputRef}
                style={{ opacity: 0, position: 'absolute', pointerEvents: 'none', width: 0, height: 0 }}
                accept="image/*"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        const sId = studentForPhotoRef.current;
                        if (sId) {
                            handleUploadPhoto(sId, file);
                        } else {
                            handleProfilePhotoUpload(file);
                        }
                    }
                    studentForPhotoRef.current = null;
                    if (e.target) e.target.value = "";
                }}
            />
        </div>
        </>
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
    onDeleteProof,
    isSelected,
    onToggleSelect,
}: {
    payment: any;
    primaryColor: string;
    uploading: boolean;
    uploadSuccess: boolean;
    onUpload: (file: File) => void;
    onViewProof: (url: string) => void;
    onDeleteProof: () => void;
    isSelected: boolean;
    onToggleSelect: () => void;
}) {
    const fileRef = useRef<HTMLInputElement>(null);

    const statusConfig: Record<string, { label: string; color: string }> = {
        pending: { label: "Pendiente", color: "text-red-500 bg-red-50 border-red-200" },
        pending_review: { label: "En Revisión", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
        approved: { label: "Pagado", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    };
    const sc = statusConfig[payment.status] || statusConfig.pending;
    const hasProof = !!payment.proof_image;
    const canDelete = hasProof && payment.status !== 'approved';

    return (
        <div className={`bg-white border ${isSelected ? 'border-orange-500 shadow-orange-50' : 'border-zinc-100'} rounded-2xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group/pay`}>
            {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />}
            
            {/* Fila principal: info + status + acción */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {payment.status === "pending" && (
                        <div onClick={onToggleSelect} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                            isSelected ? 'bg-orange-500 border-orange-500' : 'border-zinc-200 hover:border-zinc-400'
                        }`}>
                            {isSelected && <Check size={12} className="text-white" />}
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="text-sm font-black text-zinc-900">${Number(payment.amount).toLocaleString("es-CL")}</p>
                        <p className="text-[10px] text-zinc-400 font-bold truncate">Vence: {payment.due_date || "—"}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[9px] border rounded-full px-2 py-0.5 font-black uppercase shadow-sm ${sc.color}`}>{sc.label}</span>

                    {uploadSuccess && (
                        <span className="text-emerald-500 animate-in zoom-in duration-300"><CheckCircle2 className="w-6 h-6" /></span>
                    )}

                    {payment.status === "pending" && !uploadSuccess && (
                        <>
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
                            <button
                                onClick={() => fileRef.current?.click()}
                                disabled={uploading}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider bg-zinc-900 text-white rounded-xl px-4 py-2 hover:bg-zinc-800 transition-all disabled:opacity-50"
                            >
                                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                {uploading ? "..." : "Pagar"}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Mini tarjeta de comprobante */}
            {hasProof && (
                <div className="mt-3 pt-3 border-t border-zinc-50">
                    <div className="flex items-center gap-3">
                        {/* Thumbnail con badge (-) */}
                        <div className="relative shrink-0">
                            <button
                                onClick={() => onViewProof(payment.proof_image)}
                                className="w-14 h-14 rounded-xl overflow-hidden border border-zinc-100 bg-zinc-50 shadow-sm active:scale-95 transition-transform"
                            >
                                <img src={payment.proof_image} alt="Comprobante" className="w-full h-full object-cover" />
                            </button>
                            {canDelete && (
                                <button
                                    onClick={onDeleteProof}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform border-2 border-white"
                                >
                                    <Minus size={10} strokeWidth={3} />
                                </button>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-zinc-500 flex items-center gap-1">
                                <ImageIcon size={10} /> Comprobante adjunto
                            </p>
                            <p className="text-[9px] text-zinc-300 mt-0.5">
                                {payment.status === 'approved' ? 'Aprobado ✓' : 'Toca la imagen para ampliar'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
