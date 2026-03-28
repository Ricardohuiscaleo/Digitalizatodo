"use client";

import React from 'react';
import { 
    Plus, Loader2, DollarSign, RefreshCw, Calendar, Trash2, Users, 
    CalendarCheck, X, Eye, CheckCircle2, Banknote, Search, CreditCard
} from 'lucide-react';

interface FeesSectionProps {
    feesList: any[];
    feesLoading: boolean;
    feeSubmitting: boolean;
    feeForm: any;
    setFeeForm: (form: any) => void;
    feeFormError: string | null;
    showCreateFee: boolean;
    setShowCreateFee: (show: boolean) => void;
    loadFees: () => void;
    handleCreateFee: (e: React.FormEvent) => void;
    handleDeleteFee: (id: any) => void;
    handleRejectFeePayment: (gId: number, pId: number, notes?: string) => void;
    formatMoney: (v: any) => string;
    formatCLP: (v: number) => string;
    parseCLP: (v: string) => number;
    nowCL: () => Date;
    STATUS_LABEL: Record<string, any>;
    selectedFee: any;
    setSelectedFee: (fee: any) => void;
    feeDetailLoading: boolean;
    feePayments: any[];
    openFee: (fee: any) => void;
    approvingFeePayment: any;
    setApprovingFeePayment: (payment: any) => void;
    feeApproveMethod: "cash" | "transfer" | string;
    setFeeApproveMethod: (method: any) => void;
    feeApproveNotes: string;
    setFeeApproveNotes: (notes: string) => void;
    handleApproveFeePayment: () => void;
    feeApprovingLoading: boolean;
    feeProofUrl: string | null;
    setFeeProofUrl: (url: string | null) => void;
    branding: any;
    feesSearch: string;
    setFeesSearch: (v: string) => void;
    feesView: 'list' | 'history';
    setFeesView: (v: 'list' | 'history') => void;
    feesGuardians: any[];
    feesGuardiansLoading: boolean;
}

