"use client";

import React from 'react';
import { Search, Calendar, Users, ChevronRight, SlidersHorizontal, LayoutGrid, List, RefreshCw, ChevronDown, ChevronUp, Eye, Banknote, ArrowRightLeft } from 'lucide-react';
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
    handlePaymentApprove: (payer: any, method?: string) => void;
    handleApproveWithMethod?: (payer: any, method: string) => Promise<void>;
    handleLongPressStart: (id: string) => void;
    handleLongPressEnd: () => void;
    setBubbleModalPayer: (p: any) => void;
    setProofModalUrl: (u: string | null) => void;
    bubbleModalPayer: any;
    vocab: any;
    isDark?: boolean;
    handleBulkApprove?: (ids: string[]) => Promise<void>;
    handleRevertPayment?: (payer: any) => Promise<void>;
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
    handleApproveWithMethod,
    handleLongPressStart,
    handleLongPressEnd,
    setBubbleModalPayer,
    setProofModalUrl,
    bubbleModalPayer,
    vocab,
    isDark = false,
    handleBulkApprove,
    handleRevertPayment,
}) => {
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
    const [isBulkApproving, setIsBulkApproving] = React.useState(false);
    const [viewMode, setViewMode] = React.useState<'table' | 'cards'>('table');
    const [categoryFilter, setCategoryFilter] = React.useState<'all' | 'kids' | 'adults'>('all');

    const getPayerRealStats = (payer: any) => {
        const isHistory = paymentFilter === 'history';

        // Función para verificar si un pago pertenece al mes/año seleccionado
        const matchesSelectedPeriod = (p: any) => {
            if (!isHistory) return true; // Si no es historial, consideramos todo para la deuda global
            const dateStr = p.raw_due_date || p.due_date || p.created_at;
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return (d.getMonth() + 1 === selectedMonth) && (d.getFullYear() === selectedYear);
        };

        const paymentsInScope = (payer.payments || []).filter((p: any) => (p.deleted_at === undefined || !p.deleted_at) && matchesSelectedPeriod(p));

        const reviewAmount = paymentsInScope.filter((p: any) => p.status === 'review').reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
        const pendingAmount = paymentsInScope.filter((p: any) => (p.status === 'pending' || p.status === 'overdue' || p.status === 'pending_review')).reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
        const approvedAmount = paymentsInScope.filter((p: any) => (p.status === 'approved' || p.status === 'paid')).reduce((acc: number, p: any) => acc + p.amount, 0) || 0;

        const backendStatus = payer.status;
        const backendTotalDue = payer.total_due || 0;

        const hasReview = (isHistory ? reviewAmount > 0 : (backendStatus === 'review' || reviewAmount > 0));
        const effectivePending = (isHistory ? pendingAmount : (backendStatus === 'pending' ? (backendTotalDue || pendingAmount) : pendingAmount));
        
        const students = (payer.enrolledStudents || payer.students || []).filter((s: any) => s.deleted_at === undefined || !s.deleted_at);
        const numEnrollments = students.length;
        
        const totalPlanAmount = students.reduce((acc: number, s: any) => acc + (s.amount || s.plan_price || 0), 0);

        const displayAmount = isHistory
            ? (approvedAmount + reviewAmount + effectivePending)
            : (hasReview 
                ? reviewAmount 
                : (effectivePending > 0 
                    ? effectivePending 
                    : (approvedAmount > 0 ? approvedAmount : totalPlanAmount)));

        return { displayAmount, reviewAmount, pendingAmount: effectivePending, approvedAmount, numEnrollments, hasReview, totalPlanAmount };
    };

    const filteredPayers = (payers || []).filter(p => {
        if (p.deleted_at === true) return false;
        const stats = getPayerRealStats(p);
        
        // Filtro por categoría (Adult/Kid) - Más robusto (singular/plural)
        if (categoryFilter !== 'all') {
            const students = (p.enrolledStudents || p.students || []).filter((s: any) => s.deleted_at === undefined || !s.deleted_at);
            const hasCategory = students.some((s: any) => {
                const sCat = s.category?.toLowerCase() || '';
                // Coincidencia flexible: 'adults' coincide con 'adult', 'kids' con 'kid'
                return sCat === categoryFilter || sCat.startsWith(categoryFilter.replace(/s$/, '')) || categoryFilter.startsWith(sCat);
            });
            if (!hasCategory) return false;
        }

        if (stats.numEnrollments === 0 && paymentFilter !== 'history') return false;
        
        // Filtrar por cada estado de pago
        if (paymentFilter === 'pending') return p.status === 'pending' || stats.pendingAmount > 0;
        if (paymentFilter === 'review') return p.status === 'review' || stats.reviewAmount > 0;
        if (paymentFilter === 'paid') return (p.status === 'paid' || p.status === 'approved') && stats.pendingAmount === 0 && stats.reviewAmount === 0;
        
        // Si es historial, solo mostrar los que tienen algo aprobado o pendientes de épocas anteriores
        if (paymentFilter === 'history') return stats.approvedAmount > 0 || stats.pendingAmount > 0 || stats.reviewAmount > 0;
        
        return true;
    }).filter(p => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (p.name || '').toLowerCase().includes(search) || 
               (p.email || '').toLowerCase().includes(search);
    });

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
        { label: 'TODOS', value: 'all' },
        { label: 'PENDIENTE', value: 'pending' },
        { label: 'REVISAR', value: 'review' },
        { label: 'AL DÍA', value: 'paid' },
        { label: 'HISTORIAL', value: 'history' }
    ];

    const formatPlanName = (fullName: string) => {
        if (!fullName) return 'Sin plan';
        const parts = fullName.split(' - ');
        return parts.length > 1 ? parts[1] : fullName;
    };

    return (
        <div className="space-y-4 px-0 pb-24">

            {/* HEADER FIJO MINIMALISTA DE PAGOS */}
            <div className={`sticky top-0 z-50 -mx-4 px-4 py-3 border-b transition-all duration-300 ${
                isDark ? 'bg-zinc-950/90 border-zinc-800' : 'bg-white/90 border-zinc-200'
            } backdrop-blur-xl shadow-sm`}>
                <div className="flex flex-col gap-3">
                    {/* Fila 1: Buscador + View Mode */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`} />
                            <input
                                type="text"
                                placeholder="Buscar apoderado..."
                                className={`w-full border pl-9 pr-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest focus:outline-none transition-colors ${
                                    isDark
                                        ? 'bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-700'
                                        : 'bg-zinc-50 border-zinc-100 text-zinc-900 placeholder:text-zinc-300'
                                }`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-1 bg-zinc-400/10 p-0.5 rounded-lg shrink-0">
                            <button 
                                onClick={() => setViewMode('table')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? (isDark ? 'bg-indigo-500 text-white' : 'bg-white shadow-sm text-indigo-500') : 'text-zinc-500'}`}
                            >
                                <List size={12} />
                            </button>
                            <button 
                                onClick={() => setViewMode('cards')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'cards' ? (isDark ? 'bg-indigo-500 text-white' : 'bg-white shadow-sm text-indigo-500') : 'text-zinc-500'}`}
                            >
                                <LayoutGrid size={12} />
                            </button>
                        </div>
                    </div>

                    {/* Fila 2: Filtros Compactos (Categoría y Estado) */}
                    <div className="flex flex-wrap items-center justify-between gap-y-2">
                        <div className="flex items-center gap-1.5">
                            {/* Categorías */}
                            <div className={`flex p-0.5 rounded-lg ${isDark ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
                                {[
                                    { label: 'TODOS', value: 'all' },
                                    { label: 'ADULT', value: 'adults' },
                                    { label: 'KID', value: 'kids' }
                                ].map((cat) => (
                                    <button
                                        key={cat.value}
                                        onClick={() => setCategoryFilter(cat.value as any)}
                                        className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-tight transition-all ${
                                            categoryFilter === cat.value
                                                ? (isDark ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm' : 'bg-white text-zinc-900 shadow-sm border border-zinc-200')
                                                : (isDark ? 'text-zinc-600 hover:text-zinc-400' : 'text-zinc-400 hover:text-zinc-600')
                                        }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>

                            {/* Separador vertical */}
                            <div className={`w-px h-4 mx-1 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

                            {/* Estados de Pago */}
                            <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
                                {FILTERS.map((f) => (
                                    <button
                                        key={f.value}
                                        onClick={() => { setPaymentFilter(f.value); setExpandedPayerId(null); }}
                                        className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-tight whitespace-nowrap transition-all ${
                                            paymentFilter === f.value
                                                ? (isDark ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-indigo-50 text-indigo-600 border border-indigo-100')
                                                : (isDark ? 'text-zinc-600 hover:text-zinc-400' : 'text-zinc-400 hover:text-zinc-600')
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Switch de Historial (Si es necesario destacar) */}
                        <button 
                            onClick={() => {
                                const newVal = paymentFilter === 'history' ? 'pending' : 'history';
                                setPaymentFilter(newVal); 
                                setExpandedPayerId(null);
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[8px] font-black uppercase transition-all ${
                                paymentFilter === 'history'
                                    ? 'bg-amber-400/10 border-amber-400 text-amber-500'
                                    : (isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-600' : 'bg-zinc-50 border-zinc-200 text-zinc-400')
                            }`}
                        >
                            <Calendar size={10} />
                            Historial
                        </button>
                    </div>
                </div>
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
                                disabled={selectedIds.size === 0 || isBulkApproving}
                                className="px-6 py-2 bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isBulkApproving ? 'Procesando...' : 'Aprobar Masivamente'}
                            </button>
                        </div>
                    </div>
                )}

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
                            {['Titular','Alumnos y Planes','Monto','Estado','Acción'].map((h,i) => (
                                <th key={i} className={`px-6 py-4 text-[10px] font-black uppercase ${isDark ? 'text-zinc-600' : 'text-zinc-400'} ${i===4?'text-right':''}`}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-zinc-50'}`}>
                        {filteredPayers.map((payer: any) => {
                            const stats = getPayerRealStats(payer);
                            const isPaid = (payer.status === 'paid') || (paymentFilter === 'history' && stats.approvedAmount > 0);
                            const students = (payer.enrolledStudents || payer.students || []).filter((s: any) => s.deleted_at === undefined || !s.deleted_at);
                            const isExpanded = expandedPayerId === String(payer.id);

                            // Mapa student_id → plan_name y amount desde payments (fuente de verdad)
                            const studentPlanMap: Record<number, string> = {};
                            const studentAmountMap: Record<number, number> = {};
                            (payer.payments || []).forEach((p: any) => {
                                if (p.student_id) {
                                    if (p.plan_name) studentPlanMap[p.student_id] = p.plan_name;
                                    if (p.amount) studentAmountMap[p.student_id] = p.amount;
                                }
                            });
                            
                            return (
                                <React.Fragment key={payer.id}>
                                    <tr className={`transition-all border-l-4 ${
                                        isExpanded 
                                            ? (isDark ? 'border-indigo-500 bg-indigo-500/10' : 'border-indigo-500 bg-indigo-50/50') 
                                            : 'border-transparent'
                                    } ${isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-50/50'} ${selectedIds.has(String(payer.id)) ? (isDark ? 'bg-indigo-500/5' : 'bg-indigo-50/30') : ''}`}>
                                        <td className="px-6 py-5">
                                            <input 
                                                type="checkbox" 
                                                className="accent-indigo-500 w-4 h-4 rounded cursor-pointer"
                                                checked={selectedIds.has(String(payer.id))}
                                                onChange={() => toggleSelect(String(payer.id))}
                                            />
                                        </td>
                                        <td className="px-6 py-5 cursor-pointer group/row" onClick={() => setExpandedPayerId(isExpanded ? null : String(payer.id))}>
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col flex-1">
                                                    <span className={`text-sm font-black uppercase ${isDark ? 'text-white' : 'text-zinc-900'}`}>{payer.name}</span>
                                                    <span className={`text-[8px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Titular</span>
                                                </div>
                                                <div className={`p-1.5 rounded-lg transition-all ${isExpanded ? 'bg-indigo-500 text-white' : isDark ? 'bg-zinc-800 text-zinc-500 group-hover/row:text-zinc-300' : 'bg-zinc-100 text-zinc-400 group-hover/row:text-zinc-600'}`}>
                                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-wrap gap-2">
                                                {students.map((s: any) => (
                                                    <div key={s.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-50 border-zinc-100 shadow-sm'}`}>
                                                        <span className={`text-[10px] font-black uppercase ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                                            {s.name.split(' ')[0]}: 
                                                            <span className={`ml-1 font-bold ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                                                {formatPlanName(studentPlanMap[s.id] || s.enrollment?.plan?.name || s.plan_name || 'Sin plan')}
                                                            </span>
                                                        </span>
                                                        
                                                        <span className={`text-[10px] font-black ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`}>
                                                            {formatMoney(studentAmountMap[s.id] || s.amount || s.plan_price || 0)}
                                                        </span>
    
                                                        <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black border uppercase shadow-sm ${
                                                            s.category?.toLowerCase() === 'kids' 
                                                                ? 'text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/20' 
                                                                : 'text-sky-500 bg-sky-500/10 border-sky-500/20'
                                                        }`}>
                                                            {s.category?.toLowerCase() === 'kids' ? 'KID' : 'ADULT'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                         <td className="px-6 py-5">
                                             <div className="flex flex-col">
                                                 <span className={`text-sm font-black ${isPaid ? 'text-emerald-500' : isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                                                     {formatMoney(stats.displayAmount)}
                                                 </span>
                                                 {isPaid && (() => {
                                                     const currentPayment = (payer.payments ?? []).find((p: any) => {
                                                         // Usar raw_due_date para comparar mes/año de forma más segura
                                                         if (!p.raw_due_date) return false;
                                                         const d = new Date(p.raw_due_date);
                                                         return (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear;
                                                     });
                                                     
                                                     const method = currentPayment?.payment_method?.toLowerCase() || '';
                                                     if (!method) return null;

                                                     const isMercadoPago = method.includes('mercadopago') || method.includes('mp') || method.includes('card');
                                                     const isCash = method === 'cash' || method === 'efectivo';
                                                     const isTransfer = method === 'transfer' || method === 'transferencia';
                                                     
                                                     let label = method;
                                                     if (isMercadoPago) label = 'Mercado Pago';
                                                     else if (isCash) label = 'Efectivo';
                                                     else if (isTransfer) label = 'Transferencia';

                                                     return (
                                                         <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-md border self-start mt-1 shadow-sm ${
                                                             isMercadoPago 
                                                                 ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
                                                                 : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                         }`}>
                                                             {label}
                                                         </span>
                                                     );
                                                 })()}
                                             </div>
                                         </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1">
                                                {isPaid ? <span className="text-emerald-500 font-black text-[10px] uppercase">✓ Al Día</span>
                                                    : stats.hasReview ? <span className="text-amber-400 font-black text-[10px] uppercase animate-pulse">Por Aprobar</span>
                                                    : <span className="text-rose-500 font-black text-[10px] uppercase">Pendiente</span>}
                                                {payer.is_automatic && (
                                                    <span className="text-[7px] font-black uppercase bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded-md self-start border border-indigo-500/20 shadow-sm">
                                                        PAGO AUTOMÁTICO
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            {isPaid ? (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm(`¿Estás seguro de anular el pago de ${new Intl.DateTimeFormat('es', { month: 'long' }).format(new Date(selectedYear, selectedMonth - 1)).toUpperCase()}?`)) {
                                                            handleRevertPayment?.(payer);
                                                        }
                                                    }}
                                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-md hover:shadow-lg transition-all cursor-pointer border ${
                                                        isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20' : 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                                                    }`}
                                                >
                                                    Anular
                                                </button>
                                            ) : (
                                                <button onClick={(e) => { e.stopPropagation(); setBubbleModalPayer(payer); }}
                                                    style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}
                                                    className="px-4 py-2 rounded-xl text-white text-[9px] font-black uppercase shadow-md hover:shadow-lg hover:brightness-110 transition-all cursor-pointer"
                                                >{stats.hasReview ? 'Aprobar' : 'Pagar'}</button>
                                            )}
                                        </td>
                                    </tr>
                                    
                                    {/* Expanded View */}
                                    {isExpanded && (
                                        <tr className={`transition-all border-l-4 border-indigo-500 ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50/50'}`}>
                                            <td colSpan={6} className="px-6 pb-10 pt-2">
                                                <div className={`animate-in slide-in-from-top-2 duration-300 p-6 rounded-3xl ${
                                                    isDark ? 'bg-zinc-950/40' : 'bg-white/40'
                                                }`}>
                                                    <div className="flex items-center justify-between mb-6">
                                                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                                            Desglose Detallado: <span className={isDark ? 'text-white' : 'text-zinc-900'}>{payer.name}</span>
                                                        </p>
                                                        <div className="flex items-center gap-3">
                                                            {isPaid && handleRevertPayment && (
                                                                <button
                                                                    onClick={() => {
                                                                        if (confirm(`¿Estás seguro de anular el pago de ${new Intl.DateTimeFormat('es', { month: 'long' }).format(new Date(selectedYear, selectedMonth - 1)).toUpperCase()}?`)) {
                                                                            handleRevertPayment(payer);
                                                                        }
                                                                    }}
                                                                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border transition-all ${
                                                                        isDark ? 'border-amber-500/20 text-amber-500 bg-amber-500/10 hover:bg-amber-500/20' : 'border-amber-200 text-amber-600 bg-amber-50 hover:bg-amber-100'
                                                                    }`}
                                                                >
                                                                    Anular Pago
                                                                </button>
                                                            )}
                                                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                                                                isPaid ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/10' : 'border-rose-500/20 text-rose-500 bg-rose-500/10'
                                                            }`}>
                                                            {isPaid ? 'Al Día' : 'Pendiente de Pago'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                        {students.map((s: any) => {
                                                            const studentPayment = (payer.payments || []).find((p: any) => p.student_id === s.id);
                                                            const sStatus = studentPayment?.status || 'pending';
                                                            const sAmount = studentAmountMap[s.id] || s.amount || s.plan_price || 0;
                                                            const sPlan = studentPlanMap[s.id] || s.enrollment?.plan?.name || s.plan_name || 'Sin plan';

                                                            return (
                                                                <div key={s.id} className={`flex items-center gap-4 p-4 rounded-2xl border ${
                                                                    isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'
                                                                }`}>
                                                                    <StudentAvatar
                                                                        photo={s.photo}
                                                                        name={s.name}
                                                                        size={44}
                                                                        beltRank={s.belt_rank}
                                                                        degrees={s.degrees ?? 0}
                                                                        isDark={isDark}
                                                                        industry={branding?.industry}
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center justify-between">
                                                                            <p className={`text-[11px] font-black uppercase truncate ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
                                                                                {s.name}
                                                                            </p>
                                                                            <p className={`text-[11px] font-black ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                                                                {formatMoney(sAmount)}
                                                                            </p>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <span className={`text-[8px] font-bold uppercase ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                                                                {formatPlanName(sPlan)}
                                                                            </span>
                                                                            <span className={`px-1.5 rounded-md text-[7px] font-black border uppercase ${
                                                                                s.category?.toLowerCase() === 'kids' 
                                                                                    ? 'text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/20' 
                                                                                    : 'text-sky-500 bg-sky-500/10 border-sky-500/20'
                                                                            }`}>
                                                                                {s.category?.toLowerCase() === 'kids' ? 'KID' : 'ADULT'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    {studentPayment?.proof_url && (
                                                                        <button
                                                                            onClick={() => setProofModalUrl(studentPayment.proof_url)}
                                                                            className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                                                                                isDark ? 'bg-amber-400/10 border-amber-400/20 text-amber-500 hover:bg-amber-400/20' : 'bg-amber-50 border-amber-100 text-amber-500 hover:bg-amber-100'
                                                                            }`}
                                                                        >
                                                                            <Eye size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {!isPaid && (
                                                        <div className={`mt-8 pt-6 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
                                                            <p className={`text-[9px] font-black uppercase tracking-tight mb-4 text-center ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                                                Seleccione el método para confirmar el pago de {new Intl.DateTimeFormat('es', { month: 'long' }).format(new Date(selectedYear, selectedMonth - 1)).toUpperCase()} {selectedYear} por {formatMoney(stats.displayAmount)}:
                                                            </p>
                                                            <div className="flex justify-center gap-3">
                                                                <button
                                                                    onClick={() => handlePaymentApprove(payer, 'cash')}
                                                                    className="flex-1 h-14 rounded-2xl text-white font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg text-center leading-tight hover:brightness-110"
                                                                    style={{ backgroundColor: stats.hasReview ? '#f59e0b' : '#10b981' }}
                                                                >
                                                                    <Banknote size={16} /> {stats.hasReview ? 'Aprobar Efectivo' : 'Efectivo'}
                                                                </button>
                                                                <button
                                                                    onClick={() => handlePaymentApprove(payer, 'transfer')}
                                                                    className="flex-1 h-14 rounded-2xl text-white font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg text-center leading-tight hover:brightness-110"
                                                                    style={{ backgroundColor: stats.hasReview ? '#d97706' : '#6366f1' }}
                                                                >
                                                                    <ArrowRightLeft size={16} /> {stats.hasReview ? 'Aprobar Transf.' : 'Transferencia'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
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
                    onApprove={async (payer, method = 'cash') => { setBubbleModalPayer(null); if (handleApproveWithMethod) { await handleApproveWithMethod(payer, method); } else { handlePaymentApprove(payer, method); } }}
                    onViewProof={(url) => setProofModalUrl(url)}
                    onRevert={handleRevertPayment}
                    isDark={isDark}
                    industry={branding?.industry}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
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
                    // Mapa student_id → plan_name y amount desde payments (fuente de verdad)
                    const studentPlanMap: Record<number, string> = {};
                    const studentAmountMap: Record<number, number> = {};
                    (payer.payments || []).forEach((p: any) => {
                        if (p.student_id) {
                            if (p.plan_name) studentPlanMap[p.student_id] = p.plan_name;
                            if (p.amount) studentAmountMap[p.student_id] = p.amount;
                        }
                    });
                    
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
                                <div className="flex items-center justify-between w-full mb-1">
                                    <p className={`text-2xl md:text-4xl font-black tracking-tighter ${statusColor}`}>
                                        {formatMoney(stats.displayAmount)}
                                    </p>
                                    <span className={`px-2.5 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase border ${statusBg} ${statusColor} border-current/10`}>
                                        {statusLabel}
                                    </span>
                                </div>

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

                                <div className={`w-full flex-1 border-t pt-5 md:pt-8 ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                                    <div className="flex items-center gap-4 overflow-x-auto hide-scrollbar md:grid md:grid-cols-4 md:gap-y-10 md:overflow-visible">
                                        {students.slice(0, 12).map((student: any) => {
                                            const classesCount = student.total_attendances || 0;
                                            const individualAmount = studentAmountMap[student.id] || student.amount || student.plan_price || 0;
                                            
                                            return (
                                                <div key={student.id} className="flex flex-col items-center gap-2 flex-shrink-0 md:w-32">
                                                    <StudentAvatar
                                                        photo={student.photo}
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
                                                        <div className="flex flex-col items-center gap-0.5">
                                                            <div className="flex items-center gap-1">
                                                                <span className={`text-[7px] md:text-[9px] font-bold ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                                                    {formatPlanName(studentPlanMap[student.id] || student.enrollment?.plan?.name || 'Sin plan')}
                                                                </span>
                                                                <span className={`px-1 rounded-[3px] text-[6px] md:text-[7px] font-black border uppercase ${
                                                                    student.category?.toLowerCase() === 'kids' 
                                                                        ? 'text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/20' 
                                                                        : 'text-sky-500 bg-sky-500/10 border-sky-500/20'
                                                                }`}>
                                                                    {student.category?.toLowerCase() === 'kids' ? 'KID' : 'ADULT'}
                                                                </span>
                                                            </div>
                                                            <span className={`text-[8px] md:text-[10px] font-black tracking-widest ${statusColor}`}>
                                                                {formatMoney(individualAmount)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

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
