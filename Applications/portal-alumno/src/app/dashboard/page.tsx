"use client";

import { useEffect, useState } from "react";
import { useBranding } from "@/context/BrandingContext";
import { getProfile, getPayments, uploadProof } from "@/lib/api";
import { Home, CreditCard, User, Upload, CheckCircle2, AlertCircle, Clock, Award, FileText, LogOut } from "lucide-react";

const beltColors: Record<string, string> = {
    blanco: 'bg-white border border-zinc-300',
    gris: 'bg-gray-400',
    amarillo: 'bg-yellow-400',
    naranja: 'bg-orange-400',
    verde: 'bg-green-500',
    azul: 'bg-blue-500',
    rojo: 'bg-red-500',
    cafe: 'bg-amber-800',
    marron: 'bg-amber-800',
    negro: 'bg-zinc-950',
};

const REQUIRED_FOR_EXAM = 24; // clases requeridas para examen (configurable)

function BeltBadge({ belt }: { belt: string }) {
    const color = beltColors[belt?.toLowerCase()] ?? 'bg-zinc-200';
    return (
        <div className="flex items-center gap-2">
            <div className={`h-3.5 w-12 ${color} rounded-sm shadow-inner`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{belt}</span>
        </div>
    );
}

export default function DashboardPage() {
    const { branding, setBranding } = useBranding();
    const [data, setData] = useState<any>(null);
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('home');
    const [showModal, setShowModal] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("student_token");
        const tenantId = localStorage.getItem("tenant_id");
        if (!token || !tenantId) { window.location.href = "/"; return; }

        Promise.all([getProfile(tenantId, token), getPayments(tenantId, token)]).then(([profile, paymentsData]) => {
            if (!profile || profile.user_type !== 'guardian') {
                localStorage.clear(); window.location.href = "/"; return;
            }
            setData(profile);
            setPayments(paymentsData?.payments || []);
            if (profile.tenant && !branding?.name) {
                setBranding({ id: String(profile.tenant.id), name: profile.tenant.name, industry: profile.tenant.industry, logo: profile.tenant.logo, primaryColor: profile.tenant.primary_color });
            }
            setLoading(false);
        });
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || payments.length === 0) return;
        const token = localStorage.getItem("student_token")!;
        const tenantId = localStorage.getItem("tenant_id")!;
        setUploading(true);
        await uploadProof(tenantId, payments[0].id, token, file);
        setUploading(false);
        setShowModal(false);
        // Refresh payments
        const fresh = await getPayments(tenantId, token);
        setPayments(fresh?.payments || []);
    };

    const formatMoney = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n);

    if (loading || !data) return (
        <div className="flex min-h-screen items-center justify-center bg-white">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
    );

    const { guardian, students, total_due, payment_history } = data;
    const accountStatus = total_due > 0 ? (payments[0]?.status === 'proof_uploaded' ? 'review' : 'pending') : 'paid';

    const renderHome = () => (
        <div className="space-y-5 animate-in fade-in duration-150">
            {/* Estado de cuenta */}
            <div className={`rounded-3xl p-6 text-white shadow-lg relative overflow-hidden ${
                accountStatus === 'pending' ? 'bg-gradient-to-br from-red-500 to-rose-600' :
                accountStatus === 'review'  ? 'bg-gradient-to-br from-amber-500 to-orange-500' :
                'bg-gradient-to-br from-emerald-500 to-teal-600'
            }`}>
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">Mensualidad</p>
                        <div className="flex items-center gap-2 mb-1">
                            {accountStatus === 'pending' && <AlertCircle size={20} />}
                            {accountStatus === 'review'  && <Clock size={20} />}
                            {accountStatus === 'paid'    && <CheckCircle2 size={20} />}
                            <p className="text-2xl font-black">
                                {accountStatus === 'pending' ? 'Pendiente' : accountStatus === 'review' ? 'En Revisión' : 'Al Día'}
                            </p>
                        </div>
                        {accountStatus !== 'paid' && <p className="text-sm opacity-80">{formatMoney(total_due)}</p>}
                    </div>
                    {accountStatus === 'pending' && (
                        <button onClick={() => { setActiveTab('payments'); setShowModal(true); }}
                            className="bg-white text-rose-600 px-4 py-2 rounded-xl text-xs font-black shadow active:scale-95 transition-all">
                            Pagar Ahora
                        </button>
                    )}
                </div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl" />
            </div>

            {/* Progreso en el Tatami */}
            <div>
                <h3 className="font-black text-zinc-800 text-sm uppercase tracking-widest flex items-center gap-2 mb-3 px-1">
                    <Award className="text-indigo-500" size={16} /> Progreso en el Tatami
                </h3>
                <div className="space-y-3">
                    {students.map((s: any) => {
                        const pct = Math.min(100, ((s.attendance_count || 0) / REQUIRED_FOR_EXAM) * 100);
                        const left = Math.max(0, REQUIRED_FOR_EXAM - (s.attendance_count || 0));
                        return (
                            <div key={s.id} className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 space-y-3">
                                <div className="flex items-center gap-3">
                                    {s.photo ? (
                                        <img src={s.photo} alt={s.name} className="w-11 h-11 rounded-full object-cover border border-zinc-100" />
                                    ) : (
                                        <div className="w-11 h-11 rounded-full bg-indigo-50 flex items-center justify-center font-black text-indigo-400">{s.name[0]}</div>
                                    )}
                                    <div className="flex-1">
                                        <p className="font-black text-zinc-800 text-sm">{s.name}</p>
                                        {s.belt_rank && <BeltBadge belt={s.belt_rank} />}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] font-black mb-1.5">
                                        <span className="text-zinc-400 uppercase tracking-widest">{s.attendance_count || 0} asistencias</span>
                                        <span className={left === 0 ? 'text-emerald-600' : 'text-indigo-500'}>
                                            {left === 0 ? '¡Listo para examen!' : `Faltan ${left} clases`}
                                        </span>
                                    </div>
                                    <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                                        <div className={`h-2 rounded-full transition-all duration-700 ${left === 0 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    const renderPayments = () => (
        <div className="space-y-5 animate-in fade-in duration-150">
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-zinc-100">
                <h3 className="font-black text-zinc-800 text-sm uppercase tracking-widest mb-4">Mensualidad Actual</h3>
                <div className="flex justify-between items-center mb-5">
                    <p className="text-3xl font-black text-zinc-900">{formatMoney(total_due)}</p>
                    {accountStatus === 'pending' && <span className="bg-red-50 text-red-600 px-3 py-1 rounded-xl text-[10px] font-black border border-red-100 uppercase">Pendiente</span>}
                    {accountStatus === 'review'  && <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-xl text-[10px] font-black border border-amber-100 uppercase">Revisando</span>}
                    {accountStatus === 'paid'    && <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-xl text-[10px] font-black border border-emerald-100 uppercase">Pagado</span>}
                </div>
                {accountStatus === 'pending' && (
                    <button onClick={() => setShowModal(true)}
                        className="w-full bg-zinc-950 text-white font-black py-4 rounded-2xl active:scale-95 transition-all text-xs uppercase tracking-widest">
                        Pagar con Transferencia
                    </button>
                )}
                {accountStatus === 'review' && (
                    <div className="w-full bg-zinc-50 text-zinc-500 font-black py-4 rounded-2xl flex items-center justify-center gap-2 border border-zinc-100 text-xs uppercase tracking-widest">
                        <Clock size={16} className="text-amber-500" /> Comprobante enviado · Esperando validación
                    </div>
                )}
            </div>

            {payment_history?.length > 0 && (
                <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-5 pt-4 pb-2">Historial</p>
                    <div className="divide-y divide-zinc-50">
                        {payment_history.map((p: any) => (
                            <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center">
                                        <FileText size={15} className="text-emerald-500" />
                                    </div>
                                    <p className="text-xs font-black text-zinc-800">{p.paid_at || p.due_date}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-zinc-800">{formatMoney(p.amount)}</p>
                                    <p className="text-[9px] font-black text-emerald-500 uppercase">Aprobado</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderProfile = () => (
        <div className="space-y-5 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center font-black text-3xl text-indigo-400 mb-3 border-4 border-white shadow-md">
                    {guardian.name[0]}
                </div>
                <h2 className="text-lg font-black text-zinc-900">{guardian.name}</h2>
                <p className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full mt-2 uppercase tracking-widest">Titular / Apoderado</p>
            </div>

            <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1 mb-3">Carnets Digitales</p>
                <div className="space-y-3">
                    {students.map((s: any) => (
                        <div key={s.id} className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-1 shadow-md">
                            <div className="bg-white/10 rounded-xl p-4 border border-white/20 flex gap-4 relative overflow-hidden">
                                <Award className="absolute -right-4 -bottom-4 text-white/5 w-24 h-24" />
                                {s.photo ? (
                                    <img src={s.photo} alt={s.name} className="w-16 h-20 object-cover rounded-lg border-2 border-white/20 shrink-0" />
                                ) : (
                                    <div className="w-16 h-20 rounded-lg bg-white/10 flex items-center justify-center font-black text-2xl text-white/40 shrink-0">{s.name[0]}</div>
                                )}
                                <div className="flex-1 py-1">
                                    <p className="text-[9px] text-indigo-300 font-black uppercase tracking-widest mb-1">{branding?.name}</p>
                                    <h4 className="font-black text-white text-base leading-tight">{s.name}</h4>
                                    <p className="text-slate-400 text-[10px] mb-3 uppercase">{s.category}</p>
                                    {s.belt_rank && (
                                        <div className="inline-flex items-center gap-2 bg-black/30 rounded-lg px-3 py-1.5 border border-white/10">
                                            <div className={`h-3 w-10 ${beltColors[s.belt_rank?.toLowerCase()] ?? 'bg-zinc-200'} rounded-sm`} />
                                            <span className="text-[10px] font-black text-white uppercase">{s.belt_rank}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <button onClick={() => { localStorage.clear(); window.location.href = "/"; }}
                className="w-full text-rose-500 font-black py-5 rounded-3xl hover:bg-rose-50 uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all">
                <LogOut size={14} /> Cerrar Sesión
            </button>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-zinc-50 font-sans sm:max-w-md sm:mx-auto relative overflow-hidden">
            <header className="bg-white px-5 py-4 flex items-center justify-between sticky top-0 z-40 border-b border-zinc-100 shrink-0">
                <div className="flex items-center gap-3">
                    {branding?.logo ? (
                        <img src={branding.logo} className="w-9 h-9 rounded-full object-cover border border-zinc-100" alt="logo" />
                    ) : (
                        <div className="w-9 h-9 bg-zinc-950 rounded-full flex items-center justify-center">
                            <span className="text-white font-black text-xs">{branding?.name?.[0] || 'D'}</span>
                        </div>
                    )}
                    <h1 className="text-sm font-black text-zinc-900 uppercase tracking-tighter">
                        {activeTab === 'home' ? 'Inicio' : activeTab === 'payments' ? 'Mis Pagos' : 'Mi Perfil'}
                    </h1>
                </div>
                <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center font-black text-indigo-400">
                    {guardian.name[0]}
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 pb-28" style={{ scrollbarWidth: 'none' }}>
                {activeTab === 'home'     && renderHome()}
                {activeTab === 'payments' && renderPayments()}
                {activeTab === 'profile'  && renderProfile()}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 sm:max-w-md sm:mx-auto bg-white border-t border-zinc-100 pt-3 pb-8 px-10 flex justify-between items-center h-24 z-50">
                {[
                    { id: 'home', icon: Home, label: 'Inicio' },
                    { id: 'payments', icon: CreditCard, label: 'Pagos', badge: accountStatus === 'pending' },
                    { id: 'profile', icon: User, label: 'Perfil' },
                ].map(({ id, icon: Icon, label, badge }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                        className={`flex flex-col items-center gap-1.5 transition-all relative ${activeTab === id ? 'text-zinc-950 scale-110' : 'text-zinc-300'}`}>
                        <div className={`p-2 rounded-2xl relative ${activeTab === id ? 'bg-zinc-50' : ''}`}>
                            <Icon size={22} strokeWidth={activeTab === id ? 3 : 2} />
                            {badge && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />}
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">{label}</span>
                    </button>
                ))}
            </nav>

            {/* Modal pago */}
            {showModal && (
                <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full sm:max-w-md rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                        <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-5" />
                        <h3 className="text-base font-black text-zinc-900 mb-1 uppercase tracking-tighter">Pagar Mensualidad</h3>
                        <p className="text-zinc-400 text-xs mb-5">Transfiere el monto exacto y sube el comprobante.</p>
                        <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 space-y-2.5 mb-5 text-xs">
                            {[['Monto', formatMoney(total_due)], ['Banco', 'Banco Estado'], ['Tipo', 'Cuenta Corriente']].map(([k, v]) => (
                                <div key={k} className="flex justify-between">
                                    <span className="text-zinc-400 font-bold">{k}</span>
                                    <span className="font-black text-zinc-900">{v}</span>
                                </div>
                            ))}
                        </div>
                        <label className="w-full bg-zinc-950 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all text-xs uppercase tracking-widest mb-3">
                            <Upload size={16} /> {uploading ? 'Subiendo...' : 'Subir Comprobante'}
                            <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleUpload} disabled={uploading} />
                        </label>
                        <button onClick={() => setShowModal(false)} className="w-full text-zinc-400 font-black py-3 text-xs uppercase tracking-widest">Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    );
}
