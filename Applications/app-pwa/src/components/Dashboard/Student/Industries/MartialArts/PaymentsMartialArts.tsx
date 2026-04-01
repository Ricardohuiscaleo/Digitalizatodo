"use client";

import React from "react";
import { 
    CreditCard, 
    Clock, 
    ChevronDown, 
    ChevronUp, 
    ShieldCheck, 
    Loader2, 
    Zap,
    Upload,
    Trash2,
    Eye,
    Copy,
    Check,
    X,
    ImageIcon,
    Users,
    Baby,
    User,
    Calendar,
    Lock,
    Send,
    Banknote
} from "lucide-react";
import { PaymentRow } from "../../StudentPaymentComponents";
import { createSubscription } from "@/lib/api";

interface PaymentsMartialArtsProps {
    paymentTab: "pending" | "upgrade" | "history";
    setPaymentTab: (tab: "pending" | "upgrade" | "history") => void;
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
    onBuyPack?: (studentId: string, type: string, file?: File) => Promise<void>;
    plans: any[];
    guardianEmail?: string;
    token: string | null;
    slug: string;
}

// Helpers
function getStudentCategory(student: any): 'adults' | 'kids' {
    const cat = (student?.category || '').toLowerCase();
    if (cat === 'kids' || cat === 'kid' || cat === 'niño' || cat === 'infantil') return 'kids';
    if (student?.age && Number(student.age) < 14) return 'kids';
    return 'adults';
}

