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
import { FeeCard, PaymentRow } from "./StudentPaymentComponents";

interface StudentPaymentsSectionProps {
    paymentTab: "pending" | "history";
    setPaymentTab: (tab: "pending" | "history") => void;
    bankInfo: any;
    copiedBank: boolean;
    setCopiedBank: (val: boolean) => void;
    selectedPayments: string[];
    setSelectedPayments: React.Dispatch<React.SetStateAction<string[]>>;
    uploadingPayment: string | null;
    bulkFileInputRef: React.RefObject<HTMLInputElement>;
    myFees: any[];
    setFeePayModal: (val: { fees: any[] } | null) => void;
    students: any[];
    primaryColor: string;
    uploadSuccess: string | null;
    handleUploadProof: (id: string, file: File) => void;
    setProofModal: (val: { url: string; canDelete: boolean; paymentId: string } | null) => void;
    setConfirmDelete: (id: string | null) => void;
    handleBulkUploadProof: (file: File) => void;
    paymentHistory: any[];
    vocab: any;
    isSchoolTreasury?: boolean;
}

export function StudentPaymentsSection({
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
    setFeePayModal,
    students,
    primaryColor,
    uploadSuccess,
    handleUploadProof,
    setProofModal,
    setConfirmDelete,
    handleBulkUploadProof,
    paymentHistory,
    vocab,
    isSchoolTreasury
}: StudentPaymentsSectionProps) {
    const [showBankInfo, setShowBankInfo] = React.useState(false);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-black text-zinc-900">{isSchoolTreasury ? 'Cuotas' : 'Pagos'}</h2>
            
            {/* Tabs */}
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
                    {/* Pagos pendientes */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between ml-2">
                            <div className="flex items-center gap-3">
                                {bankInfo && (
                                    <button 
                                        onClick={() => setShowBankInfo(!showBankInfo)}
                                        className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all ${
                                            showBankInfo 
                                                ? 'bg-zinc-900 text-white shadow-md' 
                                                : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                                        }`}
                                    >
                                        Datos Transferencia
                                        {showBankInfo ? <ChevronUp size={12} className="text-white/70" /> : <ChevronDown size={12} className="text-orange-500/70" />}
                                    </button>
                                )}
                            </div>
                            {selectedPayments.length > 0 && (
                                <button 
                                    onClick={() => bulkFileInputRef.current?.click()}
                                    disabled={uploadingPayment === "bulk"}
                                    className="bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-orange-200 animate-in zoom-in duration-200 flex items-center gap-2"
                                >
                                    {uploadingPayment === "bulk" ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
                                    Pagar {selectedPayments.length} Masivamente
                                </button>
                            )}
                        </div>

                        {showBankInfo && bankInfo && (
                            <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-3xl p-4 shadow-lg relative overflow-hidden flex flex-col gap-3 animate-in slide-in-from-top-2 duration-300 mb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-zinc-800 rounded-xl flex items-center justify-center">
                                            <ShieldCheck size={16} className="text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Transferencia</p>
                                            <p className="text-xs font-bold leading-none mt-0.5">{bankInfo.bank_name}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${bankInfo.bank_name}\n${bankInfo.account_type}\n${bankInfo.account_number}\n${bankInfo.holder_name}\n${bankInfo.holder_rut}`);
                                            setCopiedBank(true);
                                            setTimeout(() => setCopiedBank(false), 2000);
                                        }}
                                        className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors"
                                    >
                                        {copiedBank ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                                        {copiedBank ? 'Copiado' : 'Datos'}
                                    </button>
                                </div>
                                <div className="bg-zinc-950/50 rounded-2xl p-3 border border-zinc-800/50 flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-zinc-400 font-medium">Cuenta</span>
                                        <span className="text-xs font-mono font-bold text-orange-400">{bankInfo.account_number}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-zinc-400 font-medium">Tipo</span>
                                        <span className="text-[10px] font-bold">{bankInfo.account_type}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-zinc-400 font-medium">Titular</span>
                                        <span className="text-[10px] font-bold line-clamp-1 text-right max-w-[150px]">{bankInfo.holder_name}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-zinc-400 font-medium">RUT</span>
                                        <span className="text-[10px] font-bold">{bankInfo.holder_rut}</span>
                                    </div>
                                </div>
                                <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
                            </div>
                        )}

                        {myFees && myFees.length > 0 && (
                            <>
                                <div className="flex items-center justify-between ml-2 mb-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                        {isSchoolTreasury ? 'Cuotas Recurrentes' : `${vocab.cat1}s ${vocab.placeLabel.toLowerCase()}s`}
                                    </h3>
                                    <button
                                        onClick={() => setFeePayModal({ fees: myFees })}
                                        className="bg-zinc-900 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full flex items-center gap-1.5"
                                    >
                                        <CreditCard size={10} /> {isSchoolTreasury ? 'Gestionar Cuotas' : 'Pagar'}
                                    </button>
                                </div>
                                {myFees.map((feeData: any) => (
                                    <FeeCard
                                        key={feeData.fee.id}
                                        feeData={feeData}
                                        primaryColor={primaryColor}
                                        onPay={() => setFeePayModal({ fees: [feeData] })}
                                        onViewProof={(url) => setProofModal({ url, canDelete: false, paymentId: '0' })}
                                    />
                                ))}
                            </>
                        )}
                        {students.some((s: any) => s.payments && s.payments.length > 0) && (
                            <div className="flex items-center justify-between ml-2 mb-1 mt-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {isSchoolTreasury ? 'Cuotas Únicas' : 'Pagos Mensuales'}
                                </h3>
                            </div>
                        )}
                        {students.flatMap((s: any) => s.payments || []).map((payment: any) => (
                            <PaymentRow
                                key={payment.id}
                                payment={payment}
                                primaryColor={primaryColor}
                                uploading={uploadingPayment === String(payment.id)}
                                uploadSuccess={uploadSuccess === String(payment.id) || (uploadSuccess === "bulk" && selectedPayments.includes(String(payment.id)))}
                                onUpload={(file) => handleUploadProof(String(payment.id), file)}
                                onViewProof={(url) => setProofModal({ url, canDelete: payment.status !== 'approved', paymentId: String(payment.id) })}
                                onDeleteProof={() => setConfirmDelete(String(payment.id))}
                                isSelected={selectedPayments.includes(String(payment.id))}
                                onToggleSelect={() => {
                                    setSelectedPayments(prev => 
                                        prev.includes(String(payment.id)) 
                                            ? prev.filter(id => id !== String(payment.id))
                                            : [...prev, String(payment.id)]
                                    );
                                }}
                            />
                        ))}
                        {students.every((s: any) => (s.payments || []).length === 0) && (!myFees || myFees.length === 0) && (
                            <div className="bg-white border border-dashed border-zinc-200 rounded-[2rem] p-8 text-center">
                                <p className="text-sm text-zinc-400 font-bold italic">No hay pagos pendientes</p>
                            </div>
                        )}
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
                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                            p.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-yellow-50 text-yellow-600 border-yellow-100'
                                        }`}>
                                            {p.status === 'approved' ? 'Pagado' : 'En Revisión'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {p.proof_image && (
                                        <button 
                                            onClick={() => setProofModal({ url: p.proof_image, canDelete: false, paymentId: String(p.id) })} 
                                            className="w-9 h-9 flex items-center justify-center bg-zinc-50 text-zinc-400 rounded-xl hover:bg-zinc-900 hover:text-white transition-all border border-zinc-100"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    )}
                                    {p.status !== 'approved' && (
                                        <button 
                                            onClick={() => setConfirmDelete(String(p.id))}
                                            className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white border border-dashed border-zinc-200 rounded-[2.5rem] p-12 text-center">
                            <Clock className="w-12 h-12 text-zinc-200 mx-auto mb-3" />
                            <p className="text-sm text-zinc-400 font-bold italic">No hay registro de pagos anteriores</p>
                        </div>
                    )}
                </div>
            )}
            
            <input 
                type="file"
                ref={bulkFileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleBulkUploadProof(file);
                    if (e.target) e.target.value = "";
                }}
            />
        </div>
    );
}
