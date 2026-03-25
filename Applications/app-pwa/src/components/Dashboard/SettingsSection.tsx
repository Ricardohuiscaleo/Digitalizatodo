"use client";

import React, { useState } from 'react';
import { Camera, Save, ClipboardPaste, CreditCard, Edit2, Loader2, Sparkles, Trash2, LogOut, RefreshCw, Users } from 'lucide-react';
import { deleteRegistrationPage, generateRegistrationPage } from "@/lib/api";

interface SettingsSectionProps {
    branding: any;
    user: any;
    token: string | null;
    vocab: any;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleLoadDemo: () => void;
    regPageCode: string | null;
    setRegPageCode: (code: string | null) => void;
    generatingPage: boolean;
    setGeneratingPage: (v: boolean) => void;
    prices: any;
    setPrices: React.Dispatch<React.SetStateAction<any>>;
    handlePriceInput: (field: 'cat1' | 'cat2', value: string) => void;
    handleSavePrices: () => void;
    bankData: any;
    setBankData: React.Dispatch<React.SetStateAction<any>>;
    handleSaveBankData: () => void;
    formatCLP: (n: number) => string;
    parseCLP: (s: string) => number;
    showInactivePayers: boolean;
    setShowInactivePayers: (v: boolean) => void;
    loadingSync: boolean;
    forceSync: () => void;
    handleLogout: () => void;
    // New Props for Management
    plansList: any[];
    plansLoading: boolean;
    loadPlans: () => void;
    handleCreatePlan: (data: any) => Promise<any>;
    handleUpdatePlan: (id: number, data: any) => Promise<any>;
    handleDeletePlan: (id: number) => Promise<any>;
    schedulesList: any[];
    schedulesLoading: boolean;
    loadSchedules: () => void;
    handleCreateSchedule: (data: any) => Promise<any>;
    handleUpdateSchedule: (id: number, data: any) => Promise<any>;
    handleDeleteSchedule: (id: number) => Promise<any>;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
    branding,
    user,
    token,
    vocab,
    fileInputRef,
    handleLogoUpload,
    handleLoadDemo,
    regPageCode,
    setRegPageCode,
    generatingPage,
    setGeneratingPage,
    prices,
    setPrices,
    handlePriceInput,
    handleSavePrices,
    bankData,
    setBankData,
    handleSaveBankData,
    formatCLP,
    parseCLP,
    showInactivePayers,
    setShowInactivePayers,
    loadingSync,
    forceSync,
    handleLogout,
    plansList,
    plansLoading,
    loadPlans,
    handleCreatePlan,
    handleUpdatePlan,
    handleDeletePlan,
    schedulesList,
    schedulesLoading,
    loadSchedules,
    handleCreateSchedule,
    handleUpdateSchedule,
    handleDeleteSchedule
}) => {
    const [copied, setCopied] = useState(false);
    const [showPlanForm, setShowPlanForm] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [planForm, setPlanForm] = useState({ name: '', price: '', billing_cycle: 'monthly_from_enrollment' });
    
    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<any>(null);
    const [scheduleForm, setScheduleForm] = useState({ name: '', day_of_week: '1', start_time: '18:00', end_time: '19:30', category: 'GI' });

    const handleCopyClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePasteHeuristic = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (!text) return;
            
            const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
            let newBankData = { ...bankData };
            
            const typeKeywords = ['vista', 'corriente', 'ahorro', 'rut'];
            const bankKeywords = ['banco', 'santander', 'scotiabank', 'itaú', 'itau', 'bci', 'falabella', 'mercado pago', 'mercadopago', 'tenpo', 'mach', 'coopeuch', 'security', 'bice', 'consorcio'];
            
            for (const line of lines) {
                const lowerLine = line.toLowerCase();
                if (typeKeywords.some(k => lowerLine.includes(k)) && (lowerLine.includes('cuenta') || lowerLine === 'cuentarut')) {
                    if (lowerLine.includes('vista') || lowerLine.includes('rut')) newBankData.account_type = 'Cuenta Vista';
                    else if (lowerLine.includes('corriente')) newBankData.account_type = 'Cuenta Corriente';
                    else if (lowerLine.includes('ahorro')) newBankData.account_type = 'Cuenta de Ahorro';
                    const digits = line.replace(/\D/g, '');
                    if (digits.length >= 6) newBankData.account_number = digits;
                    continue;
                }
                if (bankKeywords.some(k => lowerLine.includes(k))) {
                    const parts = line.split(':');
                    newBankData.bank_name = (parts.length > 1 ? parts[1] : line).trim();
                    continue;
                }
                const rutMatch = line.match(/\b\d{1,2}\.?\d{3}\.?\d{3}[-][0-9kK]\b/);
                if (rutMatch) {
                    newBankData.holder_rut = rutMatch[0];
                    continue;
                }
                if (lowerLine.startsWith('rut')) {
                    const parts = line.split(':');
                    const val = (parts.length > 1 ? parts[1] : line.replace(/rut/i, '')).trim();
                    if (val.replace(/\D/g, '').length >= 7) newBankData.holder_rut = val;
                    continue;
                }
                if (lowerLine.includes('cuenta') || lowerLine.includes('nro') || lowerLine.includes('número') || lowerLine.includes('numero')) {
                    if (!lowerLine.includes('tipo')) {
                        const digits = line.replace(/\D/g, '');
                        if (digits.length >= 6) {
                            newBankData.account_number = digits;
                            continue;
                        }
                    }
                }
                if (/^\d{6,20}$/.test(line.replace(/\s/g, ''))) {
                    if (!newBankData.account_number) newBankData.account_number = line.replace(/\s/g, '');
                    continue;
                }
                if (lowerLine.includes('@') && lowerLine.includes('.')) continue;
                if (!newBankData.holder_name) {
                    if (lowerLine.startsWith('nombre')) {
                        const parts = line.split(':');
                        newBankData.holder_name = (parts.length > 1 ? parts[1] : line.replace(/nombre/i, '')).trim();
                    } else if (line.split(' ').length >= 2 && line.split(' ').length <= 6 && !/\d/.test(line)) {
                        const parts = line.split(':');
                        newBankData.holder_name = (parts.length > 1 ? parts[1] : line).trim();
                    }
                }
            }
            setBankData(newBankData);
            alert("Datos copiados del portapapeles. Por favor revisa que estén correctos.");
        } catch (err) {
            alert("No se pudo acceder al portapapeles o no hay texto copiado.");
        }
    };

    return (
        <div className="space-y-4 px-0 pb-10">
            {/* BRANDING */}
            <div className="bg-[#0f0f10] rounded-2xl px-5 py-4 shadow-xl border border-zinc-800/50 flex items-center gap-4">
                <div className="relative shrink-0">
                    <img src={branding?.logo || "/icon.webp"} className="w-12 h-12 rounded-full object-cover border-2 border-zinc-800 shadow-inner" alt="Logo" />
                    <button onClick={() => fileInputRef.current?.click()} 
                        className="absolute -bottom-1 -right-1 bg-white text-zinc-950 p-1 rounded-full border border-zinc-200 shadow-lg active:scale-90 transition-all">
                        <Camera size={12} />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-black uppercase tracking-tighter text-zinc-100 truncate leading-none mb-1">
                        {branding?.name || 'Academy'}
                    </h3>
                    <div className="flex items-center gap-2">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest opacity-80">PLATAFORMA DE GESTIÓN V4.7</p>
                        <span className="text-[7px] font-black uppercase tracking-[0.2em] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">Demo</span>
                    </div>
                </div>
            </div>

            {/* LINK DE REGISTRO */}
            <div className="bg-[#0f0f10] rounded-2xl px-5 py-4 shadow-xl border border-zinc-800/50">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3">Link de Registro Titulares</p>
                {regPageCode ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <p className="flex-1 text-[10px] font-bold text-zinc-300 truncate bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-800">
                                {`https://app.digitalizatodo.cl/r/${regPageCode}`}
                            </p>
                            <button onClick={() => handleCopyClipboard(`https://app.digitalizatodo.cl/r/${regPageCode}`)}
                                className={`shrink-0 text-[9px] font-black uppercase px-4 py-3 rounded-xl border transition-all active:scale-95 ${copied ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-zinc-800 text-zinc-100 border-zinc-700'}`}>
                                {copied ? '✓ COPIADO' : 'COPIAR'}
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={async () => { setGeneratingPage(true); await deleteRegistrationPage(user.tenant_slug || user.tenant_id, token ?? ''); const r = await generateRegistrationPage(user.tenant_slug || user.tenant_id, token ?? ''); setGeneratingPage(false); if (r?.code) setRegPageCode(r.code); }}
                                disabled={generatingPage}
                                className="flex-1 h-10 bg-zinc-900 border border-zinc-800 text-zinc-400 text-[9px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40">
                                {generatingPage ? <Loader2 className="animate-spin" size={12} /> : <><RefreshCw size={12} /> Nuevo link</>}
                            </button>
                            <button onClick={async () => { await deleteRegistrationPage(user.tenant_slug || user.tenant_id, token ?? ''); setRegPageCode(null); }}
                                className="flex-1 h-10 bg-rose-500/10 text-rose-400 text-[9px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all border border-rose-500/20">
                                Eliminar link
                            </button>
                        </div>
                    </div>
                ) : (
                    <button onClick={async () => { setGeneratingPage(true); const r = await generateRegistrationPage(user.tenant_slug || user.tenant_id, token ?? ''); setGeneratingPage(false); if (r?.code) setRegPageCode(r.code); }}
                        disabled={generatingPage}
                        style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}
                        className="w-full h-11 text-white text-[10px] font-black uppercase tracking-[0.15em] rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-40">
                        {generatingPage ? <Loader2 className="animate-spin" size={14} /> : <><Sparkles size={14} /> Generar página de registro</>}
                    </button>
                )}
            </div>

            {/* PRECIOS — oculto para school_treasury */}
            {branding?.industry !== 'school_treasury' && (
                <div className="space-y-3">
                    <div className="bg-[#0f0f10] rounded-2xl shadow-xl border border-zinc-800/50 overflow-hidden">
                        <div className="px-5 py-3 border-b border-zinc-800/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CreditCard size={14} className="text-zinc-500" style={{ color: branding?.primaryColor || '#6366f1' }} />
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Configurar Mensualidad</span>
                            </div>
                        </div>
                        <div className="divide-y divide-zinc-800/50">
                            {[{ label: vocab?.cat1 || 'KIDS', field: 'cat1' as const }, { label: vocab?.cat2 || 'ADULTOS', field: 'cat2' as const }].map(({ label, field }) => (
                                <div key={field} className="flex items-center px-5 py-3">
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest w-24 shrink-0">{label}</span>
                                    <input type="text" inputMode="numeric" className="flex-1 bg-transparent text-[13px] font-black text-zinc-100 focus:ring-0 outline-none text-right placeholder-zinc-700"
                                        value={formatCLP(prices[field])} onChange={e => handlePriceInput(field, e.target.value)} placeholder="$ 0" />
                                </div>
                            ))}
                            <div className="flex items-center px-5 py-3">
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest w-24 shrink-0">Desc. desde</span>
                                <input type="text" inputMode="numeric" className="flex-1 bg-transparent text-[13px] font-black text-zinc-100 focus:ring-0 outline-none text-right placeholder-zinc-700"
                                    value={prices.discountThreshold === 0 ? '' : prices.discountThreshold} onChange={e => { const v = e.target.value.replace(/\D/g, ''); setPrices((p: any) => ({ ...p, discountThreshold: v === '' ? 0 : parseInt(v) })); }} placeholder="0 alumnos" />
                            </div>
                            <div className="flex items-center px-5 py-3">
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest w-24 shrink-0">Descuento</span>
                                <input type="text" inputMode="numeric" className="flex-1 bg-transparent text-[13px] font-black text-zinc-100 focus:ring-0 outline-none text-right placeholder-zinc-700"
                                    value={prices.discountPercentage === 0 ? '' : `${prices.discountPercentage}%`} onChange={e => { const v = e.target.value.replace(/\D/g, ''); setPrices((p: any) => ({ ...p, discountPercentage: v === '' ? 0 : Math.min(100, parseInt(v)) })); }} placeholder="0%" />
                            </div>
                        </div>
                    </div>
                    <button onClick={handleSavePrices} 
                        style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}
                        className="w-full text-white font-black py-4 rounded-2xl active:scale-95 transition-all text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20">
                        Guardar Configuración de Precios
                    </button>
                </div>
            )}

            {/* GESTIÓN DE PLANES */}
            {(branding?.industry === 'martial_arts' || (plansList && plansList.length > 0)) && (
                <div className="bg-[#0f0f10] rounded-2xl shadow-xl border border-zinc-800/50 overflow-hidden mt-6">
                    <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/40">
                        <span className="text-[10px] font-black text-zinc-200 uppercase tracking-widest flex items-center gap-2">
                            <Sparkles size={14} className="text-indigo-400" /> Gestión de Planes
                        </span>
                        <button onClick={() => { setEditingPlan(null); setPlanForm({ name: '', price: '', billing_cycle: 'monthly_from_enrollment' }); setShowPlanForm(true); }}
                            className="text-[9px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-full active:scale-95 transition-all">
                            + Nuevo Plan
                        </button>
                    </div>

                    {showPlanForm && (
                        <div className="p-5 bg-indigo-500/5 space-y-4 border-b border-zinc-800">
                            <input type="text" placeholder="Nombre (ej: Plan Anual)" 
                                className="w-full bg-[#161618] border border-zinc-800 rounded-xl px-4 py-3 text-[11px] font-black uppercase text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-zinc-600"
                                value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} />
                            <div className="grid grid-cols-2 gap-2">
                                <input type="text" inputMode="numeric" placeholder="Precio ($ 0)" 
                                    className="bg-[#161618] border border-zinc-800 rounded-xl px-4 py-3 text-[11px] font-black uppercase text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-zinc-600"
                                    value={formatCLP(parseCLP(planForm.price))} onChange={e => setPlanForm({ ...planForm, price: String(parseCLP(e.target.value)) })} />
                                <select className="bg-[#161618] border border-zinc-800 rounded-xl px-4 py-3 text-[11px] font-black uppercase text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    value={planForm.billing_cycle} onChange={e => setPlanForm({ ...planForm, billing_cycle: e.target.value })}>
                                    <option value="monthly_fixed">Mensual Fijo</option>
                                    <option value="monthly_from_enrollment">Mes Corrido</option>
                                    <option value="quarterly">Trimestral</option>
                                    <option value="semi_annual">Semestral</option>
                                    <option value="annual">Anual</option>
                                </select>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setShowPlanForm(false)} className="flex-1 h-11 bg-zinc-800 text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Cancelar</button>
                                <button onClick={async () => { if (editingPlan) await handleUpdatePlan(editingPlan.id, planForm); else await handleCreatePlan(planForm); setShowPlanForm(false); }}
                                    className="flex-1 h-11 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-indigo-500/20">
                                    {editingPlan ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="divide-y divide-zinc-800/50">
                        {plansLoading ? (
                            <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-zinc-600" size={24} /></div>
                        ) : (
                            plansList.map((plan: any) => (
                                <div key={plan.id} className="flex items-center justify-between px-5 py-4 hover:bg-zinc-900/40 transition-colors">
                                    <div className="flex-1">
                                        <p className="text-[11px] font-black text-zinc-100 uppercase tracking-tighter leading-none mb-1.5">{plan.name}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded uppercase tracking-widest border border-indigo-500/10">{formatCLP(plan.price)}</span>
                                            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.1em]">{plan.billing_cycle.replace('_', ' ')}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => { setEditingPlan(plan); setPlanForm({ name: plan.name, price: String(plan.price), billing_cycle: plan.billing_cycle }); setShowPlanForm(true); }}
                                            className="p-2.5 text-zinc-500 hover:text-indigo-400 active:scale-90 transition-all"><Edit2 size={16} /></button>
                                        <button onClick={async () => { if(confirm('¿Eliminar plan?')) await handleDeletePlan(plan.id); }}
                                            className="p-2.5 text-zinc-500 hover:text-rose-400 active:scale-90 transition-all"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* GESTIÓN DE HORARIOS */}
            {branding?.industry === 'martial_arts' && (
                <div className="bg-[#0f0f10] rounded-2xl shadow-xl border border-zinc-800/50 overflow-hidden mt-6">
                    <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/40">
                        <span className="text-[10px] font-black text-zinc-200 uppercase tracking-widest flex items-center gap-2">
                            <Sparkles size={14} className="text-emerald-400" /> Gestión de Horarios
                        </span>
                        <button onClick={() => { setEditingSchedule(null); setScheduleForm({ name: '', day_of_week: '1', start_time: '18:00', end_time: '19:30', category: 'GI' }); setShowScheduleForm(true); }}
                            className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full active:scale-95 transition-all">
                            + Nuevo Horario
                        </button>
                    </div>

                    {showScheduleForm && (
                        <div className="p-5 bg-emerald-500/5 space-y-4 border-b border-zinc-800">
                             <div className="grid grid-cols-2 gap-2">
                                <select className="bg-[#161618] border border-zinc-800 rounded-xl px-4 py-3 text-[11px] font-black uppercase text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    value={scheduleForm.day_of_week} onChange={e => setScheduleForm({ ...scheduleForm, day_of_week: e.target.value })}>
                                    <option value="1">Lunes</option>
                                    <option value="2">Martes</option>
                                    <option value="3">Miércoles</option>
                                    <option value="4">Jueves</option>
                                    <option value="5">Viernes</option>
                                    <option value="6">Sábado</option>
                                    <option value="0">Domingo</option>
                                </select>
                                <select className="bg-[#161618] border border-zinc-800 rounded-xl px-4 py-3 text-[11px] font-black uppercase text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    value={scheduleForm.category} onChange={e => setScheduleForm({ ...scheduleForm, category: e.target.value })}>
                                    <option value="GI">GI (Jiujitsu)</option>
                                    <option value="NO-GI">NO-GI</option>
                                    <option value="KIDS">KIDS</option>
                                    <option value="OPEN MAT">OPEN MAT</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <input type="time" className="bg-[#161618] border border-zinc-800 rounded-xl px-4 py-3 text-[11px] font-black text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    value={scheduleForm.start_time} onChange={e => setScheduleForm({ ...scheduleForm, start_time: e.target.value })} />
                                <input type="time" className="bg-[#161618] border border-zinc-800 rounded-xl px-4 py-3 text-[11px] font-black text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    value={scheduleForm.end_time} onChange={e => setScheduleForm({ ...scheduleForm, end_time: e.target.value })} />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setShowScheduleForm(false)} className="flex-1 h-11 bg-zinc-800 text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Cancelar</button>
                                <button onClick={async () => { if (editingSchedule) await handleUpdateSchedule(editingSchedule.id, scheduleForm); else await handleCreateSchedule(scheduleForm); setShowScheduleForm(false); }}
                                    className="flex-1 h-11 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-emerald-500/20">
                                    {editingSchedule ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="divide-y divide-zinc-800/50">
                        {schedulesLoading ? (
                            <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-zinc-600" size={24} /></div>
                        ) : (
                            schedulesList.sort((a: any, b: any) => a.day_of_week - b.day_of_week).map((sch: any) => (
                                <div key={sch.id} className="flex items-center justify-between px-5 py-4 hover:bg-zinc-900/40 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-[11px] font-black text-zinc-100 uppercase tracking-tighter">
                                                {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][sch.day_of_week]}
                                            </p>
                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border ${
                                                sch.category === 'KIDS' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                                                sch.category === 'NO-GI' ? 'bg-zinc-800 text-zinc-100 border-zinc-700' : 
                                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            }`}>
                                                {sch.category || 'GI'}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{sch.start_time.substring(0,5)} — {sch.end_time.substring(0,5)}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => { setEditingSchedule(sch); setScheduleForm({ name: sch.name || '', day_of_week: String(sch.day_of_week), start_time: sch.start_time.substring(0,5), end_time: sch.end_time.substring(0,5), category: sch.category || 'GI' }); setShowScheduleForm(true); }}
                                            className="p-2.5 text-zinc-500 hover:text-emerald-400 active:scale-90 transition-all"><Edit2 size={16} /></button>
                                        <button onClick={async () => { if(confirm('¿Eliminar horario?')) await handleDeleteSchedule(sch.id); }}
                                            className="p-2.5 text-zinc-500 hover:text-rose-400 active:scale-90 transition-all"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* DATOS BANCARIOS */}
            <div className="bg-[#0f0f10] rounded-2xl shadow-xl border border-zinc-800/50 overflow-hidden mt-6">
                <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/40">
                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                        <CreditCard size={14} className="text-zinc-500" /> Datos Bancarios
                    </span>
                    <button onClick={handlePasteHeuristic}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 border border-zinc-700"
                    >
                        <ClipboardPaste size={14} /> PEGAR COPIADO
                    </button>
                </div>
                <div className="divide-y divide-zinc-800/50">
                    {([
                        { label: 'Banco', field: 'bank_name', placeholder: 'Ej: Banco Estado' },
                        { label: 'Tipo Cta.', field: 'account_type', placeholder: 'Cuenta Corriente / Vista' },
                        { label: 'N° Cuenta', field: 'account_number', placeholder: '00000000' },
                        { label: 'Titular', field: 'holder_name', placeholder: 'Nombre del titular' },
                        { label: 'RUT', field: 'holder_rut', placeholder: '12.345.678-9' },
                    ] as const).map(({ label, field, placeholder }) => (
                        <div key={field} className="flex items-center px-5 py-3">
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest w-24 shrink-0">{label}</span>
                            <input type="text" className="flex-1 bg-transparent text-[13px] font-black text-zinc-100 focus:ring-0 outline-none text-right placeholder-zinc-800"
                                value={bankData[field] || ''} onChange={e => setBankData((p: any) => ({ ...p, [field]: e.target.value }))} placeholder={placeholder} />
                        </div>
                    ))}
                </div>
            </div>

            <button onClick={handleSaveBankData}
                style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}
                className="w-full text-white font-black py-4 rounded-2xl active:scale-95 transition-all text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
                <Save size={18} /> Guardar Datos Bancarios
            </button>

            {/* ACCIONES DE SISTEMA */}
            <div className="space-y-3 mt-8">
                <div className="bg-[#0f0f10] rounded-2xl px-5 py-4 shadow-xl border border-zinc-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Users size={18} className="text-zinc-500" />
                        <span className="text-[10px] font-black uppercase text-zinc-300 tracking-widest">Mostrar alumnos inactivos</span>
                    </div>
                    <button onClick={() => setShowInactivePayers(!showInactivePayers)}
                        className={`w-12 h-7 rounded-full transition-all relative ${showInactivePayers ? 'bg-emerald-500' : 'bg-zinc-800'}`}>
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all ${showInactivePayers ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={forceSync} disabled={loadingSync}
                        className="h-16 bg-zinc-100 text-zinc-950 rounded-2xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all shadow-xl font-black uppercase text-[10px] tracking-widest">
                        <RefreshCw size={20} className={loadingSync ? "animate-spin" : ""} />
                        Sincronizar Cloud
                    </button>
                    <button onClick={handleLogout}
                        className="h-16 bg-[#0f0f10] border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center gap-2 active:scale-95 shadow-lg transition-all focus:bg-rose-500/5 font-black uppercase text-[10px] tracking-widest">
                        <LogOut size={20} />
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsSection;