function formatDateFriendly(dateStr: string) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
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
    plans,
    guardianEmail,
    token,
    slug
}: PaymentsMartialArtsProps) {
    const [showBankInfo, setShowBankInfo] = React.useState(false);
    const [isBuying, setIsBuying] = React.useState<string | null>(null);
    const [showProjections, setShowProjections] = React.useState(false);
    
    const [pendingPaymentId, setPendingPaymentId] = React.useState<string | null>(null);
    const [pendingProofFile, setPendingProofFile] = React.useState<File | null>(null);
    const [pendingProofPreview, setPendingProofPreview] = React.useState<string | null>(null);
    const pendingFileRef = React.useRef<HTMLInputElement>(null);
    const [isUploadingPending, setIsUploadingPending] = React.useState<string | null>(null);

    const [planCategory, setPlanCategory] = React.useState<'adults' | 'kids' | '1-1'>('adults');
    const [selectedStudentId, setSelectedStudentId] = React.useState<string>(students[0]?.id || "");
    const [pendingPlanId, setPendingPlanId] = React.useState<string | null>(null);
    const [proofFile, setProofFile] = React.useState<File | null>(null);
    const [proofPreview, setProofPreview] = React.useState<string | null>(null);
    const inlineFileRef = React.useRef<HTMLInputElement>(null);

    const handlePendingFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPendingProofFile(file);
            setPendingProofPreview(URL.createObjectURL(file));
        }
    };

    const handleProofFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProofFile(file);
            setProofPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmitUpgrade = async () => {
        if (!onBuyPack || !selectedStudentId || !pendingPlanId || !proofFile) return;
        setIsBuying(pendingPlanId);
        try {
            await (onBuyPack as any)(selectedStudentId, pendingPlanId, proofFile);
            setPendingPlanId(null);
            setProofFile(null);
            setProofPreview(null);
        } finally {
            setIsBuying(null);
        }
    };

    const renderPaymentCard = (payment: any, student: any) => {
        const pid = String(payment.id);
        const isOpen = pendingPaymentId === pid;
        const isInReview = payment.status === 'pending_review';
        const isProjected = payment.isProjected;
        
        const localPlan = plans.find(p => String(p.id) === String(payment.plan_id));
        const isProportional = localPlan && payment.amount && Math.abs(Number(payment.amount) - Number(localPlan.price)) > 10;

        const handlePayWithMP = async () => {
            const emailToUse = student?.email || guardianEmail;
            if (!emailToUse) {
                alert("Alumno sin correo. Favor actualizar perfil.");
                return;
            }
            setIsUploadingPending(pid);
            try {
                const res = await createSubscription(slug, token || "", {
                    student_id: String(student.id),
                    plan_id: payment.mp_plan_id || String(payment.plan_id || ""), 
                    email: emailToUse,
                    amount: payment.amount,
                    fee_payment_id: payment.id 
                });
                if (res?.init_point) window.location.href = res.init_point;
                else alert("Error al generar pago.");
            } finally {
                setIsUploadingPending(null);
            }
        };

        return (
            <div key={pid} className={`rounded-[2rem] border-2 transition-all duration-300 ${
                isOpen ? 'bg-orange-50/50 border-orange-200' : 'bg-white border-zinc-100'
            } ${isProjected && !isOpen ? 'opacity-60' : ''}`}>
                <div className="p-5 flex items-center justify-between">
                    <div>
                        <div className="flex gap-2 mb-1">
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg ${isProjected ? 'bg-zinc-100 text-zinc-400' : 'bg-orange-100 text-orange-600'}`}>
                                {isProjected ? 'Futuro' : (payment.title || 'Cuota')}
                            </span>
                            {isProportional && !isProjected && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-600">Prorrateo 🎯</span>}
                        </div>
                        <p className={`text-xl font-black ${isProjected ? 'text-zinc-400' : 'text-zinc-900'}`}>{payment.amount ? `$${Number(payment.amount).toLocaleString('es-CL')}` : '---'}</p>
                        <p className="text-[10px] text-zinc-400 font-bold">{formatDateFriendly(payment.due_date)}</p>
                    </div>
                    <button 
                        onClick={() => !isInReview && !isProjected && setPendingPaymentId(isOpen ? null : pid)}
                        disabled={isInReview || isProjected}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                            isInReview ? 'bg-yellow-100 text-yellow-600' : isOpen ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
                        }`}
                    >
                        {isInReview ? <Clock size={20} /> : isOpen ? <X size={20} /> : <CreditCard size={20} />}
                    </button>
                </div>

                {isOpen && (
                    <div className="p-5 border-t border-orange-100 bg-white/50 rounded-b-[2rem] space-y-4">
                        <button onClick={handlePayWithMP} disabled={isUploadingPending === pid} className="w-full bg-zinc-950 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                            {isUploadingPending === pid ? <Loader2 size={16} className="animate-spin" /> : <><ShieldCheck size={16} /> Digitaliza Todo Pay (Seguro)</>}
                        </button>
                        <div className="flex gap-2">
                            <button onClick={() => pendingFileRef.current?.click()} className="flex-1 bg-white border-2 border-dashed border-zinc-200 py-3 rounded-2xl flex flex-col items-center justify-center gap-1">
                                {pendingProofPreview ? <img src={pendingProofPreview} className="w-8 h-8 rounded" alt="Proof" /> : <><ImageIcon size={14} className="text-zinc-300" /><span className="text-[8px] font-bold text-zinc-400">Subir Comprobante</span></>}
                            </button>
                            {pendingProofFile && (
                                <button onClick={() => handleUploadProof(pid, pendingProofFile)} className="w-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center"><Send size={18} /></button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <h2 className="text-2xl font-black text-zinc-900 px-1">Pagos</h2>
            
            {/* Tabs */}
            <div className="flex bg-zinc-100/50 p-1 rounded-2xl h-11 relative">
                <div className="absolute inset-y-1 left-1 bg-white rounded-xl shadow-sm transition-all duration-300" 
                    style={{ width: '33.33%', transform: `translateX(${paymentTab === 'pending' ? '0%' : paymentTab === 'upgrade' ? '100%' : '200%'})` }} />
                {(['pending', 'upgrade', 'history'] as const).map(tab => (
                    <button key={tab} onClick={() => setPaymentTab(tab)} className={`flex-1 relative z-10 text-[9px] font-black uppercase tracking-widest ${paymentTab === tab ? 'text-zinc-950' : 'text-zinc-400'}`}>
                        {tab === 'pending' ? 'Pendientes' : tab === 'upgrade' ? 'Mejorar' : 'Historial'}
                    </button>
                ))}
            </div>

            {paymentTab === "pending" && (
                <div className="space-y-4">
                    {(() => {
                        const groups: Record<string, any> = {};
                        students.forEach(s => {
                            const pending = (s.payments || []).filter((p: any) => p.status !== 'approved');
                            if (pending.length > 0) groups[s.id] = { student: s, payments: pending };
                        });
                        if (myFees) {
                            myFees.forEach((fd: any) => {
                                if (!groups[fd.student_id]) groups[fd.student_id] = { student: students.find(ss => ss.id === fd.student_id), payments: [] };
                                fd.periods?.filter((p: any) => p.status === 'pending').forEach((p: any) => {
                                    groups[fd.student_id].payments.push({ ...p, id: `proj-${p.id}`, isProjected: true, amount: fd.fee?.amount, title: fd.fee?.title });
                                });
                            });
                        }
                        const groupList = Object.values(groups);
                        if (groupList.length === 0) return <div className="p-12 text-center text-zinc-300 italic">No hay pagos pendientes</div>;
                        return groupList.map((g: any) => (
                            <div key={g.student.id} className="space-y-3">
                                {groupList.length > 1 && <p className="text-[9px] font-black uppercase text-zinc-400 ml-1">{g.student.name}</p>}
                                {g.payments.filter((p: any) => !p.isProjected || showProjections).map((p: any) => renderPaymentCard(p, g.student))}
                            </div>
                        ));
                    })()}

                    <div className="pt-4 space-y-4">
                        <button onClick={() => setShowProjections(!showProjections)} className="w-full py-4 border-2 border-dashed border-zinc-100 rounded-[2rem] text-[9px] font-black uppercase text-zinc-400">
                            {showProjections ? 'Ocultar Proyecciones' : 'Ver Próximos Meses'}
                        </button>
                    </div>
                </div>
            )}

            {paymentTab === "upgrade" && (
                <div className="space-y-4">
                    <div className="flex bg-zinc-100/50 p-1 rounded-2xl border border-zinc-50">
                        {(['adults', 'kids', '1-1'] as const).map(cat => (
                            <button key={cat} onClick={() => setPlanCategory(cat)} className={`flex-1 py-2 text-[8px] font-black uppercase rounded-xl transition-all ${planCategory === cat ? 'bg-white text-orange-600 shadow-sm' : 'text-zinc-400'}`}>
                                {cat === 'adults' ? 'Adulto' : cat === 'kids' ? 'Kid' : '1-1'}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {plans.filter(p => p.active).map(plan => {
                            const isCurrent = students.find(s => String(s.id) === selectedStudentId)?.enrollments?.some((e: any) => Number(e.plan_id) === Number(plan.id));
                            const isPending = pendingPlanId === String(plan.id);
                            return (
                                <div key={plan.id} className={`p-5 rounded-[2rem] border-2 transition-all ${isCurrent ? 'bg-amber-50 border-amber-200' : 'bg-white border-zinc-100'}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h4 className="text-xs font-black uppercase">{plan.name}</h4>
                                            <div className="flex items-baseline gap-2 mt-1">
                                                <span className="text-lg font-black">${Number(plan.price).toLocaleString('es-CL')}</span>
                                                {isCurrent && <button onClick={() => alert("Gestionar suscripción...")} className="text-[7px] font-black uppercase text-red-500 mt-2 block hover:underline">Gestionar Suscripción</button>}
                                            </div>
                                        </div>
                                        <button disabled={isCurrent} onClick={() => setPendingPlanId(isPending ? null : String(plan.id))} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isCurrent ? 'bg-zinc-50 text-zinc-300' : 'bg-zinc-900 text-white hover:bg-orange-600'}`}>
                                            {isCurrent ? 'Tu Plan ✓' : 'Cambiar'}
                                        </button>
                                    </div>
                                    {isPending && (
                                        <div className="mt-4 p-4 bg-orange-50/50 border border-orange-200 rounded-3xl space-y-4">
                                            <button onClick={async () => {
                                                const email = students.find(s => String(s.id) === selectedStudentId)?.email || guardianEmail;
                                                if (!email) return alert("Email missing");
                                                const res = await createSubscription(slug, token || "", { student_id: selectedStudentId, plan_id: String(plan.id), email, amount: plan.price });
                                                if (res?.init_point) window.location.href = res.init_point;
                                            }} className="w-full bg-zinc-950 text-white py-4 rounded-2xl text-[9px] font-black uppercase flex items-center justify-center gap-2">
                                                <ShieldCheck size={14} /> Pagar con Digitaliza Todo Pay
                                            </button>
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="h-px w-full bg-orange-200/50" />
                                                <span className="text-[8px] font-black text-zinc-400 uppercase">O también</span>
                                                <button onClick={() => inlineFileRef.current?.click()} className="w-full bg-white border-2 border-dashed border-zinc-200 py-3 rounded-2xl text-[8px] font-black uppercase text-zinc-500 flex flex-col items-center gap-1">
                                                    <Upload size={14} /> {proofFile ? 'Archivo Seleccionado' : 'Subir Comprobante'}
                                                </button>
                                                {proofFile && <button onClick={handleSubmitUpgrade} className="w-full bg-emerald-500 text-white py-2 rounded-2xl text-[9px] font-black uppercase">Confirmar</button>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {paymentTab === "history" && (
                <div className="space-y-3">
                    {paymentHistory?.map((p: any) => (
                        <div key={p.id} className="bg-white border border-zinc-100 p-4 rounded-3xl flex justify-between items-center">
                            <div>
                                <p className="text-xs font-black">${Number(p.amount).toLocaleString('es-CL')}</p>
                                <p className="text-[9px] font-bold text-zinc-400">{p.paid_at || p.created_at}</p>
                            </div>
                            <span className="text-[8px] font-black uppercase px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg">Aprobado ✓</span>
                        </div>
                    )) || <p className="text-center text-zinc-300 italic pt-10">Sin historial</p>}
                </div>
            )}

            <input type="file" ref={pendingFileRef} className="hidden" accept="image/*" onChange={handlePendingFileSelect} />
            <input type="file" ref={inlineFileRef} className="hidden" accept="image/*" onChange={handleProofFileSelect} />
        </div>
    );
}
