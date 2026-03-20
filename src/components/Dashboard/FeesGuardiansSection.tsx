"use client";

import React from 'react';
import { Loader2, Users, X, Eye, CheckCircle2, Banknote, CreditCard, Search, Plus } from 'lucide-react';

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
    setProofModalUrl: (url: string) => void;
    formatMoney: (n: number) => string;
    vocab: any;
}

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
    setProofModalUrl,
    formatMoney,
    vocab
}) => {
    // Filtrar apoderados/pagadores usando feesSearch
    const filtered = payers.filter(p => p.name.toLowerCase().includes(feesSearch.toLowerCase()));

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
                        const ringColor = isPaid ? 'ring-4 ring-emerald-400 shadow-emerald-100'
                            : isReview ? 'ring-4 ring-amber-400 shadow-amber-100'
                            : 'ring-4 ring-rose-400 shadow-rose-100';
                        const dotColor = isPaid ? 'bg-emerald-500'
                            : isReview ? 'bg-amber-400'
                            : 'bg-rose-500';

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
                    <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-4 duration-200 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-zinc-100 shrink-0">
                            <div className="flex justify-center mb-3"><div className="w-10 h-1.5 bg-zinc-200 rounded-full" /></div>
                            <div className="flex items-center gap-3">
                                <img src={feesBubbleModal.photo || '/icon.webp'} className="w-12 h-12 rounded-full object-cover border border-zinc-100" />
                                <div>
                                    <h3 className="text-sm font-black uppercase text-zinc-900">{feesBubbleModal.name}</h3>
                                    <p className="text-[10px] text-zinc-400 font-bold">{feesBubbleModal.pending} pendiente · {feesBubbleModal.review} en revisión · {feesBubbleModal.paid} pagado</p>
                                </div>
                                <button onClick={() => setFeesBubbleModal(null)} className="ml-auto w-8 h-8 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100"><X size={16} /></button>
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 p-4 space-y-2">
                            {feesBubbleModal.payments?.map((p: any) => {
                                const st = { pending: { label: 'Pendiente', color: 'bg-rose-50 text-rose-600 border-rose-100' }, review: { label: 'En revisión', color: 'bg-amber-50 text-amber-600 border-amber-100' }, paid: { label: 'Pagado', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' } }[p.status as string] || { label: 'Pendiente', color: 'bg-rose-50 text-rose-600 border-rose-100' };
                                return (
                                    <div key={p.id} className="bg-zinc-50 rounded-2xl p-3 border border-zinc-100 flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-zinc-900 uppercase leading-none truncate">{p.fee?.title}</p>
                                            <p className="text-[10px] text-zinc-400 mt-0.5">{formatMoney(p.fee?.amount || 0)} · {p.fee?.type === 'recurring' ? `Día ${p.fee.recurring_day} c/mes` : p.fee?.due_date ? new Date(p.fee.due_date + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }) : ''}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                                            {p.proof_url && (
                                                <button onClick={() => setProofModalUrl(p.proof_url)}
                                                    className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 active:scale-95">
                                                    <Eye size={14} />
                                                </button>
                                            )}
                                            {p.status !== 'paid' && (
                                                <button onClick={() => { setApprovingFeePayment(p); setSelectedFee(p.fee); setFeeApproveMethod('cash'); }}
                                                    className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 active:scale-95">
                                                    <CheckCircle2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
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
        </div>
    );
};

export default FeesGuardiansSection;
