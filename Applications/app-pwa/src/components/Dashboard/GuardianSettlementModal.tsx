"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Upload, X, ShieldAlert } from 'lucide-react';
import { getGuardianSettlement, deleteGuardian } from '@/lib/api';

interface GuardianSettlementModalProps {
    tenantId: string;
    token: string;
    guardian: any;
    onClose: () => void;
    onSuccess: () => void;
    formatMoney: (n: number) => string;
}

export default function GuardianSettlementModal({ tenantId, token, guardian, onClose, onSuccess, formatMoney }: GuardianSettlementModalProps) {
    const [loading, setLoading] = useState(true);
    const [settlement, setSettlement] = useState<any>(null);
    const [confirmName, setConfirmName] = useState('');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSettlement = async () => {
            const res = await getGuardianSettlement(tenantId, token, guardian.id);
            if (res && !res.error) {
                setSettlement(res);
            } else {
                setError('Error al obtener el finiquito.');
            }
            setLoading(false);
        };
        fetchSettlement();
    }, [tenantId, token, guardian.id]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setProofFile(e.target.files[0]);
        }
    };

    const handleDelete = async () => {
        if (confirmName.toLowerCase().trim() !== guardian.name.toLowerCase().trim()) {
            setError('El nombre de confirmación no coincide.');
            return;
        }

        const refundTotal = settlement?.refunds?.total || 0;
        if (refundTotal > 0 && !proofFile) {
            setError('Debe adjuntar el comprobante de transferencia.');
            return;
        }

        setDeleting(true);
        setError('');

        const formData = new FormData();
        formData.append('confirmation_name', confirmName);
        formData.append('refund_amount', String(refundTotal));
        if (proofFile) {
            formData.append('refund_proof', proofFile);
        }

        const res = await deleteGuardian(tenantId, token, guardian.id, formData);
        setDeleting(false);

        if (res && res.error) {
            setError(res.error);
        } else {
            onSuccess();
        }
    };

    return (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-rose-100 bg-rose-50/50 rounded-t-[2.5rem] shrink-0">
                    <div className="flex justify-center mb-4"><div className="w-10 h-1.5 bg-rose-200 rounded-full" /></div>
                    <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center shrink-0">
                                <ShieldAlert size={24} className="text-rose-600" />
                            </div>
                            <div>
                                <h2 className="text-base font-black uppercase text-rose-700 tracking-tight">Retiro de Apoderado</h2>
                                <p className="text-xs text-rose-600/80 font-medium leading-tight mt-0.5">La eliminación es irreversible. Se calcularon las deudas y devoluciones pendientes.</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white border border-rose-100 text-rose-400 flex items-center justify-center shrink-0 active:scale-95">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 p-6 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                            <Loader2 size={24} className="animate-spin text-rose-400" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Calculando Finiquito...</p>
                        </div>
                    ) : settlement ? (
                        <>
                            {/* Resumen Finiquito */}
                            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Apoderado</p>
                                        <p className="text-sm font-bold text-zinc-900">{guardian.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Alumno(s) Asociado(s)</p>
                                        <div className="flex flex-wrap gap-1">
                                            {settlement.guardian?.students?.map((s: any) => (
                                                <span key={s.id} className="text-[10px] font-bold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md border border-zinc-200">
                                                    {s.name} <span className="text-[8px] opacity-50 ml-1">({s.category === '3_basico' ? '3° Básico' : s.category})</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white border border-rose-100 rounded-xl p-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1">Deudas Pendientes</p>
                                        <p className="text-lg font-black text-rose-600">{formatMoney(settlement.debts.total)}</p>
                                        <p className="text-[9px] text-zinc-400 mt-1">{settlement.debts.payments.length} cuotas no pagadas</p>
                                    </div>
                                    <div className="bg-white border border-emerald-100 rounded-xl p-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">A Devolver</p>
                                        <p className="text-lg font-black text-emerald-600">{formatMoney(settlement.refunds.total)}</p>
                                        <p className="text-[9px] text-zinc-400 mt-1">Pagado por adelantado</p>
                                    </div>
                                </div>
                            </div>

                            {/* Subida Comprobante (si hay devoluciones) */}
                            {settlement.refunds.total > 0 && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Comprobante de Transferencia <span className="text-rose-500">*</span></label>
                                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl cursor-pointer transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-6 h-6 mb-2 text-emerald-500" />
                                            <p className="text-[10px] font-bold text-emerald-700">{proofFile ? proofFile.name : "Adjuntar PDF o Imagen"}</p>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                                    </label>
                                </div>
                            )}

                            {/* Confirmación CAPTCHA */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Confirme escribiendo el nombre</label>
                                <input 
                                    type="text" 
                                    placeholder={guardian.name}
                                    value={confirmName}
                                    onChange={e => setConfirmName(e.target.value)}
                                    className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-4 text-sm font-bold text-zinc-900 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all outline-none"
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-[10px] font-bold uppercase">
                                    <AlertTriangle size={14} /> {error}
                                </div>
                            )}
                        </>
                    ) : null}
                </div>

                <div className="p-6 border-t border-zinc-100 shrink-0">
                    <button 
                        onClick={handleDelete}
                        disabled={loading || deleting || !confirmName}
                        className="w-full h-12 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-rose-200"
                    >
                        {deleting ? <Loader2 className="animate-spin" size={16} /> : "Eliminar Definitivamente"}
                    </button>
                </div>
            </div>
        </div>
    );
}
