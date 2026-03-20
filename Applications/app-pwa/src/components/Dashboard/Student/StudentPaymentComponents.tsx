import React, { useState, useRef } from "react";
import { 
    CreditCard, 
    Check, 
    CheckCircle2, 
    Upload, 
    Loader2, 
    X, 
    Minus, 
    ImageIcon 
} from "lucide-react";

/* ─── Fee Card Component ─── */
export function FeeCard({ feeData, primaryColor, onPay, onViewProof }: {
    feeData: any; 
    primaryColor: string;
    onPay: () => void;
    onViewProof: (url: string) => void;
}) {
    const fee = feeData.fee;
    const periods: any[] = feeData.periods || [];
    const pending  = periods.filter((p: any) => p.status === 'pending');
    const review   = periods.filter((p: any) => p.status === 'review');
    const paid     = periods.filter((p: any) => p.status === 'paid');
    const total    = periods.length;

    const today = new Date();
    const overdue  = periods.filter((p: any) => p.status === 'pending' && p.due_date && new Date(p.due_date) < today);
    const overallStatus = paid.length === total && total > 0 ? 'paid'
        : review.length > 0 ? 'review'
        : overdue.length > 0 ? 'overdue' : 'pending';

    const statusConfig: Record<string, { label: string; color: string }> = {
        pending: { label: 'Por vencer', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
        overdue: { label: 'Vencida', color: 'text-red-500 bg-red-50 border-red-200' },
        review:  { label: 'En Revisión', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
        paid:    { label: 'Al día', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    };
    const sc = statusConfig[overallStatus];

    return (
        <div className="bg-white border border-zinc-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-zinc-900">{fee.title}</p>
                    <p className="text-[10px] text-zinc-400 font-bold">
                        ${Number(fee.amount).toLocaleString('es-CL')}/mes
                        {fee.type === 'recurring' && fee.recurring_day && ` · Día ${fee.recurring_day}`}
                        {total > 0 && ` · ${paid.length}/${total} pagados`}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[9px] border rounded-full px-2 py-0.5 font-black uppercase shadow-sm ${sc.color}`}>{sc.label}</span>
                    {overallStatus !== 'paid' && (
                        <button onClick={onPay} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-zinc-900 text-white rounded-xl px-3 py-2">
                            <CreditCard size={11} /> Pagar
                        </button>
                    )}
                </div>
            </div>
            {total > 1 && (
                <div className="mt-3">
                    <div className="flex gap-1 flex-wrap">
                        {periods.map((p: any, i: number) => {
                            const isOverdue = p.status === 'pending' && p.due_date && new Date(p.due_date) < today;
                            return (
                                <div key={i} className="flex flex-col items-center gap-0.5" style={{ flex: '1 1 0', minWidth: 0 }}>
                                    <div
                                        title={`${p.label} — ${p.status}`}
                                        className={`h-2 w-full rounded-full ${
                                            p.status === 'paid' ? 'bg-emerald-400' :
                                            p.status === 'review' ? 'bg-yellow-400' :
                                            isOverdue ? 'bg-red-400' : 'bg-zinc-200'
                                        }`}
                                    />
                                    <span className="text-[7px] font-black text-zinc-400 uppercase leading-none truncate w-full text-center">
                                        {['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][p.month - 1]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Fee Pay Modal ─── */
export function FeePayModal({ fees, onClose, onSuccess, submitFeePayment }: {
    fees: any[];
    onClose: () => void;
    onSuccess: () => void;
    submitFeePayment: (slug: string, tk: string, items: any[], file: File) => Promise<any>;
}) {
    const [selected, setSelected] = useState<Record<number, Set<string>>>(() => {
        const init: Record<number, Set<string>> = {};
        fees.forEach(fd => {
            const pending = (fd.periods || []).filter((p: any) => p.status === 'pending');
            init[fd.fee.id] = pending.length > 0 ? new Set([`${pending[0].year}-${pending[0].month}`]) : new Set();
        });
        return init;
    });
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const togglePeriod = (feeId: number, key: string, periods: any[]) => {
        setSelected(prev => {
            const set = new Set(prev[feeId] || []);
            const pendingKeys = periods
                .filter((p: any) => p.status === 'pending')
                .map((p: any) => `${p.year}-${p.month}`);
            const idx = pendingKeys.indexOf(key);
            if (idx === -1) return prev;
            
            const newSet = new Set<string>();
            if (set.has(key) && [...set].pop() === key) {
                pendingKeys.slice(0, idx).forEach(k => newSet.add(k));
            } else {
                pendingKeys.slice(0, idx + 1).forEach(k => newSet.add(k));
            }
            return { ...prev, [feeId]: newSet };
        });
    };

    const selectAll = (feeId: number, periods: any[]) => {
        const pendingKeys = periods
            .filter((p: any) => p.status === 'pending')
            .map((p: any) => `${p.year}-${p.month}`);
        setSelected(prev => ({ ...prev, [feeId]: new Set(pendingKeys) }));
    };

    const totalAmount = fees.reduce((sum, fd) => {
        const count = (selected[fd.fee.id] || new Set()).size;
        return sum + count * Number(fd.fee.amount);
    }, 0);

    const totalPeriods = fees.reduce((sum, fd) => sum + (selected[fd.fee.id] || new Set()).size, 0);

    const handleSubmit = async () => {
        if (!proofFile || totalPeriods === 0) return;
        setSubmitting(true);
        const slug = localStorage.getItem('tenant_slug') || '';
        const tk = localStorage.getItem('auth_token') || localStorage.getItem('staff_token') || '';
        const items = fees
            .map(fd => ({
                fee_id: fd.fee.id,
                periods: [...(selected[fd.fee.id] || new Set())].map(key => {
                    const [year, month] = key.split('-').map(Number);
                    return { month, year };
                }),
            }))
            .filter(item => item.periods.length > 0);
        
        const res = await submitFeePayment(slug, tk, items, proofFile);
        setSubmitting(false);
        if (res?.created !== undefined) {
            setSuccess(true);
            setTimeout(() => { onSuccess(); onClose(); }, 1800);
        }
    };

    const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

    return (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-end justify-center p-0 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-200 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                {success ? (
                    <div className="flex flex-col items-center gap-4 py-12">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </div>
                        <p className="text-lg font-black text-zinc-900">¡Pago enviado!</p>
                        <p className="text-xs text-zinc-400">El staff revisará tu comprobante pronto.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-zinc-900">Pagar Cuotas</h3>
                            <button onClick={onClose} className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center"><X size={16} /></button>
                        </div>

                        {fees.map(fd => {
                            const fee = fd.fee;
                            const periods: any[] = fd.periods || [];
                            const pendingPeriods = periods.filter((p: any) => p.status === 'pending');
                            const sel = selected[fee.id] || new Set();
                            if (pendingPeriods.length === 0) return null;
                            return (
                                <div key={fee.id} className="mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <p className="text-sm font-black text-zinc-900">{fee.title}</p>
                                            <p className="text-[10px] text-zinc-400">${Number(fee.amount).toLocaleString('es-CL')}/mes</p>
                                        </div>
                                        <button
                                            onClick={() => selectAll(fee.id, periods)}
                                            className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-700 border border-zinc-200 px-3 py-1 rounded-full"
                                        >
                                            Todo el año
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {pendingPeriods.map((p: any) => {
                                            const key = `${p.year}-${p.month}`;
                                            const isSelected = sel.has(key);
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => togglePeriod(fee.id, key, periods)}
                                                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${
                                                        isSelected
                                                            ? 'bg-zinc-900 text-white border-zinc-900'
                                                            : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-400'
                                                    }`}
                                                >
                                                    {MONTHS[p.month - 1]} {p.year}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {totalPeriods > 0 && (
                            <div className="bg-zinc-50 rounded-2xl p-4 mb-4 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total a pagar</p>
                                    <p className="text-2xl font-black text-zinc-900">${totalAmount.toLocaleString('es-CL')}</p>
                                </div>
                                <p className="text-[10px] text-zinc-400 font-bold">{totalPeriods} {totalPeriods === 1 ? 'mes' : 'meses'}</p>
                            </div>
                        )}

                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setProofFile(f); }} />
                        <button
                            onClick={() => fileRef.current?.click()}
                            className={`w-full h-14 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest mb-4 transition-all ${
                                proofFile ? 'border-emerald-400 bg-emerald-50 text-emerald-600' : 'border-zinc-200 text-zinc-400 hover:border-zinc-400'
                            }`}
                        >
                            {proofFile ? <><CheckCircle2 size={14} /> {proofFile.name.slice(0, 30)}</> : <><Upload size={14} /> Adjuntar comprobante</>}
                        </button>

                        <button
                            onClick={handleSubmit}
                            disabled={!proofFile || totalPeriods === 0 || submitting}
                            className="w-full h-14 bg-zinc-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest disabled:opacity-40 flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                            {submitting ? 'Enviando...' : `Enviar pago $${totalAmount.toLocaleString('es-CL')}`}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

/* ─── Payment Row Component ─── */
export function PaymentRow({
    payment,
    primaryColor,
    uploading,
    uploadSuccess,
    onUpload,
    onViewProof,
    onDeleteProof,
    isSelected,
    onToggleSelect,
}: {
    payment: any;
    primaryColor: string;
    uploading: boolean;
    uploadSuccess: boolean;
    onUpload: (file: File) => void;
    onViewProof: (url: string) => void;
    onDeleteProof: () => void;
    isSelected: boolean;
    onToggleSelect: () => void;
}) {
    const fileRef = useRef<HTMLInputElement>(null);

    const statusConfig: Record<string, { label: string; color: string }> = {
        pending: { label: "Pendiente", color: "text-red-500 bg-red-50 border-red-200" },
        pending_review: { label: "En Revisión", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
        approved: { label: "Pagado", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    };
    const sc = statusConfig[payment.status] || statusConfig.pending;
    const hasProof = !!payment.proof_image;
    const canDelete = hasProof && payment.status !== 'approved';

    return (
        <div className={`bg-white border ${isSelected ? 'border-orange-500 shadow-orange-50' : 'border-zinc-100'} rounded-2xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group/pay`}>
            {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />}
            
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {payment.status === "pending" && (
                        <div onClick={onToggleSelect} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                            isSelected ? 'bg-orange-500 border-orange-500' : 'border-zinc-200 hover:border-zinc-400'
                        }`}>
                            {isSelected && <Check size={12} className="text-white" />}
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="text-sm font-black text-zinc-900">${Number(payment.amount).toLocaleString("es-CL")}</p>
                        <p className="text-[10px] text-zinc-400 font-bold truncate">Vence: {payment.due_date || "—"}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[9px] border rounded-full px-2 py-0.5 font-black uppercase shadow-sm ${sc.color}`}>{sc.label}</span>

                    {uploadSuccess && (
                        <span className="text-emerald-500 animate-in zoom-in duration-300"><CheckCircle2 className="w-6 h-6" /></span>
                    )}

                    {payment.status === "pending" && !uploadSuccess && (
                        <>
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
                            <button
                                onClick={() => fileRef.current?.click()}
                                disabled={uploading}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider bg-zinc-900 text-white rounded-xl px-4 py-2 hover:bg-zinc-800 transition-all disabled:opacity-50"
                            >
                                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                {uploading ? "..." : "Pagar"}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {hasProof && (
                <div className="mt-3 pt-3 border-t border-zinc-50">
                    <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                            <button
                                onClick={() => onViewProof(payment.proof_image)}
                                className="w-14 h-14 rounded-xl overflow-hidden border border-zinc-100 bg-zinc-50 shadow-sm active:scale-95 transition-transform"
                            >
                                <img src={payment.proof_image} alt="Comprobante" className="w-full h-full object-cover" />
                            </button>
                            {canDelete && (
                                <button
                                    onClick={onDeleteProof}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform border-2 border-white"
                                >
                                    <Minus size={10} strokeWidth={3} />
                                </button>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-zinc-500 flex items-center gap-1">
                                <ImageIcon size={10} /> Comprobante adjunto
                            </p>
                            <p className="text-[9px] text-zinc-300 mt-0.5">
                                {payment.status === 'approved' ? 'Aprobado ✓' : 'Toca la imagen para ampliar'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
