"use client";

import React, { useState, useEffect } from "react";
import { 
    CreditCard, 
    ShieldCheck, 
    Loader2, 
    X, 
    ImageIcon, 
    Upload, 
    Send,
    ChevronRight,
    Zap,
    Clock,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { initMercadoPago, CardPayment } from "@mercadopago/sdk-react";
import { PracticalBankInfo } from "./PracticalBankInfo";

interface RefactoredPaymentCardProps {
    payment: any;
    student: any;
    primaryColor: string;
    guardianEmail?: string;
    slug: string;
    token: string | null;
    isUploading: boolean;
    handleCardSubmit: (formData: any, payment: any, student: any) => Promise<void>;
    handleUploadProof: (id: string, file: File) => void;
    bankInfo?: any;
}

export function RefactoredPaymentCard({
    payment,
    student,
    primaryColor,
    guardianEmail,
    slug,
    token,
    isUploading,
    handleCardSubmit,
    handleUploadProof,
    bankInfo
}: RefactoredPaymentCardProps) {
    // Sellar la inicialización antes del render (v1.4.8)
    const key = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || process.env.MERCADOPAGO_PUBLIC_KEY;
    console.log("[MP-Debug] Rendering RefactoredPaymentCard v1.4.8 - mpReady:", true);
    console.log("[MP-Debug] Key check:", key ? "Defined (Starts with: " + key.substring(0, 10) + "...)" : "UNDEFINED");
    
    if (key) {
        initMercadoPago(key, { locale: 'es-CL' });
    }
    const [isOpen, setIsOpen] = useState(false);
    const [showCardForm, setShowCardForm] = useState(false);
    const [showBankDetails, setShowBankDetails] = useState(false);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [proofPreview, setProofPreview] = useState<string | null>(null);
    const [mpReady, setMpReady] = useState(true); // MP ya inicializado en layout
    const fileRef = React.useRef<HTMLInputElement>(null);

    const isProjected = payment.isProjected;
    const isOverdue = !isProjected && new Date(payment.due_date + 'T12:00:00') < new Date();
    const amount = Number(payment.amount);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProofFile(file);
            setProofPreview(URL.createObjectURL(file));
        }
    };

    return (
        <div className={`relative group transition-all duration-500 mb-4 animate-in fade-in slide-in-from-bottom-4`}>
            {/* Glassmorphism Background */}
            <div className={`absolute inset-0 bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all duration-500 ${
                isOpen ? 'scale-[1.02] shadow-[0_20px_50px_rgba(0,0,0,0.08)]' : 'group-hover:scale-[1.01]'
            }`} />

            <div className="relative p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider border transition-all ${
                                isProjected ? 'bg-zinc-50 text-zinc-400 border-zinc-100' : 
                                isOverdue ? 'bg-rose-50 text-rose-500 border-rose-100' : 
                                'bg-emerald-50 text-emerald-600 border-emerald-100'
                            }`}>
                                {isProjected ? 'Próximo Mes' : isOverdue ? 'Vencido' : 'Pendiente'}
                            </span>
                            {payment.type === 'vip' && (
                                <span className="bg-amber-100 text-amber-600 text-[8px] font-black uppercase px-2 py-1 rounded-full flex items-center gap-1 border border-amber-200">
                                    <Zap size={8} fill="currentColor" /> VIP
                                </span>
                            )}
                        </div>
                        
                        <div className="flex flex-col">
                            <span className={`text-[10px] font-bold text-zinc-400 uppercase tracking-widest`}>
                                {payment.title || 'Membresía'}
                            </span>
                            <h3 className={`text-3xl font-black transition-colors ${isProjected ? 'text-zinc-300' : 'text-zinc-900'}`}>
                                ${amount.toLocaleString('es-CL')}
                            </h3>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] font-black text-zinc-400 font-mono">
                            {new Date(payment.due_date + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }).replace('.', '')}
                        </span>
                        <button 
                            disabled={isProjected}
                            onClick={() => { setIsOpen(true); setShowCardForm(true); }}
                            className={`px-4 py-2.5 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm ${
                                isOpen ? 'bg-zinc-900 text-white' : 
                                isProjected ? 'bg-zinc-50 text-zinc-200 cursor-not-allowed' :
                                'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100 active:scale-95'
                            }`}
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {isOpen ? <X size={16} onClick={(e) => { e.stopPropagation(); setIsOpen(false); setShowCardForm(false); }} /> : 'PAGAR'}
                            </span>
                        </button>
                    </div>
                </div>

                {isOpen && (
                    <div className="mt-6 pt-6 border-t border-zinc-100/50 animate-in slide-in-from-top-4 duration-300">
                        {isUploading && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-[2.5rem]">
                                <Loader2 className="animate-spin text-zinc-900 mb-2" size={32} />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Sincronizando...</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            {showCardForm ? (
                                <div className="animate-in fade-in zoom-in-95 duration-300">
                                    <div className="flex items-center justify-between mb-4 px-2">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="text-emerald-500" size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Pago Seguro (MP) <span className="text-[8px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded ml-1">v1.4.8</span></span>
                                        </div>
                                        {/* CSS Hack para IDs internos y estabilidad de scroll en PWA */}
                                        <style dangerouslySetInnerHTML={{ __html: `
                                            #form-checkout__cardNumber, #form-checkout__expirationDate, #form-checkout__securityCode {
                                                min-height: 48px !important;
                                                display: block !important;
                                            }
                                            #mp-brick-container {
                                                overscroll-behavior: contain !important;
                                                touch-action: pan-y !important;
                                            }
                                        ` }} />
                                        <button onClick={() => setShowCardForm(false)} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 transition-colors">
                                            <X size={16} />
                                        </button>
                                    </div>

                                    <div className="bg-white/50 p-2 rounded-3xl border border-zinc-100/50 block min-h-[350px] relative z-10 overflow-visible">
                                        <div className="min-h-[300px] w-full" id="mp-brick-container">
                                            {key ? (
                                                <CardPayment
                                                    initialization={{
                                                        amount: amount,
                                                        payer: { email: student.email || guardianEmail || 'pagos@digitalizatodo.cl' }
                                                    }}
                                                    onSubmit={(formData) => handleCardSubmit(formData, payment, student)}
                                                    customization={{
                                                        paymentMethods: { maxInstallments: 1 },
                                                        visual: { 
                                                            style: { 
                                                                theme: 'flat',
                                                                customVariables: {
                                                                    borderRadiusMedium: '1.25rem',
                                                                    inputHorizontalPadding: '1rem',
                                                                    inputVerticalPadding: '1rem',
                                                                }
                                                            } 
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                                                    <ShieldCheck className="text-rose-500 opacity-20" size={48} />
                                                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-relaxed">
                                                        ⚠️ Clave de Pago No Encontrada<br/>
                                                        <span className="text-zinc-400 font-medium normal-case">Por favor, configura NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY en Coolify.</span>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => setShowCardForm(true)}
                                        className="w-full h-16 bg-zinc-900 text-white rounded-[1.5rem] flex items-center justify-between px-6 hover:shadow-xl hover:shadow-zinc-200 transition-all active:scale-[0.98] group/btn"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                                                <CreditCard size={16} />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-widest">Digitaliza Todo Pay</span>
                                        </div>
                                        <ShieldCheck size={18} className="text-emerald-400 group-hover/btn:scale-110 transition-transform" />
                                    </button>

                                    <button 
                                        type="button"
                                        onClick={() => setShowBankDetails(!showBankDetails)}
                                        className="w-full py-4 group/msg relative"
                                    >
                                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-100"></div></div>
                                        <div className="relative flex justify-center">
                                            <span className="bg-white px-3 text-[8px] font-black text-zinc-400 uppercase tracking-[0.3em] group-hover/msg:text-zinc-900 transition-colors flex items-center gap-2">
                                                O mediante transferencia {showBankDetails ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                            </span>
                                        </div>
                                    </button>

                                    {showBankDetails && (
                                        <div className="animate-in slide-in-from-top-2 duration-300 space-y-4">
                                            {bankInfo && <PracticalBankInfo bankInfo={bankInfo} primaryColor={primaryColor} />}
                                            
                                            <div 
                                                onClick={() => fileRef.current?.click()}
                                                className="w-full py-8 border-2 border-dashed border-zinc-200 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:border-zinc-300 hover:bg-zinc-50/50 transition-all cursor-pointer group/upload"
                                            >
                                                {proofPreview ? (
                                                    <div className="relative group/preview">
                                                        <img src={proofPreview} className="w-20 h-20 rounded-2xl object-cover shadow-xl border-4 border-white" />
                                                        <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity">
                                                            <Upload size={20} className="text-white" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100 group-hover/upload:scale-110 group-hover/upload:bg-white transition-all duration-500">
                                                            <ImageIcon size={24} className="text-zinc-300" />
                                                        </div>
                                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center px-6">Sube tu comprobante de transferencia</p>
                                                    </>
                                                )}
                                            </div>
                                            
                                            {proofFile && (
                                                <button 
                                                    onClick={() => handleUploadProof(payment.id, proofFile)}
                                                    className="w-full h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 active:scale-[0.98] animate-in zoom-in-95"
                                                >
                                                    <Send size={18} />
                                                    <span className="text-[11px] font-black uppercase tracking-widest">Enviar Comprobante</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    
                                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
