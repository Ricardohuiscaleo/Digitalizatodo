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
        <div className="space-y-3 px-0 pb-10">
            {/* BRANDING */}
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-zinc-100 flex items-center gap-3">
                <div className="relative shrink-0">
                    <img src={branding?.logo || "/icon.webp"} className="w-10 h-10 rounded-full object-cover border border-zinc-100" alt="Logo" />
                    <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 bg-white text-zinc-950 p-0.5 rounded-full border border-zinc-200 shadow active:scale-90">
                        <Camera size={10} />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-black uppercase tracking-tighter text-zinc-950 truncate leading-none">{branding?.name || 'Academy'}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Plataforma de Gestión v4.7</p>
                        <button onClick={handleLoadDemo} className="text-[7px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded-full active:scale-95 transition-all">Demo</button>
                    </div>
                </div>
            </div>

            {/* LINK DE REGISTRO */}
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-zinc-100">
                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-2">Link de Registro Titulares</p>
                {regPageCode ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <p className="flex-1 text-[9px] font-bold text-zinc-500 truncate bg-zinc-50 rounded-xl px-3 py-2 border border-zinc-100">
                                {`https://app.digitalizatodo.cl/r/${regPageCode}`}
                            </p>
                            <button onClick={() => handleCopyClipboard(`https://app.digitalizatodo.cl/r/${regPageCode}`)}
                                className={`shrink-0 text-[8px] font-black uppercase px-3 py-2 rounded-xl border transition-all active:scale-95 ${copied ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-zinc-50 text-zinc-600 border-zinc-200'}`}>
                                {copied ? '✓ Copiado' : 'Copiar'}
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={async () => { setGeneratingPage(true); await deleteRegistrationPage(user.tenant_slug || user.tenant_id, token ?? ''); const r = await generateRegistrationPage(user.tenant_slug || user.tenant_id, token ?? ''); setGeneratingPage(false); if (r?.code) setRegPageCode(r.code); }}
                                disabled={generatingPage}
                                className="flex-1 h-8 bg-zinc-100 text-zinc-600 text-[8px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all disabled:opacity-40">
                                {generatingPage ? <Loader2 className="animate-spin" size={10} /> : '↺ Nuevo link'}
                            </button>
                            <button onClick={async () => { await deleteRegistrationPage(user.tenant_slug || user.tenant_id, token ?? ''); setRegPageCode(null); }}
                                className="flex-1 h-8 bg-red-50 text-red-400 text-[8px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all border border-red-100">
                                Eliminar link
                            </button>
                        </div>
                    </div>
                ) : (
                    <button onClick={async () => { setGeneratingPage(true); const r = await generateRegistrationPage(user.tenant_slug || user.tenant_id, token ?? ''); setGeneratingPage(false); if (r?.code) setRegPageCode(r.code); }}
                        disabled={generatingPage}
                        style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}
                        className="w-full h-9 text-white text-[9px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40">
                        {generatingPage ? <Loader2 className="animate-spin" size={12} /> : <><Sparkles size={12} /> Generar página de registro</>}
                    </button>
                )}
            </div>

            {/* PRECIOS — oculto para school_treasury */}
            {branding?.industry !== 'school_treasury' && (
                <>
                    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
                        <div className="px-4 py-2 border-b border-zinc-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CreditCard size={14} style={{ color: branding?.primaryColor || '#6366f1' }} />
                                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Configurar Mensualidad</span>
                            </div>
                            <Edit2 size={10} className="text-zinc-300" />
                        </div>
                        <div className="divide-y divide-zinc-50">
                            {[{ label: vocab?.cat1, field: 'cat1' as const }, { label: vocab?.cat2, field: 'cat2' as const }].map(({ label, field }) => (
                                <div key={field} className="flex items-center px-4 py-2">
                                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest w-20 shrink-0">{label}</span>
                                    <input type="text" inputMode="numeric" className="flex-1 bg-transparent text-xs font-black text-zinc-950 focus:ring-0 outline-none text-right"
                                        value={formatCLP(prices[field])} onChange={e => handlePriceInput(field, e.target.value)} placeholder="$ 0" />
                                </div>
                            ))}
                            <div className="flex items-center px-4 py-2">
                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest w-20 shrink-0">Desc. desde</span>
                                <input type="text" inputMode="numeric" className="flex-1 bg-transparent text-xs font-black text-zinc-950 focus:ring-0 outline-none text-right"
                                    value={prices.discountThreshold === 0 ? '' : prices.discountThreshold} onChange={e => { const v = e.target.value.replace(/\D/g, ''); setPrices((p: any) => ({ ...p, discountThreshold: v === '' ? 0 : parseInt(v) })); }} placeholder="0 inscritos" />
                            </div>
                            <div className="flex items-center px-4 py-2">
                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest w-20 shrink-0">Descuento</span>
                                <input type="text" inputMode="numeric" className="flex-1 bg-transparent text-xs font-black text-zinc-950 focus:ring-0 outline-none text-right"
                                    value={prices.discountPercentage === 0 ? '' : `${prices.discountPercentage}%`} onChange={e => { const v = e.target.value.replace(/\D/g, ''); setPrices((p: any) => ({ ...p, discountPercentage: v === '' ? 0 : Math.min(100, parseInt(v)) })); }} placeholder="0%" />
                            </div>
                        </div>
                    </div>
                    <button onClick={handleSavePrices} 
                        style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}
                        className="w-full text-white font-black py-4 rounded-2xl active:scale-95 transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                        <Save size={16} /> Guardar Configuración de Precios
                    </button>
                </>
            )}

            {/* GESTIÓN DE PLANES (Solo para Martial Arts o si tiene planes) */}
            {(branding?.industry === 'martial_arts' || (plansList && plansList.length > 0)) && (
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden mt-6">
                    <div className="px-4 py-3 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/50">
                        <span className="text-[10px] font-black text-zinc-950 uppercase tracking-widest flex items-center gap-2">
                            <Sparkles size={14} className="text-indigo-500" /> Gestión de Planes
                        </span>
                        <button onClick={() => { setEditingPlan(null); setPlanForm({ name: '', price: '', billing_cycle: 'monthly_from_enrollment' }); setShowPlanForm(true); }}
                            className="text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full active:scale-95 transition-all">
                            + Nuevo Plan
                        </button>
                    </div>

                    {showPlanForm && (
                        <div className="p-4 bg-indigo-50/30 space-y-3 border-b border-zinc-100">
                            <input type="text" placeholder="Nombre (ej: Plan Anual)" className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                                value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} />
                            <div className="grid grid-cols-2 gap-2">
                                <input type="text" inputMode="numeric" placeholder="Precio ($ 0)" className="bg-white border border-zinc-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formatCLP(parseCLP(planForm.price))} onChange={e => setPlanForm({ ...planForm, price: String(parseCLP(e.target.value)) })} />
                                <select className="bg-white border border-zinc-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={planForm.billing_cycle} onChange={e => setPlanForm({ ...planForm, billing_cycle: e.target.value })}>
                                    <option value="monthly_fixed">Mensual Fijo</option>
                                    <option value="monthly_from_enrollment">Mensual Corrido</option>
                                    <option value="quarterly">Trimestral</option>
                                    <option value="semi_annual">Semestral</option>
                                    <option value="annual">Anual</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowPlanForm(false)} className="flex-1 h-10 bg-zinc-200 text-zinc-600 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">Cancelar</button>
                                <button onClick={async () => { 
                                    if (editingPlan) await handleUpdatePlan(editingPlan.id, planForm);
                                    else await handleCreatePlan(planForm);
                                    setShowPlanForm(false);
                                }}
                                    className="flex-1 h-10 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">
                                    {editingPlan ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="divide-y divide-zinc-50">
                        {plansLoading ? (
                            <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-zinc-300" size={20} /></div>
                        ) : (
                            plansList.map((plan: any) => (
                                <div key={plan.id} className="flex items-center justify-between px-4 py-4 hover:bg-zinc-50 transition-colors">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-zinc-950 uppercase tracking-tighter leading-none mb-1">{plan.name}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-widest">{formatCLP(plan.price)}</span>
                                            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{plan.billing_cycle === 'monthly_from_enrollment' ? 'Mes corrido' : plan.billing_cycle}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => { setEditingPlan(plan); setPlanForm({ name: plan.name, price: String(plan.price), billing_cycle: plan.billing_cycle }); setShowPlanForm(true); }}
                                            className="p-2 text-zinc-400 hover:text-indigo-600 active:scale-90 transition-all"><Edit2 size={14} /></button>
                                        <button onClick={async () => { if(confirm('¿Eliminar plan?')) await handleDeletePlan(plan.id); }}
                                            className="p-2 text-zinc-400 hover:text-rose-500 active:scale-90 transition-all"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* GESTIÓN DE HORARIOS (Solo para Martial Arts) */}
            {branding?.industry === 'martial_arts' && (
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden mt-6">
                    <div className="px-4 py-3 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/50">
                        <span className="text-[10px] font-black text-zinc-950 uppercase tracking-widest flex items-center gap-2">
                            <Sparkles size={14} className="text-emerald-500" /> Gestión de Horarios
                        </span>
                        <button onClick={() => { setEditingSchedule(null); setScheduleForm({ name: '', day_of_week: '1', start_time: '18:00', end_time: '19:30', category: 'GI' }); setShowScheduleForm(true); }}
                            className="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full active:scale-95 transition-all">
                            + Nuevo Horario
                        </button>
                    </div>

                    {showScheduleForm && (
                        <div className="p-4 bg-emerald-50/30 space-y-3 border-b border-zinc-100">
                             <div className="grid grid-cols-2 gap-2">
                                <select className="bg-white border border-zinc-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-zinc-950 outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={scheduleForm.day_of_week} onChange={e => setScheduleForm({ ...scheduleForm, day_of_week: e.target.value })}>
                                    <option value="1">Lunes</option>
                                    <option value="2">Martes</option>
                                    <option value="3">Miércoles</option>
                                    <option value="4">Jueves</option>
                                    <option value="5">Viernes</option>
                                    <option value="6">Sábado</option>
                                    <option value="0">Domingo</option>
                                </select>
                                <select className="bg-white border border-zinc-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-zinc-950 outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={scheduleForm.category} onChange={e => setScheduleForm({ ...scheduleForm, category: e.target.value })}>
                                    <option value="GI">GI (Jiujitsu)</option>
                                    <option value="NO-GI">NO-GI</option>
                                    <option value="KIDS">KIDS</option>
                                    <option value="OPEN MAT">OPEN MAT</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <input type="time" className="bg-white border border-zinc-200 rounded-xl px-4 py-2 text-[10px] font-black text-zinc-950 outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={scheduleForm.start_time} onChange={e => setScheduleForm({ ...scheduleForm, start_time: e.target.value })} />
                                <input type="time" className="bg-white border border-zinc-200 rounded-xl px-4 py-2 text-[10px] font-black text-zinc-950 outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={scheduleForm.end_time} onChange={e => setScheduleForm({ ...scheduleForm, end_time: e.target.value })} />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowScheduleForm(false)} className="flex-1 h-10 bg-zinc-200 text-zinc-600 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">Cancelar</button>
                                <button onClick={async () => { 
                                    if (editingSchedule) await handleUpdateSchedule(editingSchedule.id, scheduleForm);
                                    else await handleCreateSchedule(scheduleForm);
                                    setShowScheduleForm(false);
                                }}
                                    className="flex-1 h-10 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">
                                    {editingSchedule ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="divide-y divide-zinc-50">
                        {schedulesLoading ? (
                            <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-zinc-300" size={20} /></div>
                        ) : (
                            schedulesList.sort((a: any, b: any) => a.day_of_week - b.day_of_week).map((sch: any) => (
                                <div key={sch.id} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="text-[10px] font-black text-zinc-950 uppercase tracking-tighter">
                                                {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][sch.day_of_week]}
                                            </p>
                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${
                                                sch.category === 'KIDS' ? 'bg-orange-50 text-orange-600' : 
                                                sch.category === 'NO-GI' ? 'bg-zinc-900 text-zinc-100' : 
                                                'bg-emerald-50 text-emerald-600'
                                            }`}>
                                                {sch.category || 'GI'}
                                            </span>
                                        </div>
                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{sch.start_time.substring(0,5)} — {sch.end_time.substring(0,5)}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => { setEditingSchedule(sch); setScheduleForm({ name: sch.name || '', day_of_week: String(sch.day_of_week), start_time: sch.start_time.substring(0,5), end_time: sch.end_time.substring(0,5), category: sch.category || 'GI' }); setShowScheduleForm(true); }}
                                            className="p-2 text-zinc-400 hover:text-emerald-600 active:scale-90 transition-all"><Edit2 size={14} /></button>
                                        <button onClick={async () => { if(confirm('¿Eliminar horario?')) await handleDeleteSchedule(sch.id); }}
                                            className="p-2 text-zinc-400 hover:text-rose-500 active:scale-90 transition-all"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* DATOS BANCARIOS */}
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden mt-6">
                <div className="px-4 py-3 border-b border-zinc-50 flex items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <CreditCard size={14} style={{ color: branding?.primaryColor || '#6366f1' }} /> Datos Bancarios
                    </span>
                    <button onClick={handlePasteHeuristic}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-full text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                        <ClipboardPaste size={14} /> Pegar Copiado
                    </button>
                </div>
                <div className="divide-y divide-zinc-50">
                    {([
                        { label: 'Banco', field: 'bank_name', placeholder: 'Ej: Banco Estado' },
                        { label: 'Tipo Cta.', field: 'account_type', placeholder: 'Cuenta Corriente / Vista' },
                        { label: 'N° Cuenta', field: 'account_number', placeholder: '00000000' },
                        { label: 'Titular', field: 'holder_name', placeholder: 'Nombre del titular' },
                        { label: 'RUT', field: 'holder_rut', placeholder: '12.345.678-9' },
                    ] as const).map(({ label, field, placeholder }) => (
                        <div key={field} className="flex items-center px-4 py-2">
                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest w-20 shrink-0">{label}</span>
                            <input type="text" className="flex-1 bg-transparent text-xs font-black text-zinc-950 focus:ring-0 outline-none text-right"
                                value={bankData[field] || ''} onChange={e => setBankData((p: any) => ({ ...p, [field]: e.target.value }))} placeholder={placeholder} />
                        </div>
                    ))}
                </div>
            </div>

            <button onClick={handleSaveBankData}
                style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}
                className="w-full text-white font-black py-4 rounded-2xl active:scale-95 transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                <Save size={16} /> Guardar Datos Bancarios
            </button>

            {/* ACCIONES DE SISTEMA */}
            <div className="space-y-2 mt-8">
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Users size={16} className="text-zinc-400" />
                        <span className="text-[10px] font-black uppercase text-zinc-700 tracking-widest">Mostrar alumnos inactivos</span>
                    </div>
                    <button onClick={() => setShowInactivePayers(!showInactivePayers)}
                        className={`w-10 h-6 rounded-full transition-all relative ${showInactivePayers ? 'bg-emerald-500' : 'bg-zinc-200'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showInactivePayers ? 'left-5' : 'left-1'}`} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button onClick={forceSync} disabled={loadingSync}
                        className="h-14 bg-zinc-950 text-white rounded-2xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all">
                        <RefreshCw size={18} className={loadingSync ? "animate-spin" : ""} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Sincronizar Cloud</span>
                    </button>
                    <button onClick={handleLogout}
                        className="h-14 bg-white border border-zinc-100 text-rose-500 rounded-2xl flex items-center justify-center gap-2 active:scale-95 shadow-sm transition-all focus:bg-rose-50">
                        <LogOut size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Cerrar Sesión</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsSection;
