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
    Calendar
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
}

// Helper: determinar categoría de un alumno
function getStudentCategory(student: any): 'adults' | 'kids' {
    const cat = (student?.category || '').toLowerCase();
    const name = (student?.name || '').toLowerCase();
    if (cat === 'kids' || cat === 'kid' || cat === 'niño' || cat === 'infantil') return 'kids';
    // Heurística por edad si disponible
    if (student?.age && Number(student.age) < 14) return 'kids';
    return 'adults';
}

// Helper: Formatear fecha de forma amigable (D MMM, YYYY)
function formatDateFriendly(dateStr: string) {
    if (!dateStr) return '';
    // Intentar manejar YYYY-MM-DD sin problemas de zona horaria
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        const date = new Date(year, month, day);
        return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
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
    const [isBuying, setIsBuying] = React.useState<string | null>(null);
    const [expandedStudents, setExpandedStudents] = React.useState<Record<string, boolean>>({});

    const toggleStudentExpansion = (sid: string) => {
        setExpandedStudents(prev => ({ ...prev, [sid]: !prev[sid] }));
    };

    // Separar alumnos por categoría
    const adultStudents = students.filter(s => getStudentCategory(s) === 'adults');
    const kidStudents   = students.filter(s => getStudentCategory(s) === 'kids');

    // Categoría activa en el switch
    const [planCategory, setPlanCategory] = React.useState<'adults' | 'kids' | '1-1'>(
        adultStudents.length > 0 ? 'adults' : kidStudents.length > 0 ? 'kids' : 'adults'
    );

    // Alumno seleccionado dentro de la categoría activa
    const relevantStudents = planCategory === 'adults' ? adultStudents : planCategory === 'kids' ? kidStudents : students;
    const [selectedStudentId, setSelectedStudentId] = React.useState<string>(
        relevantStudents[0]?.id || students[0]?.id || ""
    );

    // Cuando cambia la categoría, resetear al primer alumno relevante
    React.useEffect(() => {
        const rel = planCategory === 'adults' ? adultStudents : planCategory === 'kids' ? kidStudents : students;
        if (rel.length > 0) setSelectedStudentId(String(rel[0].id));
    }, [planCategory]); // eslint-disable-line

    // Estado del flujo de compra inline (Upgrade)
    const [pendingPlanId, setPendingPlanId] = React.useState<string | null>(null);
    const [proofFile, setProofFile] = React.useState<File | null>(null);
    const [proofPreview, setProofPreview] = React.useState<string | null>(null);
    const inlineFileRef = React.useRef<HTMLInputElement>(null);

    // Estado del flujo inline de upload en PENDIENTES
    const [pendingPaymentId, setPendingPaymentId] = React.useState<string | null>(null);
    const [pendingProofFile, setPendingProofFile] = React.useState<File | null>(null);
    const [pendingProofPreview, setPendingProofPreview] = React.useState<string | null>(null);
    const pendingFileRef = React.useRef<HTMLInputElement>(null);
    const [isUploadingPending, setIsUploadingPending] = React.useState<string | null>(null);

    const handleOpenPendingUpload = (paymentId: string) => {
        if (pendingPaymentId === paymentId) {
            setPendingPaymentId(null); setPendingProofFile(null); setPendingProofPreview(null);
        } else {
            setPendingPaymentId(paymentId); setPendingProofFile(null); setPendingProofPreview(null);
        }
    };

    const handlePendingFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPendingProofFile(file);
        setPendingProofPreview(URL.createObjectURL(file));
        if (e.target) e.target.value = "";
    };

    const handleSubmitPendingProof = async (paymentId: string) => {
        if (!pendingProofFile) return;
        setIsUploadingPending(paymentId);
        try {
            await handleUploadProof(paymentId, pendingProofFile);
            setPendingPaymentId(null); setPendingProofFile(null); setPendingProofPreview(null);
        } finally {
            setIsUploadingPending(null);
        }
    };

    const renderPaymentCard = (payment: any, student: any) => {
        const pid = String(payment.id);
        const isOpen = pendingPaymentId === pid;
        const isInReview = payment.status === 'pending_review';
        const isUploading = isUploadingPending === pid;

        const handlePayWithMP = async () => {
            if (!student?.email) {
                alert("El alumno no tiene un correo registrado.");
                return;
            }
            setIsUploadingPending(pid);
            try {
                // Obtenemos el plan_id si es proyectado o el ID de suscripción de MP
                const res = await createSubscription(student.tenant_id, "", {
                    studentId: String(student.id),
                    planId: payment.mp_plan_id || "TEST_PLAN_ID", // Aquí usaremos el ID real del plan de MP
                    email: student.email,
                    amount: payment.amount
                });

                if (res?.init_point) {
                    window.location.href = res.init_point;
                } else {
                    alert("No se pudo generar el link de pago.");
                }
            } finally {
                setIsUploadingPending(null);
            }
        };

        return (
            <div key={pid} className="space-y-0 relative">
                <div className={`p-4 rounded-[2rem] border transition-all duration-300 ${
                    isOpen 
                    ? 'bg-orange-50/40 border-orange-300 border-2' 
                    : isInReview
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-white border-zinc-100 hover:border-zinc-200 hover:shadow-md'
                }`}>
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-zinc-900 truncate">{payment.title || 'Pago'}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-base font-black text-zinc-900">${Number(payment.amount).toLocaleString('es-CL')}</span>
                                {payment.due_date && (
                                    <span className="text-[9px] text-zinc-400 font-bold uppercase">{formatDateFriendly(payment.due_date)}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {isInReview ? (
                                <span className="text-[8px] font-black uppercase px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
                                    ⏳ En Revisión
                                </span>
                            ) : (
                                <button
                                    onClick={() => handleOpenPendingUpload(pid)}
                                    className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3.5 py-2 rounded-2xl transition-all ${
                                        isOpen
                                        ? 'bg-zinc-200 text-zinc-600'
                                        : 'bg-zinc-900 text-white hover:bg-orange-600 active:scale-95'
                                    }`}
                                >
                                    {isOpen ? <><X size={11} /> Cancelar</> : <><CreditCard size={11} /> Pagar</>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {isOpen && (
                    <div className="mx-2 rounded-b-[2rem] border-x border-b border-orange-200 bg-orange-50/30 p-5 space-y-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center">
                                <ShieldCheck size={12} className="text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-zinc-900 uppercase tracking-wide">Pago Seguro con Tarjeta</p>
                                <p className="text-[9px] text-zinc-500">Activa tu suscripción mensual 🥋</p>
                            </div>
                        </div>

                        <button
                            onClick={handlePayWithMP}
                            disabled={isUploading}
                            className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 bg-zinc-900 text-white hover:bg-zinc-950 active:scale-95 shadow-xl shadow-zinc-200`}
                        >
                            {isUploading ? (
                                <><Loader2 size={14} className="animate-spin" /> Conectando...</>
                            ) : (
                                <><CreditCard size={14} /> Pagar Ahora</>
                            )}
                        </button>

                        <p className="text-center text-[7.5px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
                            Al pagar, autorizas el cobro mensual automático.<br/>Seguridad garantizada por Mercado Pago.
                        </p>
                    </div>
                )}
            </div>
        );
    };

    const handleSelectPlan = (planId: string) => {
        // Abrir el flujo inline de carga de comprobante
        if (pendingPlanId === planId) {
            // toggle: cancel
            setPendingPlanId(null);
            setProofFile(null);
            setProofPreview(null);
        } else {
            setPendingPlanId(planId);
            setProofFile(null);
            setProofPreview(null);
        }
    };

    const handleProofFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setProofFile(file);
        setProofPreview(URL.createObjectURL(file));
        if (e.target) e.target.value = "";
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

    // Filtrado de planes según categoría
    const filteredPlans = plans.filter(p => {
        const audience = p.target_audience?.toLowerCase() || "";
        const category = p.category?.toLowerCase() || "";
        const name = p.name?.toLowerCase() || "";
        const is1a1 = category === 'personal' || category === 'vip' || name.includes('1-1') || name.includes('individual') || name.includes('personalizada');
        if (planCategory === '1-1') return is1a1;
        if (is1a1) return false;
        const isKidPlan = audience.includes('kid') || audience.includes('niño') || audience.includes('infantil') || audience.includes('chico') || name.includes('kid') || name.includes('niño') || name.includes('infantil');
        const isAdultPlan = (audience.includes('adult') || audience.includes('adulto')) || (!isKidPlan);
        if (planCategory === 'kids') return isKidPlan;
        if (planCategory === 'adults') return isAdultPlan && !isKidPlan;
        return false;
    });

    // Base mensual para cálculo de ahorro
    const baseMonthlyPlan = plans.find(p => {
        const pName = p.name.toLowerCase();
        if (p.billing_cycle !== 'monthly_fixed') return false;
        if (planCategory === '1-1') return p.category === 'vip' || p.category === 'personal' || pName.includes('1-1');
        if (planCategory === 'kids') return pName.includes('kid') || pName.includes('niño');
        return !pName.includes('kid') && !pName.includes('niño') && p.category !== 'vip' && p.category !== 'personal';
    });

    const selectedStudent = students.find(s => String(s.id) === String(selectedStudentId));

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-black text-zinc-900">Pagos</h2>
            
            {/* Tabs */}
            <div className="flex bg-zinc-100/50 p-1 rounded-2xl h-11 relative">
                <div 
                    className="absolute inset-y-1 left-1 bg-white rounded-xl shadow-sm transition-all duration-300 ease-out"
                    style={{ 
                        width: 'calc(33.33% - 4px)',
                        transform: `translateX(${paymentTab === 'pending' ? '0' : paymentTab === 'upgrade' ? '100%' : '200%'})`
                    }}
                />
                {(['pending', 'upgrade', 'history'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setPaymentTab(tab)}
                        className={`flex-1 relative z-10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 ${
                            paymentTab === tab ? 'text-zinc-950' : 'text-zinc-400'
                        }`}
                    >
                        {tab === 'pending' ? <CreditCard size={14} /> : tab === 'upgrade' ? <Zap size={14} /> : <Clock size={14} />}
                        <span>
                            {tab === 'pending' ? 'Pendientes' : 
                             tab === 'upgrade' ? 'Mejorar Plan' : 
                             'Historial'}
                        </span>
                    </button>
                ))}
            </div>
            
            {/* ===== 1. PENDIENTES ===== */}
            {paymentTab === "pending" && (
                <div className="space-y-6 animate-in fade-in duration-300 pb-10">
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

                        {/* Agrupar pagos pendientes por alumno */}
                        {(() => {
                            const groups: Record<string, { student: any; payments: any[] }> = {};

                            // 2) Collect Real Payments first to use as reference
                            students.forEach((s: any) => {
                                const sid = String(s.id);
                                const pending = (s.payments || []).filter((p: any) => p.status !== 'approved');
                                if (pending.length > 0) {
                                    if (!groups[sid]) groups[sid] = { student: s, payments: [] };
                                    pending.forEach((p: any) => {
                                        groups[sid].payments.push({ ...p, isReal: true });
                                    });
                                }
                            });

                             // 2.5) Map of covered months per student: "sid-YYYY-MM"
                            const coveredMonths = new Set<string>();
                            Object.values(groups).forEach((g: any) => {
                                const sid = String(g.student.id);
                                g.payments.forEach((p: any) => {
                                    if (p.due_date) {
                                        const parts = p.due_date.split('-');
                                        if (parts.length >= 2) {
                                            const y = parseInt(parts[0]);
                                            const m = parseInt(parts[1]);
                                            coveredMonths.add(`${sid}-${y}-${m}`);
                                        }
                                    }
                                });

                                // También cubrimos el mes de creación del alumno para no duplicar con la prorrata
                                if (g.student.created_at) {
                                    const d = new Date(g.student.created_at);
                                    if (!isNaN(d.getTime())) {
                                        coveredMonths.add(`${sid}-${d.getFullYear()}-${d.getMonth() + 1}`);
                                    }
                                }
                            });

                            // 3) Add Projected Fees (myFees), skipping duplicates
                            if (myFees) {
                                myFees.forEach((fd: any) => {
                                    const sid = String(fd.student_id || fd.fee?.student_id || 'all');
                                    const student = students.find(s => String(s.id) === sid) || { id: sid, name: 'General', photo_url: null };
                                    if (!groups[sid]) groups[sid] = { student, payments: [] };
                                    
                                    (fd.periods || []).filter((p: any) => p.status === 'pending' || p.status === 'review').forEach((p: any) => {
                                        const monthKey = `${sid}-${p.year}-${p.month}`;
                                        // Skip if we already have a manual payment for this period
                                        if (coveredMonths.has(monthKey)) return;

                                        groups[sid].payments.push({
                                            id: p.payment_id ? `pay-${p.payment_id}` : `fee-${sid}-${fd.enrollment_id || 0}-${fd.fee.id}-${p.month}-${p.year}`,
                                            amount: fd.fee.amount,
                                            title: fd.fee.title,
                                            due_date: p.due_date || `${p.year}-${String(p.month).padStart(2, '0')}-01`,
                                            status: p.status === 'review' ? 'pending_review' : 'pending',
                                            proof_image: p.proof_url,
                                            isProjected: true
                                        });
                                    });
                                });
                            }

                            const groupList: any[] = Object.values(groups).filter((g: any) => g.payments.length > 0);

                            if (groupList.length === 0) return (
                                <div className="bg-white border border-dashed border-zinc-200 rounded-[2.5rem] p-12 text-center mt-6">
                                    <ShieldCheck className="w-12 h-12 text-zinc-200 mx-auto mb-3" />
                                    <p className="text-sm text-zinc-400 font-bold italic">No tienes pagos pendientes</p>
                                </div>
                            );

                            return groupList.map(({ student, payments }: any) => (
                                <div key={student.id} className="space-y-2">
                                    {/* Header del alumno (solo si hay más de un grupo) */}
                                    {groupList.length > 1 && (
                                        <div className="flex items-center gap-2 px-1 pt-2">
                                            <div className={`w-7 h-7 rounded-xl overflow-hidden flex items-center justify-center font-black text-xs flex-shrink-0 ${getStudentCategory(student) === 'kids' ? 'bg-fuchsia-500 text-white' : 'bg-blue-500 text-white'}`}>
                                                {student.photo_url
                                                    ? <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" />
                                                    : (student.name || '?').charAt(0).toUpperCase()
                                                }
                                            </div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">{student.name?.split(' ')[0]}</p>
                                            <div className="flex-1 h-px bg-zinc-100" />
                                            <span className="text-[8px] font-bold text-zinc-300">{payments.length} cuota{payments.length !== 1 ? 's' : ''}</span>
                                        </div>
                                    )}

                                    {/* Tarjetas del alumno - Con Lógica de Expandible */}
                                     {(() => {
                                        const sortedPayments = [...payments].sort((a, b) => {
                                            // 1. Prioridad: Reales primero (Registration/Manual)
                                            if (a.isReal && !b.isReal) return -1;
                                            if (!a.isReal && b.isReal) return 1;

                                            // 2. Fecha ascendente
                                            if (!a.due_date) return 1;
                                            if (!b.due_date) return -1;
                                            return a.due_date.localeCompare(b.due_date);
                                        });

                                        const mainPayment = sortedPayments[0];
                                        const otherPayments = sortedPayments.slice(1);
                                        const isExpanded = expandedStudents[String(student.id)];

                                        return (
                                            <div className="space-y-3">
                                                {/* Cuota Principal (La más próxima) */}
                                                {renderPaymentCard(mainPayment, student)}

                                                {/* Cuotas Adicionales colapsadas */}
                                                {otherPayments.length > 0 && (
                                                    <div className="space-y-3 mt-4">
                                                        <button 
                                                            onClick={() => toggleStudentExpansion(String(student.id))}
                                                            className="flex items-center gap-3 w-full px-5 py-3 rounded-2xl bg-zinc-50 border border-zinc-100 hover:bg-zinc-100 transition-all group"
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 group-hover:text-zinc-600 transition-colors">
                                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                            </div>
                                                            <div className="flex-1 text-left">
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                                                    {isExpanded ? 'Ocultar proyecciones' : `Ver ${otherPayments.length} cuotas proyectadas`}
                                                                </p>
                                                            </div>
                                                        </button>

                                                        {isExpanded && (
                                                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 pl-4 border-l-2 border-zinc-100/50 ml-4">
                                                                {otherPayments.map(p => renderPaymentCard(p, student))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                     })()}
                                </div>
                            ));
                        })()}

                    </div>
                </div>
            )}

            {/* ===== 2. UPGRADE / MEJORAR PLAN ===== */}
            {paymentTab === "upgrade" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">

                    {/* Switch de Categoría: Adulto / Kid / 1-1 */}
                    <div className="flex bg-zinc-100/80 p-1 rounded-2xl border border-zinc-50">
                        {/* Adulto */}
                        <button
                            onClick={() => setPlanCategory('adults')}
                            className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                planCategory === 'adults' 
                                ? 'bg-white text-blue-600 shadow-sm border border-blue-100' 
                                : 'text-zinc-400 hover:text-zinc-700'
                            }`}
                        >
                            <Users size={14} className={planCategory === 'adults' ? 'text-blue-500' : 'text-zinc-300'} />
                            Adulto
                        </button>
                        {/* Kid */}
                        <button
                            onClick={() => setPlanCategory('kids')}
                            className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                planCategory === 'kids' 
                                ? 'bg-white text-fuchsia-600 shadow-sm border border-fuchsia-100' 
                                : 'text-zinc-400 hover:text-zinc-700'
                            }`}
                        >
                            <Baby size={14} className={planCategory === 'kids' ? 'text-fuchsia-500' : 'text-zinc-300'} />
                            Kid
                        </button>
                        {/* 1-1 */}
                        <button
                            onClick={() => setPlanCategory('1-1')}
                            className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                planCategory === '1-1' 
                                ? 'bg-white text-amber-600 shadow-sm border border-amber-100' 
                                : 'text-zinc-400 hover:text-zinc-700'
                            }`}
                        >
                            <User size={14} className={planCategory === '1-1' ? 'text-amber-500' : 'text-zinc-300'} />
                            1-1
                        </button>
                    </div>

                    {/* Selector Smart de Alumno (según categoría) */}
                    {planCategory !== '1-1' && (
                        <div>
                            {/* Alumnos de la categoría activa */}
                            {relevantStudents.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                    {relevantStudents.map(s => {
                                        const isActive = String(s.id) === String(selectedStudentId);
                                        const isKid = getStudentCategory(s) === 'kids';
                                        return (
                                            <button
                                                key={s.id}
                                                onClick={() => setSelectedStudentId(String(s.id))}
                                                className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all duration-300 min-w-[64px] ${
                                                    isActive 
                                                    ? isKid 
                                                        ? 'bg-fuchsia-50 border-fuchsia-300 shadow-md shadow-fuchsia-100' 
                                                        : 'bg-blue-50 border-blue-300 shadow-md shadow-blue-100'
                                                    : 'bg-zinc-50 border-zinc-100 hover:border-zinc-200'
                                                }`}
                                            >
                                                {/* Avatar */}
                                                <div className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center font-black text-sm ${
                                                    isActive 
                                                    ? isKid ? 'bg-fuchsia-500 text-white' : 'bg-blue-500 text-white'
                                                    : 'bg-zinc-200 text-zinc-500'
                                                }`}>
                                                    {s.photo_url 
                                                        ? <img src={s.photo_url} alt={s.name} className="w-full h-full object-cover" />
                                                        : (s.name || 'X').charAt(0).toUpperCase()
                                                    }
                                                </div>
                                                <span className={`text-[8px] font-black uppercase tracking-wide text-center leading-tight max-w-[60px] truncate ${
                                                    isActive 
                                                    ? isKid ? 'text-fuchsia-700' : 'text-blue-700'
                                                    : 'text-zinc-500'
                                                }`}>
                                                    {s.name?.split(' ')[0] || '—'}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}



                            {/* No hay alumnos en esta categoría */}
                            {relevantStudents.length === 0 && (
                                <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-3xl p-6 text-center">
                                    <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest">
                                        {planCategory === 'kids' ? 'No tienes alumnos en categoría infantil' : 'No tienes alumnos en categoría adulto'}
                                    </p>
                                    {planCategory === 'kids' && <p className="text-[8px] text-zinc-300 mt-1">Los planes Kid aplican a alumnos registrados en categoría infantil</p>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Selector para 1-1: Mostrar todos */}
                    {planCategory === '1-1' && students.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {students.map(s => {
                                const isActive = String(s.id) === String(selectedStudentId);
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => setSelectedStudentId(String(s.id))}
                                        className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all duration-300 min-w-[64px] ${
                                            isActive 
                                            ? 'bg-amber-50 border-amber-300 shadow-md shadow-amber-100'
                                            : 'bg-zinc-50 border-zinc-100 hover:border-zinc-200'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center font-black text-sm ${isActive ? 'bg-amber-500 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
                                            {s.photo_url 
                                                ? <img src={s.photo_url} alt={s.name} className="w-full h-full object-cover" />
                                                : (s.name || 'X').charAt(0).toUpperCase()
                                            }
                                        </div>
                                        <span className={`text-[8px] font-black uppercase tracking-wide text-center leading-tight max-w-[60px] truncate ${isActive ? 'text-amber-700' : 'text-zinc-500'}`}>
                                            {s.name?.split(' ')[0] || '—'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Header de la sección */}
                    <div className="flex items-center gap-2 ml-1">
                        <div className={`w-2 h-2 rounded-full ${planCategory === 'adults' ? 'bg-blue-400' : planCategory === 'kids' ? 'bg-fuchsia-400' : 'bg-amber-400'}`} />
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                            {planCategory === 'adults' ? 'Planes Adulto' : planCategory === 'kids' ? 'Planes Infantiles' : 'Sesiones Personalizadas'}
                            {selectedStudent && planCategory !== '1-1' && ` · ${selectedStudent.name?.split(' ')[0]}`}
                        </p>
                    </div>

                    {/* Grid de Planes */}
                    <div className="grid grid-cols-1 gap-3">
                        {filteredPlans.map((plan) => {
                            const isCurrentPlan = selectedStudent?.enrollments?.some((e: any) => Number(e.plan_id) === Number(plan.id) && e.status === 'active');

                            let savingAmount = 0;
                            if (baseMonthlyPlan && Number(plan.id) !== Number(baseMonthlyPlan.id)) {
                                const monthlyPrice = Number(baseMonthlyPlan.price);
                                if (plan.billing_cycle === 'quarterly')  savingAmount = (monthlyPrice * 3)  - Number(plan.price);
                                if (plan.billing_cycle === 'semi_annual') savingAmount = (monthlyPrice * 6) - Number(plan.price);
                                if (plan.billing_cycle === 'annual')      savingAmount = (monthlyPrice * 12) - Number(plan.price);
                            }
                            if (savingAmount < 0) savingAmount = 0;

                            const isPending = pendingPlanId === String(plan.id);

                            return (
                                <div key={plan.id} className="space-y-0">
                                    {/* Tarjeta del Plan */}
                                    <div 
                                        className={`relative p-5 rounded-[2rem] border transition-all duration-300 ${
                                            isCurrentPlan 
                                            ? 'bg-amber-50 border-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.15)]' 
                                            : isPending
                                            ? `border-2 ${planCategory === 'adults' ? 'border-blue-300 bg-blue-50/40' : planCategory === 'kids' ? 'border-fuchsia-300 bg-fuchsia-50/40' : 'border-amber-300 bg-amber-50/40'}`
                                            : 'bg-white border-zinc-100 hover:border-zinc-200 hover:shadow-lg'
                                        }`}
                                    >
                                        {/* Tag plan actual */}
                                        {isCurrentPlan && (
                                            <div className="absolute -top-3 left-5 bg-amber-400 text-white text-[8px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow border-2 border-white flex items-center gap-1.5 whitespace-nowrap">
                                                <Zap size={9} className="fill-white" />
                                                Tu Plan Actual
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1 flex-1 min-w-0">
                                                <h4 className={`text-sm font-black uppercase tracking-tight ${isCurrentPlan ? 'text-amber-800' : 'text-zinc-900'}`}>
                                                    {plan.name}
                                                </h4>
                                                <div className="flex items-center flex-wrap gap-2">
                                                    <span className={`text-xl font-black ${isCurrentPlan ? 'text-amber-600' : 'text-zinc-900'}`}>
                                                        ${Number(plan.price).toLocaleString('es-CL')}
                                                    </span>
                                                    {savingAmount > 0 && (
                                                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg">
                                                            💚 Ahorro de ${savingAmount.toLocaleString('es-CL')}
                                                        </span>
                                                    )}
                                                    {plan.billing_cycle && plan.billing_cycle !== 'monthly_fixed' && plan.billing_cycle !== 'monthly_from_enrollment' && (
                                                        <span className="text-[9px] font-black text-blue-600 bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                                            <Calendar size={10} />
                                                            {plan.billing_cycle === 'quarterly' ? '3 Meses' : plan.billing_cycle === 'semi_annual' ? '6 Meses' : '12 Meses'} de Cobertura
                                                        </span>
                                                    )}
                                                </div>
                                                {plan.description && (
                                                    <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2 italic mt-1">
                                                        {plan.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className={`ml-3 p-2 rounded-2xl flex-shrink-0 ${isCurrentPlan ? 'bg-amber-100' : 'bg-zinc-50'}`}>
                                                <ShieldCheck size={18} className={isCurrentPlan ? 'text-amber-500' : 'text-zinc-300'} />
                                            </div>
                                        </div>

                                        {/* Botón de acción */}
                                        <button
                                            onClick={() => !isCurrentPlan && handleSelectPlan(String(plan.id))}
                                            disabled={isCurrentPlan || isBuying !== null}
                                            className={`w-full mt-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 ${
                                                isCurrentPlan
                                                ? 'bg-amber-100 text-amber-600 border border-amber-200 cursor-default'
                                                : isPending
                                                ? `text-white ${planCategory === 'adults' ? 'bg-blue-500' : planCategory === 'kids' ? 'bg-fuchsia-500' : 'bg-amber-500'}`
                                                : isBuying !== null
                                                ? 'bg-zinc-100 text-zinc-400'
                                                : 'bg-zinc-900 text-white hover:bg-orange-600 hover:shadow-lg active:scale-95'
                                            }`}
                                        >
                                            {isBuying === String(plan.id) ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : isCurrentPlan ? (
                                                "Plan Actual ✓"
                                            ) : isPending ? (
                                                <><X size={12} /> Cancelar</>
                                            ) : (
                                                <><CreditCard size={12} /> Seleccionar Plan</>
                                            )}
                                        </button>
                                    </div>

                                    {/* ===== CAJA DE SUBIR COMPROBANTE (inline) ===== */}
                                    {isPending && (
                                        <div className={`mx-2 rounded-b-[2rem] border-x border-b p-5 space-y-4 animate-in slide-in-from-top-2 duration-300 ${
                                            planCategory === 'adults' ? 'bg-blue-50/50 border-blue-200' : planCategory === 'kids' ? 'bg-fuchsia-50/50 border-fuchsia-200' : 'bg-amber-50/50 border-amber-200'
                                        }`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${planCategory === 'adults' ? 'bg-blue-500' : planCategory === 'kids' ? 'bg-fuchsia-500' : 'bg-amber-500'}`}>
                                                    <Upload size={12} className="text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-zinc-900 uppercase tracking-wide">Sube tu comprobante</p>
                                                    <p className="text-[9px] text-zinc-500">El Sensei lo aprobará pronto 🥋</p>
                                                </div>
                                            </div>

                                            {/* Preview o zona de carga */}
                                            {proofPreview ? (
                                                <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-zinc-200 bg-white">
                                                    <img src={proofPreview} alt="Comprobante" className="w-full h-40 object-cover" />
                                                    <button
                                                        onClick={() => { setProofFile(null); setProofPreview(null); }}
                                                        className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[8px] font-bold px-2 py-1 rounded-lg truncate max-w-[80%]">
                                                        {proofFile?.name}
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => inlineFileRef.current?.click()}
                                                    className="w-full h-28 rounded-2xl border-2 border-dashed border-zinc-200 bg-white hover:border-zinc-400 hover:bg-zinc-50 transition-all flex flex-col items-center justify-center gap-2 group"
                                                >
                                                    <ImageIcon size={24} className="text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-600">Toca para subir foto</span>
                                                    <span className="text-[8px] text-zinc-300">JPG, PNG, HEIC — máx 50MB</span>
                                                </button>
                                            )}

                                            {/* Botón Confirmar */}
                                            <button
                                                onClick={handleSubmitUpgrade}
                                                disabled={!proofFile || isBuying !== null}
                                                className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 ${
                                                    proofFile 
                                                    ? `text-white shadow-lg active:scale-95 ${planCategory === 'adults' ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-200' : planCategory === 'kids' ? 'bg-fuchsia-500 hover:bg-fuchsia-600 shadow-fuchsia-200' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'}`
                                                    : 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
                                                }`}
                                            >
                                                {isBuying ? (
                                                    <><Loader2 size={14} className="animate-spin" /> Enviando...</>
                                                ) : (
                                                    <><Check size={14} /> Confirmar y Enviar</>
                                                )}
                                            </button>

                                            <p className="text-center text-[8px] text-zinc-400">
                                                Una vez validado, tu plan se actualizará automáticamente
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Sin planes */}
                        {filteredPlans.length === 0 && plans.length > 0 && (
                            <div className="p-10 text-center bg-zinc-50 rounded-[2rem] border border-dashed border-zinc-200">
                                <Zap size={18} className="text-zinc-300 mx-auto mb-2" />
                                <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest">Sin planes en esta categoría</p>
                                <p className="text-[8px] text-zinc-300 mt-1">Contacta al sensei para más información</p>
                            </div>
                        )}
                        {plans.length === 0 && (
                            <div className="p-10 text-center bg-zinc-50 rounded-[2rem] border border-dashed border-zinc-200">
                                <Loader2 size={20} className="animate-spin text-orange-500 mx-auto mb-3" />
                                <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest">Cargando planes...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===== 3. HISTORIAL ===== */}
            {paymentTab === "history" && (
                <div className="space-y-4 animate-in fade-in duration-300">
                    {paymentHistory && paymentHistory.length > 0 ? (
                        paymentHistory.map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between bg-white border border-zinc-100 rounded-3xl px-5 py-4 shadow-sm group">
                                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-zinc-400 font-mono">#{String(p.id).slice(-4)}</span>
                                        <p className="text-sm font-black text-zinc-900">${Number(p.amount).toLocaleString("es-CL")}</p>
                                    </div>
                                    <p className="text-[10px] text-zinc-800 font-bold truncate pr-2 uppercase">{p.title || p.notes || 'Pago'}</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[9px] text-zinc-400 font-bold tracking-widest uppercase">{p.paid_at || p.due_date}</p>
                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                            p.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                            p.status === 'pending_review' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                            'bg-zinc-50 text-zinc-500 border-zinc-100'
                                        }`}>
                                            {p.status === 'approved' ? 'Pagado ✓' : 'En Revisión ⏳'}
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
            <input type="file" ref={inlineFileRef} className="hidden" accept="image/*,image/heic" onChange={handleProofFileSelect} />
            <input type="file" ref={pendingFileRef} className="hidden" accept="image/*,image/heic" onChange={handlePendingFileSelect} />
        </div>
    );
}
