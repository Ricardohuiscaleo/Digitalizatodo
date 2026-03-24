"use client";

import React from 'react';
import { Search, Calendar, Users, ChevronRight, SlidersHorizontal } from 'lucide-react';
import BubblePaymentModal from './BubblePaymentModal';
import { StudentAvatar } from './Industries/MartialArts/StudentAvatar';

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
    isDark?: boolean;
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
    vocab,
    isDark = false,
}) => {
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

    const filteredPayers = payers.filter(p => {
        const stats = getPayerRealStats(p);
        if (paymentFilter === 'pending') return stats.pendingAmount > 0;
        if (paymentFilter === 'review') return stats.reviewAmount > 0;
        if (paymentFilter === 'paid') return stats.approvedAmount > 0 && stats.pendingAmount === 0 && stats.reviewAmount === 0;
        return true;
    }).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const years = [new Date().getFullYear(), new Date().getFullYear() - 1];

    const FILTERS = [
        { label: 'Todos', value: 'all' },
        { label: 'Pendiente', value: 'pending' },
        { label: 'Revisar', value: 'review' },
        { label: 'Al día', value: 'paid' },
    ];

    return (
        <div className="space-y-4 px-0 pb-24">

            {/* Buscador + pill filters */}
            <div className="space-y-3">
                <div className="relative">
                    <Search size={13} className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`} />
                    <input
                        type="text"
                        placeholder="Buscar apoderado..."
                        className={`w-full border pl-10 pr-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest placeholder:font-black placeholder:uppercase placeholder:tracking-widest focus:outline-none transition-colors ${
                            isDark
                                ? 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-zinc-500'
                                : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-300 focus:border-zinc-400'
                        }`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className={`flex p-1 rounded-2xl h-10 relative ${isDark ? 'bg-zinc-800/80' : 'bg-zinc-100/60'}`}>
                    <div
                        className={`absolute inset-y-1 rounded-xl shadow-sm border transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                            isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-zinc-100'
                        }`}
                        style={{
                            width: `calc(${100 / FILTERS.length}% - 2px)`,
                            transform: `translateX(${FILTERS.findIndex(f => f.value === paymentFilter) * 100}%)`
                        }}
                    />
                    {FILTERS.map(f => (
                        <button key={f.value}
                            onClick={() => { setPaymentFilter(f.value); setExpandedPayerId(null); }}
                            className={`flex-1 relative z-10 flex items-center justify-center text-[9px] font-black uppercase tracking-widest transition-colors duration-200 ${
                                paymentFilter === f.value
                                    ? isDark ? 'text-white' : 'text-zinc-950'
                                    : isDark ? 'text-zinc-500' : 'text-zinc-400'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {paymentFilter === 'history' && (
                <div className={`border rounded-[2.5rem] p-4 animate-in slide-in-from-top-2 duration-300 ${
                    isDark ? 'bg-zinc-800/60 border-zinc-700' : 'bg-white border-zinc-100 shadow-sm'
                }`}>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
                            {months.map((m, idx) => (
                                <button key={m} onClick={() => setSelectedMonth(idx + 1)}
                                    className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                                        selectedMonth === idx + 1
                                            ? 'text-white shadow-lg'
                                            : isDark ? 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
                                    }`}
                                    style={selectedMonth === idx + 1 ? { backgroundColor: branding?.primaryColor || '#6366f1' } : {}}
                                >{m}</button>
                            ))}
                        </div>
                        <div className={`flex items-center justify-between border-t pt-3 ${isDark ? 'border-zinc-700' : 'border-zinc-50'}`}>
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className={isDark ? 'text-zinc-500' : 'text-zinc-400'} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Año:</span>
                            </div>
                            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className={`border rounded-lg px-2 py-1 text-[10px] font-black ${
                                    isDark ? 'bg-zinc-700 border-zinc-600 text-white' : 'bg-zinc-50 border-zinc-100 text-zinc-700'
                                }`}
                            >
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop tabla */}
            <div className={`hidden md:block rounded-3xl border overflow-hidden ${
                isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'
            }`}>
                <table className="w-full text-left">
                    <thead className={`border-b ${isDark ? 'bg-zinc-800/60 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                        <tr>
                            {['Titular','Monto','Estado','Acción'].map((h,i) => (
                                <th key={i} className={`px-6 py-4 text-[10px] font-black uppercase ${isDark ? 'text-zinc-600' : 'text-zinc-400'} ${i===3?'text-right':''}`}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-zinc-50'}`}>
                        {filteredPayers.map(payer => {
                            const stats = getPayerRealStats(payer);
                            const isPaid = (payer.status === 'paid') || (paymentFilter === 'history' && stats.approvedAmount > 0);
                            return (
                                <tr key={payer.id} className={`transition-colors ${isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-50/50'}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img src={payer.photo} className="w-10 h-10 rounded-full object-cover" />
                                            <span className={`text-sm font-black uppercase ${isDark ? 'text-white' : 'text-zinc-900'}`}>{payer.name}</span>
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 text-sm font-black ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{formatMoney(stats.displayAmount)}</td>
                                    <td className="px-6 py-4">
                                        {isPaid ? <span className="text-emerald-500 font-black text-[10px] uppercase">✓ Al Día</span>
                                            : stats.hasReview ? <span className="text-amber-400 font-black text-[10px] uppercase animate-pulse">Por Aprobar</span>
                                            : <span className="text-rose-500 font-black text-[10px] uppercase">Pendiente</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handlePaymentApprove(payer.id)}
                                            style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}
                                            className="px-4 py-2 rounded-xl text-white text-[9px] font-black uppercase shadow-md active:scale-95 transition-all"
                                        >{stats.hasReview ? 'Aprobar' : 'Pagar'}</button>
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
                    isDark={isDark}
                />
            )}

            {/* Mobile lista */}
            <div className="md:hidden space-y-3 pb-12 px-3">
                {filteredPayers.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Users size={32} className={isDark ? 'text-zinc-700' : 'text-zinc-200'} />
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-zinc-300'}`}>Sin resultados</p>
                    </div>
                )}
                {filteredPayers.map(payer => {
                    const stats = getPayerRealStats(payer);
                    const isPaid = payer.status === 'paid' || (stats.approvedAmount > 0 && stats.pendingAmount === 0 && stats.reviewAmount === 0);
                    const isReview = !isPaid && stats.reviewAmount > 0;
                    const students = payer.enrolledStudents || payer.students || [];
                    
                    const statusColor = isPaid ? 'text-emerald-500' : isReview ? 'text-amber-400' : 'text-rose-500';
                    const statusLabel = isPaid ? 'Al día' : isReview ? 'Por aprobar' : 'Pendiente';
                    const statusBg = isPaid ? 'bg-emerald-500/10' : isReview ? 'bg-amber-400/10' : 'bg-rose-500/10';
                    const cardBg = isPaid 
                        ? (isDark ? 'bg-emerald-500/[0.08] border-emerald-500/30' : 'bg-emerald-50 border-emerald-500/20')
                        : isReview 
                            ? (isDark ? 'bg-amber-400/[0.08] border-amber-400/30' : 'bg-amber-50 border-amber-400/20')
                            : (isDark ? 'bg-rose-500/[0.08] border-rose-500/30' : 'bg-rose-50 border-rose-500/20');

                    return (
                        <button key={payer.id}
                            className={`w-full flex flex-col gap-2.5 py-2.5 px-4 rounded-[1.8rem] border transition-all active:scale-[0.97] ${cardBg}`}
                            onMouseDown={() => handleLongPressStart(payer.id)}
                            onMouseUp={handleLongPressEnd}
                            onTouchStart={() => handleLongPressStart(payer.id)}
                            onTouchEnd={handleLongPressEnd}
                            onClick={() => setBubbleModalPayer(payer)}
                        >
                            {/* Nivel 1 & 2: Alumnos (Avatar + Nombre Abajo) */}
                            <div className="flex items-center gap-4 overflow-x-auto hide-scrollbar pt-2 pl-2 pb-1.5 min-h-[72px]">
                                {students.slice(0, 4).map((student: any) => {
                                    const classesCount = (student.total_attendances || 0) + (student.previous_classes || 0) - (student.belt_classes_at_promotion || 0);
                                    
                                    return (
                                        <div key={student.id} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                                            <StudentAvatar
                                                photo={student.photo || payer.photo}
                                                name={student.name}
                                                size={46}
                                                beltRank={student.belt_rank}
                                                degrees={student.degrees ?? 0}
                                                classesCount={classesCount > 0 ? classesCount : undefined}
                                                isDark={isDark}
                                            />
                                            <span className={`text-[8px] font-black uppercase tracking-tighter text-center max-w-[48px] truncate ${isDark ? 'text-zinc-500' : 'text-zinc-900/60'}`}>
                                                {student.name.split(' ')[0]}
                                            </span>
                                        </div>
                                    );
                                })}
                                {students.length > 4 && (
                                    <div className="flex flex-col items-center gap-1.5 pr-2">
                                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-[10px] font-black ${
                                            isDark ? 'bg-zinc-800 text-zinc-600' : 'bg-zinc-100 text-zinc-300'
                                        }`}>
                                            +{students.length - 4}
                                        </div>
                                        <span className="text-[8px] font-black uppercase text-zinc-700">Más</span>
                                    </div>
                                )}
                            </div>

                            <div className={`space-y-2 pb-0.5 pt-2 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                                {/* Nivel 3: Titular */}
                                <div className="text-left">
                                    <p className={`text-[15px] font-black uppercase tracking-tight leading-none ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                        {payer.name}
                                    </p>
                                </div>

                                {/* Nivel 4: Total y Botón Gestionar */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${statusBg} ${statusColor} border-current/10 font-black`}>
                                            {statusLabel}
                                        </span>
                                        <p className={`text-base font-black tracking-tighter ${statusColor}`}>
                                            {formatMoney(stats.displayAmount)}
                                        </p>
                                    </div>
                                    <div className={`flex items-center gap-1.5 pr-1 ${statusColor} opacity-70`}>
                                        <span className="text-[9px] font-black uppercase tracking-widest">Gestionar</span>
                                        <ChevronRight size={14} />
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default PaymentsSection;
