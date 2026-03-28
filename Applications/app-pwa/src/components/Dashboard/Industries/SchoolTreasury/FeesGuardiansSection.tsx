"use client";

import React from 'react';
import { Loader2, Users, X, Eye, CheckCircle2, Banknote, CreditCard, Search, Plus, AlertCircle } from 'lucide-react';

interface FeesGuardiansSectionProps {
    payers: any[];
    feesSearch: string;
    setFeesSearch: (v: string) => void;
    branding: any;
    setShowCreateFee: (v: boolean) => void;
    feesGuardiansLoading: boolean;
    feesBubbleModal: any;
    setFeesBubbleModal: (v: any) => void;
    approvingFeePayment: any;
    setApprovingFeePayment: (v: any) => void;
    selectedFee: any;
    setSelectedFee: (v: any) => void;
    feeApproveMethod: 'cash' | 'transfer';
    setFeeApproveMethod: (v: 'cash' | 'transfer') => void;
    feeApproveNotes: string;
    setFeeApproveNotes: (v: string) => void;
    feeApprovingLoading: boolean;
    handleApproveFeePayment: () => void;
    handleRejectFeePayment: (gId: number, pId: number, notes?: string) => void;
    setProofModalUrl: (url: string) => void;
    feesGuardianFilter: 'all' | 'pending' | 'paid' | 'overdue' | 'review';
    setFeesGuardianFilter: (v: 'all' | 'pending' | 'paid' | 'overdue' | 'review') => void;
    formatMoney: (n: number) => string;
    vocab: any;
    token: string | null;
    onDeleteSuccess: () => void;
    guardianPayments: any[];
    guardianPaymentsLoading: boolean;
    openGuardianPayments: (guardian: any) => void;
}

import GuardianSettlementModal from './GuardianSettlementModal';
import { Trash2 } from 'lucide-react';

