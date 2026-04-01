"use client";

import React from 'react';
import { Search, Calendar, Users, ChevronRight, SlidersHorizontal, LayoutGrid, List, RefreshCw } from 'lucide-react';
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
    handleBulkApprove?: (ids: string[]) => Promise<void>;
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
    handleBulkApprove,
}) => {
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
    const [isBulkApproving, setIsBulkApproving] = React.useState(false);
    const [viewMode, setViewMode] = React.useState<'table' | 'cards'>('cards');
    const getPayerRealStats = (payer: any) => {
        const reviewAmount = payer.payments?.filter((p: any) => p.status === 'review' && (p.deleted_at === undefined || !p.deleted_at)).reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
        const pendingAmount = payer.payments?.filter((p: any) => (p.status === 'pending' || p.status === 'overdue') && (p.deleted_at === undefined || !p.deleted_at)).reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
        const approvedAmount = payer.payments?.filter((p: any) => (p.status === 'approved' || p.status === 'paid') && (p.deleted_at === undefined || !p.deleted_at)).reduce((acc: number, p: any) => acc + p.amount, 0) || 0;

        // Si el backend ya calculó el status correctamente (fee_payments), usarlo
        const backendStatus = payer.status; // 'paid' | 'pending' | 'review'
        const backendTotalDue = payer.total_due || 0;

        const hasReview = backendStatus === 'review' || reviewAmount > 0;
        const effectivePending = backendStatus === 'pending' ? (backendTotalDue || pendingAmount) : pendingAmount;
        const numEnrollments = (payer.enrolledStudents || payer.students || []).filter((s: any) => s.deleted_at === undefined || !s.deleted_at).length;
        const displayAmount = paymentFilter === 'history'
            ? (approvedAmount + reviewAmount + effectivePending)
            : (hasReview ? reviewAmount : (effectivePending || 0));

        return { displayAmount, reviewAmount, pendingAmount: effectivePending, approvedAmount, numEnrollments, hasReview };
    };

    const filteredPayers = payers.filter(p => {
        if (p.deleted_at === true) return false;
        const stats = getPayerRealStats(p);
        if (stats.numEnrollments === 0 && paymentFilter !== 'history') return false;
        if (paymentFilter === 'pending') return p.status === 'pending' || stats.pendingAmount > 0;
        if (paymentFilter === 'review') return p.status === 'review' || stats.reviewAmount > 0;
        if (paymentFilter === 'paid') return p.status === 'paid' && stats.pendingAmount === 0 && stats.reviewAmount === 0;
        return true;
    }).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredPayers.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(filteredPayers.map(p => String(p.id))));
    };

    const executeBulkApprove = async () => {
        if (!handleBulkApprove || selectedIds.size === 0) return;
        setIsBulkApproving(true);
        try {
            await handleBulkApprove(Array.from(selectedIds));
            setSelectedIds(new Set());
        } finally {
            setIsBulkApproving(false);
        }
    };

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
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 bg-zinc-400/10 p-1 rounded-xl">
                        <div className="flex items-center gap-2 mr-2 pr-2 border-r border-zinc-500/20">
                            <input 
                                type="checkbox" 
                                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                                checked={filteredPayers.length > 0 && selectedIds.size === filteredPayers.length}
                                onChange={toggleSelectAll}
                            />
                            <span className={`text-[8px] font-black uppercase ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Todos</span>
                        </div>
                        <button 
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? (isDark ? 'bg-zinc-700 text-white' : 'bg-white shadow-sm text-indigo-500') : 'text-zinc-400'}`}
                        >
                            <List size={14} />
                        </button>
                        <button 
                            onClick={() => setViewMode('cards')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'cards' ? (isDark ? 'bg-zinc-700 text-white' : 'bg-white shadow-sm text-indigo-500') : 'text-zinc-400'}`}
                        >
                            <LayoutGrid size={14} />
                        </button>
                    </div>
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

                {/* Bulk Actions Header */}
                {selectedIds.size > 0 && (
                    <div className={`flex items-center justify-between p-4 rounded-2xl animate-in slide-in-from-top-2 duration-300 ${
                        isDark ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                    } border shadow-lg shadow-indigo-500/5`}>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-black">
                                {selectedIds.size}
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest">Apoderados seleccionados</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setSelectedIds(new Set())}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${
                                    isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-white text-zinc-400 hover:text-zinc-600'
                                }`}
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={executeBulkApprove}
                                disabled={isBulkApproving}
                                className="px-6 py-2 bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isBulkApproving ? 'Procesando...' : 'Aprobar Masivamente'}
                            </button>
                        </div>
                    </div>
                )}
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

            {/* PC: Table View */}
            {viewMode === 'table' && (
                <div className={`hidden md:block rounded-3xl border overflow-hidden ${
                    isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'
                }`}>
                <table className="w-full text-left">
                    <thead className={`border-b ${isDark ? 'bg-zinc-800/60 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                        <tr>
                            <th className="px-6 py-4 w-4">
                                <input 
                                    type="checkbox" 
                                    className="accent-indigo-500 w-4 h-4 rounded cursor-pointer"
                                    checked={filteredPayers.length > 0 && selectedIds.size === filteredPayers.length}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            {['Titular','Monto','Estado','Acción'].map((h,i) => (
                                <th key={i} className={`px-6 py-4 text-[10px] font-black uppercase ${isDark ? 'text-zinc-600' : 'text-zinc-400'} ${i===3?'text-right':''}`}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-zinc-50'}`}>
                        {filteredPayers.map((payer: any) => {
                            const stats = getPayerRealStats(payer);
                            const isPaid = (payer.status === 'paid') || (paymentFilter === 'history' && stats.approvedAmount > 0);
                            const students = (payer.enrolledStudents || payer.students || []).filter((s: any) => s.deleted_at === undefined || !s.deleted_at);
                            return (
                                <tr key={payer.id} className={`transition-colors ${isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-50/50'} ${selectedIds.has(String(payer.id)) ? (isDark ? 'bg-indigo-500/5' : 'bg-indigo-50/30') : ''}`}>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="checkbox" 
                                            className="accent-indigo-500 w-4 h-4 rounded cursor-pointer"
                                            checked={selectedIds.has(String(payer.id))}
                                            onChange={() => toggleSelect(String(payer.id))}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <StudentAvatar 
                                                photo={payer.photo} 
                                                name={payer.name} 
                                                size={40} 
                                                isDark={isDark} 
                                                industry={branding?.industry}
                                            />
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-black uppercase ${isDark ? 'text-white' : 'text-zinc-900'}`}>{payer.name}</span>
                                                <div className="flex flex-wrap gap-1 mt-0.5">
                                                    {students.map((s: any) => (
                                                        <div key={s.id} className="flex items-center gap-1">
                                                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${
                                                                isDark ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-100 text-zinc-400'
                                                            }`}>
                                                                {s.name.split(' ')[0]}: {s.enrollment?.plan?.name || s.plan_name || s.course_name || 'Sin plan'}
                                                            </span>
                                                            {s.category?.toLowerCase() === 'kids' && (
                                                                <span className="text-[7px] font-black uppercase bg-fuchsia-500 text-white px-1 rounded-[4px] tracking-tighter shadow-sm animate-pulse">KID</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 text-sm font-black ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{formatMoney(stats.displayAmount)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            {isPaid ? <span className="text-emerald-500 font-black text-[10px] uppercase">✓ Al Día</span>
                                                : stats.hasReview ? <span className="text-amber-400 font-black text-[10px] uppercase animate-pulse">Por Aprobar</span>
                                                : <span className="text-rose-500 font-black text-[10px] uppercase">Pendiente</span>}
                                            {payer.is_automatic && (
                                                <span className="text-[7px] font-black uppercase bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded-md self-start border border-indigo-500/20 shadow-sm animate-pulse">
                                                    PAGO AUTOMÁTICO
                                                </span>
                                            )}
                                        </div>
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
            )}

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
                    industry={branding?.industry}
                />
            )}

            {/* Cards View (Mobile or PC in Cards mode) */}
            <div className={`${viewMode === 'cards' ? 'grid' : 'grid md:hidden'} grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4 pb-12 px-3`}>
                {filteredPayers.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3">
                        <Users size={32} className={isDark ? 'text-zinc-700' : 'text-zinc-200'} />
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-zinc-300'}`}>Sin resultados</p>
                    </div>
                )}
                {filteredPayers.map(payer => {
                    const stats = getPayerRealStats(payer);
                    const isReview = (payer.status === 'review');
                    const isPaid = (payer.status === 'paid');
                    const students = (payer.enrolledStudents || payer.students || []).filter((s: any) => s.deleted_at === undefined || !s.deleted_at);
                    const isPayerParticipating = students.some((s: any) => s.name === payer.name || s.id === payer.id);
                    
                    const statusColor = isPaid ? 'text-emerald-500' : isReview ? 'text-amber-400' : 'text-rose-500';
                    const statusLabel = isPaid ? 'Al día' : isReview ? 'Por aprobar' : 'Pendiente';
                    const statusBg = isPaid ? 'bg-emerald-500/10' : isReview ? 'bg-amber-400/10' : 'bg-rose-500/10';
                    const cardBg = isPaid 
                        ? (isDark ? 'bg-emerald-500/[0.08] border-emerald-500/30' : 'bg-emerald-50 border-emerald-500/20')
                        : isReview 
                            ? (isDark ? 'bg-amber-400/[0.08] border-amber-400/30' : 'bg-amber-50 border-amber-400/20')
                            : (isDark ? 'bg-rose-500/[0.08] border-rose-500/30' : 'bg-rose-50 border-rose-500/20');

                    return (
                        <div key={payer.id} className="relative group">
                            {/* Checkbox for Bulk Actions */}
                            <div className="absolute top-4 left-4 z-20">
                                <input 
                                    type="checkbox" 
                                    className="w-5 h-5 accent-indigo-500 rounded-lg cursor-pointer border-2 border-white/20"
                                    checked={selectedIds.has(String(payer.id))}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        toggleSelect(String(payer.id));
                                    }}
                                />
                            </div>

                            <button 
                                className={`w-full group relative flex flex-col gap-6 p-5 md:p-8 rounded-[2.5rem] border transition-all duration-300 md:hover:translate-y-[-6px] md:hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] md:hover:z-10 ${
                                    selectedIds.has(String(payer.id)) 
                                        ? (isDark ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-indigo-50 border-indigo-200')
                                        : (isDark ? cardBg + ' md:bg-zinc-900/60 md:backdrop-blur-md' : cardBg + ' md:bg-white md:hover:border-zinc-200')
                                }`}
                                onClick={() => setBubbleModalPayer(payer)}
                            >
                                {/* Fila 1: Monto Total y Estado */}
                                <div className="flex items-center justify-between w-full mb-1">
                                    <p className={`text-2xl md:text-4xl font-black tracking-tighter ${statusColor}`}>
                                        {formatMoney(stats.displayAmount)}
                                    </p>
                                    <span className={`px-2.5 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase border ${statusBg} ${statusColor} border-current/10`}>
                                        {statusLabel}
                                    </span>
                                </div>

                                {/* Fila 2: Nombre del Titular */}
                                <div className="flex flex-col text-left mb-6">
                                    <p className={`text-[15px] md:text-[22px] font-black uppercase tracking-tight leading-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                        {payer.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5 md:mt-1">
                                        <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                            Titular del Grupo
                                        </span>
                                        {payer.is_automatic && (
                                            <span className="px-1.5 py-0.5 rounded-full text-[7px] md:text-[9px] font-black uppercase bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                                                Pago Automático
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Fila 3: Cuerpo - Burbujas de Alumnos */}
                                <div className={`w-full flex-1 border-t pt-5 md:pt-8 ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                                    <div className="flex items-center gap-4 overflow-x-auto hide-scrollbar md:grid md:grid-cols-4 md:gap-y-10 md:overflow-visible">
                                        {students.slice(0, 8).map((student: any) => {
                                            const classesCount = student.total_attendances || 0;
                                            const individualAmount = student.enrollment?.amount || student.amount || student.enrollment?.plan?.price || 0;
                                            
                                            return (
                                                <div key={student.id} className="flex flex-col items-center gap-2 flex-shrink-0 md:w-32">
                                                    <StudentAvatar
                                                        photo={student.photo || payer.photo}
                                                        name={student.name}
                                                        size={60}
                                                        beltRank={student.belt_rank}
                                                        degrees={student.degrees ?? 0}
                                                        classesCount={classesCount > 0 ? classesCount : undefined}
                                                        payerStatus={payer.status}
                                                        modality={student.modality}
                                                        showPayerDot={false}
                                                        isDark={isDark}
                                                        industry={branding?.industry}
                                                    />
                                                    <div className="flex flex-col items-center text-center">
                                                        <span className={`text-[9px] md:text-[11px] font-black uppercase tracking-tighter truncate max-w-[50px] md:max-w-[80px] ${isDark ? 'text-zinc-400' : 'text-zinc-900/70'}`}>
                                                            {student.name.split(' ')[0]}
                                                        </span>
                                                        <span className={`text-[8px] md:text-[10px] font-black tracking-widest ${statusColor}`}>
                                                            {formatMoney(individualAmount)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {students.length > 8 && (
                                            <div className="flex flex-col items-center gap-2 shrink-0 h-full justify-center">
                                                <div className={`w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center text-[10px] font-black ${
                                                    isDark ? 'border-zinc-800 text-zinc-700' : 'border-zinc-200 text-zinc-300'
                                                }`}>
                                                    +{students.length - 8}
                                                </div>
                                                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Ver más</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Pie: Quick Action Chevron */}
                                <div className="absolute bottom-6 right-8 hidden md:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`}>Gestionar</span>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-500'}`}>
                                        <ChevronRight size={14} />
                                    </div>
                                </div>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PaymentsSection;
