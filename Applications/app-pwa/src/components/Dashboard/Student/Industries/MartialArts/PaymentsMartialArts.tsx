"use client";

import React from "react";
import { 
    ShieldCheck, 
    Copy, 
    Check, 
    Upload, 
    Loader2, 
    CreditCard, 
    Clock, 
    Eye,
    ChevronDown,
    ChevronUp,
    Trash2
} from "lucide-react";
import { PaymentRow } from "../../StudentPaymentComponents";

interface PaymentsMartialArtsProps {
    paymentTab: "pending" | "history";
    setPaymentTab: (tab: "pending" | "history") => void;
    bankInfo: any;
    copiedBank: boolean;
    setCopiedBank: (val: boolean) => void;
    selectedPayments: string[];
    setSelectedPayments: React.Dispatch<React.SetStateAction<string[]>>;
    uploadingPayment: string | null;
    bulkFileInputRef: React.RefObject<HTMLInputElement>;
    myFees?: any[];
    students: any[];
    primaryColor: string;
    uploadSuccess: string | null;
    handleUploadProof: (id: string, file: File) => void;
    setProofModal: (val: { url: string; canDelete: boolean; paymentId: string } | null) => void;
    setConfirmDelete: (id: string | null) => void;
    handleBulkUploadProof: (file: File) => void;
    paymentHistory: any[];
    vocab: any;
    onBuyPack?: (studentId: string, type: string) => Promise<void>;
    plans: any[];
}

