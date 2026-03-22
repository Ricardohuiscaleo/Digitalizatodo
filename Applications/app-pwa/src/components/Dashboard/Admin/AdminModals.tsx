"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
    CheckCircle2, 
    Users, 
    Sparkles, 
    DollarSign, 
    QrCode, 
    X 
} from 'lucide-react';

/* ─── Proof Modal Component ─── */
interface PaymentActionModalProps {
    payer: any;
    onConfirm: () => void;
    onCancel: () => void;
    primaryColor: string;
    formatMoney: (n: number) => string;
}

export function PaymentActionModal({ payer, onConfirm, onCancel, primaryColor, formatMoney }: PaymentActionModalProps) {
    const pendingDetails = payer.payments?.filter((p: any) => p.status === 'review' || p.status === 'pending' || p.status === 'overdue') || [];
    const totalAmount = pendingDetails.reduce((acc: number, p: any) => acc + p.amount, 0);

    return (
        <div className="fixed inset-0 z-[200] bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onCancel}>
            <div className="bg-zinc-50 rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-white/20 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                
                {/* Header: Perfil del Titular */}
                <div className="relative pt-8 pb-6 px-6 bg-white border-b border-zinc-100">
                    <div className="flex flex-col items-center text-center">
                        <div className="relative mb-3">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-zinc-50 shadow-md">
                                <img src={payer.photo} className="w-full h-full object-cover" alt={payer.name} />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full border-4 border-white shadow-sm">
                                <CheckCircle2 size={14} />
                            </div>
                        </div>
                        <h3 className="text-base font-black uppercase text-zinc-900 leading-tight mb-1">{payer.name}</h3>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                            <Users size={10} /> Titular de Cuenta
                        </div>
                    </div>
                </div>

                {/* Body: Detalle de Alumnos */}
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-[1px] flex-1 bg-zinc-200"></div>
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] px-2">Detalle de Cobro</span>
                        <div className="h-[1px] flex-1 bg-zinc-200"></div>
                    </div>

                    <div className="space-y-2 mb-8 max-h-[35vh] overflow-y-auto pr-1 custom-scrollbar">
                        {pendingDetails.length > 0 ? pendingDetails.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-white border border-zinc-100 shadow-sm transition-all hover:border-zinc-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100 shrink-0">
                                        <img src={item.student_photo || 'https://i.pravatar.cc/100'} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-black uppercase text-zinc-800 leading-tight mb-0.5">{item.student_name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${item.category === 'kids' ? 'bg-sky-50 text-sky-600' : 'bg-zinc-100 text-zinc-600'}`}>
                                                {item.category === 'kids' ? 'Infantil' : 'Adulto'}
                                            </span>
                                            <span className="text-[8px] text-zinc-400 font-bold uppercase">{item.due_date}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className="text-sm font-black text-zinc-900 tracking-tighter">{formatMoney(item.amount)}</span>
                            </div>
                        )) : (
                            <div className="py-8 text-center flex flex-col items-center gap-2">
                                <Sparkles className="text-zinc-200" size={32} />
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Todo al día</p>
                            </div>
                        )}
                    </div>

                    {/* Footer con Total y Botones */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Total Recibido</span>
                            <span className="text-2xl font-black text-zinc-950 tracking-tighter">{formatMoney(totalAmount)}</span>
                        </div>

                        <div className="flex flex-col gap-2 pt-2">
                            <button 
                                onClick={onConfirm}
                                style={{ backgroundColor: primaryColor }}
                                className="group relative w-full py-4 rounded-2xl text-white font-black text-[12px] uppercase tracking-widest shadow-xl shadow-zinc-200 overflow-hidden active:scale-95 transition-all"
                            >
                                <div className="relative z-10 flex items-center justify-center gap-3">
                                    <DollarSign size={20} className="transition-transform group-hover:scale-110" />
                                    <span>Confirmar Pago</span>
                                </div>
                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </button>
                            
                            <button 
                                onClick={onCancel}
                                className="w-full py-3 text-zinc-400 font-black text-[9px] uppercase tracking-widest hover:text-zinc-600 active:scale-95 transition-all text-center"
                            >
                                Volver al Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface HistoryDetailModalProps {
    date: string;
    records: any[];
    branding: any;
    onClose: () => void;
}

export function HistoryDetailModal({ date, records, branding, onClose }: HistoryDetailModalProps) {
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!date) return;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [date]);

    if (!date) return null;
    const dateObj = new Date(date + 'T12:00:00');
    const dateStr = dateObj.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

    const handleTouchStart = (e: React.TouchEvent) => {
        if (scrollRef.current && scrollRef.current.scrollTop > 0) return;
        startY.current = e.touches[0].pageY;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const deltaY = e.touches[0].pageY - startY.current;
        if (deltaY > 0) {
            e.preventDefault();
            setDragY(deltaY);
        }
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (dragY > 100) onClose();
        else setDragY(0);
    };

    return (
        <div
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className={`bg-white w-full max-w-lg rounded-t-[2.5rem] md:rounded-[2.5rem] p-6 shadow-2xl ${
                    !isDragging ? 'transition-all duration-500 [transition-timing-function:cubic-bezier(0.175,0.885,0.32,1.275)]' : ''
                } animate-in fade-in slide-in-from-bottom-10`}
                style={{ 
                    transform: `translateY(${dragY}px)`, 
                    opacity: 1 - dragY / 400
                }}
                onClick={e => e.stopPropagation()}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="flex justify-center mb-4 md:hidden">
                    <div className="w-12 h-1.5 bg-zinc-200 rounded-full" />
                </div>

                <div className="mb-6">
                    <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tighter leading-none">{dateStr}</h2>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">{records.length} asistentes</p>
                </div>

                <div ref={scrollRef} className="max-h-[310px] overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                    {records.map((r: any, i: number) => (
                        <div 
                            key={r.id} 
                            style={{ animationDelay: `${i * 60}ms` }}
                            className="flex items-center justify-between p-3 bg-zinc-50 rounded-2xl border border-zinc-100 animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both"
                        >
                            <div className="flex items-center gap-3">
                                <img src={r.student?.photo} className="w-10 h-10 rounded-full object-cover border border-white shadow-sm" alt={r.student?.name} />
                                <div>
                                    <p className="text-sm font-black text-zinc-900 uppercase leading-none">{r.student?.name}</p>
                                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1">
                                        {r.registration_method === 'qr' ? 'Escaneado' : 'Manual'} • {new Date(r.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                            {r.registration_method === 'qr' && (
                                <div className="bg-emerald-500 p-1.5 rounded-xl">
                                    <QrCode size={14} className="text-white" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function ProofModal({ url, onClose }: { url: string; onClose: () => void }) {
    return (
        <div 
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <button 
                    onClick={onClose}
                    className="absolute -top-12 -right-0 z-10 w-10 h-10 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                    <X size={20} />
                </button>
                <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                    <img src={url} alt="Comprobante" className="w-full object-contain max-h-[85vh]" />
                </div>
            </div>
        </div>
    );
}
