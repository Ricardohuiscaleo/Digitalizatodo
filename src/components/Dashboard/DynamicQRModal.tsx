"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Loader2, QrCode, RefreshCw, User, Check, XCircle } from 'lucide-react';

interface DynamicQRModalProps {
    onClose: () => void;
    tenantSlug: string;
    authToken: string;
    primaryColor: string;
    payers: any[];
    checkedInStudent?: any;
    onStudentAcknowledged?: () => void;
}

export default function DynamicQRModal({ 
    onClose, 
    tenantSlug, 
    authToken, 
    primaryColor, 
    payers, 
    checkedInStudent, 
    onStudentAcknowledged 
}: DynamicQRModalProps) {
    const [qrData, setQrData] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(60);
    const [loading, setLoading] = useState(true);
    const [detectedStudent, setDetectedStudent] = useState<any>(null);
    const [continueCountdown, setContinueCountdown] = useState(0);
    const currentTokenRef = useRef<string | null>(null);

    const fetchToken = useCallback(async () => {
        if (detectedStudent) return;
        try {
            setLoading(true);
            const API = process.env.NEXT_PUBLIC_API_URL || "https://admin.digitalizatodo.cl/api";
            const res = await fetch(`${API}/${tenantSlug}/attendance/qr-token`, {
                headers: { Authorization: `Bearer ${authToken}` }
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
            setLoading(false);
        }
    }, [tenantSlug, authToken, detectedStudent]);

    useEffect(() => {
        fetchToken();
    }, [fetchToken]);

    useEffect(() => {
        if (loading || detectedStudent) return;
        if (timeLeft <= 0) {
            fetchToken();
            return;
        }
        
        const t = setTimeout(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearTimeout(t);
    }, [timeLeft, loading, fetchToken, detectedStudent]);

    // Recibir estudiante detectado desde el dashboard (WebSocket)
    useEffect(() => {
        if (checkedInStudent) {
            setDetectedStudent(checkedInStudent);
            setContinueCountdown(7);
            if (window.navigator?.vibrate) window.navigator.vibrate(200);
        }
    }, [checkedInStudent?._ts]);

    // Fallback: verificar si el token fue usado (por si WebSocket falla en móvil)
    useEffect(() => {
        if (detectedStudent || !qrData) return;
        const API = process.env.NEXT_PUBLIC_API_URL || "https://admin.digitalizatodo.cl/api";
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${API}/${tenantSlug}/attendance/qr-status?token=${currentTokenRef.current}`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                if (!res.ok) return;
                const data = await res.json();
                if (data.scanned && data.student) {
                    setDetectedStudent({ id: data.student.id, name: data.student.name, photo: data.student.photo, _ts: Date.now() });
                    setContinueCountdown(7);
                    if (window.navigator?.vibrate) window.navigator.vibrate(200);
                }
            } catch {}
        }, 3000);
        return () => clearInterval(interval);
    }, [detectedStudent, qrData, tenantSlug, authToken]);

    // Auto-continuar después de 7 segundos
    useEffect(() => {
        if (!detectedStudent || continueCountdown <= 0) return;
        const t = setTimeout(() => {
            if (continueCountdown === 1) {
                setDetectedStudent(null);
                onStudentAcknowledged?.();
                fetchToken();
            } else {
                setContinueCountdown(prev => prev - 1);
            }
        }, 1000);
        return () => clearTimeout(t);
    }, [detectedStudent, continueCountdown, fetchToken, onStudentAcknowledged]);

    const progressPercent = (timeLeft / 60) * 100;

    return (
        <div className="fixed inset-0 z-[100] bg-zinc-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl scale-in-center border-2 border-white/20">
                
                {detectedStudent ? (
                    <div className="p-8 text-center animate-in zoom-in-95 duration-300">
                        <div className="relative mx-auto w-32 h-32 mb-6">
                            <div className="relative w-full h-full rounded-full border-4 border-emerald-500 overflow-hidden bg-zinc-100 shadow-xl">
                                {detectedStudent.photo ? (
                                    <img src={detectedStudent.photo} className="w-full h-full object-cover" alt={detectedStudent.name} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                        <User size={48} />
                                    </div>
                                )}
                            </div>
                            <div className="absolute -right-2 -bottom-2 w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                                <Check size={20} />
                            </div>
                        </div>

                        <h2 className="text-2xl font-black text-zinc-950 tracking-tighter mb-1">¡Hola, {detectedStudent.name.split(' ')[0]}!</h2>
                        <p className="text-xl font-bold text-emerald-600 mb-6">Bienvenid@ 😊</p>

                        <div className="bg-emerald-50 rounded-2xl p-4 mb-8 border border-emerald-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Asistencia Registrada</p>
                            <p className="text-xs font-bold text-emerald-800 mt-1">
                                {new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} • Dojo Arica
                            </p>
                        </div>

                        <button
                            onClick={() => { setDetectedStudent(null); onStudentAcknowledged?.(); setContinueCountdown(0); fetchToken(); }}
                            className="relative w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all overflow-hidden"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <div className="absolute inset-0 bg-black/15 origin-right transition-transform duration-1000 ease-linear" style={{ transform: `scaleX(${continueCountdown / 7})` }} />
                            <span className="relative z-10">Siguiente ({continueCountdown}s)</span>
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="p-6 text-center relative border-b border-zinc-100 bg-zinc-50/50">
                            <button onClick={onClose} className="absolute right-4 top-4 p-2 bg-white rounded-full text-zinc-400 hover:text-zinc-600 shadow-sm transition-all active:scale-95 border border-zinc-100">
                                <XCircle size={24} />
                            </button>
                            <div className="w-12 h-12 bg-white text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md border border-zinc-100">
                                <QrCode size={24} />
                            </div>
                            <h2 className="text-xl font-black text-zinc-900 leading-tight">Punto de Marcación</h2>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mt-1">Escanea el código para ingresar</p>
                        </div>
                        
                        <div className="p-8 flex flex-col items-center">
                            <div className="relative p-6 bg-white rounded-3xl shadow-xl border border-zinc-100 mb-8 flex items-center justify-center group overflow-hidden">
                                {qrData ? (
                                    <QRCodeCanvas value={qrData} size={200} level="H" includeMargin={false} fgColor={primaryColor} />
                                ) : (
                                    <div className="w-[200px] h-[200px] flex items-center justify-center bg-zinc-50 rounded-xl">
                                        <Loader2 className="animate-spin text-zinc-300" size={32} />
                                    </div>
                                )}
                                
                                {/* Overlay de luz scanner */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-400/10 to-transparent h-full w-full pointer-events-none line-scan-animation" />
                            </div>
                            
                            <div className="w-full space-y-3">
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-zinc-500 px-1">
                                    <span className="flex items-center gap-1.5"><RefreshCw size={10} className={loading ? "animate-spin" : ""} /> Código Dinámico</span>
                                    <span className={timeLeft <= 5 ? "text-red-500 font-black animate-pulse" : "font-black"}>{timeLeft}s</span>
                                </div>
                                <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ease-linear rounded-full ${timeLeft <= 5 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-emerald-500'}`}
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>

                            <p className="mt-8 text-[9px] text-zinc-400 font-bold uppercase tracking-widest text-center leading-relaxed">
                                El código se actualiza automáticamente<br/>por seguridad cada 1 minuto.
                            </p>
                        </div>
                    </>
                )}
            </div>
            <style jsx>{`
                @keyframes scanLine {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
                .line-scan-animation {
                    animation: scanLine 3s linear infinite;
                    border-top: 2px solid rgba(16, 185, 129, 0.4);
                }
                @keyframes scale-in-center {
                    0% { transform: scale(0); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .scale-in-center {
                    animation: scale-in-center 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
                }
            `}</style>
        </div>
    );
}
