"use client";

import React, { useState, useEffect } from 'react';
import { 
    Camera, Save, ClipboardPaste, CreditCard, Edit2, Loader2, Sparkles, 
    Trash2, LogOut, RefreshCw, Users, X, FileText, ChevronRight, 
    Banknote, Settings as SettingsIcon, ShieldCheck, Calendar
} from 'lucide-react';
import { deleteRegistrationPage, generateRegistrationPage } from "@/lib/api";

interface SettingsSectionProps {
    branding: any;
    isDark: boolean;
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
    handleSaveBankInfo: () => void;
    formatCLP: (n: number) => string;
    parseCLP: (s: string) => number;
    handleLogout: () => void;
    changeTab: (tab: string) => void;
    // Management Props
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
    // Terms Props
    tenantTerms: any;
    termsLoading: boolean;
    loadTenantTerms: () => void;
    handleUpdateTenantTerms: (content: string) => Promise<any>;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
    branding,
    isDark,
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
    handleSaveBankInfo,
    formatCLP,
    parseCLP,
    handleLogout,
    changeTab,
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
    handleDeleteSchedule,
    tenantTerms,
    termsLoading,
    loadTenantTerms,
    handleUpdateTenantTerms
}) => {
    const [copied, setCopied] = useState(false);
    
    // Modals visibility
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [showBankModal, setShowBankModal] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showSchedulesModal, setShowSchedulesModal] = useState(false);
    
    // Schedule form state
    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<any>(null);
    const [scheduleForm, setScheduleForm] = useState({ name: '', day_of_week: '1', start_time: '18:00', end_time: '19:30', category: 'GI' });

    // Terms editor state
    const [termsSections, setTermsSections] = useState<any[]>([]);
    const [savingTerms, setSavingTerms] = useState(false);
    const [isTermsPreview, setIsTermsPreview] = useState(false);

    useEffect(() => {
        if (tenantTerms?.content) {
            try {
                // Try to parse as JSON (new format)
                const parsed = JSON.parse(tenantTerms.content);
                if (Array.isArray(parsed)) {
                    setTermsSections(parsed);
                    return;
                }
            } catch (e) {
                // Fallback: Parse Markdown to JSON (legacy format)
                const sections: any[] = [];
                const lines = tenantTerms.content.split('\n');
                let currentSection: any = null;

                lines.forEach((line: string) => {
                    if (line.startsWith('## ') || line.startsWith('# ')) {
                        if (currentSection) sections.push(currentSection);
                        currentSection = { title: line.replace(/^#+ /, '').trim(), content: '' };
                    } else if (currentSection) {
                        currentSection.content += (currentSection.content ? '\n' : '') + line;
                    } else if (line.trim()) {
                        currentSection = { title: 'General', content: line };
                    }
                });
                if (currentSection) sections.push(currentSection);
                setTermsSections(sections.length > 0 ? sections : [{ title: 'Nuevo Contrato', content: '' }]);
            }
        } else if (!termsLoading) {
            setTermsSections([{ title: '1. Objeto del Contrato', content: '' }]);
        }
    }, [tenantTerms, termsLoading]);

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

    const handleSaveTerms = async () => {
        setSavingTerms(true);
        // Serialize to JSON for storage
        await handleUpdateTenantTerms(JSON.stringify(termsSections));
        setSavingTerms(false);
        setShowTermsModal(false);
    };

    const addTermsSection = () => {
        setTermsSections([...termsSections, { title: '', content: '' }]);
    };

    const updateTermsSection = (index: number, field: string, value: string) => {
        const next = [...termsSections];
        next[index] = { ...next[index], [field]: value };
        setTermsSections(next);
    };

    const removeTermsSection = (index: number) => {
        if (termsSections.length <= 1) return;
        setTermsSections(termsSections.filter((_, i) => i !== index));
    };

    const ActionCard = ({ icon: Icon, title, description, onClick, color = "indigo" }: any) => (
        <button onClick={onClick}
            className={`w-full ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'} rounded-[24px] p-5 shadow-xl border flex items-center gap-4 active:scale-[0.98] transition-all ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50'} group shadow-zinc-950/5`}>
            <div className={`w-14 h-14 rounded-2xl bg-${color}-500/10 flex items-center justify-center border border-${color}-500/20 group-hover:bg-${color}-500/20 transition-colors shadow-inner`}>
                <Icon className={`text-${color}-500`} size={24} />
            </div>
            <div className="flex-1 text-left">
                <h4 className={`text-[14px] font-black uppercase tracking-tighter ${isDark ? 'text-zinc-100' : 'text-zinc-950'} leading-none mb-1`}>
                    {title}
                </h4>
                <p className={`text-[10px] font-black ${isDark ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-widest leading-snug`}>
                    {description}
                </p>
            </div>
            <ChevronRight className={`${isDark ? 'text-zinc-700' : 'text-zinc-300'} group-hover:text-zinc-500 transition-colors`} size={20} />
        </button>
    );

    return (
        <div className={`space-y-4 px-0 pb-10 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
            {/* BRANDING */}
            <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-zinc-950/5'} rounded-[28px] px-6 py-5 shadow-xl border flex items-center gap-4`}>
                <div className="relative shrink-0">
                    <img src={branding?.logo || "/icon.webp"} className={`w-14 h-14 rounded-full object-cover border-2 ${isDark ? 'border-zinc-800' : 'border-zinc-50'} shadow-inner`} alt="Logo" />
                    <button onClick={() => fileInputRef.current?.click()} 
                        className={`absolute -bottom-1 -right-1 ${isDark ? 'bg-white text-zinc-950 border-zinc-200' : 'bg-zinc-950 text-white border-zinc-800'} p-1.5 rounded-full border shadow-lg active:scale-90 transition-all`}>
                        <Camera size={14} />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className={`text-[15px] font-black uppercase tracking-tighter ${isDark ? 'text-zinc-100' : 'text-zinc-950'} truncate leading-none mb-1`}>
                        {branding?.name || 'Academy'}
                    </h3>
                    <div className="flex items-center gap-2">
                        <p className={`text-[10px] font-black ${isDark ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-widest`}>STAFF DASHBOARD v5.1</p>
                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-zinc-950 text-zinc-100 border-zinc-800'} px-2 py-0.5 rounded-full border`}>Staff</span>
                    </div>
                </div>
            </div>

            {/* GESTIÓN DE NEGOCIO */}
            <div className="grid gap-3 pt-2">
                <p className={`text-[10px] font-black ${isDark ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-[0.4em] ml-3 mb-1 opaciy-60`}>ADMINISTRACIÓN</p>
                
                <ActionCard 
                    icon={CreditCard} 
                    title="Planes y Precios" 
                    description="Gestiona las cuotas mensuales"
                    onClick={() => setShowPricingModal(true)}
                    color="indigo"
                />

                <ActionCard 
                    icon={Calendar} 
                    title="Horarios Dojo" 
                    description="Configura las clases semanales"
                    onClick={() => {
                        loadSchedules();
                        setShowSchedulesModal(true);
                    }}
                    color="emerald"
                />

                <ActionCard 
                    icon={Banknote} 
                    title="Datos de Pago" 
                    description="Información para transferencias"
                    onClick={() => setShowBankModal(true)}
                    color="amber"
                />

                <ActionCard 
                    icon={ShieldCheck} 
                    title="Términos Legales" 
                    description="Contrato de membrecía digital"
                    onClick={() => {
                        loadTenantTerms();
                        setShowTermsModal(true);
                    }}
                    color="blue"
                />
            </div>

            {/* LINK DE REGISTRO */}
            <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-zinc-950/5'} rounded-[28px] px-6 py-5 shadow-xl border mt-4`}>
                <p className={`text-[10px] font-black ${isDark ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-widest mb-3`}>Página de Registro Público</p>
                {regPageCode ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <p className={`flex-1 text-[11px] font-bold ${isDark ? 'text-zinc-300 bg-zinc-950 border-zinc-800/50' : 'text-zinc-700 bg-zinc-50 border-zinc-100'} truncate rounded-2xl px-5 py-4 border shadow-inner`}>
                                {`app.digitalizatodo.cl/r/${regPageCode}`}
                            </p>
                            <button onClick={() => handleCopyClipboard(`https://app.digitalizatodo.cl/r/${regPageCode}`)}
                                className={`shrink-0 text-[10px] font-black uppercase px-5 py-4 rounded-2xl border transition-all active:scale-95 ${copied ? 'bg-emerald-500 text-white border-emerald-400' : isDark ? 'bg-zinc-800 text-zinc-100 border-zinc-700' : 'bg-zinc-100 text-zinc-900 border-zinc-200'}`}>
                                {copied ? '✓' : 'COPIAR'}
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={async () => { setGeneratingPage(true); await generateRegistrationPage(user.tenant_slug || user.tenant_id, token ?? ''); setGeneratingPage(false); loadPlans(); }}
                                disabled={generatingPage}
                                className={`flex-1 h-12 ${isDark ? 'bg-zinc-950 border-zinc-800/50 text-zinc-500' : 'bg-zinc-50 border-zinc-100 text-zinc-400'} border rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest`}>
                                {generatingPage ? <Loader2 className="animate-spin" size={12} /> : <><RefreshCw size={14} /> Regenerar Link</>}
                            </button>
                        </div>
                    </div>
                ) : (
                    <button onClick={async () => { setGeneratingPage(true); const r = await generateRegistrationPage(user.tenant_slug || user.tenant_id, token ?? ''); setGeneratingPage(false); if (r?.code) setRegPageCode(r.code); }}
                        disabled={generatingPage}
                        style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}
                        className="w-full h-14 text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-[22px] flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-40">
                        {generatingPage ? <Loader2 className="animate-spin" size={14} /> : <><Sparkles size={16} /> Crear Página de Registro</>}
                    </button>
                )}
            </div>

            {/* MODAL: PRECIOS */}
            {showPricingModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowPricingModal(false)} />
                    <div className={`${isDark ? 'bg-zinc-900' : 'bg-white'} w-full sm:max-w-sm rounded-t-[36px] sm:rounded-[40px] border ${isDark ? 'border-zinc-800' : 'border-zinc-100'} shadow-2xl relative z-10 overflow-hidden animate-in slide-in-from-bottom duration-400`}>
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80" />
                        <div className="p-8 space-y-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[20px] bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                                        <CreditCard className="text-indigo-500" size={24} />
                                    </div>
                                    <div>
                                        <h4 className={`text-[16px] font-black uppercase tracking-tighter ${isDark ? 'text-zinc-100' : 'text-zinc-950'} leading-none`}>Mensualidades</h4>
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Valores base de la academia</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowPricingModal(false)} className={`p-2 ${isDark ? 'text-zinc-600 hover:text-zinc-400 bg-zinc-950' : 'text-zinc-400 hover:text-zinc-600 bg-zinc-50'} active:scale-90 transition-all rounded-full`}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className={`divide-y ${isDark ? 'divide-zinc-800/50 bg-zinc-950 border-zinc-800' : 'divide-zinc-100 bg-zinc-50 border-zinc-100'} rounded-[28px] border shadow-inner overflow-hidden`}>
                                {[{ label: vocab?.cat1 || 'KIDS', field: 'cat1' as const }, { label: vocab?.cat2 || 'ADULTOS', field: 'cat2' as const }].map(({ label, field }) => (
                                    <div key={field} className="flex items-center px-6 py-5">
                                        <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest w-24 shrink-0">{label}</span>
                                        <input type="text" inputMode="numeric" className={`flex-1 bg-transparent text-[15px] font-black ${isDark ? 'text-white' : 'text-zinc-950'} focus:ring-0 outline-none text-right placeholder-zinc-800`}
                                            value={formatCLP(prices[field])} onChange={e => handlePriceInput(field, e.target.value)} placeholder="$ 0" />
                                    </div>
                                ))}
                                <div className="flex items-center px-6 py-5">
                                    <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest w-24 shrink-0">Desc. desde</span>
                                    <input type="text" inputMode="numeric" className={`flex-1 bg-transparent text-[15px] font-black ${isDark ? 'text-white' : 'text-zinc-950'} focus:ring-0 outline-none text-right placeholder-zinc-800`}
                                        value={prices.discountThreshold === 0 ? '' : prices.discountThreshold} onChange={e => { const v = e.target.value.replace(/\D/g, ''); setPrices((p: any) => ({ ...p, discountThreshold: v === '' ? 0 : parseInt(v) })); }} placeholder="2 alumnos" />
                                </div>
                                <div className="flex items-center px-6 py-5">
                                    <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest w-24 shrink-0">Descuento</span>
                                    <input type="text" inputMode="numeric" className={`flex-1 bg-transparent text-[15px] font-black ${isDark ? 'text-white' : 'text-zinc-950'} focus:ring-0 outline-none text-right placeholder-zinc-800`}
                                        value={prices.discountPercentage === 0 ? '' : `${prices.discountPercentage}%`} onChange={e => { const v = e.target.value.replace(/\D/g, ''); setPrices((p: any) => ({ ...p, discountPercentage: v === '' ? 0 : Math.min(100, parseInt(v)) })); }} placeholder="15%" />
                                </div>
                            </div>

                            <button onClick={() => { handleSavePrices(); setShowPricingModal(false); }}
                                style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}
                                className="w-full h-16 text-white font-black rounded-[24px] active:scale-95 transition-all text-[12px] uppercase tracking-[0.25em] shadow-xl shadow-indigo-500/20">
                                Guardar Precios
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: HORARIOS (Management List) */}
            {showSchedulesModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowSchedulesModal(false)} />
                    <div className={`${isDark ? 'bg-zinc-900' : 'bg-white'} w-full sm:max-w-lg rounded-t-[36px] sm:rounded-[40px] border ${isDark ? 'border-zinc-800' : 'border-zinc-100'} shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-400`}>
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-80" />
                        <div className="p-8 pb-4 space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[20px] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                                        <Calendar className="text-emerald-500" size={24} />
                                    </div>
                                    <div>
                                        <h4 className={`text-[16px] font-black uppercase tracking-tighter ${isDark ? 'text-zinc-100' : 'text-zinc-950'} leading-none`}>Gestión Clases</h4>
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Horarios por día de la semana</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => { setEditingSchedule(null); setScheduleForm({ name: '', day_of_week: '1', start_time: '18:00', end_time: '19:30', category: 'GI' }); setShowScheduleForm(true); }}
                                        className="text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white border border-emerald-400 px-4 py-2 rounded-2xl active:scale-95 transition-all shadow-lg shadow-emerald-500/10">
                                        + Agregar
                                    </button>
                                    <button onClick={() => setShowSchedulesModal(false)} className={`p-2 ${isDark ? 'text-zinc-600 hover:text-zinc-400 bg-zinc-950' : 'text-zinc-400 hover:text-zinc-600 bg-zinc-50'} active:scale-90 transition-all rounded-full`}>
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 px-8 pb-10 hide-scrollbar pt-2">
                            {schedulesLoading ? (
                                <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-emerald-400" size={32} /></div>
                            ) : (
                                (() => {
                                    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                                    const grouped = (schedulesList || []).reduce((acc: any, sch: any) => {
                                        const d = sch.day_of_week;
                                        if (!acc[d]) acc[d] = [];
                                        acc[d].push(sch);
                                        return acc;
                                    }, {});

                                    const sortedDayKeys = Object.keys(grouped).sort((a, b) => {
                                        const valA = Number(a) === 0 ? 7 : Number(a);
                                        const valB = Number(b) === 0 ? 7 : Number(b);
                                        return valA - valB;
                                    });

                                    if (sortedDayKeys.length === 0) return (
                                        <div className={`py-16 text-center ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'} rounded-[32px] border border-dashed`}>
                                            <Calendar className="text-zinc-800 mx-auto mb-4" size={48} />
                                            <p className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.2em]">No hay horarios creados</p>
                                        </div>
                                    );

                                    return sortedDayKeys.map(dayKey => (
                                        <div key={dayKey} className="mb-6">
                                            <div className="flex items-center gap-3 mb-3 px-2">
                                                <div className={`h-px ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'} flex-1`} />
                                                <span className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em] bg-emerald-500/5 px-3 py-1 rounded-full">{days[Number(dayKey)]}</span>
                                                <div className={`h-px ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'} flex-1`} />
                                            </div>
                                            <div className="space-y-3">
                                                {grouped[dayKey].sort((a: any, b: any) => a.start_time.localeCompare(b.start_time)).map((sch: any) => (
                                                    <div key={sch.id} className={`flex items-center justify-between p-5 ${isDark ? 'bg-zinc-950 border-zinc-800/50 hover:border-emerald-500/30' : 'bg-zinc-50 border-zinc-100 hover:border-emerald-200'} rounded-[24px] border transition-all group shadow-sm`}>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-1.5">
                                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest border ${
                                                                    sch.category === 'KIDS' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                                                                    sch.category === 'NO-GI' ? 'bg-zinc-800 text-zinc-100 border-zinc-700' : 
                                                                    'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                                }`}>
                                                                    {sch.category || 'GI'}
                                                                </span>
                                                                <p className={`text-[13px] font-black ${isDark ? 'text-zinc-100' : 'text-zinc-950'} tracking-tight`}>{sch.start_time.substring(0,5)} — {sch.end_time.substring(0,5)}</p>
                                                            </div>
                                                            {sch.name && <p className={`text-[10px] font-medium ${isDark ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-widest pl-1`}>{sch.name}</p>}
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => { setEditingSchedule(sch); setScheduleForm({ name: sch.name || '', day_of_week: String(sch.day_of_week), start_time: sch.start_time.substring(0,5), end_time: sch.end_time.substring(0,5), category: sch.category || 'GI' }); setShowScheduleForm(true); }}
                                                                className={`p-3 ${isDark ? 'text-zinc-600 hover:text-emerald-400' : 'text-zinc-400 hover:text-emerald-500'} transition-all active:scale-90`}><Edit2 size={16} /></button>
                                                            <button onClick={async () => { if(confirm('¿Eliminar horario?')) await handleDeleteSchedule(sch.id); }}
                                                                className={`p-3 ${isDark ? 'text-zinc-600 hover:text-rose-400' : 'text-zinc-400 hover:text-rose-500'} transition-all active:scale-90`}><Trash2 size={16} /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ));
                                })()
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* NESTED MODAL: SCHEDULE FORM (Create/Edit) */}
            {showScheduleForm && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowScheduleForm(false)} />
                    <div className={`${isDark ? 'bg-zinc-900' : 'bg-white'} w-full sm:max-w-sm rounded-[40px] border ${isDark ? 'border-zinc-800' : 'border-zinc-100'} shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
                        <div className="p-8 space-y-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[20px] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                        <Sparkles className="text-emerald-500" size={24} />
                                    </div>
                                    <div>
                                        <h4 className={`text-[16px] font-black uppercase tracking-tighter ${isDark ? 'text-zinc-100' : 'text-zinc-950'} leading-none`}>
                                            {editingSchedule ? 'Editar Sesión' : 'Nueva Sesión'}
                                        </h4>
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Detalles de la clase</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowScheduleForm(false)} className={`p-2 ${isDark ? 'text-zinc-600 hover:text-zinc-400 bg-zinc-950' : 'text-zinc-400 hover:text-zinc-600 bg-zinc-50'} active:scale-90 transition-all rounded-full`}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Día</p>
                                    <select className={`w-full ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-100 text-zinc-950'} border rounded-[20px] px-5 py-4 text-[12px] font-black uppercase outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none shadow-inner`}
                                        value={scheduleForm.day_of_week} onChange={e => setScheduleForm({ ...scheduleForm, day_of_week: e.target.value })}>
                                        <option value="1">Lunes</option>
                                        <option value="2">Martes</option>
                                        <option value="3">Miércoles</option>
                                        <option value="4">Jueves</option>
                                        <option value="5">Viernes</option>
                                        <option value="6">Sábado</option>
                                        <option value="0">Domingo</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Tipo de Clase</p>
                                    <select className={`w-full ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-100 text-zinc-950'} border rounded-[20px] px-5 py-4 text-[12px] font-black uppercase outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none shadow-inner`}
                                        value={scheduleForm.category} onChange={e => setScheduleForm({ ...scheduleForm, category: e.target.value })}>
                                        <option value="GI">GI (Jiujitsu)</option>
                                        <option value="NO-GI">NO-GI</option>
                                        <option value="KIDS">KIDS</option>
                                        <option value="OPEN MAT">OPEN MAT</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Inicio</p>
                                        <input type="time" className={`w-full ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-100 text-zinc-950'} border rounded-[20px] px-5 py-4 text-[14px] font-black outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner`}
                                            value={scheduleForm.start_time} onChange={e => setScheduleForm({ ...scheduleForm, start_time: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Fin</p>
                                        <input type="time" className={`w-full ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-100 text-zinc-950'} border rounded-[20px] px-5 py-4 text-[14px] font-black outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner`}
                                            value={scheduleForm.end_time} onChange={e => setScheduleForm({ ...scheduleForm, end_time: e.target.value })} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Descripción</p>
                                    <input type="text" placeholder="Ej: Iniciantes" 
                                        className={`w-full ${isDark ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-800' : 'bg-zinc-50 border-zinc-100 text-zinc-950 placeholder-zinc-300'} border rounded-[20px] px-5 py-4 text-[12px] font-black uppercase outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner`}
                                        value={scheduleForm.name} onChange={e => setScheduleForm({ ...scheduleForm, name: e.target.value })} />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setShowScheduleForm(false)} 
                                    className={`flex-1 h-16 ${isDark ? 'bg-zinc-950 text-zinc-500 border-zinc-800' : 'bg-zinc-50 text-zinc-400 border-zinc-100'} border rounded-[24px] text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all`}>
                                    Cerrar
                                </button>
                                <button onClick={async () => { if (editingSchedule) await handleUpdateSchedule(editingSchedule.id, scheduleForm); else await handleCreateSchedule(scheduleForm); setShowScheduleForm(false); }}
                                    className="flex-1 h-16 bg-emerald-500 text-white rounded-[24px] text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-emerald-500/20">
                                    {editingSchedule ? 'Guardar' : 'Crear'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: BANCO */}
            {showBankModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowBankModal(false)} />
                    <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'} w-full sm:max-w-sm rounded-t-[36px] sm:rounded-[40px] border shadow-2xl relative z-10 overflow-hidden animate-in slide-in-from-bottom duration-400`}>
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500 opacity-80" />
                        <div className="p-8 space-y-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[20px] bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-inner">
                                        <Banknote className="text-amber-500" size={24} />
                                    </div>
                                    <div>
                                        <h4 className={`text-[16px] font-black uppercase tracking-tighter ${isDark ? 'text-zinc-100' : 'text-zinc-950'} leading-none`}>Datos Bancarios</h4>
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Para recepción de pagos</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={handlePasteHeuristic} className={`p-2.5 ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-400' : 'bg-zinc-50 border-zinc-100 text-zinc-400'} border rounded-2xl active:scale-90 transition-all hover:text-amber-500`}>
                                        <ClipboardPaste size={18} />
                                    </button>
                                    <button onClick={() => setShowBankModal(false)} className={`p-2 ${isDark ? 'text-zinc-600 hover:text-zinc-400 bg-zinc-950' : 'text-zinc-400 hover:text-zinc-600 bg-zinc-50'} active:scale-90 transition-all rounded-full`}>
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className={`${isDark ? 'divide-zinc-800/30 bg-zinc-950 border-zinc-800' : 'divide-zinc-100 bg-zinc-50 border-zinc-100'} divide-y rounded-[28px] border shadow-inner overflow-hidden`}>
                                {([
                                    { label: 'Banco', field: 'bank_name', placeholder: 'Ej: Santander' },
                                    { label: 'Tipo', field: 'account_type', placeholder: 'Vista / Corriente' },
                                    { label: 'Número', field: 'account_number', placeholder: '00000000' },
                                    { label: 'Titular', field: 'holder_name', placeholder: 'Nombre' },
                                    { label: 'RUT', field: 'holder_rut', placeholder: '12.345.678-9' },
                                ] as const).map(({ label, field, placeholder }) => (
                                    <div key={field} className="flex items-center px-6 py-4">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest w-20 shrink-0">{label}</span>
                                        <input type="text" className={`flex-1 bg-transparent text-[13px] font-black ${isDark ? 'text-zinc-100' : 'text-zinc-950'} focus:ring-0 outline-none text-right placeholder-zinc-800`}
                                            value={bankData[field] || ''} onChange={e => setBankData((p: any) => ({ ...p, [field]: e.target.value }))} placeholder={placeholder} />
                                    </div>
                                ))}
                            </div>

                            <button onClick={() => { handleSaveBankInfo(); setShowBankModal(false); }}
                                style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}
                                className="w-full h-16 text-white font-black rounded-[24px] active:scale-95 transition-all text-[12px] uppercase tracking-[0.25em] shadow-xl shadow-amber-500/10 flex items-center justify-center gap-3">
                                <Save size={20} /> Guardar Datos
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: TÉRMINOS */}
            {showTermsModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowTermsModal(false)} />
                    <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'} w-full sm:max-w-lg rounded-t-[36px] sm:rounded-[40px] border shadow-2xl relative z-10 overflow-hidden animate-in slide-in-from-bottom duration-400`}>
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-80" />
                        <div className="p-8 space-y-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[20px] bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
                                        <FileText className="text-blue-500" size={24} />
                                    </div>
                                    <div>
                                        <h4 className={`text-[16px] font-black uppercase tracking-tighter ${isDark ? 'text-zinc-100' : 'text-zinc-950'} leading-none`}>Contrato Staff</h4>
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Términos y condiciones legales</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowTermsModal(false)} className={`p-2 ${isDark ? 'text-zinc-600 hover:text-zinc-400 bg-zinc-950' : 'text-zinc-400 hover:text-zinc-600 bg-zinc-50'} active:scale-90 transition-all rounded-full`}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[50vh] overflow-y-auto px-1 hide-scrollbar">
                                <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 py-2 z-10">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{isTermsPreview ? 'Vista Previa' : 'Editor Estructurado'}</p>
                                    <div className="flex items-center gap-3">
                                        {termsLoading && <Loader2 className="animate-spin text-blue-500" size={10} />}
                                        {!isTermsPreview && (
                                            <button onClick={addTermsSection}
                                                className="text-[9px] font-black uppercase text-indigo-500 hover:text-indigo-600 flex items-center gap-1 bg-indigo-500/5 px-3 py-1.5 rounded-xl border border-indigo-500/10 transition-all active:scale-95">
                                                + Sección
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => setIsTermsPreview(!isTermsPreview)}
                                            className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                                                isTermsPreview 
                                                    ? 'bg-emerald-500 text-white border-emerald-400' 
                                                    : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                                            }`}
                                        >
                                            {isTermsPreview ? <Edit2 size={10} /> : <FileText size={10} />}
                                            {isTermsPreview ? 'Editar' : 'Previsualizar'}
                                        </button>
                                    </div>
                                </div>
                                
                                {termsLoading ? (
                                    <div className={`w-full ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'} border rounded-[28px] h-[300px] flex items-center justify-center`}>
                                        <Loader2 className="animate-spin text-blue-500/30" size={32} />
                                    </div>
                                ) : isTermsPreview ? (
                                    <div className={`w-full ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-100 text-zinc-800'} border rounded-[28px] px-8 py-8 min-h-[300px] prose prose-sm max-w-none`}>
                                        {termsSections.length > 0 ? termsSections.map((sec, i) => (
                                            <div key={i} className="mb-8 last:mb-0">
                                                <h3 className="text-lg font-black mb-3 text-indigo-500 uppercase tracking-tight">{sec.title}</h3>
                                                <p className="text-[13px] leading-relaxed font-medium whitespace-pre-wrap">{sec.content}</p>
                                            </div>
                                        )) : (
                                            <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
                                                <FileText size={48} className="mb-4" />
                                                <p className="text-[10px] uppercase font-black tracking-widest">Sin contenido</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-6 pb-4">
                                        {termsSections.map((sec, i) => (
                                            <div key={i} className={`relative group p-6 rounded-[32px] border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'} transition-all`}>
                                                <div className="flex items-center justify-between mb-4">
                                                    <input 
                                                        type="text"
                                                        placeholder="Título de la Sección (Ej: 1. Riesgos)"
                                                        className={`bg-transparent text-[13px] font-black ${isDark ? 'text-white' : 'text-zinc-950'} uppercase tracking-tight outline-none w-full mr-10`}
                                                        value={sec.title}
                                                        onChange={(e) => updateTermsSection(i, 'title', e.target.value)}
                                                    />
                                                    <button onClick={() => removeTermsSection(i)}
                                                        className="absolute top-6 right-6 p-2 text-zinc-600 hover:text-rose-500 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <textarea 
                                                    className={`w-full bg-transparent text-[13px] font-medium ${isDark ? 'text-zinc-400 shadow-inner' : 'text-zinc-600'} outline-none min-h-[120px] leading-relaxed resize-none`}
                                                    placeholder="Contenido de esta sección..."
                                                    value={sec.content}
                                                    onChange={(e) => updateTermsSection(i, 'content', e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button onClick={handleSaveTerms}
                                disabled={savingTerms}
                                style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}
                                className="w-full h-16 text-white font-black rounded-[24px] active:scale-95 transition-all text-[12px] uppercase tracking-[0.25em] shadow-xl shadow-blue-500/10 flex items-center justify-center gap-3 disabled:opacity-50">
                                {savingTerms ? <Loader2 className="animate-spin" size={24} /> : <><Save size={20} /> Publicar Cambios</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SISTEMA */}
            <div className="space-y-3 mt-8">
                <button onClick={handleLogout}
                    className={`w-full h-14 ${isDark ? 'bg-zinc-950 border-rose-500/20 shadow-zinc-950/20' : 'bg-white border-zinc-100 shadow-rose-950/5'} border text-rose-500 rounded-[22px] flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg transition-all hover:bg-rose-500/5 font-black uppercase text-[11px] tracking-widest`}>
                    <LogOut size={20} />
                    Finalizar Sesión
                </button>
            </div>
        </div>
    );
};

export default SettingsSection;
