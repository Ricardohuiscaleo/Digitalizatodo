"use client";

import React from 'react';
import { Search, Eye, RefreshCw, RefreshCw as RefreshCwIcon, CheckCircle2, XCircle, Calendar, ChevronDown, Users, ChevronRight } from 'lucide-react';
import BubblePaymentModal from './BubblePaymentModal';

interface PaymentsSectionProps {
    payers: any[];
    searchTerm: string;
    setSearchTerm: (s: string) => void;
    paymentFilter: string;
    setPaymentFilter: (f: string) => void;
    selectedMonth: number;
    setSelectedMonth: (m: number) => void;
    selectedYear: number;
    setSelectedYear: (y: number) => void;
    paymentDropdownOpen: boolean;
    setPaymentDropdownOpen: (o: boolean) => void;
    expandedPayerId: string | null;
    setExpandedPayerId: (id: string | null) => void;
    branding: any;
    formatMoney: (n: number) => string;
    handlePaymentApprove: (id: string) => void;
    handleLongPressStart: (id: string) => void;
    handleLongPressEnd: () => void;
    setBubbleModalPayer: (p: any) => void;
    setProofModalUrl: (u: string | null) => void;
    bubbleModalPayer: any;
    vocab: any;
}

const PaymentsSection: React.FC<PaymentsSectionProps> = ({
    payers,
    searchTerm,
    setSearchTerm,
    paymentFilter,
    setPaymentFilter,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    paymentDropdownOpen,
    setPaymentDropdownOpen,
    expandedPayerId,
    setExpandedPayerId,
    branding,
    formatMoney,
    handlePaymentApprove,
    handleLongPressStart,
    handleLongPressEnd,
    setBubbleModalPayer,
    setProofModalUrl,
    bubbleModalPayer,
    vocab
}) => {
    const filteredPayers = payers.filter(p => {
        const stats = getPayerRealStats(p);
        if (paymentFilter === 'pending') return stats.pendingAmount > 0;
        if (paymentFilter === 'review') return stats.reviewAmount > 0;
        if (paymentFilter === 'paid') return stats.approvedAmount > 0 && stats.pendingAmount === 0 && stats.reviewAmount === 0;
        return true;
    }).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const getPayerRealStats = (payer: any) => {
        const reviewAmount = payer.payments?.filter((p: any) => p.status === 'review').reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
        const pendingAmount = payer.payments?.filter((p: any) => p.status === 'pending' || p.status === 'overdue').reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
        const approvedAmount = payer.payments?.filter((p: any) => p.status === 'approved').reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
        
        const hasReview = reviewAmount > 0;
        const numEnrollments = (payer.enrolledStudents || payer.students || []).length;
        const displayAmount = paymentFilter === 'history' 
            ? (approvedAmount + reviewAmount + pendingAmount)
            : ((hasReview || (paymentFilter === 'pending' && reviewAmount > 0)) ? reviewAmount : (pendingAmount || 0));
            
        return { displayAmount, reviewAmount, pendingAmount, approvedAmount, numEnrollments, hasReview };
    };

    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const years = [new Date().getFullYear(), new Date().getFullYear() - 1];

    return (
        <div className="space-y-6 px-0 pb-24">
            {/* Contenido de Pagos (Buscador, Tabla, Meses, etc.) */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1 group focus-within:scale-[1.01] transition-all duration-300">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-zinc-950 transition-colors z-10" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="w-full bg-white pl-12 pr-4 py-3 rounded-[2rem] text-sm font-black text-zinc-950 placeholder:text-zinc-300 placeholder:font-black placeholder:uppercase placeholder:tracking-widest focus:outline-none shadow-[6px_6px_12px_#e5e5e5,-6px_-6px_12px_#ffffff] focus:shadow-[inset_3px_3px_6px_#e5e5e5,inset_-3px_-3px_6px_#ffffff] border-2 border-zinc-100 focus:border-zinc-300"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative shrink-0">
                    <button
                        onClick={() => setPaymentDropdownOpen(!paymentDropdownOpen)}
                        className="w-12 h-12 bg-white rounded-2xl border-2 border-zinc-100 flex items-center justify-center shadow-[4px_4px_8px_#e5e5e5,-4px_-4px_8px_#ffffff] active:scale-95 transition-all"
                    >
                        <span className="text-zinc-500 font-black text-lg leading-none">···</span>
                    </button>
                    {paymentDropdownOpen && (
                        <div className="absolute right-0 top-14 w-48 bg-white rounded-2xl shadow-2xl border border-zinc-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                            {[
                                { label: 'Pendientes', value: 'pending' },
                                { label: 'Por aprobar', value: 'review' },
                                { label: 'Pagados', value: 'paid' },
                                { label: 'Historial', value: 'history' },
                            ].map(opt => (
                                <button key={opt.value}
                                    onClick={() => { setPaymentFilter(opt.value); setPaymentDropdownOpen(false); setExpandedPayerId(null); }}
                                    className={`w-full text-left px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-colors hover:bg-zinc-50 ${
                                        paymentFilter === opt.value ? 'text-zinc-950' : 'text-zinc-400'
                                    }`}
                                >
                                    {paymentFilter === opt.value && <span className="mr-2">✓</span>}{opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {paymentFilter === 'history' && (
                <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-4 shadow-sm animate-in slide-in-from-top-2 duration-300">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
                            {months.map((m, idx) => (
                                <button
                                    key={m}
                                    onClick={() => setSelectedMonth(idx + 1)}
                                    className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                                        selectedMonth === idx + 1 
                                        ? "text-white shadow-lg" 
                                        : "bg-zinc-50 text-zinc-400 hover:bg-zinc-100"
                                    }`}
                                    style={selectedMonth === idx + 1 ? { backgroundColor: branding?.primaryColor || '#6366f1' } : {}}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center justify-between border-t border-zinc-50 pt-3">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-zinc-400" />
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Año:</span>
                            </div>
                            <select 
                                value={selectedYear} 
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="bg-zinc-50 border border-zinc-100 rounded-lg px-2 py-1 text-[10px] font-black"
                            >
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-zinc-50 border-b border-zinc-100">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-zinc-400">Titular</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-zinc-400">Monto</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-zinc-400">Estado</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-zinc-400">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {filteredPayers.map(payer => {
                            const stats = getPayerRealStats(payer);
                            const isPaid = (payer.status === 'paid') || (paymentFilter === 'history' && stats.approvedAmount > 0);
                            return (
                                <tr key={payer.id} className="hover:bg-zinc-50/50">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <img src={payer.photo} className="w-10 h-10 rounded-full object-cover" />
                                        <span className="text-sm font-black text-zinc-900 uppercase">{payer.name}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-black">{formatMoney(stats.displayAmount)}</td>
                                    <td className="px-6 py-4">
                                        {isPaid ? (
                                            <span className="text-emerald-600 font-black text-[10px] uppercase">✓ Al Día</span>
                                        ) : stats.hasReview ? (
                                            <span className="text-amber-600 font-black text-[10px] uppercase animate-pulse">Por Aprobar</span>
                                        ) : (
                                            <span className="text-rose-600 font-black text-[10px] uppercase">Pendiente</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => handlePaymentApprove(payer.id)}
                                            style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}
                                            className="px-4 py-2 rounded-xl text-white text-[9px] font-black uppercase shadow-md active:scale-95 transition-all"
                                        >
                                            {stats.hasReview ? 'Aprobar' : 'Pagar'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {bubbleModalPayer && (
                <BubblePaymentModal
                    payer={bubbleModalPayer}
                    vocab={vocab}
                    formatMoney={formatMoney}
                    primaryColor={branding?.primaryColor || '#6366f1'}
                    getPayerRealStats={getPayerRealStats}
                    onClose={() => setBubbleModalPayer(null)}
                    onApprove={(id) => { handlePaymentApprove(id); setBubbleModalPayer(null); }}
                    onViewProof={(url) => setProofModalUrl(url)}
                />
            )}

            <div className="md:hidden grid grid-cols-4 gap-x-3 gap-y-7 px-1 pb-6">
                {filteredPayers.flatMap(payer => {
                    const stats = getPayerRealStats(payer);
                    const isPaid = (payer.status === 'paid');
                    const isReview = !isPaid && stats.hasReview;

                    return (payer.enrolledStudents || payer.students || []).map((student: any) => {
                        const ringColor = isPaid ? 'ring-emerald-400' : isReview ? 'ring-amber-400' : 'ring-rose-400';
                        const dotColor = isPaid ? 'bg-emerald-500' : isReview ? 'bg-amber-400' : 'bg-rose-500';

                        return (
                            <div
                                key={`${payer.id}-${student.id}`}
                                className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                                onMouseDown={() => handleLongPressStart(payer.id)}
                                onMouseUp={handleLongPressEnd}
                                onTouchStart={() => handleLongPressStart(payer.id)}
                                onTouchEnd={handleLongPressEnd}
                                onClick={() => setBubbleModalPayer({ ...payer, _focusStudent: student })}
                            >
                                <div className="relative">
                                    <img src={student.photo || payer.photo} className={`w-[72px] h-[72px] min-w-[72px] min-h-[72px] rounded-full object-cover ring-4 ${ringColor}`} />
                                    <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white ${dotColor}`} />
                                </div>
                                <p className="text-[9px] font-black uppercase text-zinc-700 max-w-[72px] text-center line-clamp-2">{student.name.split(' ')[0]}</p>
                            </div>
                        );
                    });
                })}
            </div>
        </div>
    );
};

export default PaymentsSection;
