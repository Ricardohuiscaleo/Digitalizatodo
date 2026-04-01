"use client";

import React, { useState } from "react";
import { 
    Clock, 
    History,
    CreditCard,
    Zap,
    TrendingUp
} from "lucide-react";
import { createSubscription, subscribeWithCard } from "@/lib/api";
import { RefactoredPaymentCard } from "./subcomponents/RefactoredPaymentCard";
import { PlanUpgradeGrid } from "./subcomponents/PlanUpgradeGrid";

interface PaymentsMartialArtsProps {
    paymentTab: "pending" | "upgrade" | "history";
    setPaymentTab: (tab: "pending" | "upgrade" | "history") => void;
    students: any[];
    plans: any[];
    myFees?: any[];
    token: string | null;
    slug: string;
    bankInfo?: any;
    copiedBank?: boolean;
    setCopiedBank?: (v: boolean) => void;
    selectedPayments?: string[];
    setSelectedPayments?: (v: string[]) => void;
    uploadingPayment?: any;
    bulkFileInputRef?: any;
    uploadSuccess?: any;
    setProofModal?: any;
    setConfirmDelete?: any;
    handleBulkUploadProof?: any;
    vocab?: any;
    onBuyPack?: any;
    guardianEmail?: string;
    handleUploadProof: (id: string, file: File) => void;
    primaryColor: string;
    paymentHistory: any[];
}

