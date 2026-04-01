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

// Sub-components
import { PaymentHeader } from "./subcomponents/PaymentHeader";
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

    // Stats Calculation
    const allPending = students.flatMap(s => (s.payments || []).filter((p: any) => !PAID_STATUSES.includes(p.status)));
    const overdueCount = allPending.filter(p => !p.isProjected && p.due_date && new Date(p.due_date) < new Date()).length;
    const totalPendingAmount = allPending.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const handleCardSubmit = async (formData: any, payment: any, student: any) => {
        if (!token) return;
        setIsProcessing(payment.id);
        try {
            const res = await subscribeWithCard(slug, token, {
                token: formData.token,
                payment_method_id: formData.payment_method_id,
                plan_id: payment.plan_id || payment.id,
                student_id: student.id,
                email: student.email || guardianEmail,
                amount: payment.amount,
                fee_payment_id: payment.id
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

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 relative">
            
            {/* 1. Dashboard Header (Premium Stats) */}
            <PaymentHeader 
                pendingCount={allPending.length}
                overdueCount={overdueCount}
                totalAmount={totalPendingAmount}
            />

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
                        

                        {/* 3.2 Payment List Grouped by Student */}
                        {(() => {
                            const studentGroups = students
                                .map(s => {
                                    const feeData = myFees?.find(f => Number(f.student_id) === Number(s.id));
                                    const currentEnrollment = s.enrollments?.[0];
                                    const planId = currentEnrollment?.plan_id || feeData?.fee?.plan_id;
                                    const currentPlan = plans.find(pl => Number(pl.id) === Number(planId));

                                    return {
                                        student: s,
                                        planName: currentPlan?.name || "Sin Plan",
                                        payments: (s.payments || []).filter((p: any) => !PAID_STATUSES.includes(p.status)),
                                        allPeriods: feeData?.periods || []
                                    };
                                })
                                .filter(g => g.payments.length > 0);

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
                                    {group.payments.map((p: any) => (
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

                        {/* 3.3 Sección Proyectada removida segun feedback */}
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
                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                        {paymentHistory?.length > 0 ? (
                            paymentHistory.map((p: any) => (
                                <div key={p.id} className="relative bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-[2rem] flex justify-between items-center group hover:border-emerald-100 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                            <History size={20} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-zinc-900">${Number(p.amount).toLocaleString('es-CL')}</p>
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{p.paid_at || p.created_at}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-[8px] font-black uppercase px-2.5 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">Exitoso ✓</span>
                                        <span className="text-[7px] font-bold text-zinc-300 uppercase tracking-tighter">ID: {p.id}</span>
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
