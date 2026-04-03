"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Eye, RefreshCw, Banknote, ArrowRightLeft } from 'lucide-react';
import { StudentAvatar } from './Industries/MartialArts/StudentAvatar';

interface BubblePaymentModalProps {
    payer: any;
    vocab: any;
    formatMoney: (n: number) => string;
    primaryColor: string;
    getPayerRealStats: (p: any) => any;
    onClose: () => void;
    onApprove: (payer: any, method?: string) => void;
    onRevert?: (payer: any) => void;
    onViewProof: (url: string) => void;
    isDark?: boolean;
    industry?: string;
    selectedMonth?: number;
    selectedYear?: number;
}

const BubblePaymentModal: React.FC<BubblePaymentModalProps> = ({ 
    payer, 
    vocab, 
    formatMoney, 
    primaryColor, 
    getPayerRealStats, 
    onClose, 
    onApprove, 
    onRevert,
    onViewProof,
    isDark = false,
    industry = 'martial_arts',
    selectedMonth,
    selectedYear
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

    const payments = payer.payments ?? [];

    return (
        <div
            className={`fixed inset-0 z-[200] backdrop-blur-md flex items-end justify-center animate-in fade-in duration-200 ${
                isDark ? 'bg-black/80' : 'bg-zinc-950/70'
            }`}
            onClick={onClose}
        >
            <div
                className={`w-full rounded-t-[2.5rem] shadow-2xl ${!isDragging ? 'transition-all duration-300' : ''} ${
                    isDark ? 'bg-[#09090b] border-t border-zinc-800' : 'bg-white'
                }`}
                style={{ transform: `translateY(${dragY}px)`, opacity: 1 - dragY / 400 }}
                onClick={e => e.stopPropagation()}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="flex justify-center pt-4 pb-2">
                    <div className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                </div>

                <div className={`px-6 pb-4 border-b ${isDark ? 'border-zinc-800/50' : 'border-zinc-100'}`}>
                    <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-3 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Desglose del Pago</p>
            <div className="flex items-center gap-3">
                <div>
                    <p className={`text-base font-black uppercase leading-none ${isDark ? 'text-white' : 'text-zinc-900'}`}>{payer.name}</p>
                                {payer.is_automatic ? (
                                    <span className="text-[7px] font-black uppercase bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full border border-indigo-500/20 animate-pulse flex items-center gap-1 mt-1.5 w-max">
                                        <RefreshCw size={8} /> PAGO AUTOMÁTICO
                                    </span>
                                ) : (
                                    <p className={`text-[10px] font-bold mt-0.5 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                        {payer.enrolledStudents?.length} {vocab?.memberLabel || 'Miembro'}s
                                    </p>
                                )}
                        </div>
                    </div>
                </div>

                <div ref={scrollRef} className="px-6 pt-4 space-y-4 max-h-[60vh] overflow-y-auto pb-6">
                    {payments?.map((payment: any, idx: number) => {
                        const statusLabel = payment.status === 'approved' || payment.status === 'paid' ? 'Pagado'
                            : payment.status === 'review' || payment.status === 'pending_review' || payment.status === 'proof_uploaded' ? 'En Revisión' : 'Por Pagar';
                        const statusColor = payment.status === 'approved' || payment.status === 'paid' ? 'text-emerald-500'
                            : (payment.status === 'review' || payment.status === 'pending_review' || payment.status === 'proof_uploaded') ? 'text-amber-400' : 'text-rose-500';
                        
                        return (
                            <div key={idx} className={`flex items-start gap-3 rounded-[2rem] p-5 border transition-all ${
                                isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-100 shadow-sm'
                            }`}>
                                <div className="mt-1">
                                    <StudentAvatar
                                        photo={payment.student_photo || payer.photo}
                                        name={payment.student_name}
                                        size={48}
                                        beltRank={payment.belt_rank}
                                        degrees={payment.degrees ?? 0}
                                        classesCount={((payment.total_attendances || 0) + (payment.previous_classes || 0) - (payment.belt_classes_at_promotion || 0)) > 0 
                                            ? ((payment.total_attendances || 0) + (payment.previous_classes || 0) - (payment.belt_classes_at_promotion || 0)) 
                                            : undefined
                                        }
                                        isDark={isDark}
                                        industry={industry}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <div className="flex flex-col">
                                            <p className={`text-sm font-black uppercase truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                                {payment.student_name}
                                            </p>
                                            <p className={`text-[9px] font-bold uppercase mt-0.5 opacity-60 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                                {payment.plan_name || payment.course_name || 'Sin plan'}
                                            </p>
                                        </div>
                                        <p className={`text-lg font-black tracking-tighter ${isDark ? 'text-white' : 'text-zinc-950'}`}>
                                            {formatMoney(payment.amount)}
                                        </p>
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                            Vence: {payment.due_date}
                                        </p>
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                            statusColor.replace('text-', 'bg-').replace('500', '500/10').replace('400', '400/10')
                                        } ${statusColor} border-current/20`}>
                                            {statusLabel}
                                        </span>
                                        {(payment.type === 'single' || payment.type === 'pack_4' || payment.type === 'referral') && (
                                            <span className="bg-[#c9a84c]/10 text-[#c9a84c] text-[8px] font-black px-2 py-0.5 rounded-full border border-[#c9a84c]/20">CLASE VIP</span>
                                        )}
                                    </div>
                                </div>
                                {payment.proof_url && (
                                    <button
                                        onClick={() => onViewProof(payment.proof_url)}
                                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                                            isDark ? 'bg-amber-400/10 border-amber-400/20 text-amber-500 hover:bg-amber-400/20' : 'bg-amber-50 border-amber-100 text-amber-500 hover:bg-amber-100'
                                        }`}
                                    >
                                        <Eye size={18} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {!isPaid && (
                    <div className="px-6 pt-4 pb-10">
                        {!payer.is_automatic && (
                            <p className={`text-center text-[9px] font-bold uppercase tracking-tight mb-3 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                ¿Te pagaron el periodo {selectedMonth && selectedYear ? `${new Intl.DateTimeFormat('es', { month: 'long' }).format(new Date(selectedYear, selectedMonth - 1)).toUpperCase()} ${selectedYear}` : 'actual'}? Márcalo aquí:
                            </p>
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={() => onApprove(payer, 'cash')}
                                className="flex-1 h-14 rounded-2xl text-white font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg text-center leading-tight hover:brightness-110"
                                style={{ backgroundColor: isReview ? '#f59e0b' : '#10b981' }}
                            >
                                <Banknote size={16} /> {isReview ? 'Aprobar Efectivo' : 'Efectivo'}
                            </button>
                            <button
                                onClick={() => onApprove(payer, 'transfer')}
                                className="flex-1 h-14 rounded-2xl text-white font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg text-center leading-tight hover:brightness-110"
                                style={{ backgroundColor: isReview ? '#d97706' : '#6366f1' }}
                            >
                                <ArrowRightLeft size={16} /> {isReview ? 'Aprobar Transf.' : 'Transferencia'}
                            </button>
                        </div>
                        {payer.is_automatic && (
                            <p className={`text-center text-[9px] font-bold uppercase tracking-tight mt-3 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                * Este apoderado tiene pagos automáticos activados.
                            </p>
                        )}
                    </div>
                )}
                {isPaid && onRevert && (
                    <div className="px-6 pt-4 pb-10">
                        <p className={`text-center text-[9px] font-bold uppercase tracking-tight mb-3 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                            ¿Hubo un error? Puedes anular la aprobación de {selectedMonth && selectedYear ? `${new Intl.DateTimeFormat('es', { month: 'long' }).format(new Date(selectedYear, selectedMonth - 1)).toUpperCase()} ${selectedYear}` : 'este periodo'}:
                        </p>
                        <button
                            onClick={() => {
                                if (confirm('¿Estás seguro de anular esta aprobación?')) {
                                    onRevert(payer);
                                    onClose();
                                }
                            }}
                            className={`w-full h-12 rounded-2xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all border ${
                                isDark ? 'border-amber-500/20 text-amber-500 bg-amber-500/10' : 'border-amber-200 text-amber-600 bg-amber-50'
                            }`}
                        >
                            <RefreshCw size={14} /> Anular Aprobación
                        </button>
                    </div>
                )}
                {isPaid && !onRevert && <div className="pb-10" />}
                {!isPaid && <div className="pb-10" />}
            </div>
        </div>
    );
};

export default BubblePaymentModal;

