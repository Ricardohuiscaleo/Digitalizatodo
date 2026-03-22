"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { QrCode, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import jsQR from "jsqr";
import { markAttendanceViaQR } from "@/lib/api";

interface StudentQRScannerProps {
    studentId: string;
    onComplete: () => void;
    onCancel: () => void;
    primaryColor: string;
    hasCredits?: boolean;
}

export function StudentQRScanner({
    studentId,
    onComplete,
    onCancel,
    primaryColor,
    hasCredits = false,
}: StudentQRScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<number>(0);
    const [status, setStatus] = useState<"scanning" | "loading" | "success" | "error" | "denied">("scanning");
    const [errorMsg, setErrorMsg] = useState("");
    const [isPersonalized, setIsPersonalized] = useState(hasCredits);

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
                markAttendanceViaQR(tenantSlug, token, code.data, studentId, isPersonalized).then((res) => {
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

                {hasCredits && status === "scanning" && (
                    <div className="bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5 flex items-center justify-between gap-1 w-full relative z-10">
                        <button 
                            type="button" 
                            onClick={() => setIsPersonalized(false)}
                            className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!isPersonalized ? 'bg-white text-black shadow-lg' : 'text-zinc-500'}`}
                        >
                            Clase Normal
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setIsPersonalized(true)}
                            className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isPersonalized ? 'bg-[#c9a84c] text-black shadow-[0_0_15px_rgba(201,168,76,0.3)]' : 'text-[#c9a84c]/50'}`}
                        >
                            Usar Clase VIP <span className="text-[12px]">★</span>
                        </button>
                    </div>
                )}

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
