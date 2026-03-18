"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    getFees, createFee, deleteFee, getFeeDetail,
    approveFeePayment, uploadFeeProof
} from "@/lib/api";
import {
    Plus, Loader2, ChevronLeft, Trash2, Eye, X,
    CheckCircle2, Clock, RefreshCw, DollarSign,
    Users, Calendar, Upload, Banknote
} from "lucide-react";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    pending: { label: "Pendiente", color: "bg-rose-50 text-rose-600 border-rose-100" },
    review:  { label: "En revisión", color: "bg-amber-50 text-amber-600 border-amber-100" },
    paid:    { label: "Pagado", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
};

function formatMoney(n: number) {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n);
}

function formatDate(d: string) {
    return new Date(d + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });
}

export default function FeesPage() {
    const router = useRouter();
    const [token, setToken] = useState("");
    const [slug, setSlug] = useState("");
    const [fees, setFees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedFee, setSelectedFee] = useState<any>(null);
    const [feePayments, setFeePayments] = useState<any[]>([]);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [proofUrl, setProofUrl] = useState<string | null>(null);

    // Form nueva cuota
    const [form, setForm] = useState({ title: "", description: "", amount: "", due_date: "", target: "all" });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    // Modal aprobar pago
    const [approvingPayment, setApprovingPayment] = useState<any>(null);
    const [approveMethod, setApproveMethod] = useState<"cash" | "transfer">("cash");
    const [approveNotes, setApproveNotes] = useState("");
    const [approvingLoading, setApprovingLoading] = useState(false);

    useEffect(() => {
        const t = localStorage.getItem("staff_token") || localStorage.getItem("auth_token") || "";
        const s = localStorage.getItem("tenant_slug") || "";
        if (!t || !s) { router.push("/"); return; }
        setToken(t); setSlug(s);
        loadFees(s, t);
    }, []);

    const loadFees = async (s: string, t: string) => {
        setLoading(true);
        const data = await getFees(s, t);
        setFees(data?.fees || []);
        setLoading(false);
    };

    const openFee = async (fee: any) => {
        setSelectedFee(fee);
        setLoadingDetail(true);
        const data = await getFeeDetail(slug, token, fee.id);
        setFeePayments(data?.payments || []);
        setLoadingDetail(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.amount || !form.due_date) { setFormError("Completa todos los campos requeridos"); return; }
        setSubmitting(true); setFormError("");
        const result = await createFee(slug, token, { ...form, amount: parseFloat(form.amount) });
        setSubmitting(false);
        if (result?.fee) {
            setShowCreate(false);
            setForm({ title: "", description: "", amount: "", due_date: "", target: "all" });
            loadFees(slug, token);
        } else {
            setFormError(result?.message || "Error al crear cuota");
        }
    };

    const handleDelete = async (feeId: number) => {
        if (!confirm("¿Eliminar esta cuota y todos sus pagos?")) return;
        await deleteFee(slug, token, feeId);
        loadFees(slug, token);
    };

    const handleApprove = async () => {
        if (!approvingPayment || !selectedFee) return;
        setApprovingLoading(true);
        await approveFeePayment(slug, token, selectedFee.id, {
            guardian_id: approvingPayment.guardian_id,
            payment_method: approveMethod,
            notes: approveNotes,
        });
        setApprovingLoading(false);
        setApprovingPayment(null);
        setApproveNotes("");
        // Refrescar detalle
        const data = await getFeeDetail(slug, token, selectedFee.id);
        setFeePayments(data?.payments || []);
        loadFees(slug, token);
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-white">
            <Loader2 className="animate-spin text-zinc-300" size={24} />
        </div>
    );

    return (
        <div className="min-h-screen bg-white pb-24">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white border-b border-zinc-100 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push("/dashboard")} className="w-9 h-9 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center active:scale-95">
                        <ChevronLeft size={18} className="text-zinc-500" />
                    </button>
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-tighter text-zinc-900">Cuotas</h1>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{fees.length} cuotas creadas</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 h-9 px-4 bg-zinc-950 text-white text-[10px] font-black uppercase rounded-xl active:scale-95 transition-all"
                >
                    <Plus size={14} /> Nueva
                </button>
            </div>

            <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
                {fees.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                            <DollarSign size={28} className="text-zinc-300" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Sin cuotas creadas</p>
                        <button onClick={() => setShowCreate(true)}
                            className="h-10 px-6 bg-zinc-950 text-white text-[10px] font-black uppercase rounded-xl active:scale-95">
                            Crear primera cuota
                        </button>
                    </div>
                ) : fees.map(fee => {
                    const paidCount = fee.paid_count || 0;
                    const reviewCount = fee.review_count || 0;
                    const totalCount = fee.total_count || 0;
                    const pendingCount = totalCount - paidCount - reviewCount;
                    const progress = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

                    return (
                        <div key={fee.id} className="bg-white border border-zinc-100 rounded-[1.8rem] p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-black text-zinc-900 uppercase leading-tight">{fee.title}</h3>
                                    {fee.description && <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{fee.description}</p>}
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="text-base font-black text-zinc-950">{formatMoney(fee.amount)}</span>
                                        <span className="flex items-center gap-1 text-[9px] font-bold text-zinc-400 uppercase">
                                            <Calendar size={10} /> Vence {formatDate(fee.due_date)}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(fee.id)}
                                    className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-400 active:scale-95 border border-rose-100 shrink-0">
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            {/* Barra de progreso */}
                            <div className="mb-3">
                                <div className="flex justify-between text-[9px] font-black uppercase text-zinc-400 mb-1">
                                    <span>{paidCount} pagados</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                                </div>
                            </div>

                            {/* Badges */}
                            <div className="flex items-center gap-2 mb-3">
                                {paidCount > 0 && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">{paidCount} pagados</span>}
                                {reviewCount > 0 && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">{reviewCount} en revisión</span>}
                                {pendingCount > 0 && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">{pendingCount} pendientes</span>}
                            </div>

                            <button onClick={() => openFee(fee)}
                                className="w-full h-9 bg-zinc-50 border border-zinc-100 rounded-xl text-[10px] font-black uppercase text-zinc-600 flex items-center justify-center gap-2 active:scale-95 transition-all">
                                <Users size={13} /> Ver apoderados
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Modal crear cuota */}
            {showCreate && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center p-0 animate-in fade-in duration-200" onClick={() => setShowCreate(false)}>
                    <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-center mb-4"><div className="w-10 h-1.5 bg-zinc-200 rounded-full" /></div>
                        <h2 className="text-base font-black uppercase tracking-tighter text-zinc-900 mb-5">Nueva Cuota</h2>

                        <form onSubmit={handleCreate} className="space-y-3">
                            {formError && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{formError}</p>}

                            <input placeholder="Título (ej: Gira de estudios)" value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                className="w-full h-11 bg-zinc-50 rounded-xl px-4 text-sm font-bold text-zinc-900 placeholder:text-zinc-300 border border-zinc-100 outline-none focus:ring-2 ring-zinc-950" />

                            <textarea placeholder="Descripción (opcional)" value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                rows={2}
                                className="w-full bg-zinc-50 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-300 border border-zinc-100 outline-none focus:ring-2 ring-zinc-950 resize-none" />

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-black uppercase text-zinc-400 ml-1">Monto ($)</label>
                                    <input type="number" placeholder="0" value={form.amount}
                                        onChange={e => setForm({ ...form, amount: e.target.value })}
                                        className="w-full h-11 bg-zinc-50 rounded-xl px-4 text-sm font-black text-zinc-900 placeholder:text-zinc-300 border border-zinc-100 outline-none focus:ring-2 ring-zinc-950 mt-1" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase text-zinc-400 ml-1">Fecha límite</label>
                                    <input type="date" value={form.due_date}
                                        onChange={e => setForm({ ...form, due_date: e.target.value })}
                                        className="w-full h-11 bg-zinc-50 rounded-xl px-4 text-sm font-bold text-zinc-900 border border-zinc-100 outline-none focus:ring-2 ring-zinc-950 mt-1" />
                                </div>
                            </div>

                            <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                                <p className="text-[9px] font-black uppercase text-zinc-400 mb-2">Aplica a</p>
                                <div className="flex gap-2">
                                    {[{ v: "all", l: "Todos los apoderados" }, { v: "custom", l: "Selección manual" }].map(opt => (
                                        <button key={opt.v} type="button"
                                            onClick={() => setForm({ ...form, target: opt.v })}
                                            className={`flex-1 h-9 rounded-xl text-[9px] font-black uppercase transition-all border ${form.target === opt.v ? "bg-zinc-950 text-white border-zinc-950" : "bg-white text-zinc-400 border-zinc-200"}`}>
                                            {opt.l}
                                        </button>
                                    ))}
                                </div>
                                {form.target === "custom" && (
                                    <p className="text-[9px] text-amber-600 font-bold mt-2">* Selección manual disponible próximamente. Por ahora aplica a todos.</p>
                                )}
                            </div>

                            <button type="submit" disabled={submitting}
                                className="w-full h-12 bg-zinc-950 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40">
                                {submitting ? <Loader2 className="animate-spin" size={16} /> : <><Plus size={16} /> Crear Cuota</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal detalle cuota — lista de apoderados */}
            {selectedFee && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200" onClick={() => setSelectedFee(null)}>
                    <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-4 duration-200 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-zinc-100 shrink-0">
                            <div className="flex justify-center mb-3"><div className="w-10 h-1.5 bg-zinc-200 rounded-full" /></div>
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-base font-black uppercase tracking-tighter text-zinc-900">{selectedFee.title}</h2>
                                    <p className="text-[10px] text-zinc-400 font-bold mt-0.5">{formatMoney(selectedFee.amount)} · Vence {formatDate(selectedFee.due_date)}</p>
                                </div>
                                <button onClick={() => setSelectedFee(null)} className="w-8 h-8 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 p-4 space-y-2">
                            {loadingDetail ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-zinc-300" size={20} /></div>
                            ) : feePayments.length === 0 ? (
                                <p className="text-center text-[10px] text-zinc-400 font-black uppercase py-10">Sin apoderados asignados</p>
                            ) : feePayments.map(p => {
                                const st = STATUS_LABEL[p.status] || STATUS_LABEL.pending;
                                return (
                                    <div key={p.id} className="bg-zinc-50 rounded-2xl p-3 border border-zinc-100 flex items-center gap-3">
                                        <img src={p.guardian?.photo || "/icon.webp"} className="w-10 h-10 rounded-full object-cover border border-white shadow-sm shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-zinc-900 uppercase leading-none truncate">{p.guardian?.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                                                {p.payment_method && <span className="text-[8px] text-zinc-400 font-bold uppercase">{p.payment_method === "cash" ? "Efectivo" : "Transferencia"}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {p.proof_url && (
                                                <button onClick={() => setProofUrl(p.proof_url)}
                                                    className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 active:scale-95">
                                                    <Eye size={14} />
                                                </button>
                                            )}
                                            {p.status !== "paid" && (
                                                <button onClick={() => { setApprovingPayment(p); setApproveMethod("cash"); }}
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

            {/* Modal aprobar pago */}
            {approvingPayment && (
                <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setApprovingPayment(null)}>
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <h3 className="text-sm font-black uppercase tracking-tighter text-zinc-900 mb-1">Confirmar Pago</h3>
                        <p className="text-[10px] text-zinc-400 font-bold mb-5">{approvingPayment.guardian?.name}</p>

                        <div className="space-y-3 mb-5">
                            <p className="text-[9px] font-black uppercase text-zinc-400">Método de pago</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setApproveMethod("cash")}
                                    className={`h-12 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase border transition-all ${approveMethod === "cash" ? "bg-zinc-950 text-white border-zinc-950" : "bg-zinc-50 text-zinc-400 border-zinc-200"}`}>
                                    <Banknote size={16} /> Efectivo
                                </button>
                                <button onClick={() => setApproveMethod("transfer")}
                                    className={`h-12 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase border transition-all ${approveMethod === "transfer" ? "bg-zinc-950 text-white border-zinc-950" : "bg-zinc-50 text-zinc-400 border-zinc-200"}`}>
                                    <Upload size={16} /> Transferencia
                                </button>
                            </div>
                            <input placeholder="Notas (opcional)" value={approveNotes}
                                onChange={e => setApproveNotes(e.target.value)}
                                className="w-full h-10 bg-zinc-50 rounded-xl px-4 text-sm text-zinc-900 placeholder:text-zinc-300 border border-zinc-100 outline-none" />
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => setApprovingPayment(null)}
                                className="flex-1 h-11 bg-zinc-50 text-zinc-400 text-[10px] font-black uppercase rounded-xl border border-zinc-100 active:scale-95">
                                Cancelar
                            </button>
                            <button onClick={handleApprove} disabled={approvingLoading}
                                className="flex-[2] h-11 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40">
                                {approvingLoading ? <Loader2 className="animate-spin" size={14} /> : <><CheckCircle2 size={14} /> Marcar Pagado</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox comprobante */}
            {proofUrl && (
                <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setProofUrl(null)}>
                    <div className="relative max-w-sm w-full" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setProofUrl(null)} className="absolute -top-12 right-0 w-10 h-10 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white">
                            <X size={20} />
                        </button>
                        <div className="rounded-3xl overflow-hidden border border-white/10">
                            <img src={proofUrl} alt="Comprobante" className="w-full object-contain max-h-[85vh]" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
