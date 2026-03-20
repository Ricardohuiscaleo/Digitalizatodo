"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Eye, RefreshCw, DollarSign } from 'lucide-react';

interface BubblePaymentModalProps {
    payer: any;
    vocab: any;
    formatMoney: (n: number) => string;
    primaryColor: string;
    getPayerRealStats: (p: any) => any;
    onClose: () => void;
    onApprove: (id: string) => void;
    onViewProof: (url: string) => void;
}

const BubblePaymentModal: React.FC<BubblePaymentModalProps> = ({ 
    payer, 
    vocab, 
    formatMoney, 
    primaryColor, 
    getPayerRealStats, 
    onClose, 
    onApprove, 
    onViewProof 
}) => {
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (scrollRef.current && scrollRef.current.scrollTop > 0) return;
        startY.current = e.touches[0].pageY;
        setIsDragging(true);
    };
    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const deltaY = e.touches[0].pageY - startY.current;
        if (deltaY > 0) { 
            // Prevenimos el scroll solo si estamos arrastrando hacia abajo
            setDragY(deltaY); 
        }
    };
    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (dragY > 100) onClose();
        else setDragY(0);
    };

    const { reviewAmount, pendingAmount, approvedAmount } = getPayerRealStats(payer);
    const isPaid = (payer.status === 'paid') || (approvedAmount > 0 && pendingAmount === 0 && reviewAmount === 0);
    const isReview = !isPaid && (payer.status === 'review' || reviewAmount > 0);

    const payments = payer.payments && payer.payments.length > 0
        ? payer.payments
        : payer.enrolledStudents?.map((s: any) => ({
            student_name: s.name,
            student_photo: s.photo,
            due_date: '—',
            status: payer.status === 'paid' ? 'approved' : payer.status,
            amount: 0,
        }));

    return (
        <div
            className="fixed inset-0 z-[200] bg-zinc-950/70 backdrop-blur-md flex items-end justify-center animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className={`bg-white w-full rounded-t-[2.5rem] shadow-2xl ${!isDragging ? 'transition-all duration-300' : ''}`}
                style={{ transform: `translateY(${dragY}px)`, opacity: 1 - dragY / 400 }}
                onClick={e => e.stopPropagation()}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="flex justify-center pt-4 pb-2">
                    <div className="w-12 h-1.5 bg-zinc-200 rounded-full" />
                </div>

                <div className="px-6 pb-4 border-b border-zinc-100">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">Desglose del Pago</p>
                    <div className="flex items-center gap-3">
                        <img src={payer.photo} className="w-12 h-12 rounded-full object-cover border-2 border-zinc-100 shadow-sm" />
                        <div>
                            <p className="text-base font-black uppercase text-zinc-900 leading-none">{payer.name}</p>
                            <p className="text-[10px] text-zinc-400 font-bold mt-0.5">{payer.enrolledStudents?.length} {vocab?.memberLabel || 'Miembro'}s</p>
                        </div>
                    </div>
                </div>

                <div ref={scrollRef} className="px-6 pt-4 space-y-3 max-h-[55vh] overflow-y-auto pb-2">
                    {payments?.map((payment: any, idx: number) => {
                        const statusLabel = payment.status === 'approved' || payment.status === 'paid' ? 'Pagado'
                            : payment.status === 'review' ? 'Por Aprobar' : 'Por Pagar';
                        const statusColor = payment.status === 'approved' || payment.status === 'paid' ? 'text-emerald-600'
                            : payment.status === 'review' ? 'text-amber-600' : 'text-rose-600';
                        return (
                            <div key={idx} className="flex items-center gap-3 bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                                <img
                                    src={payment.student_photo || payer.photo}
                                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black uppercase text-zinc-900 leading-none truncate">{payment.student_name}</p>
                                    <p className="text-[10px] text-zinc-400 font-bold mt-1.5 uppercase">
                                        Vence: {payment.due_date} • <span className={statusColor}>{statusLabel}</span>
                                    </p>
                                    <p className="text-xl font-black text-zinc-950 mt-1 tracking-tighter">{formatMoney(payment.amount)}</p>
                                </div>
                                {payment.proof_url && (
                                    <button
                                        onClick={() => onViewProof(payment.proof_url)}
                                        className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0 active:scale-95"
                                    >
                                        <Eye size={16} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {!isPaid && (
                    <div className="px-6 pt-4 pb-10">
                        <button
                            onClick={() => onApprove(payer.id)}
                            className="w-full h-14 rounded-2xl text-white font-black text-[12px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
                            style={{ backgroundColor: isReview ? '#f59e0b' : primaryColor }}
                        >
                            {isReview ? <><RefreshCw size={18} /> Aprobar Pago</> : <><DollarSign size={18} /> Marcar como Pagado</>}
                        </button>
                    </div>
                )}
                {isPaid && <div className="pb-10" />}
            </div>
        </div>
    );
};

export default BubblePaymentModal;