const FeesGuardiansSection: React.FC<FeesGuardiansSectionProps> = ({
    payers,
    feesSearch,
    setFeesSearch,
    branding,
    setShowCreateFee,
    feesGuardiansLoading,
    feesBubbleModal,
    setFeesBubbleModal,
    approvingFeePayment,
    setApprovingFeePayment,
    selectedFee,
    setSelectedFee,
    feeApproveMethod,
    setFeeApproveMethod,
    feeApproveNotes,
    setFeeApproveNotes,
    feeApprovingLoading,
    handleApproveFeePayment,
    handleRejectFeePayment,
    setProofModalUrl,
    feesGuardianFilter,
    setFeesGuardianFilter,
    formatMoney,
    vocab,
    token,
    onDeleteSuccess,
    guardianPayments,
    guardianPaymentsLoading,
    openGuardianPayments
}) => {
    const [settlementGuardian, setSettlementGuardian] = React.useState<any>(null);
    // Filtrar apoderados/pagadores usando feesSearch y feesGuardianFilter
    const filtered = payers.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(feesSearch.toLowerCase());
        const matchesFilter = feesGuardianFilter === 'all' || p.status === feesGuardianFilter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-4 px-0 pb-32">
            {/* CABECERA TÁCTICA */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md pt-2 pb-4 -mx-2 px-2 flex items-center gap-3">
                <div className="relative flex-1 group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-800 transition-colors">
                        <Search size={16} />
                    </div>
                    <input 
                        value={feesSearch}
                        onChange={(e) => setFeesSearch(e.target.value)}
                        placeholder="Buscar apoderado..."
                        className="w-full h-11 bg-zinc-100/50 border border-zinc-100 rounded-2xl pl-11 pr-4 text-xs font-bold text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-200 focus:ring-4 focus:ring-zinc-50 transition-all outline-none"
                    />
                    {feesSearch && (
                        <button 
                            onClick={() => setFeesSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-white shadow-sm border border-zinc-100 flex items-center justify-center text-zinc-400 active:scale-90 transition-all"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
                <button 
                    onClick={() => setShowCreateFee(true)}
                    className="w-11 h-11 bg-zinc-950 text-white rounded-2xl flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-zinc-200 shrink-0"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* FILTROS DE ESTADO */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-2 px-2 pb-2">
                {[
                    { id: 'all', label: 'Todos', color: 'bg-zinc-100 text-zinc-600', activeColor: 'bg-zinc-950 text-white' },
                    { id: 'overdue', label: 'Morosos', color: 'bg-rose-50 text-rose-600', activeColor: 'bg-rose-500 text-white' },
                    { id: 'review', label: 'Pendientes', color: 'bg-amber-50 text-amber-600', activeColor: 'bg-amber-500 text-white' },
                    { id: 'paid', label: 'Al día', color: 'bg-emerald-50 text-emerald-600', activeColor: 'bg-emerald-500 text-white' }
                ].map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFeesGuardianFilter(f.id as any)}
                        className={`px-4 h-8 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                            feesGuardianFilter === f.id ? f.activeColor + ' border-transparent shadow-md' : f.color + ' border-zinc-50'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {feesGuardiansLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-zinc-300" size={24} /></div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Users size={32} className="text-zinc-200" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">{feesSearch ? 'Sin coincidencias' : 'Sin resultados'}</p>
                </div>
            ) : (
                <div className="flex flex-wrap gap-4 justify-start px-1 pb-6">
                    {filtered.flatMap((guardian: any) => {
                        const isPaid = guardian.status === 'paid';
                        const isReview = guardian.status === 'review';
                        const isOverdue = guardian.status === 'overdue';
                        
                        const ringColor = isPaid ? 'ring-4 ring-emerald-400 shadow-emerald-100'
                            : isReview ? 'ring-4 ring-amber-400 shadow-amber-100'
                            : isOverdue ? 'ring-4 ring-rose-400 shadow-rose-100'
                            : 'ring-4 ring-zinc-300 shadow-zinc-50'; // pending futuro
                            
                        const dotColor = isPaid ? 'bg-emerald-500'
                            : isReview ? 'bg-amber-400'
                            : isOverdue ? 'bg-rose-500'
                            : 'bg-zinc-400';

                        const subjects = guardian.students?.length > 0 ? guardian.students : [{ id: guardian.id, name: guardian.name, photo: guardian.photo }];
                        return subjects.map((s: any) => (
                            <div key={`${guardian.id}-${s.id}`}
                                className="flex flex-col items-center gap-1.5 cursor-pointer select-none active:scale-95 transition-transform"
                                onClick={() => setFeesBubbleModal(guardian)}>
                                <div className="relative">
                                    <img src={s.photo || guardian.photo || '/icon.webp'}
                                        className={`w-16 h-16 rounded-full object-cover shadow-md ${ringColor}`}
                                        alt={s.name} />
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${dotColor}`} />
                                    
                                    {/* BADGE DE NOTIFICACIÓN (MOROSOS + REVISIÓN) */}
                                    {(guardian.pending + guardian.review) > 0 && (
                                        <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-amber-400 text-zinc-900 text-[10px] font-black rounded-full flex items-center justify-center px-1.5 border-2 border-white shadow-sm animate-in zoom-in duration-300">
                                            {guardian.pending + guardian.review}
                                        </div>
                                    )}
                                </div>
                                <p className="text-[9px] font-black uppercase text-zinc-700 text-center leading-tight max-w-[72px] line-clamp-2">
                                    {s.name.split(' ')[0]}
                                </p>
                            </div>
                        ));
                    })}
                </div>
            )}

            {/* Modal detalle apoderado */}
            {feesBubbleModal && (
                <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200" onClick={() => setFeesBubbleModal(null)}>
                    <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] flex flex-col max-h-[90vh] shadow-2xl animate-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-center mt-4 mb-2"><div className="w-10 h-1.5 bg-zinc-200 rounded-full" /></div>
                        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-zinc-100 overflow-hidden ring-2 ring-zinc-50">
                                    <img src={feesBubbleModal.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(feesBubbleModal.name)}&background=random`} 
                                         alt="" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-tight text-zinc-900">{feesBubbleModal.name}</h3>
                                    <p className="text-[10px] text-zinc-400 font-bold">{feesBubbleModal.pending} morosos · {feesBubbleModal.review} pendientes · {feesBubbleModal.paid} al día</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                                <button 
                                    onClick={() => setSettlementGuardian(feesBubbleModal)}
                                    className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center active:scale-95 transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                                <button onClick={() => setFeesBubbleModal(null)} className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center active:scale-95 transition-all">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 p-4 space-y-3 bg-zinc-50/50 min-h-[200px]">
                            {guardianPaymentsLoading ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="animate-spin text-zinc-300" size={32} />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Cargando pagos...</p>
                                </div>
                            ) : guardianPayments.length > 0 ? (
                                guardianPayments.map((p: any) => {
                                    const st = { 
                                        pending: { label: 'Moroso', color: 'bg-rose-50 text-rose-600 border-rose-100' }, 
                                        review: { label: 'Pendiente', color: 'bg-amber-50 text-amber-600 border-amber-100' }, 
                                        paid: { label: 'Pagado', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' } 
                                    }[p.status as string] || { label: 'Pendiente', color: 'bg-zinc-50 text-zinc-400' };

                                    return (
                                        <div key={p.id} className="bg-white rounded-3xl p-5 border border-zinc-100 shadow-xl shadow-zinc-200/50 flex flex-col gap-5 overflow-hidden active:scale-[0.99] transition-transform">
                                            {/* INFO SUPERIOR */}
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-[13px] font-black text-zinc-950 uppercase tracking-tight leading-tight mb-1">{p.fee?.title || 'Cuota desconocida'}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                                                        {(p.period_month && p.period_year) && (
                                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                                                                {['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][p.period_month]} {p.period_year}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-zinc-950">{formatMoney(p.fee?.amount || 0)}</p>
                                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{p.payment_method || 'Transferencia'}</p>
                                                </div>
                                            </div>

                                            {/* COMPROBANTE - SI EXISTE, MÁS GRANDE */}
                                            {p.proof_url && (
                                                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-zinc-100 group cursor-pointer"
                                                     onClick={() => setProofModalUrl(p.proof_url)}>
                                                    <img src={p.proof_url} alt="Comprobante" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex items-end p-4">
                                                        <div className="flex items-center gap-2 text-white/90 text-[10px] font-black uppercase tracking-widest">
                                                            <Eye size={14} /> Ver comprobante completo
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* BOTONES DE ACCIÓN - GRANDES Y CLAROS */}
                                            {p.status === 'review' && (
                                                <div className="flex items-center gap-3 pt-2">
                                                    <button 
                                                        onClick={() => {
                                                            if(confirm('¿Rechazar este pago? El comprobante se eliminará y el estado volverá a pendiente.')) {
                                                                handleRejectFeePayment(feesBubbleModal.id, p.id);
                                                            }
                                                        }}
                                                        className="flex-1 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all border border-rose-100 shadow-sm"
                                                    >
                                                        <X size={16} /> Rechazar
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setApprovingFeePayment(p); 
                                                            setSelectedFee(p.fee); 
                                                            setFeeApproveMethod('transfer');
                                                        }}
                                                        className="flex-[1.5] h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-emerald-200 border border-emerald-600"
                                                    >
                                                        <CheckCircle2 size={16} /> Aprobar Pago
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-10 flex flex-col items-center justify-center gap-2 opacity-30">
                                    <AlertCircle size={32} />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-center">Sin pagos registrados para este apoderado</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal aprobar pago de cuota */}
            {approvingFeePayment && selectedFee && (
                <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-end justify-center p-0 animate-in fade-in duration-200" onClick={() => setApprovingFeePayment(null)}>
                    <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-center mb-4"><div className="w-10 h-1.5 bg-zinc-200 rounded-full" /></div>
                        <h3 className="text-sm font-black uppercase tracking-tighter text-zinc-900 mb-4">Aprobar Pago — {selectedFee.title}</h3>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {(['cash', 'transfer'] as const).map(m => (
                                <button key={m} onClick={() => setFeeApproveMethod(m)}
                                    className={`h-10 rounded-xl text-[10px] font-black uppercase border transition-all ${
                                        feeApproveMethod === m ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-zinc-50 text-zinc-400 border-zinc-100'
                                    }`}>
                                    {m === 'cash' ? <span className="flex items-center justify-center gap-1.5"><Banknote size={12} /> Efectivo</span> : <span className="flex items-center justify-center gap-1.5"><CreditCard size={12} /> Transferencia</span>}
                                </button>
                            ))}
                        </div>
                        <input placeholder="Notas (opcional)" value={feeApproveNotes} onChange={e => setFeeApproveNotes(e.target.value)}
                            className="w-full h-11 bg-zinc-50 rounded-xl px-4 text-sm font-bold text-zinc-900 border border-zinc-100 outline-none mb-4" />
                        <button onClick={handleApproveFeePayment} disabled={feeApprovingLoading}
                            className="w-full h-12 bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40">
                            {feeApprovingLoading ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={16} /> Confirmar Pago</>}
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de Finiquito y Eliminación */}
            {settlementGuardian && token && (
                <GuardianSettlementModal 
                    tenantId={branding?.slug || ''}
                    token={token}
                    guardian={settlementGuardian}
                    onClose={() => setSettlementGuardian(null)}
                    onSuccess={() => {
                        setSettlementGuardian(null);
                        setFeesBubbleModal(null);
                        onDeleteSuccess();
                    }}
                    formatMoney={formatMoney}
                />
            )}
        </div>
    );
};

export default FeesGuardiansSection;