export function PaymentsMartialArts({
    paymentTab,
    setPaymentTab,
    students,
    plans,
    myFees,
    token,
    slug,
    bankInfo,
    guardianEmail,
    handleUploadProof,
    primaryColor,
    paymentHistory
}: PaymentsMartialArtsProps) {
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || "");

    const PAID_STATUSES = ['approved', 'paid', 'accredited'];

    // Solo el próximo período pendiente por fee (no todos los del año)
    const nextPendingPeriods = (myFees || []).flatMap(f => {
        const first = (f.periods || []).find((p: any) => p.status === 'pending');
        if (!first) return [];
        return [{ ...first, amount: f.fee?.amount || 0, fee_id: f.fee?.id, plan_id: f.fee?.plan_id, title: f.fee?.title || 'Mensualidad', student_id: f.student_id }];
    });
    const overdueCount = nextPendingPeriods.filter(p => new Date(p.due_date) < new Date()).length;
    const totalPendingAmount = nextPendingPeriods.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const handleCardSubmit = async (formData: any, payment: any, student: any) => {
        if (!token) return;
        setIsProcessing(payment.id);
        try {
            const res = await subscribeWithCard(slug, token, {
                token: formData.token,
                payment_method_id: formData.payment_method_id,
                plan_id: payment.plan_id || payment.fee_id,
                student_id: student.id,
                email: student.email || guardianEmail,
                amount: payment.amount,
                fee_id: payment.fee_id,
                period_month: payment.month,
                period_year: payment.year,
            });

            if (res?.success) {
                alert("¡Pago Exitoso! Tu suscripción automática está activa.");
                window.location.reload();
            } else {
                alert("No se pudo procesar: " + (res?.message || "Revisar datos de tarjeta"));
            }
        } catch (error) {
            alert("Error de conexión con Mercado Pago.");
        } finally {
            setIsProcessing(null);
        }
    };

    // Plan actual del primer alumno
    const firstFee = myFees?.[0];
    const currentPlanId = firstFee?.fee?.plan_id;
    const currentPlan = plans.find(pl => Number(pl.id) === Number(currentPlanId));
    const currentPlanName = currentPlan?.name || firstFee?.fee?.title || null;
    const nextPeriod = nextPendingPeriods[0] || null;
    const hasCard = !!(students[0]?.mercadopago_customer_id && students[0]?.mercadopago_card_id);

    return (
        <div className="space-y-5 animate-in fade-in duration-500 pb-20 relative">

            {/* Plan actual + próximo pago */}
            <div className="relative overflow-hidden rounded-[2rem] bg-zinc-950 text-white p-6 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950" />
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">Plan Actual</p>
                    {currentPlanName ? (
                        <p className="text-lg font-black leading-tight text-white">{currentPlanName}</p>
                    ) : (
                        <p className="text-sm font-bold text-zinc-500">Sin plan asignado</p>
                    )}

                    <div className="mt-5 pt-5 border-t border-white/10 flex items-end justify-between">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">
                                {nextPeriod ? (new Date(nextPeriod.due_date) < new Date() ? '⚠️ Vencido' : 'Próximo Pago') : 'Estado'}
                            </p>
                            {nextPeriod ? (
                                <>
                                    <p className="text-4xl font-black">${Number(nextPeriod.amount).toLocaleString('es-CL')}</p>
                                    <p className="text-[10px] font-bold text-zinc-400 mt-1">{nextPeriod.label}</p>
                                </>
                            ) : (
                                <p className="text-lg font-black text-emerald-400">✓ Al día</p>
                            )}
                        </div>
                        {hasCard ? (
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[8px] font-black uppercase px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">Cobro automático ✓</span>
                                <span className="text-[8px] text-zinc-600">•••• {students[0]?.mercadopago_last_four}</span>
                            </div>
                        ) : nextPeriod ? (
                            <span className="text-[8px] font-black uppercase px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">Pago manual</span>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* 2. Custom Tabs (Glassmorphism inspired) */}
            <div className="flex bg-zinc-100/50 p-1 rounded-[1.5rem] border border-zinc-200/50 relative h-14 items-center mb-8">
                <div 
                    className="absolute inset-y-1 bg-white rounded-2xl shadow-sm transition-all duration-500 ease-out z-0"
                    style={{ 
                        width: 'calc(33.33% - 4px)', 
                        transform: `translateX(${paymentTab === 'pending' ? '4px' : paymentTab === 'upgrade' ? 'calc(100% + 4px)' : 'calc(200% + 4px)'})` 
                    }}
                />
                {(['pending', 'upgrade', 'history'] as const).map(tab => (
                    <button 
                        key={tab} 
                        onClick={() => setPaymentTab(tab)} 
                        className={`flex-1 relative z-10 text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${
                            paymentTab === tab ? 'text-zinc-950' : 'text-zinc-400 hover:text-zinc-600'
                        }`}
                    >
                        {tab === 'pending' ? 'Pendientes' : tab === 'upgrade' ? 'Mejorar' : 'Historial'}
                    </button>
                ))}
            </div>

            {/* 3. Content Sections */}
            <div className="min-h-[40vh]">
                {paymentTab === "pending" && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                        {(() => {
                            // Agrupar períodos pendientes por alumno — solo el próximo
                            const studentGroups = students.map(s => {
                                const feeData = (myFees || []).filter(f => Number(f.student_id) === Number(s.id));
                                // Solo el primer período pendiente (el más próximo)
                                const nextPendingPeriods = feeData.flatMap(f => {
                                    const firstPending = (f.periods || []).find((p: any) => p.status === 'pending');
                                    if (!firstPending) return [];
                                    return [{
                                        id: `${f.fee?.id}_${firstPending.month}_${firstPending.year}`,
                                        fee_id: f.fee?.id,
                                        plan_id: f.fee?.plan_id,
                                        amount: f.fee?.amount || 0,
                                        title: f.fee?.title || 'Mensualidad',
                                        due_date: firstPending.due_date,
                                        label: firstPending.label,
                                        month: firstPending.month,
                                        year: firstPending.year,
                                        isOverdue: new Date(firstPending.due_date) < new Date(),
                                        hasCard: !!(s.mercadopago_customer_id && s.mercadopago_card_id),
                                    }];
                                });
                                const planId = feeData[0]?.fee?.plan_id;
                                const currentPlan = plans.find(pl => Number(pl.id) === Number(planId));
                                return { student: s, planName: currentPlan?.name || feeData[0]?.fee?.title || 'Sin Plan', pendingPeriods: nextPendingPeriods };
                            }).filter(g => g.pendingPeriods.length > 0);

                            if (studentGroups.length === 0) {
                                return (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4 transition-all hover:scale-110">
                                            <TrendingUp size={32} />
                                        </div>
                                        <p className="text-xl font-black text-zinc-900">¡Todo al día!</p>
                                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">No tienes deudas pendientes</p>
                                    </div>
                                );
                            }

                            return studentGroups.map(group => (
                                <div key={group.student.id} className="space-y-4">
                                    <div className="flex items-center gap-3 px-2">
                                        <div className="w-1.5 h-6 bg-zinc-950 rounded-full" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                            Pagos de {group.student.name} • <span className="text-zinc-600 underline decoration-zinc-200 underline-offset-4">{group.planName}</span>
                                        </p>
                                    </div>
                                    {group.pendingPeriods.map((p: any) => (
                                        <RefactoredPaymentCard
                                            key={p.id}
                                            payment={p}
                                            student={group.student}
                                            primaryColor={primaryColor}
                                            guardianEmail={guardianEmail}
                                            slug={slug}
                                            token={token}
                                            isUploading={isProcessing === p.id}
                                            handleCardSubmit={handleCardSubmit}
                                            handleUploadProof={handleUploadProof}
                                            bankInfo={bankInfo}
                                        />
                                    ))}
                                </div>
                            ));
                        })()}
                    </div>
                )}

                {paymentTab === "upgrade" && (
                    <div className="animate-in slide-in-from-right-4 duration-500 overflow-visible">
                        <PlanUpgradeGrid 
                            plans={plans}
                            students={students}
                            selectedStudentId={selectedStudentId}
                            onSelectStudent={setSelectedStudentId}
                            onSelectPlan={async (plan) => {
                                const email = students.find(s => s.id === selectedStudentId)?.email || guardianEmail;
                                if (!email) return alert("Falta el email del alumno");
                                const res = await createSubscription(slug, token || "", { 
                                    student_id: selectedStudentId, 
                                    plan_id: String(plan.id), 
                                    email, 
                                    amount: plan.price 
                                });
                                if (res?.init_point) window.location.href = res.init_point;
                            }}
                            currentPlanId={students.find(s => s.id === selectedStudentId)?.enrollments?.[0]?.plan_id}
                            primaryColor={primaryColor}
                        />
                    </div>
                )}

                {paymentTab === "history" && (
                    <div className="space-y-3 animate-in slide-in-from-right-4 duration-500">
                        {paymentHistory?.length > 0 ? (
                            paymentHistory.map((p: any) => (
                                <div key={p.id} className="relative bg-white/40 backdrop-blur-xl border border-white/60 p-5 rounded-[2rem] flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                            <History size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{p.title || 'Mensualidad'}</p>
                                            <p className="text-xl font-black text-zinc-900">${Number(p.amount).toLocaleString('es-CL')}</p>
                                            <p className="text-[9px] font-bold text-zinc-300 mt-0.5">{p.paid_at || p.due_date}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        <span className="text-[8px] font-black uppercase px-2.5 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">✓ Pagado</span>
                                        {p.payment_method && (
                                            <span className="text-[8px] font-bold text-zinc-300 uppercase">
                                                {p.payment_method === 'mercadopago' ? '💳 MP Auto' : p.payment_method === 'transfer' ? '🏦 Transfer' : p.payment_method}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 italic text-zinc-300 font-bold uppercase text-[10px] tracking-[0.2em]">Sin historial de pagos</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