export function PaymentsMartialArts({
    paymentTab,
    setPaymentTab,
    bankInfo,
    copiedBank,
    setCopiedBank,
    selectedPayments,
    setSelectedPayments,
    uploadingPayment,
    bulkFileInputRef,
    myFees,
    students,
    primaryColor,
    uploadSuccess,
    handleUploadProof,
    setProofModal,
    setConfirmDelete,
    handleBulkUploadProof,
    paymentHistory,
    vocab,
    onBuyPack,
    plans
}: PaymentsMartialArtsProps) {
    const [showBankInfo, setShowBankInfo] = React.useState(false);
    const [selectedStudentForPack, setSelectedStudentForPack] = React.useState<string>(students[0]?.id || "");
    const [isBuying, setIsBuying] = React.useState<string | null>(null);
    const [planCategory, setPlanCategory] = React.useState<'adults' | 'kids' | '1-1'>(
        students.find(s => String(s.id) === String(selectedStudentForPack))?.category === 'kids' ? 'kids' : 'adults'
    );

    const handleBuy = async (type: string) => {
        if (!onBuyPack || !selectedStudentForPack) return;
        setIsBuying(type);
        try {
            await onBuyPack(selectedStudentForPack, type);
        } finally {
            setIsBuying(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-black text-zinc-900">Pagos</h2>
            
            <div className="flex bg-zinc-100/50 p-1 rounded-2xl h-11 relative">
                <div
                    className="absolute inset-y-1 rounded-xl bg-white shadow-sm border border-zinc-100 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                    style={{
                        width: 'calc(50% - 2px)',
                        transform: `translateX(${paymentTab === 'pending' ? '0' : '100%'})`
                    }}
                />
                {(['pending', 'history'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setPaymentTab(tab)}
                        className={`flex-1 relative z-10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 ${
                            paymentTab === tab ? 'text-zinc-950' : 'text-zinc-400'
                        }`}
                    >
                        {tab === 'pending' ? <CreditCard size={14} /> : <Clock size={14} />}
                        <span>{tab === 'pending' ? 'Pendientes' : 'Historial'}</span>
                    </button>
                ))}
            </div>
            
            {paymentTab === "pending" ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between ml-2">
                            <div className="flex items-center gap-3">
                                {bankInfo && (
                                    <button 
                                        onClick={() => setShowBankInfo(!showBankInfo)}
                                        className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all ${
                                            showBankInfo ? 'bg-zinc-900 text-white shadow-md' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                                        }`}
                                    >
                                        Datos Transferencia
                                        {showBankInfo ? <ChevronUp size={12} className="text-white/70" /> : <ChevronDown size={12} className="text-orange-500/70" />}
                                    </button>
                                )}
                            </div>
                            {selectedPayments.length > 0 && (
                                <button onClick={() => bulkFileInputRef.current?.click()} disabled={uploadingPayment === "bulk"} className="bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                                    {uploadingPayment === "bulk" ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />} Pagar {selectedPayments.length} Masivamente
                                </button>
                            )}
                        </div>

                        {showBankInfo && bankInfo && (
                            <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-3xl p-4 shadow-lg relative overflow-hidden flex flex-col gap-3 animate-in slide-in-from-top-2 duration-300 mb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-zinc-800 rounded-xl flex items-center justify-center"><ShieldCheck size={16} className="text-orange-400" /></div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Transferencia</p>
                                            <p className="text-xs font-bold leading-none mt-0.5">{bankInfo.bank_name}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { navigator.clipboard.writeText(`${bankInfo.bank_name}\n${bankInfo.account_type}\n${bankInfo.account_number}\n${bankInfo.holder_name}\n${bankInfo.holder_rut}`); setCopiedBank(true); setTimeout(() => setCopiedBank(false), 2000); }} className="flex items-center gap-1.5 bg-zinc-800 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors">
                                        {copiedBank ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />} {copiedBank ? 'Copiado' : 'Datos'}
                                    </button>
                                </div>
                                <div className="bg-zinc-950/50 rounded-2xl p-3 border border-zinc-800/50 flex flex-col gap-1">
                                    <div className="flex items-center justify-between"><span className="text-[10px] text-zinc-400 font-medium">Cuenta</span><span className="text-xs font-mono font-bold text-orange-400">{bankInfo.account_number}</span></div>
                                    <div className="flex items-center justify-between"><span className="text-[10px] text-zinc-400 font-medium">Tipo</span><span className="text-[10px] font-bold">{bankInfo.account_type}</span></div>
                                    <div className="flex items-center justify-between"><span className="text-[10px] text-zinc-400 font-medium">Titular</span><span className="text-[10px] font-bold text-right line-clamp-1">{bankInfo.holder_name}</span></div>
                                    <div className="flex items-center justify-between"><span className="text-[10px] text-zinc-400 font-medium">RUT</span><span className="text-[10px] font-bold">{bankInfo.holder_rut}</span></div>
                                </div>
                            </div>
                        )}
                        
                        {/* SECCIÓN DE UPGRADES / PLANES */}
                        <div className="mt-2 p-6 rounded-[2.5rem] border border-zinc-800 bg-zinc-900/40 relative overflow-hidden transition-all duration-700">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9a84c]/5 rounded-full blur-3xl" />
                            
                            <div className="flex items-center justify-between mb-5 relative z-10">
                                <div className="space-y-0.5">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c9a84c]">Mejora tu Plan</h3>
                                    <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">
                                        {planCategory === 'adults' ? 'Entrenamiento Adulto' : 
                                         planCategory === 'kids' ? 'Pequeños Guerreros' : 'Sesiones Personalizadas'}
                                    </p>
                                </div>
                                {students.length > 1 && (
                                    <select 
                                        value={selectedStudentForPack}
                                        onChange={(e) => setSelectedStudentForPack(e.target.value)}
                                        className="text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-950/50 text-white outline-none transition-all"
                                    >
                                        {students.map(s => <option key={s.id} value={s.id}>{s.name.split(' ')[0]}</option>)}
                                    </select>
                                )}
                            </div>

                            {/* TABS DE CATEGORÍA */}
                            <div className="flex bg-zinc-950/60 p-1 rounded-xl mb-6 border border-zinc-800/50">
                                {(['adults', 'kids', '1-1'] as const).map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setPlanCategory(cat)}
                                        className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                            planCategory === cat 
                                            ? 'bg-zinc-800 text-[#c9a84c] shadow-lg' 
                                            : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                    >
                                        {cat === 'adults' ? 'Adulto' : cat === 'kids' ? 'Kid' : '1-1'}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 gap-2.5 relative z-10">
                                {plans
                                    .filter(p => {
                                        if (planCategory === '1-1') return p.category === 'personal' || p.name.toLowerCase().includes('1-1') || p.name.toLowerCase().includes('individual');
                                        return p.target_audience === planCategory;
                                    })
                                    .map((plan) => {
                                        const student = students.find(s => String(s.id) === String(selectedStudentForPack));
                                        const isCurrentPlan = student?.enrollments?.some((e: any) => e.plan_id === plan.id && e.status === 'active');
                                        
                                        // Calcular ahorro o etiqueta según ciclo
                                        let badge = "";
                                        if (plan.billing_cycle === 'quarterly') badge = "AHORRO TRIMESTRAL";
                                        if (plan.billing_cycle === 'semi_annual') badge = "AHORRO SEMESTRAL";
                                        if (plan.billing_cycle === 'annual') badge = "MEJOR VALOR ANUAL";
                                        if (isCurrentPlan) badge = "PLAN ACTUAL";

                                        return (
                                            <button
                                                key={plan.id}
                                                onClick={() => handleBuy(`plan_${plan.id}`)}
                                                disabled={!!isBuying || isCurrentPlan}
                                                className={`group flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${
                                                    isCurrentPlan 
                                                    ? 'border-[#c9a84c]/30 bg-[#c9a84c]/5 cursor-default' 
                                                    : 'border-zinc-800/50 bg-zinc-950/40 hover:border-[#c9a84c]/50'
                                                }`}
                                            >
                                                <div className="flex flex-col text-left">
                                                    <div className="flex items-center gap-2">
                                                        {badge && (
                                                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full tracking-widest ${
                                                                isCurrentPlan ? 'bg-[#c9a84c] text-black' : 'bg-zinc-800 text-[#c9a84c]'
                                                            }`}>
                                                                {badge}
                                                            </span>
                                                        )}
                                                        <span className={`text-[10px] font-black uppercase tracking-tight ${isCurrentPlan ? 'text-[#c9a84c]' : 'text-white'}`}>
                                                            {plan.name}
                                                        </span>
                                                    </div>
                                                    <span className="text-[8px] text-zinc-500 font-bold uppercase mt-0.5">
                                                        {plan.billing_cycle === 'monthly_fixed' ? 'Mensualidad' : 
                                                         plan.billing_cycle === 'quarterly' ? 'Pack 3 Meses' :
                                                         plan.billing_cycle === 'annual' ? 'Acceso Anual' : 'Plan Especial'}
                                                    </span>
                                                    <p className="text-[7.5px] text-zinc-600 font-medium leading-tight mt-1 max-w-[180px]">
                                                        {plan.description || 'Entrena con nosotros y alcanza tu siguiente nivel.'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[13px] font-black text-[#c9a84c] tracking-tighter">
                                                        ${Number(plan.price).toLocaleString('es-CL')}
                                                    </span>
                                                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shadow-lg transition-all ${
                                                        isCurrentPlan ? 'bg-[#c9a84c] text-black' : 'bg-zinc-900 text-white group-hover:bg-[#c9a84c] group-hover:text-black'
                                                    }`}>
                                                        {isBuying === `plan_${plan.id}` ? <Loader2 size={12} className="animate-spin" /> : 
                                                         isCurrentPlan ? <ShieldCheck size={12} /> : <CreditCard size={12} />}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                
                                {plans.filter(p => {
                                    if (planCategory === '1-1') return p.category === 'personal' || p.name.toLowerCase().includes('1-1') || p.name.toLowerCase().includes('individual');
                                    return p.target_audience === planCategory;
                                }).length === 0 && (
                                    <div className="p-8 text-center bg-zinc-950/20 rounded-2xl border border-dashed border-zinc-800/50">
                                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Sin planes activos en esta categoría</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between ml-2 mb-1 mt-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Pagos Pendientes</h3>
                        </div>
                        
                        {/* 1. Renderizar Cuotas Pendientes (Fees) */}
                        {myFees && myFees.flatMap((fd: any) => 
                            (fd.periods || []).filter((p: any) => p.status === 'pending' || p.status === 'review').map((p: any) => ({
                                id: p.payment_id ? `pay-${p.payment_id}` : `fee-${fd.fee.id}-${p.month}-${p.year}`,
                                amount: fd.fee.amount,
                                title: fd.fee.title,
                                due_date: p.due_date || `${p.year}-${String(p.month).padStart(2, '0')}-01`,
                                status: p.status === 'review' ? 'pending_review' : 'pending',
                                proof_image: p.proof_url,
                                type: 'monthly_fee'
                            }))
                        ).map((payment: any) => (
                            <PaymentRow 
                                key={payment.id} 
                                payment={payment} 
                                primaryColor={primaryColor} 
                                uploading={uploadingPayment === String(payment.id)} 
                                uploadSuccess={uploadSuccess === String(payment.id)} 
                                onUpload={(file) => handleUploadProof(String(payment.id), file)} 
                                onViewProof={(url) => setProofModal({ url, canDelete: payment.status !== 'approved', paymentId: String(payment.id) })} 
                                onDeleteProof={() => setConfirmDelete(String(payment.id))} 
                                isSelected={selectedPayments.includes(String(payment.id))} 
                                onToggleSelect={() => { setSelectedPayments(prev => prev.includes(String(payment.id)) ? prev.filter(id => id !== String(payment.id)) : [...prev, String(payment.id)]); }} 
                            />
                        ))}

                        {/* 2. Renderizar Pagos Genéricos/VIP (Payments tradicionales) */}
                        {students.flatMap((s: any) => (s.payments || []).filter((p:any) => p.status !== 'approved')).map((payment: any) => (
                            <PaymentRow key={payment.id} payment={payment} primaryColor={primaryColor} uploading={uploadingPayment === String(payment.id)} uploadSuccess={uploadSuccess === String(payment.id) || (uploadSuccess === "bulk" && selectedPayments.includes(String(payment.id)))} onUpload={(file) => handleUploadProof(String(payment.id), file)} onViewProof={(url) => setProofModal({ url, canDelete: payment.status !== 'approved', paymentId: String(payment.id) })} onDeleteProof={() => setConfirmDelete(String(payment.id))} isSelected={selectedPayments.includes(String(payment.id))} onToggleSelect={() => { setSelectedPayments(prev => prev.includes(String(payment.id)) ? prev.filter(id => id !== String(payment.id)) : [...prev, String(payment.id)]); }} />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                    {paymentHistory && paymentHistory.length > 0 ? (
                        paymentHistory.map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between bg-white border border-zinc-100 rounded-3xl px-5 py-4 shadow-sm group">
                                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-zinc-400 font-mono">#{String(p.id).slice(-4)}</span>
                                        <p className="text-sm font-black text-zinc-900">${Number(p.amount).toLocaleString("es-CL")}</p>
                                    </div>
                                    <p className="text-[10px] text-zinc-800 font-bold truncate pr-2 uppercase">{p.title || 'Pago de Mensualidad'}</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[9px] text-zinc-400 font-bold tracking-widest uppercase">{p.paid_at || p.due_date}</p>
                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${p.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-yellow-50 text-yellow-600 border-yellow-100'}`}>
                                            {p.status === 'approved' ? 'Pagado' : 'En Revisión'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {p.proof_image && (
                                        <button onClick={() => setProofModal({ url: p.proof_image, canDelete: false, paymentId: String(p.id) })} className="w-9 h-9 flex items-center justify-center bg-zinc-50 text-zinc-400 rounded-xl hover:bg-zinc-900 hover:text-white transition-all border border-zinc-100"><Eye size={16} /></button>
                                    )}
                                    {p.status !== 'approved' && (
                                        <button onClick={() => setConfirmDelete(String(p.id))} className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100"><Trash2 size={16} /></button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white border border-dashed border-zinc-200 rounded-[2.5rem] p-12 text-center">
                            <Clock className="w-12 h-12 text-zinc-200 mx-auto mb-3" />
                            <p className="text-sm text-zinc-400 font-bold italic">No hay historial de pagos</p>
                        </div>
                    )}
                </div>
            )}
            <input type="file" ref={bulkFileInputRef} className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleBulkUploadProof(file); if (e.target) e.target.value = ""; }} />
        </div>
    );
}