export default function FeesSection(props: FeesSectionProps) {
    const {
        feesList, feesLoading, feeSubmitting, feeForm, setFeeForm,
        feeFormError, showCreateFee, setShowCreateFee, loadFees,
        handleCreateFee, handleDeleteFee, handleRejectFeePayment, formatMoney, formatCLP,
        parseCLP, nowCL, STATUS_LABEL, selectedFee, setSelectedFee,
        feeDetailLoading, feePayments, openFee, approvingFeePayment,
        setApprovingFeePayment, feeApproveMethod, setFeeApproveMethod,
        feeApproveNotes, setFeeApproveNotes, handleApproveFeePayment,
        feeApprovingLoading, feeProofUrl, setFeeProofUrl,
        branding, feesSearch, setFeesSearch, feesView, setFeesView,
        feesGuardians, feesGuardiansLoading
    } = props;

    const isSchool = branding?.industry === 'school_treasury';

    const nowM = nowCL().getMonth() + 1;
    const nowY = nowCL().getFullYear();
    const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const YEARS = [nowY, nowY + 1];
    const startY = parseInt(feeForm.start_year || String(nowY));

    return (
        <div className="space-y-4 pb-24">
            {/* Header con Buscador y Tabs */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md pt-2 pb-1 -mx-2 px-2 space-y-3">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-600 transition-colors">
                            <Search size={16} />
                        </div>
                        <input 
                            type="text"
                            placeholder="Buscar cuota o apoderado..."
                            value={feesSearch}
                            onChange={(e) => setFeesSearch(e.target.value)}
                            className="w-full h-11 bg-zinc-50 border border-zinc-100 rounded-2xl pl-11 pr-4 text-xs font-bold text-zinc-900 placeholder:text-zinc-300 outline-none focus:ring-2 focus:ring-zinc-100 focus:bg-white transition-all shadow-sm"
                        />
                    </div>
                    <button onClick={() => { loadFees(); setShowCreateFee(true); }}
                        style={{ backgroundColor: branding?.primaryColor || '#18181b' }}
                        className="flex items-center justify-center w-11 h-11 text-white rounded-2xl active:scale-95 transition-all shadow-lg shadow-zinc-100 shrink-0">
                        <Plus size={20} />
                    </button>
                </div>

                {isSchool && (
                    <div className="flex bg-zinc-100/50 p-1 rounded-2xl h-11 relative">
                        <div 
                            className="absolute inset-y-1 rounded-xl bg-white shadow-sm border border-zinc-100 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                            style={{ 
                                width: 'calc(50% - 2px)',
                                transform: `translateX(${feesView === 'list' ? '0' : '100%'})`
                            }}
                        />
                        {(['list', 'history'] as const).map((view) => (
                            <button 
                                key={view}
                                onClick={() => setFeesView(view)}
                                className={`flex-1 relative z-10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 ${
                                    feesView === view ? 'text-zinc-950' : 'text-zinc-400'
                                }`}
                            >
                                {view === 'list' ? <CreditCard size={14} /> : <RefreshCw size={14} />}
                                <span>{view === 'list' ? 'Cuotas' : 'Historial'}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {feesLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-zinc-300" size={24} /></div>
            ) : feesView === 'list' ? (
                feesList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                            <DollarSign size={28} className="text-zinc-300" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Sin cuotas creadas</p>
                        <button onClick={() => setShowCreateFee(true)}
                            className="h-10 px-6 bg-zinc-950 text-white text-[10px] font-black uppercase rounded-xl active:scale-95">
                            Crear primera cuota
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {feesList.map(fee => {
                            const paidCount = fee.paid_count || 0;
                            const reviewCount = fee.review_count || 0;
                            const totalCount = fee.total_count || 0;
                            const pendingCount = totalCount - paidCount - reviewCount;
                            const progress = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;
                            return (
                                <div key={fee.id} className="bg-white border border-zinc-100 rounded-[1.8rem] p-4 shadow-sm">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-black text-zinc-900 uppercase leading-tight">{fee.title}</h3>
                                            {fee.description && <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{fee.description}</p>}
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="text-base font-black text-zinc-950">{formatMoney(fee.amount)}</span>
                                                {fee.type === 'recurring' ? (
                                                    <span className="flex items-center gap-1 text-[9px] font-bold text-violet-500 uppercase bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full">
                                                        <RefreshCw size={9} /> Día {fee.recurring_day} c/mes
                                                    </span>
                                                ) : fee.due_date ? (
                                                    <span className="flex items-center gap-1 text-[9px] font-bold text-zinc-400 uppercase">
                                                        <Calendar size={10} /> Vence {new Date(fee.due_date + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteFee(fee.id)}
                                            className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-400 active:scale-95 border border-rose-100 shrink-0">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="mb-2">
                                        <div className="flex justify-between text-[9px] font-black uppercase text-zinc-400 mb-1">
                                            <span>{paidCount} pagados</span>
                                            <span>{progress}%</span>
                                        </div>
                                        <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {paidCount > 0 && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">{paidCount} pagados</span>}
                                            {reviewCount > 0 && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">{reviewCount} en revisión</span>}
                                            {pendingCount > 0 && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">{pendingCount} pendientes</span>}
                                        </div>
                                        <button onClick={() => openFee(fee)}
                                            className="h-8 px-3 rounded-xl bg-zinc-950 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 active:scale-95 shadow-sm shrink-0">
                                            <Users size={12} /> Ver apoderados
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : feesView === 'history' ? (
                feesGuardiansLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-zinc-300" size={24} /></div>
                ) : !feesGuardians || feesGuardians.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Users size={28} className="text-zinc-200" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center px-8">Sin apoderados con deuda</p>
                        <button onClick={loadFees} className="text-[9px] font-black uppercase text-zinc-400 hover:text-zinc-600 flex items-center gap-2">
                            <RefreshCw size={10} /> Actualizar ahora
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-2 mb-2">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Resumen por Apoderado</h3>
                            <button onClick={loadFees} className="text-[10px] text-zinc-400 hover:text-zinc-900 active:scale-95">
                                <RefreshCw size={12} />
                            </button>
                        </div>
                        {feesGuardians.map((g: any, i: number) => (
                            <div key={g.guardian_id || i} className="bg-white border border-zinc-100 rounded-[1.8rem] p-4 shadow-sm flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 overflow-hidden">
                                    {g.guardian_photo ? <img src={g.guardian_photo} className="w-full h-full object-cover" /> : <Users size={16} className="text-zinc-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-black text-zinc-900 uppercase truncate">{g.guardian_name || 'Apoderado'}</h4>
                                    <p className="text-[10px] text-zinc-400 mt-0.5">{g.pending_count || 0} cuotas pendientes</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-rose-500">{formatMoney(g.total_pending || 0)}</p>
                                    <p className="text-[8px] font-black uppercase text-zinc-400 mt-0.5">Deuda Total</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : null}

            {/* Modal crear cuota */}
            {showCreateFee && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200" onClick={() => setShowCreateFee(false)}>
                    <div
                        className="bg-white w-full max-w-lg rounded-t-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-200 max-h-[94vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                        onTouchStart={(e) => { (e.currentTarget as any)._touchStartY = e.touches[0].pageY; }}
                        onTouchEnd={(e) => { 
                            const st = (e.currentTarget as any)._touchStartY; 
                            if (e.changedTouches[0].pageY - st > 90) setShowCreateFee(false); 
                        }}
                    >
                        <div className="flex justify-center mb-4"><div className="w-10 h-1.5 bg-zinc-200 rounded-full" /></div>
                        <h2 className="text-base font-black uppercase tracking-tighter text-zinc-900 mb-5">Nueva Cuota</h2>
                        <form onSubmit={handleCreateFee} className="space-y-4">
                            {feeFormError && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{feeFormError}</p>}

                            <div className="relative h-12 bg-zinc-100/50 rounded-2xl p-1 flex overflow-hidden">
                                <div 
                                    className="absolute inset-y-1 rounded-xl shadow-lg shadow-zinc-200/50 transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)"
                                    style={{ 
                                        width: 'calc(50% - 4px)',
                                        transform: feeForm.type === 'once' ? 'translateX(0)' : 'translateX(100%)',
                                        backgroundColor: feeForm.type === 'once' ? '#6366f1' : '#8b5cf6' 
                                    }}
                                />
                                {(['once', 'recurring'] as const).map(t => (
                                    <button key={t} type="button"
                                        onClick={() => setFeeForm({ ...feeForm, type: t, due_date: '', recurring_day: '', start_month: String(nowM), start_year: String(nowY), end_month: '', end_year: '' })}
                                        className={`flex-1 relative z-10 text-[11px] font-black uppercase tracking-widest transition-colors duration-500 ${
                                            feeForm.type === t ? 'text-white' : 'text-zinc-400'
                                        }`}>
                                        {t === 'once' ? 'Única' : 'Recurrente'}
                                    </button>
                                ))}
                            </div>

                            <input placeholder="Título · ej: Gira de estudios" value={feeForm.title}
                                onChange={e => setFeeForm({ ...feeForm, title: e.target.value })}
                                className="w-full h-12 bg-zinc-50 rounded-2xl px-4 text-sm font-bold text-zinc-900 placeholder:text-zinc-300 border-2 border-zinc-100 outline-none transition-all focus:border-zinc-300 focus:bg-white" />

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-black uppercase text-zinc-400 ml-1">Monto ($)</label>
                                    <input type="text" inputMode="numeric" placeholder="$ 0" value={feeForm.amount ? formatCLP(parseInt(feeForm.amount)) : ''}
                                        onChange={e => setFeeForm({ ...feeForm, amount: String(parseCLP(e.target.value)) })}
                                        className="w-full h-12 bg-zinc-50 rounded-2xl px-4 text-sm font-black text-zinc-900 placeholder:text-zinc-300 border-2 border-zinc-100 outline-none transition-all mt-1 focus:border-zinc-300 focus:bg-white" />
                                </div>
                                <div>
                                    {feeForm.type === 'once' ? (
                                        <>
                                            <label className="text-[9px] font-black uppercase text-zinc-400 ml-1">Fecha límite</label>
                                            <input type="date" value={feeForm.due_date}
                                                onChange={e => setFeeForm({ ...feeForm, due_date: e.target.value })}
                                                className="w-full h-12 bg-zinc-50 rounded-2xl px-4 text-sm font-bold text-zinc-900 border-2 border-zinc-100 outline-none focus:border-zinc-300 focus:bg-white transition-all mt-1" />
                                        </>
                                    ) : (
                                        <>
                                            <label className="text-[9px] font-black uppercase text-zinc-400 ml-1">Día del mes</label>
                                            <select value={feeForm.recurring_day}
                                                onChange={e => setFeeForm({ ...feeForm, recurring_day: e.target.value })}
                                                className="w-full h-12 bg-zinc-50 rounded-2xl px-4 text-sm font-bold text-zinc-900 border-2 border-zinc-100 outline-none focus:border-violet-400 focus:bg-white transition-all mt-1">
                                                <option value="">Día...</option>
                                                {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                                                    <option key={d} value={d}>Día {d}</option>
                                                ))}
                                            </select>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className={`grid transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${feeForm.type === 'recurring' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                <div className="overflow-hidden">
                                    <div className={`space-y-4 bg-violet-50/50 border-2 border-violet-100 rounded-[2rem] p-5 mt-4 transition-all duration-500 ${feeForm.type === 'recurring' ? 'translate-y-0' : 'translate-y-4'}`}>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-violet-500">Período de cobro</p>
                                            <div className="flex gap-1">
                                                {YEARS.map(y => (
                                                    <button key={y} type="button"
                                                        onClick={() => setFeeForm({ ...feeForm, start_year: String(y), end_year: feeForm.end_month ? String(y) : '' })}
                                                        className={`px-3 py-1 rounded-full text-[10px] font-black border-2 transition-all ${
                                                            feeForm.start_year === String(y) ? 'bg-violet-500 text-white border-violet-500' : 'bg-white text-zinc-400 border-zinc-200'
                                                        }`}>{y}</button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-2">
                                            {MONTHS.map((m, i) => {
                                                const mn = i + 1;
                                                const y = parseInt(feeForm.start_year);
                                                const isPast = y === nowY && mn < nowM;
                                                
                                                const startVal = parseInt(feeForm.start_month) + (parseInt(feeForm.start_year) * 12);
                                                const endVal = feeForm.end_month ? (parseInt(feeForm.end_month) + (parseInt(feeForm.end_year || feeForm.start_year) * 12)) : null;
                                                const currentVal = mn + (y * 12);

                                                const isStart = String(mn) === feeForm.start_month && String(y) === feeForm.start_year;
                                                const isEnd = feeForm.end_month && String(mn) === feeForm.end_month && String(y) === (feeForm.end_year || feeForm.start_year);
                                                const isInRange = endVal && currentVal > startVal && currentVal < endVal;

                                                return (
                                                    <button key={m} type="button" disabled={isPast}
                                                        onClick={() => {
                                                            const clickVal = mn + (y * 12);
                                                            if (!feeForm.end_month && clickVal > startVal) {
                                                                setFeeForm({ ...feeForm, end_month: String(mn), end_year: String(y) });
                                                            } else {
                                                                setFeeForm({ ...feeForm, start_month: String(mn), start_year: String(y), end_month: '', end_year: '' });
                                                            }
                                                        }}
                                                        className={`h-11 rounded-xl text-[10px] font-black uppercase border-2 transition-all flex items-center justify-center ${
                                                            isPast ? 'opacity-20 bg-zinc-100 text-zinc-400 border-transparent'
                                                            : isStart ? 'bg-violet-600 text-white border-violet-600 z-10 scale-105 shadow-md shadow-violet-200'
                                                            : isEnd ? 'bg-zinc-900 text-white border-zinc-900 z-10 scale-105'
                                                            : isInRange ? 'bg-violet-200 text-violet-700 border-violet-200'
                                                            : 'bg-white text-zinc-400 border-zinc-100 hover:border-violet-200'
                                                        }`}>
                                                        {m}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        
                                        <div className="flex items-center justify-between px-1">
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight">
                                                {feeForm.end_month ? (
                                                    <>Desde {MONTHS[parseInt(feeForm.start_month)-1]} {feeForm.start_year} hasta {MONTHS[parseInt(feeForm.end_month)-1]} {feeForm.end_year}</>
                                                ) : (
                                                    <>Selecciona mes de fin (opcional)</>
                                                )}
                                            </p>
                                            {feeForm.end_month && (
                                                <button type="button" onClick={() => setFeeForm({ ...feeForm, end_month: '', end_year: '' })}
                                                    className="text-[9px] font-black uppercase text-rose-500 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">Reset</button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={feeSubmitting}
                                className={`w-full py-4 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all duration-300 disabled:opacity-40 shadow-lg mt-2 ${
                                    feeForm.type === 'once' ? 'bg-indigo-500 shadow-indigo-200' : 'bg-violet-500 shadow-violet-200'
                                }`}>
                                {feeSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Crear Cuota'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal detalle cuota */}
            {selectedFee && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200" onClick={() => setSelectedFee(null)}>
                    <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-4 duration-200 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-zinc-100 shrink-0">
                            <div className="flex justify-center mb-3"><div className="w-10 h-1.5 bg-zinc-200 rounded-full" /></div>
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-base font-black uppercase tracking-tighter text-zinc-900">{selectedFee.title}</h2>
                                    <p className="text-[10px] text-zinc-400 font-bold mt-0.5">{formatMoney(selectedFee.amount)} · {selectedFee.type === 'recurring' ? `Día ${selectedFee.recurring_day} c/mes` : selectedFee.due_date ? `Vence ${new Date(selectedFee.due_date + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}` : ''}</p>
                                </div>
                                <button onClick={() => setSelectedFee(null)} className="w-8 h-8 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 p-4 space-y-4 bg-zinc-50/50">
                            {feeDetailLoading ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-zinc-300" size={20} /></div>
                            ) : feePayments.length === 0 ? (
                                <p className="text-center text-[10px] text-zinc-400 font-black uppercase py-10">Sin apoderados asignados</p>
                            ) : feePayments.map(p => {
                                const st = (STATUS_LABEL as any)[p.status] || (STATUS_LABEL as any).pending;
                                const person = p.guardian || p.student || p.user || {};
                                return (
                                    <div key={p.id} className="bg-white rounded-3xl p-4 border border-zinc-100 shadow-xl shadow-zinc-200/50 flex flex-col gap-4 overflow-hidden">
                                        <div className="flex items-center gap-4">
                                            <div className="relative shrink-0">
                                                <img src={person.photo || '/icon.webp'} className="w-14 h-14 rounded-2xl object-cover border border-zinc-100 shadow-sm" />
                                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${p.status === 'paid' ? 'bg-emerald-500' : p.status === 'review' ? 'bg-amber-400' : 'bg-rose-500'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-zinc-900 uppercase leading-tight truncate">{person.name || 'Sin nombre'}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                                                    {p.payment_method && (
                                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                                                            {p.payment_method === 'cash' ? 'Efectivo' : 'Transferencia'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {p.proof_url && (
                                                <button 
                                                    onClick={() => setFeeProofUrl(p.proof_url)}
                                                    className="w-14 h-14 rounded-2xl bg-zinc-100 overflow-hidden border border-zinc-200 shadow-inner group relative"
                                                >
                                                    <img src={p.proof_url} alt="Comprobante" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Eye size={16} className="text-white" />
                                                    </div>
                                                </button>
                                            )}
                                        </div>
                                        
                                        {p.status === 'review' && (
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => {
                                                        if(confirm('¿Rechazar este pago?')) {
                                                            handleRejectFeePayment(person.id, p.id);
                                                        }
                                                    }}
                                                    className="flex-1 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest border border-rose-100"
                                                >
                                                    <X size={14} /> Rechazar
                                                </button>
                                                <button 
                                                    onClick={() => { setApprovingFeePayment(p); setFeeApproveMethod('transfer'); }}
                                                    className="flex-[2] h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 border border-emerald-600"
                                                >
                                                    <CheckCircle2 size={14} /> Aprobar Pago
                                                </button>
                                            </div>
                                        )}

                                        {p.status === 'pending' && (
                                            <button 
                                                onClick={() => { setApprovingFeePayment(p); setFeeApproveMethod('cash'); }}
                                                className="w-full h-10 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest border border-zinc-200"
                                            >
                                                <CheckCircle2 size={14} /> Marcar como pagado (Manual)
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal aprobar pago */}
            {approvingFeePayment && (
                <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setApprovingFeePayment(null)}>
                    <div className="bg-white w-full max-sm mb-4 sm:max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <h3 className="text-sm font-black uppercase tracking-tighter text-zinc-900 mb-1">Confirmar Pago</h3>
                        <p className="text-[10px] text-zinc-400 font-bold mb-5">{(approvingFeePayment.guardian || approvingFeePayment.student || approvingFeePayment.user)?.name || 'Sin nombre'}</p>
                        <div className="space-y-3 mb-5">
                            <p className="text-[9px] font-black uppercase text-zinc-400">Método de pago</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setFeeApproveMethod('cash')}
                                    className={`h-12 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase border transition-all ${feeApproveMethod === 'cash' ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-zinc-50 text-zinc-400 border-zinc-200'}`}>
                                    <Banknote size={16} /> Efectivo
                                </button>
                                <button onClick={() => setFeeApproveMethod('transfer')}
                                    className={`h-12 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase border transition-all ${feeApproveMethod === 'transfer' ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-zinc-50 text-zinc-400 border-zinc-200'}`}>
                                    <RefreshCw size={16} /> Transferencia
                                </button>
                            </div>
                            <input placeholder="Notas (opcional)" value={feeApproveNotes}
                                onChange={e => setFeeApproveNotes(e.target.value)}
                                className="w-full h-10 bg-zinc-50 rounded-xl px-4 text-sm text-zinc-900 placeholder:text-zinc-300 border border-zinc-100 outline-none" />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setApprovingFeePayment(null)}
                                className="flex-1 h-11 bg-zinc-50 text-zinc-400 text-[10px] font-black uppercase rounded-xl border border-zinc-100 active:scale-95">
                                Cancelar
                            </button>
                            <button onClick={handleApproveFeePayment} disabled={feeApprovingLoading}
                                className="flex-[2] h-11 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40">
                                {feeApprovingLoading ? <Loader2 className="animate-spin" size={14} /> : <><CheckCircle2 size={14} /> Marcar Pagado</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox comprobante */}
            {feeProofUrl && (
                <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setFeeProofUrl(null)}>
                    <div className="relative max-w-sm w-full" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setFeeProofUrl(null)} className="absolute -top-12 right-0 w-10 h-10 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white">
                            <X size={20} />
                        </button>
                        <div className="rounded-3xl overflow-hidden border border-white/10">
                            <img src={feeProofUrl} alt="Comprobante" className="w-full object-contain max-h-[85vh]" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
