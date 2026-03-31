"use client";

import React, { useState, useEffect } from 'react';
import { 
    Camera, Save, ClipboardPaste, CreditCard, Edit2, Loader2, Sparkles, 
    Trash2, LogOut, RefreshCw, Users, X, FileText, ChevronRight, 
    Banknote, Settings as SettingsIcon, ShieldCheck, Calendar, Wallet, Plus, 
    Home, Star, Baby, AlertCircle, Copy, Check, User, Info, Smartphone, Lock, CheckCircle2, QrCode
} from 'lucide-react';
import { deleteRegistrationPage, generateRegistrationPage } from "@/lib/api";
import { MPConnectModal } from './Admin/MPConnectModal';

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
    hasPermission: (module: string) => boolean;
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
    handleUpdateTenantTerms,
    hasPermission
}) => {
    const [copied, setCopied] = useState(false);
    
    // Modals visibility
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [showBankModal, setShowBankModal] = useState(false);
    const [fingerprintCopied, setFingerprintCopied] = useState(false);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showSchedulesModal, setShowSchedulesModal] = useState(false);
    
    // Mercado Pago OAuth State
    const [showMPConnectModal, setShowMPConnectModal] = useState(false);
    const [mpLoading, setMpLoading] = useState(false);
    
    // Schedule form state
    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<any>(null);
    const [scheduleForm, setScheduleForm] = useState({ name: '', day_of_week: '1', start_time: '18:00', end_time: '19:30', category: 'GI' });

    // Terms editor state
    const [termsSections, setTermsSections] = useState<any[]>([]);
    const [savingTerms, setSavingTerms] = useState(false);
    const [isTermsPreview, setIsTermsPreview] = useState(false);
    const [localPlans, setLocalPlans] = useState<any[]>([]);
    const [savingPlans, setSavingPlans] = useState(false);
    const [pricingCategory, setPricingCategory] = useState<'dojo' | 'vip'>('dojo');
    const [dojoType, setDojoType] = useState<'adulto' | 'kids'>('adulto');

    const billingCycleLabels: Record<string, string> = {
        'monthly_from_enrollment': 'MENSUAL',
        'monthly_fixed': 'MENSUAL',
        'quarterly': 'TRIMESTRAL',
        'semi_annual': 'SEMESTRAL',
        'annual': 'ANUAL'
    };

    const getVipPlanDecorations = (name: string, price: number) => {
        const n = (name || '').toUpperCase();
        if (n.includes('SUELTA') || n.includes('INDIVIDUAL')) {
            return { badge: 'CLASE INDIVIDUAL', duration: '1 SESIÓN', highlight: null };
        }
        if (n.includes('PACK')) {
            return { 
                badge: 'MEJOR VALOR', 
                duration: `${new Intl.NumberFormat('es-CL').format(Math.round(price / 4))} C/U`, 
                highlight: 'AHORRO REAL' 
            };
        }
        if (n.includes('REFERIDO')) {
            return { badge: 'PARA ALUMNOS DEL GRUPO', duration: '1 SESIÓN', highlight: 'BENEFICIO ESPECIAL' };
        }
        return { badge: 'SESIÓN VIP', duration: 'SESIÓN', highlight: null };
    };

    // VIP CRUD State
    const [isCreatingVip, setIsCreatingVip] = useState(false);
    const [isSavingVip, setIsSavingVip] = useState(false);
    const [newVipForm, setNewVipForm] = useState({
        name: '',
        price: '',
        description: '',
        billing_cycle: 'monthly_from_enrollment',
        is_recurring: 1
    });

    const onVipDelete = async (id: number) => {
        if (!window.confirm('¿Estás seguro de eliminar este plan permanentemente?')) return;
        try {
            await handleDeletePlan(id);
        } catch (error) {
            console.error('Error al eliminar el plan:', error);
        }
    };

    const onVipCreate = async () => {
        if (!newVipForm.name || !newVipForm.price) return;

        setIsSavingVip(true);
        try {
            const data = {
                name: newVipForm.name,
                description: newVipForm.description,
                billing_cycle: newVipForm.billing_cycle,
                price: parseFloat(newVipForm.price.replace(/\./g, '')),
                category: 'vip',
                active: 1,
                is_recurring: newVipForm.is_recurring
            };

            await handleCreatePlan(data);
            setIsCreatingVip(false);
            setNewVipForm({
                name: '',
                price: '',
                description: '',
                billing_cycle: 'monthly_from_enrollment',
                is_recurring: 1
            });
        } catch (error) {
            console.error('Error al crear el plan:', error);
        } finally {
            setIsSavingVip(false);
        }
    };
    const [vipPacks, setVipPacks] = useState([
        { id: 'v1', name: 'CLASE SUELTA', description: 'Ideal para probar la metodología. Sin compromiso previo.', price: 18000, duration: '1 SESIÓN', badge: 'CLASE INDIVIDUAL' },
        { id: 'v2', name: 'PACK 4 CLASES', description: 'Ahorra $7.000 vs. precio unitario. Progresión real en 4 sesiones.', price: 65000, duration: '$16.250 C/U', badge: 'MEJOR VALOR', highlight: 'AHORRO REAL' },
        { id: 'v3', name: 'CLASE REFERIDO', description: 'Beneficio exclusivo para quienes ya entrenan en la academia.', price: 15000, duration: '1 SESIÓN', badge: 'PARA ALUMNOS DEL GRUPO', highlight: 'BENEFICIO ESPECIAL' },
    ]);

    // Sync localPlans when modal opens or plansList changes
    useEffect(() => {
        if (showPricingModal && plansList) {
            setLocalPlans([...plansList]);
        }
    }, [showPricingModal, plansList]);

    const isTreasury = branding?.industry === 'school_treasury';

    const handlePlanPriceInput = (planId: string, value: string) => {
        const cleanValue = value.replace(/\D/g, '');
        const numericValue = cleanValue === '' ? 0 : parseInt(cleanValue);
        setLocalPlans(prev => prev.map(p => p.id === planId ? { ...p, price: numericValue } : p));
    };

    const handlePlanDiscountInput = (planId: string, field: string, value: string, isDecimal = false) => {
        const cleanValue = value.replace(/[^0-9.]/g, '');
        const numericValue = cleanValue === '' ? 0 : isDecimal ? parseFloat(cleanValue) : parseInt(cleanValue);
        setLocalPlans(prev => prev.map(p => p.id === planId ? { ...p, [field]: numericValue } : p));
    };

    const handleSaveAllPlans = async () => {
        setSavingPlans(true);
        try {
            const modified = localPlans.filter(lp => {
                const original = plansList.find((p: any) => p.id === lp.id);
                return !original || 
                       String(original.price) !== String(lp.price) || 
                       String(original.family_discount_min_students) !== String(lp.family_discount_min_students) ||
                       String(original.family_discount_percent) !== String(lp.family_discount_percent);
            });

            for (const plan of modified) {
                await handleUpdatePlan(plan.id, {
                    name: plan.name,
                    price: plan.price,
                    family_discount_min_students: plan.family_discount_min_students,
                    family_discount_percent: plan.family_discount_percent
                });
            }
            setShowPricingModal(false);
        } catch (error) {
            console.error('Error saving plans:', error);
        } finally {
            setSavingPlans(false);
        }
    };

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
        
        // 1. Prepare Automated Updates
        const nextSections = [...termsSections];
        const todayMonth = new Intl.DateTimeFormat('es-CL', { month: 'short', year: 'numeric' }).format(new Date());
        const fullDate = new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());

        // 2. Automate Header (Index 0): Save ONLY the intro text, strip hardcoded header
        if (nextSections[0]?.title.includes('ENCABEZADO')) {
            const h = getHeaderParts(nextSections[0].content);
            nextSections[0].content = h.intro;
        }

        // 3. Automate Footer (Last Index): Save ONLY the footer text, strip hardcoded metadata
        if (nextSections.length > 1 && nextSections[nextSections.length - 1].title.includes('FIRMA')) {
            const f = getFooterParts(nextSections[nextSections.length - 1].content);
            nextSections[nextSections.length - 1].content = f.text;
        }

        // Serialize to JSON for storage
        await handleUpdateTenantTerms(JSON.stringify(nextSections));
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

    const renderMarkdown = (text: string) => {
        if (!text) return null;
        return text.split('\n').map((line, i) => {
            if (line.startsWith('# ')) {
                return <h1 key={i} className={`text-xl font-black mb-4 uppercase tracking-tighter ${isDark ? 'text-white' : 'text-zinc-950'}`}>{line.replace('# ', '')}</h1>;
            }
            if (line.startsWith('## ')) {
                return <h2 key={i} className="text-lg font-black mb-3 uppercase tracking-tight text-indigo-500">{line.replace('## ', '')}</h2>;
            }
            
            // Simple bold/italic parts
            const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
            return (
                <div key={i} className="mb-1">
                    {parts.map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) 
                            return <strong key={j} className={`font-black ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>{part.slice(2, -2)}</strong>;
                        if (part.startsWith('*') && part.endsWith('*')) 
                            return <em key={j} className={`font-bold italic ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{part.slice(1, -1)}</em>;
                        return part;
                    })}
                </div>
            );
        });
    };

    const getHeaderParts = (content: string) => {
        if (!content) return { title: '', version: '', intro: '' };
        const lines = content.split('\n');
        let title = '';
        let version = '';
        
        const titleLine = lines.find(l => l.startsWith('# '));
        const versionLine = lines.find(l => l.startsWith('*') && l.endsWith('*'));
        
        if (titleLine) title = titleLine.replace('# ', '');
        if (versionLine) version = versionLine.slice(1, -1);
        
        // Intro is everything else (excluding title and version lines)
        const intro = lines
            .filter(l => l !== titleLine && l !== versionLine)
            .join('\n')
            .trim();
            
        return { title, version, intro };
    };

    const updateHeaderContent = (index: number, parts: { title?: string, version?: string, intro?: string }) => {
        const current = getHeaderParts(termsSections[index].content);
        const next = { ...current, ...parts };
        const newContent = `# ${next.title}\n*${next.version}*\n\n${next.intro}`;
        updateTermsSection(index, 'content', newContent);
    };

    const getFooterParts = (content: string) => {
        if (!content) return { branding: '', updated: '', regId: '', text: '' };
        const lines = content.split('\n');
        
        const line0 = lines.find(l => l.includes('**Gestión Digital por:**')) || '';
        const parts = line0.split('|');
        const branding = parts[0]?.replace(/\*\*Gestión Digital por:\*\*/g, '').replace(/\*\*/g, '').replace(':', '').trim();
        const updated = parts[1]?.replace(/\*\*Última actualización:\*\*/g, '').replace(/\*\*/g, '').replace(':', '').trim();
        
        const regLine = lines.find(l => l.includes('**ID Registro Digital:**')) || '';
        const regId = regLine.replace(/\*\*ID Registro Digital:\*\*/g, '').replace(/\*\*/g, '').replace(':', '').trim();
        
        const text = lines.filter(l => l !== line0 && l !== regLine).join('\n').trim();
        
        return { branding, updated, regId, text };
    };

    const updateFooterContent = (index: number, parts: { branding?: string, updated?: string, regId?: string }) => {
        const current = getFooterParts(termsSections[index].content);
        const next = { ...current, ...parts };
        const newContent = `**Gestión Digital por:** ${next.branding} | **Última actualización:** ${next.updated}\n**ID Registro Digital:** ${next.regId}`;
        updateTermsSection(index, 'content', newContent);
    };

    const ActionCard = ({ icon: Icon, title, description, onClick, color = "indigo", solid = false }: any) => (
        <button onClick={onClick}
            className={`w-full ${solid && color === 'blue' ? 'bg-blue-600 border-blue-500 shadow-blue-500/20' : (isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100')} rounded-[24px] p-5 shadow-xl border flex items-center gap-4 active:scale-[0.98] transition-all ${!solid && (isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50')} group shadow-zinc-950/5`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all shadow-inner ${
                solid && color === 'blue' 
                    ? 'bg-white/20 border-white/30' 
                    : `bg-${color}-500/10 border-${color}-500/20 group-hover:bg-${color}-500/20`
            }`}>
                <Icon className={solid && color === 'blue' ? 'text-white' : `text-${color}-500`} size={24} />
            </div>
            <div className="flex-1 text-left">
                <h4 className={`text-[14px] font-black uppercase tracking-tighter ${solid && color === 'blue' ? 'text-white' : (isDark ? 'text-zinc-100' : 'text-zinc-950')} leading-none mb-1`}>
                    {title}
                </h4>
                <p className={`text-[10px] font-black ${solid && color === 'blue' ? 'text-blue-100' : (isDark ? 'text-zinc-500' : 'text-zinc-400')} uppercase tracking-widest leading-snug`}>
                    {description}
                </p>
            </div>
            <ChevronRight className={`${solid && color === 'blue' ? 'text-white/50' : (isDark ? 'text-zinc-700' : 'text-zinc-300')} group-hover:text-zinc-500 transition-colors`} size={20} />
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
                        <p className={`text-[10px] font-black ${isDark ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-widest`}>{isTreasury ? 'SCHOOL TREASURY v1.2' : 'STAFF DASHBOARD v5.1'}</p>
                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-zinc-950 text-zinc-100 border-zinc-800'} px-2 py-0.5 rounded-full border`}>{isTreasury ? 'Tesorero' : 'Staff'}</span>
                    </div>
                </div>
            </div>

            {/* GESTIÓN DE NEGOCIO */}
            <div className="grid gap-3 pt-2">
                <p className={`text-[10px] font-black ${isDark ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-[0.4em] ml-3 mb-1 opacity-60`}>ADMINISTRACIÓN</p>
                
                {((branding?.industry === 'martial_arts' && hasPermission('settings.plans')) || (branding?.industry === 'school_treasury' && hasPermission('settings.plans'))) && (
                    <ActionCard 
                        icon={CreditCard} 
                        title="Planes y Precios" 
                        description="Gestiona las cuotas y membresías"
                        onClick={() => setShowPricingModal(true)}
                        color="indigo"
                    />
                )}
                
                {hasPermission('settings.schedules') && (
                    <ActionCard 
                        icon={Calendar} 
                        title={vocab.scheduleTitle} 
                        description={isTreasury ? "Configura los bloques de clases" : "Configura las clases semanales"}
                        onClick={() => {
                            loadSchedules();
                            setShowSchedulesModal(true);
                        }}
                        color="emerald"
                    />
                )}

                {hasPermission('settings.payments') && (
                    <ActionCard 
                        icon={Banknote} 
                        title="Datos de Pago" 
                        description="Información para transferencias"
                        onClick={() => setShowBankModal(true)}
                        color="amber"
                    />
                )}

                {hasPermission('settings.terms') && (
                    <ActionCard 
                        icon={ShieldCheck} 
                        title={isTreasury ? "Reglamento Interno" : "Términos Legales"} 
                        description={isTreasury ? "Reglamento y normativas" : "Contrato de membrecía digital"}
                        onClick={() => {
                            loadTenantTerms();
                            setShowTermsModal(true);
                        }}
                        color="blue"
                    />
                )}

                {branding?.industry === 'martial_arts' && hasPermission('settings.payments') && (
                    <ActionCard 
                        icon={CreditCard} 
                        title="PAGOS AUTOMÁTICOS EN DIGITALIZA TODO" 
                        description="Vincular cuenta y automatizar cobros"
                        onClick={() => setShowMPConnectModal(true)}
                        color="blue"
                        solid={true}
                    />
                )}
            </div>

            {/* MODAL: CONEXIÓN MERCADO PAGO OAUTH */}
            <MPConnectModal
                isOpen={showMPConnectModal}
                onClose={() => setShowMPConnectModal(false)}
                isDark={isDark}
                loading={mpLoading}
                onConnect={async () => {
                    setMpLoading(true);
                    try {
                        const response = await fetch('/api/mercadopago/auth/url', {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const data = await response.json();
                        if (data.url) {
                            window.location.href = data.url; 
                        }
                    } catch (error) {
                        alert("Error al iniciar la conexión con Digitalizatodo Pay.");
                    } finally {
                        setMpLoading(false);
                    }
                }}
            />

            {/* LINK DE REGISTRO */}
            {hasPermission('settings.registration') && (
                <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-zinc-950/5'} rounded-[28px] px-6 py-5 shadow-xl border mt-4`}>
                    <p className={`text-[10px] font-black ${isDark ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-widest mb-3`}>{vocab.registrationLinkTitle}</p>
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
                                <button onClick={async () => { setGeneratingPage(true); const r = await generateRegistrationPage(user.tenant_slug || user.tenant_id, token ?? ''); setGeneratingPage(false); if (r?.code) setRegPageCode(r.code); loadPlans(); }}
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
            )}

            {/* MODAL: PRECIOS */}
            {showPricingModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowPricingModal(false)} />
                    <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'} w-full sm:max-w-lg rounded-t-[36px] sm:rounded-[40px] border shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-400`}>
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-80" />
                        
                        {/* Header & Category Switch */}
                        <div className="px-5 pt-8 pb-4 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                                        <Wallet className="text-indigo-500" size={20} />
                                    </div>
                                    <h4 className={`text-[15px] font-black uppercase tracking-tighter ${isDark ? 'text-zinc-100' : 'text-zinc-950'} leading-none`}>Configuración de Mensualidades</h4>
                                </div>
                                <button onClick={() => setShowPricingModal(false)} className={`p-2 ${isDark ? 'text-zinc-600 hover:text-zinc-400 bg-zinc-950' : 'text-zinc-400 hover:text-zinc-600 bg-zinc-50'} active:scale-90 transition-all rounded-full`}>
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Primary Category Switch */}
                                <div className={`p-1.5 rounded-[22px] ${isDark ? 'bg-black border-zinc-800' : 'bg-zinc-100 border-zinc-200'} border flex items-center shadow-inner`}>
                                    <button 
                                        onClick={() => setPricingCategory('dojo')}
                                        className={`flex-1 h-11 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                                            pricingCategory === 'dojo' 
                                            ? 'bg-white shadow-lg text-indigo-600 dark:bg-zinc-900 dark:text-indigo-400' 
                                            : 'text-zinc-500 hover:text-zinc-400'
                                        }`}
                                    >
                                        <Home size={14} /> {isTreasury ? "Cuotas Mensuales" : "Ser parte del Dojo"}
                                    </button>
                                    <button 
                                        onClick={() => setPricingCategory('vip')}
                                        className={`flex-1 h-11 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                                            pricingCategory === 'vip' 
                                            ? 'bg-white shadow-lg text-amber-600 dark:bg-zinc-900 dark:text-amber-400' 
                                            : 'text-zinc-500 hover:text-zinc-400'
                                        }`}
                                    >
                                        <Star size={14} /> {isTreasury ? "Matrículas / Otros" : "VIP 1A1"}
                                    </button>
                                </div>

                                {/* Secondary Dojo Switch (Only shown if Dojo is active) */}
                                {pricingCategory === 'dojo' && (
                                    <div className="flex items-center justify-between px-1 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="flex flex-col">
                                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Vista de Planes</p>
                                            <p className="text-[7px] font-medium text-zinc-400 uppercase tracking-tighter">Filtro Inteligente</p>
                                        </div>
                                        <div className={`p-1 rounded-2xl ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-zinc-100 border-zinc-200'} border flex items-center gap-1`}>
                                            <button 
                                                onClick={() => setDojoType('adulto')}
                                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-1.5 transition-all duration-300 ${
                                                    dojoType === 'adulto' 
                                                    ? 'bg-white shadow-lg text-indigo-600 scale-105 dark:bg-zinc-900 dark:text-indigo-400' 
                                                    : 'text-zinc-500 hover:text-zinc-400'
                                                }`}
                                            >
                                                <Users size={12} className={dojoType === 'adulto' ? 'text-indigo-400' : ''} /> Adulto
                                            </button>
                                            <button 
                                                onClick={() => setDojoType('kids')}
                                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-1.5 transition-all duration-300 ${
                                                    dojoType === 'kids' 
                                                    ? 'bg-white shadow-lg text-emerald-600 scale-105 dark:bg-zinc-900 dark:text-emerald-400' 
                                                    : 'text-zinc-500 hover:text-zinc-400'
                                                }`}
                                            >
                                                <Baby size={12} className={dojoType === 'kids' ? 'text-emerald-400' : ''} /> Kids
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                                 {/* Content Area */}
                        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-6 hide-scrollbar">
                            {pricingCategory === 'dojo' ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                    {localPlans.filter(p => {
                                        const category = p.category || 'dojo';
                                        if (category !== 'dojo') return false;
                                        const name = (p.name || '').toLowerCase();
                                        const isKids = name.includes('kids') || name.includes('niños') || name.includes('infantil') || name.includes('menores');
                                        return dojoType === 'kids' ? isKids : !isKids;
                                    }).length === 0 ? (
                                        <div className={`p-8 rounded-[32px] border-2 border-dashed ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50/50'} text-center space-y-3 animate-in fade-in zoom-in-95 duration-500`}>
                                            <div className="w-12 h-12 rounded-2xl bg-zinc-500/10 flex items-center justify-center mx-auto mb-2">
                                                <Info size={24} className="text-zinc-400" />
                                            </div>
                                            <p className={`text-[13px] font-black uppercase tracking-tight ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>No se encontraron planes para {dojoType}</p>
                                            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest leading-relaxed">
                                                {dojoType === 'kids' 
                                                    ? "Tips: Nombra tus planes con 'Kids' o 'Niños'. Además, verifica que el Plan pertenezca a tu ID de academia (Tenant ID)." 
                                                    : "Mostrando solo planes que no están marcados como Kids."}
                                            </p>
                                        </div>
                                    ) : localPlans
                                        .filter(p => {
                                            const category = p.category || 'dojo';
                                            if (category !== 'dojo') return false;

                                            const name = (p.name || '').toLowerCase();
                                            const isKids = name.includes('kids') || name.includes('niños') || name.includes('infantil') || name.includes('menores');
                                            return dojoType === 'kids' ? isKids : !isKids;
                                        })
                                        .map((plan) => (
                                            <div key={plan.id} className={`p-5 rounded-[28px] border ${isDark ? 'bg-zinc-900 border-zinc-800 shadow-[0_8px_32px_rgba(0,0,0,0.5)]' : 'bg-zinc-50 border-zinc-200 shadow-sm'} space-y-4 relative overflow-hidden`}>
                                                {dojoType === 'kids' && (
                                                    <div className="absolute top-0 right-0 p-2">
                                                        <span className="bg-emerald-500/10 text-emerald-500 text-[7px] font-black px-2 py-0.5 rounded-bl-xl uppercase tracking-tighter border-l border-b border-emerald-500/10">
                                                            Modo Hermanos
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest ${
                                                            plan.billing_cycle === 'monthly_from_enrollment' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' :
                                                            plan.billing_cycle === 'quarterly' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                                            plan.billing_cycle === 'annual' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                                                            isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-600'
                                                        }`}>
                                                            {billingCycleLabels[plan.billing_cycle] || plan.billing_cycle?.replace('_', ' ') || 'PLAN'}
                                                        </span>
                                                        <p className={`text-[11px] font-black uppercase tracking-tight ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                                                            {isTreasury ? (dojoType === 'kids' ? 'CUOTAS ALUMNOS' : 'CUOTAS GENERALES') : (dojoType === 'kids' ? 'SER PARTE DEL DOJO KIDS' : 'SER PARTE DEL DOJO')}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 gap-4">
                                                    <div className="space-y-1.5">
                                                        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-1">VALOR BASE (CLP)</p>
                                                        <div className={`flex items-center px-4 py-3 rounded-2xl ${isDark ? 'bg-zinc-950' : 'bg-white'} border ${isDark ? 'border-zinc-800' : 'border-zinc-200 shadow-sm'}`}>
                                                            <span className="text-zinc-500 font-bold mr-2 text-[13px]">$</span>
                                                            <input type="text" inputMode="numeric" className={`w-full bg-transparent text-[15px] font-black ${isDark ? 'text-zinc-100' : 'text-zinc-950'} outline-none`}
                                                                value={plan.price === 0 ? '' : new Intl.NumberFormat('es-CL').format(plan.price)} 
                                                                onChange={e => handlePlanPriceInput(plan.id, e.target.value)} 
                                                                placeholder="0" />
                                                        </div>
                                                    </div>

                                                    {dojoType === 'kids' && (
                                                        <div className="grid grid-cols-2 gap-3 animate-in zoom-in-95 duration-300">
                                                            <div className="space-y-1.5">
                                                                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest ml-1">Mín. Alumnos</p>
                                                                <div className={`flex items-center px-4 py-2.5 rounded-2xl ${isDark ? 'bg-zinc-950' : 'bg-white'} border ${isDark ? 'border-emerald-500/20' : 'border-emerald-200 shadow-sm'}`}>
                                                                    <input type="text" inputMode="numeric" className={`w-full bg-transparent text-[13px] font-black ${isDark ? 'text-zinc-100' : 'text-zinc-950'} outline-none text-center`}
                                                                        value={plan.family_discount_min_students || 0} 
                                                                        onChange={e => handlePlanDiscountInput(plan.id, 'family_discount_min_students', e.target.value)} 
                                                                        placeholder="2" />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest ml-1">% Descuento</p>
                                                                <div className={`flex items-center px-4 py-2.5 rounded-2xl ${isDark ? 'bg-zinc-950' : 'bg-white'} border ${isDark ? 'border-emerald-500/20' : 'border-emerald-200 shadow-sm'}`}>
                                                                    <input type="text" inputMode="decimal" className={`w-full bg-transparent text-[13px] font-black ${isDark ? 'text-zinc-100' : 'text-zinc-950'} outline-none text-center`}
                                                                        value={plan.family_discount_percent || 0} 
                                                                        onChange={e => handlePlanDiscountInput(plan.id, 'family_discount_percent', e.target.value, true)} 
                                                                        placeholder="21.43" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {dojoType === 'kids' && plan.family_discount_percent > 0 && (
                                                    <div className={`mt-2 p-3 rounded-2xl border ${isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'} flex items-center justify-between`}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                                                                <Users size={12} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none mb-0.5">Precio Familiar ({plan.family_discount_min_students} hermanos)</p>
                                                                <p className={`text-[11px] font-black ${isDark ? 'text-zinc-100' : 'text-emerald-950'}`}>
                                                                    ${new Intl.NumberFormat('es-CL').format(Math.round(plan.price * plan.family_discount_min_students * (1 - (plan.family_discount_percent / 100))))}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/10">
                                                            ¡Ahorra -{plan.family_discount_percent}%!
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    }
                                    {localPlans.filter(p => (p.category || 'dojo') === 'dojo').length === 0 && (
                                        <div className="py-12 text-center opacity-40">
                                            <Loader2 className="animate-spin text-indigo-400 mx-auto mb-3" size={32} />
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Cargando planes del dojo...</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
                                    {/* Action Bar: Add New Pack */}
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Gestión de Packs VIP</p>
                                        {!isCreatingVip && (
                                            <button 
                                                onClick={() => setIsCreatingVip(true)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                    isDark ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white'
                                                } border border-amber-500/20 active:scale-95`}
                                            >
                                                <Plus size={14} />
                                                Nuevo Pack
                                            </button>
                                        )}
                                    </div>

                                    {/* Create Form Card */}
                                    {isCreatingVip && (
                                        <div className={`p-6 rounded-[32px] border-2 border-dashed ${isDark ? 'bg-zinc-950 border-amber-500/30' : 'bg-white border-amber-500/30'} space-y-5 animate-in zoom-in-95 duration-300 shadow-2xl shadow-amber-500/10`}>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.3em]">Configurando Nuevo Pack</p>
                                                    <button onClick={() => setIsCreatingVip(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                                                        <X size={18} />
                                                    </button>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="space-y-1.5">
                                                        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-1">NOMBRE DEL PACK</p>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Ej: PACK 8 CLASES, CLASE PRUEBA..."
                                                            className={`w-full px-4 py-3 rounded-2xl ${isDark ? 'bg-zinc-900' : 'bg-zinc-100'} border ${isDark ? 'border-zinc-800' : 'border-zinc-200'} text-[13px] font-black outline-none focus:border-amber-500 transition-all`}
                                                            value={newVipForm.name}
                                                            onChange={e => setNewVipForm({...newVipForm, name: e.target.value})}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1.5">
                                                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-1">PRECIO (CLP)</p>
                                                            <input 
                                                                type="text" 
                                                                inputMode="numeric"
                                                                placeholder="0"
                                                                className={`w-full px-4 py-3 rounded-2xl ${isDark ? 'bg-zinc-900' : 'bg-zinc-100'} border ${isDark ? 'border-zinc-800' : 'border-zinc-200'} text-[13px] font-black outline-none focus:border-amber-500 transition-all`}
                                                                value={newVipForm.price}
                                                                onChange={e => {
                                                                    const val = e.target.value.replace(/\D/g, '');
                                                                    setNewVipForm({...newVipForm, price: val ? new Intl.NumberFormat('es-CL').format(parseInt(val)) : ''});
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-1">TIPO DE PLAN</p>
                                                            <div className={`flex rounded-2xl p-1 ${isDark ? 'bg-zinc-900' : 'bg-zinc-100'} border ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                                                                <button 
                                                                    onClick={() => setNewVipForm({...newVipForm, is_recurring: 1})}
                                                                    className={`flex-1 py-1.5 rounded-xl text-[9px] font-black transition-all ${newVipForm.is_recurring === 1 ? (isDark ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-zinc-900 shadow-sm') : 'text-zinc-500'}`}
                                                                >
                                                                    RECURRENTE
                                                                </button>
                                                                <button 
                                                                    onClick={() => setNewVipForm({...newVipForm, is_recurring: 0})}
                                                                    className={`flex-1 py-1.5 rounded-xl text-[9px] font-black transition-all ${newVipForm.is_recurring === 0 ? (isDark ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-zinc-900 shadow-sm') : 'text-zinc-500'}`}
                                                                >
                                                                    ÚNICO
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-1">DESCRIPCIÓN COMERCIAL</p>
                                                        <textarea 
                                                            placeholder="Ej: Incluye 8 sesiones individuales de 1 hora."
                                                            className={`w-full px-4 py-3 rounded-2xl ${isDark ? 'bg-zinc-900' : 'bg-zinc-100'} border ${isDark ? 'border-zinc-800' : 'border-zinc-200'} text-[12px] font-medium outline-none focus:border-amber-500 transition-all min-h-[80px] resize-none`}
                                                            value={newVipForm.description}
                                                            onChange={e => setNewVipForm({...newVipForm, description: e.target.value})}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => setIsCreatingVip(false)}
                                                        className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest ${isDark ? 'bg-zinc-900 text-zinc-500' : 'bg-zinc-100 text-zinc-400'} active:scale-95 transition-all`}
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button 
                                                        onClick={onVipCreate}
                                                        disabled={isSavingVip}
                                                        className={`flex-[2] py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2`}
                                                    >
                                                        {isSavingVip ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                                                        Crear Pack VIP
                                                    </button>
                                                </div>
                                                
                                                <p className="text-[8px] font-medium text-zinc-500 text-center italic">
                                                    Tip: Los nombres que incluyen 'Pack', 'Suelta' o 'Referido' activan insignias automáticas.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* DB VIP Packs */}
                                    {localPlans
                                        .filter(p => p.category === 'vip')
                                        .map((plan) => {
                                            const deco = getVipPlanDecorations(plan.name, plan.price);
                                            return (
                                                <div key={plan.id} className={`p-5 rounded-[32px] border relative overflow-hidden group transition-all duration-300 ${
                                                    isDark ? 'bg-zinc-900 border-zinc-800 hover:border-amber-500/30' : 'bg-white border-zinc-200 shadow-sm hover:border-amber-500/30'
                                                }`}>
                                                    {deco.highlight && (
                                                        <div className="absolute top-0 right-0 px-4 py-1.5 bg-amber-500 rounded-bl-2xl">
                                                            <p className="text-[8px] font-black text-white uppercase tracking-widest">{deco.highlight}</p>
                                                        </div>
                                                    )}

                                                    <div className="space-y-4">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">{deco.badge}</p>
                                                                <span className="text-[7px] font-black bg-zinc-500/10 text-zinc-500 px-1.5 py-0.5 rounded-md uppercase tracking-widest">
                                                                    {plan.is_recurring === 0 ? 'PAGO ÚNICO' : (billingCycleLabels[plan.billing_cycle] || 'MENSUAL')}
                                                                </span>
                                                            </div>
                                                            <h4 className={`text-[15px] font-black uppercase tracking-tighter ${isDark ? 'text-zinc-100' : 'text-zinc-950'}`}>{plan.name}</h4>
                                                            <p className="text-[11px] font-medium text-zinc-500 leading-tight pr-12">{plan.description || 'Ideal para probar la metodología.'}</p>
                                                        </div>

                                                        <div className="flex items-end justify-between pt-2">
                                                            <div className="flex flex-col gap-1">
                                                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest leading-none">VALOR BASE</p>
                                                                <div className="flex items-center">
                                                                    <span className={`text-[24px] font-black tracking-tighter ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>$</span>
                                                                    <input type="text" inputMode="numeric" 
                                                                        className={`w-32 bg-transparent text-[24px] font-black tracking-tighter ${isDark ? 'text-zinc-100' : 'text-zinc-900'} outline-none border-b border-dashed border-zinc-700 focus:border-amber-500 transition-colors`}
                                                                        value={plan.price === 0 ? '' : new Intl.NumberFormat('es-CL').format(plan.price)} 
                                                                        onChange={e => handlePlanPriceInput(plan.id, e.target.value)} 
                                                                        placeholder="0" />
                                                                </div>
                                                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">{isDark ? 'CLP ·' : 'CLP ·'} {deco.duration}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button 
                                                                    onClick={() => onVipDelete(plan.id)}
                                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                                                        isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:text-rose-500' : 'bg-zinc-50 border-zinc-100 text-zinc-400 hover:text-rose-500'
                                                                    } border active:scale-90`}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                                                    isDark ? 'bg-zinc-950 border-zinc-800 text-amber-500 hover:bg-amber-500 hover:text-white' : 'bg-zinc-50 border-zinc-100 text-amber-600 hover:bg-amber-500 hover:text-white'
                                                                } border`}>
                                                                    <Save size={18} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    }

                                    {/* Template Packs (Only if NO DB VIP packs yet) */}
                                    {localPlans.filter(p => p.category === 'vip').length === 0 && (
                                        <>
                                            <div className="text-center space-y-1 mb-6">
                                                <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.3em]">Paso Final: Selecciona tu Pack VIP</p>
                                                <h3 className={`text-[14px] font-black uppercase tracking-tight ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Sesiones VIP 1-A-1</h3>
                                                <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">Elige el pack de sesiones para comenzar hoy</p>
                                            </div>

                                            {vipPacks.map((pack) => (
                                                <div key={pack.id} className={`p-5 rounded-[32px] border relative overflow-hidden group transition-all duration-300 ${
                                                    isDark ? 'bg-zinc-900 border-zinc-800 hover:border-amber-500/30' : 'bg-white border-zinc-200 shadow-sm hover:border-amber-500/30'
                                                }`}>
                                                    {pack.highlight && (
                                                        <div className="absolute top-0 right-0 px-4 py-1.5 bg-amber-500 rounded-bl-2xl">
                                                            <p className="text-[8px] font-black text-white uppercase tracking-widest">{pack.highlight}</p>
                                                        </div>
                                                    )}

                                                    <div className="space-y-4">
                                                        <div className="space-y-1">
                                                            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">{pack.badge}</p>
                                                            <h4 className={`text-[15px] font-black uppercase tracking-tighter ${isDark ? 'text-zinc-100' : 'text-zinc-950'}`}>{pack.name}</h4>
                                                            <p className="text-[11px] font-medium text-zinc-500 leading-tight pr-12">{pack.description}</p>
                                                        </div>

                                                        <div className="flex items-end justify-between pt-2">
                                                            <div className="flex flex-col">
                                                                <span className={`text-[24px] font-black tracking-tighter ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                                                                    ${new Intl.NumberFormat('es-CL').format(pack.price)}
                                                                </span>
                                                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">{isDark ? 'CLP ·' : 'CLP ·'} {pack.duration}</p>
                                                            </div>
                                                            <button className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                                                isDark ? 'bg-zinc-950 border-zinc-800 text-amber-500 hover:bg-amber-500 hover:text-white' : 'bg-zinc-50 border-zinc-100 text-amber-600 hover:bg-amber-500 hover:text-white'
                                                            } border`}>
                                                                <ChevronRight size={20} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}

                            <div className="pt-2">
                                <button onClick={handleSaveAllPlans}
                                    disabled={savingPlans}
                                    style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}
                                    className="w-full h-16 text-white font-black rounded-[24px] active:scale-95 transition-all text-[12px] uppercase tracking-[0.25em] shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2">
                                    {savingPlans ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Guardar Configuración</>}
                                </button>
                            </div>
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
                        <div className="px-[5px] py-8 pb-4 space-y-4">
                            <div className="flex items-start justify-between px-4">
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

                        <div className="overflow-y-auto flex-1 px-[5px] pb-10 hide-scrollbar pt-2">
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

            {/* MODAL: CERTIFICADO DIGITAL */}
            {showSignatureModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowSignatureModal(false)}
                    />
                    <div className={`relative w-full max-w-[360px] ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-[3rem] p-8 space-y-8 animate-in zoom-in-95 duration-200 shadow-2xl overflow-hidden`}>
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                        
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className={`w-20 h-20 rounded-[2.5rem] ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'} border border-blue-500/20 flex items-center justify-center shadow-2xl relative`}>
                                <ShieldCheck className="text-blue-500" size={40} />
                                <div className="absolute inset-0 rounded-[2.5rem] border border-blue-500/20 animate-ping opacity-20" />
                            </div>
                            <div className="space-y-1">
                                <h2 className={`text-xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-zinc-950'}`}>Certificado Digital</h2>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-4 py-1 bg-zinc-500/5 rounded-full inline-block border border-zinc-500/10">SHA-256 Integrity System</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <p className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-2">
                                    <span className="w-1 h-1 bg-indigo-500 rounded-full" /> Registro de Integridad (SHA-256)
                                </p>
                            </div>
                            
                            <div className={`p-5 rounded-[2.5rem] ${isDark ? 'bg-black border-zinc-900' : 'bg-zinc-50 border-zinc-100'} border h-[120px] overflow-y-auto hide-scrollbar shadow-inner`}>
                                {(tenantTerms?.hash 
                                    ? tenantTerms.hash.match(/.{1,16}/g) || [] 
                                    : ["SIN_FIRMA_ACTIVA", "ESPERANDO_DATOS", "PUBLIQUE_CAMBIOS", "PARA_GENERAR"]
                                ).map((row: string, i: number) => (
                                    <div key={i} className="flex items-center gap-3 mb-2 last:mb-0 group">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${isDark ? 'bg-black border-zinc-800 text-zinc-600' : 'bg-white shadow-sm border-zinc-100 text-zinc-400'} text-[9px] font-black transition-all group-hover:border-blue-500/30 group-hover:text-blue-500`}>
                                            {(i + 1).toString().padStart(2, '0')}
                                        </div>
                                        <div className={`flex-1 p-3.5 rounded-2xl border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-50 shadow-sm'} transition-all group-hover:border-blue-500/30`}>
                                            <p className={`text-[12px] font-mono font-bold ${isDark ? 'text-zinc-400' : 'text-zinc-500'} tracking-[0.3em] uppercase text-center`}>
                                                {row}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[9px] font-medium text-zinc-500 text-center px-4 italic">
                                * Los caracteres mostrados corresponden a la firma criptográfica única de este documento.
                            </p>
                        </div>

                        <div className={`p-6 rounded-[32px] ${isDark ? 'bg-zinc-900/50' : 'bg-zinc-100'} space-y-3 border border-white/5`}>
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-zinc-500 uppercase tracking-tighter">Versión Documento</span>
                                <span className={`font-black ${isDark ? 'text-white' : 'text-zinc-950'}`}>v{tenantTerms?.version || 'X'}.0</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-zinc-500 uppercase tracking-tighter">Fecha de Emisión</span>
                                <span className={`font-black ${isDark ? 'text-white' : 'text-zinc-950'}`}>{new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-zinc-500 uppercase tracking-tighter">Proveedor Cert</span>
                                <span className="font-black text-blue-400 flex items-center gap-1.5">
                                    <Sparkles size={12} className="text-blue-500" /> Digitaliza Todo SSL
                                </span>
                            </div>
                        </div>

                        <button 
                            onClick={() => setShowSignatureModal(false)}
                            className={`w-full h-16 rounded-[24px] ${isDark ? 'bg-white text-black' : 'bg-zinc-950 text-white'} font-black uppercase tracking-widest active:scale-95 transition-all text-[11px] shadow-2xl`}
                        >
                            Cerrar Certificado
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL: BANCO */}
            {showBankModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowBankModal(false)} />
                    <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'} w-full sm:max-w-sm rounded-t-[36px] sm:rounded-[40px] border shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-400`}>
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500 opacity-80" />
                        
                        {/* Header */}
                        <div className="px-[5px] pt-8 pb-4 space-y-4">
                            <div className="flex items-start justify-between px-4">
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
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto px-[5px] pb-6 space-y-6 hide-scrollbar">
                            <div className="px-4 space-y-6">

                            <div className={`${isDark ? 'divide-zinc-800/30 bg-zinc-950 border-zinc-800' : 'divide-zinc-100 bg-zinc-50 border-zinc-100'} divide-y rounded-[28px] border shadow-inner overflow-hidden`}>
                                {([
                                    { label: 'Banco', field: 'bank_name', placeholder: 'Ej: Santander' },
                                    { label: 'Tipo', field: 'account_type', placeholder: 'Vista / Corriente' },
                                    { label: 'Número', field: 'account_number', placeholder: '00000000' },
                                    { label: 'Titular', field: 'holder_name', placeholder: 'Nombre' },
                                    { label: 'RUT', field: 'holder_rut', placeholder: '12.345.678-9' },
                                ] as const).map(({ label, field, placeholder }) => (
                                    <div key={field} className="flex items-center px-4 py-4">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest w-16 shrink-0">{label}</span>
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
            </div>
        )}

            {/* MODAL: TÉRMINOS */}
            {showTermsModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowTermsModal(false)} />
                    <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'} w-full sm:max-w-lg rounded-t-[36px] sm:rounded-[40px] border shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-400`}>
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-80" />
                        
                        {/* Header */}
                        <div className="px-[5px] pt-8 pb-4 space-y-4">
                            <div className="flex items-start justify-between px-4">
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
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto px-[5px] pb-6 space-y-6 hide-scrollbar">
                            <div className="px-4 space-y-6">

                            <div className="space-y-4 max-h-[50vh] overflow-y-auto px-1 hide-scrollbar">
                                <div className={`flex items-center justify-between sticky top-0 z-50 py-4 -mx-1 px-1 ${isDark ? 'bg-zinc-900/80' : 'bg-white/80'} backdrop-blur-md border-b ${isDark ? 'border-zinc-800' : 'border-zinc-100'} mb-6`}>
                                    <div className="flex items-center gap-2">
                                        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${
                                            isTermsPreview 
                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                                                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500'
                                        }`}>
                                            <div className={`w-2 h-2 rounded-full animate-pulse ${isTermsPreview ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                                            <span className="text-[11px] font-black uppercase tracking-widest">
                                                {isTermsPreview ? 'Muestra' : 'Editor'}
                                            </span>
                                        </div>
                                        {termsLoading && <Loader2 className="animate-spin text-blue-500" size={14} />}
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        {!isTermsPreview && (
                                            <button onClick={addTermsSection}
                                                className="h-11 px-4 rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 active:scale-90 transition-all flex items-center gap-2 border border-indigo-400">
                                                <Plus size={18} />
                                                <span className="text-[10px] font-black uppercase tracking-widest mb-0.5">Sección</span>
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => setIsTermsPreview(!isTermsPreview)}
                                            className={`h-11 px-4 rounded-2xl border transition-all flex items-center gap-2 active:scale-90 ${
                                                isTermsPreview 
                                                    ? 'bg-zinc-950 text-white border-zinc-800' 
                                                    : 'bg-white text-zinc-950 border-zinc-200'
                                            }`}
                                        >
                                            {isTermsPreview ? <Edit2 size={16} /> : <FileText size={16} />}
                                            <span className="text-[10px] font-black uppercase tracking-widest mb-0.5">
                                                {isTermsPreview ? 'Editar' : 'Mirar'}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                                
                                {termsLoading ? (
                                    <div className={`w-full ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'} border rounded-[28px] h-[300px] flex items-center justify-center`}>
                                        <Loader2 className="animate-spin text-blue-500/30" size={32} />
                                    </div>
                                ) : isTermsPreview ? (
                                    <div className={`w-full ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-100 text-zinc-800'} border rounded-[28px] px-8 py-8 min-h-[300px] prose prose-sm max-w-none shadow-inner`}>
                                        {/* Dynamic content from JSON */}

                                        {termsSections.length > 0 ? termsSections.map((sec, i) => {
                                            const isHeader = i === 0 && sec.title.includes('ENCABEZADO');
                                            const isFooter = i === termsSections.length - 1 && sec.title.includes('FIRMA');
                                            
                                            let displayContent = sec.content;
                                            
                                            if (isHeader) {
                                                const todayMonth = new Intl.DateTimeFormat('es-CL', { month: 'short', year: 'numeric' }).format(new Date());
                                                const autoTitle = `REGLAMENTO Y CONDICIONES - ${branding?.name?.toUpperCase() || (isTreasury ? 'EL COLEGIO' : 'LA ACADEMIA')}`;
                                                const autoVer = `Versión: ${tenantTerms?.version || '1.0'} (${todayMonth})`;
                                                displayContent = `# ${autoTitle}\n*${autoVer}*\n\n${sec.content}`;
                                            }
                                            
                                            if (isFooter) {
                                                const fullDate = new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
                                                const metaLine = `**Gestión Digital por:** ${branding?.name || 'Staff App'} | **Última actualización:** ${fullDate}\n**ID Registro Digital:** ${user?.tenant_id || '0'}`;
                                                displayContent = `${sec.content}\n\n${metaLine}`;
                                            }

                                            return (
                                                <div key={i} className="mb-8 last:mb-0">
                                                    {!isHeader && !isFooter && sec.title && (
                                                        <h3 className="text-lg font-black mb-3 text-indigo-500 uppercase tracking-tight">{sec.title}</h3>
                                                    )}
                                                    <div className="text-[13px] leading-relaxed font-medium whitespace-pre-wrap">
                                                        {renderMarkdown(displayContent)}
                                                    </div>
                                                </div>
                                            );
                                        }) : (
                                            <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
                                                <FileText size={48} className="mb-4" />
                                                <p className="text-[10px] uppercase font-black tracking-widest">Sin contenido</p>
                                            </div>
                                        )}

                                        {/* Dynamic footer from JSON */}
                                        <div 
                                            onClick={() => setShowSignatureModal(true)}
                                            className="mt-12 pt-8 border-t border-zinc-200/50 dark:border-zinc-800/50 flex flex-col items-center gap-4 text-center cursor-pointer group"
                                        >
                                            <div className={`p-3 rounded-2xl ${fingerprintCopied ? 'bg-green-500/10 border-green-500/30' : 'bg-zinc-100/50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'} border transition-all active:scale-95`}>
                                                {fingerprintCopied ? <CheckCircle2 className="text-green-500" size={24} /> : <Lock className="text-zinc-400 group-hover:text-blue-500 transition-colors" size={24} />}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 justify-center">
                                                    {fingerprintCopied ? <span className="text-green-500">¡Hash Copiado!</span> : <span>Certificación SHA-256</span>}
                                                </p>
                                                <p className="text-[9px] font-mono text-zinc-400 break-all max-w-[280px] group-hover:text-zinc-300 transition-colors">
                                                    {tenantTerms?.hash || '0x ESPERANDO PUBLICACIÓN...'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6 pb-4">
                                        {/* Editable list start */}

                                        {termsSections.map((sec, i) => {
                                            const isHeader = i === 0 && sec.title.includes('ENCABEZADO');
                                            const isFooter = i === termsSections.length - 1 && sec.title.includes('FIRMA');
                                            
                                            return (
                                                <div key={i} className={`relative group p-5 rounded-[40px] border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200 shadow-sm'} transition-all mb-6 last:mb-0`}>
                                                    {/* Row 1: Triple Metadata Pill */}
                                                    <div className="flex items-center justify-between mb-6">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-400'} text-[8px] font-black uppercase tracking-widest`}>
                                                                BLOQUE {i + 1}
                                                            </div>
                                                            <div className={`px-3 py-1 rounded-full border ${
                                                                isHeader ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                                                                isFooter ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                                                                'bg-zinc-700/50 border-zinc-600 text-zinc-300'
                                                            } text-[8px] font-black uppercase tracking-widest`}>
                                                                {isHeader ? 'ENCABEZADO' : isFooter ? 'FIRMA' : 'CONTENIDO'}
                                                            </div>
                                                            {isHeader && (
                                                                <div className={`px-3 py-1 rounded-full border ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-white border-zinc-200 text-zinc-400'} text-[8px] font-black uppercase tracking-widest`}>
                                                                    AUTO-VERSIÓN
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {(!isHeader && !isFooter) && (
                                                            <button onClick={() => removeTermsSection(i)}
                                                                className={`p-3 rounded-2xl ${isDark ? 'bg-zinc-950' : 'bg-white shadow-sm border border-zinc-100'} text-zinc-400 hover:text-rose-500 transition-all active:scale-90`}>
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Body Area */}
                                                    <div className="space-y-6">
                                                    
                                                    {isHeader ? (() => {
                                                        const { version: hVersion, intro: hIntro } = getHeaderParts(sec.content);
                                                        return (
                                                            <div className="space-y-4">
                                                                {/* Header Info Block */}
                                                                <div className={`p-5 rounded-3xl ${isDark ? 'bg-indigo-500/5' : 'bg-indigo-50'} border border-indigo-500/10 flex items-center justify-between`}>
                                                                    <div className="space-y-1">
                                                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Reglamento Oficial</p>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[8px] font-bold text-zinc-500 uppercase">Certificación v:</span>
                                                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded bg-white border border-zinc-100 dark:bg-zinc-950 dark:border-zinc-800 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                                                                V{tenantTerms?.version || '1.0'} {(tenantTerms?.version && parseFloat(tenantTerms.version) > 0) ? '' : '.0'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="p-3 rounded-2xl bg-white/50 dark:bg-black/20 border border-indigo-500/20">
                                                                        <ShieldCheck size={20} className="text-indigo-500" />
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <p className={`text-[9px] font-black ${isDark ? 'text-indigo-400' : 'text-indigo-500'} uppercase tracking-widest pl-1`}>INTRODUCCIÓN / DECLARACIÓN (EDITABLE)</p>
                                                                    <textarea 
                                                                        className={`w-full px-4 py-4 rounded-2xl border ${isDark ? 'bg-black border-zinc-700/50 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-600 shadow-inner'} text-[13px] font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 active:border-indigo-500/50 min-h-[140px] leading-relaxed resize-none transition-all`}
                                                                        value={hIntro}
                                                                        onChange={(e) => updateHeaderContent(i, { intro: e.target.value })}
                                                                        placeholder="Escribe la declaración inicial aquí..."
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })() : isFooter ? (() => {
                                                        return (
                                                            <div className="space-y-4">
                                                                {/* Digital Fingerprint Block */}
                                                                <div 
                                                                    onClick={() => setShowSignatureModal(true)}
                                                                    className={`p-6 rounded-[32px] ${isDark ? 'bg-zinc-950' : 'bg-white'} border border-dashed ${isDark ? 'border-zinc-700' : 'border-zinc-200'} flex flex-col items-center justify-center gap-4 cursor-pointer group active:scale-[0.98] transition-all`}
                                                                >
                                                                    <div className={`w-12 h-12 rounded-2xl ${fingerprintCopied ? 'bg-green-500/10 border-green-500/30' : (isDark ? 'bg-blue-500/10' : 'bg-blue-50')} flex items-center justify-center border ${fingerprintCopied ? '' : 'border-blue-500/20'} transition-colors`}>
                                                                        {fingerprintCopied ? <CheckCircle2 className="text-green-500" size={24} /> : <Lock className="text-blue-500 group-hover:scale-110 transition-transform" size={24} />}
                                                                    </div>
                                                                    <div className="text-center space-y-1">
                                                                        <p className="text-[10px] font-black tracking-widest leading-none uppercase">
                                                                            {fingerprintCopied ? <span className="text-green-500">¡Copiado al Portapapeles!</span> : <span className="text-zinc-500">SHA-256 (Huella de Integridad)</span>}
                                                                        </p>
                                                                        <div className="flex flex-col items-center gap-1 mt-2">
                                                                            <p className="text-[9px] font-mono text-zinc-400 break-all px-4 py-2 bg-zinc-500/5 rounded-xl border border-zinc-500/10 inline-block group-hover:border-blue-500/30 transition-colors">
                                                                                HASH: {tenantTerms?.hash ? tenantTerms.hash.substring(0, 32).toUpperCase() : '0x ESPERANDO PUBLICACIÓN...'}
                                                                            </p>
                                                                            <p className="text-[8px] font-black text-blue-500/40 uppercase tracking-tighter">Criptografía de 256 BITS</p>
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-[8px] font-medium text-zinc-400 italic text-center max-w-[220px]">
                                                                        Toca la huella para copiar el certificado completo. Valida que el documento corresponde a la versión v{tenantTerms?.version || 'X'}.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })() : (
                                                        <div className="space-y-5">
                                                            <div className="space-y-2">
                                                                <p className={`text-[9px] font-black ${isDark ? 'text-blue-400' : 'text-blue-500'} uppercase tracking-widest pl-1`}>TÍTULO DE SECCIÓN (EDITABLE)</p>
                                                                <input 
                                                                    type="text"
                                                                    placeholder="Ej: 1. RIESGOS Y SALUD"
                                                                    className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-black border-zinc-700 text-white' : 'bg-white border-zinc-100 text-zinc-950 shadow-inner'} text-[11px] font-black uppercase tracking-tight outline-none focus:ring-2 focus:ring-blue-500/20 transition-all`}
                                                                    value={sec.title}
                                                                    onChange={(e) => updateTermsSection(i, 'title', e.target.value)}
                                                                />
                                                            </div>

                                                            <div className="space-y-2">
                                                                <p className={`text-[9px] font-black ${isDark ? 'text-blue-400' : 'text-blue-500'} uppercase tracking-widest pl-1`}>CONTENIDO DE SECCIÓN (EDITABLE)</p>
                                                                <textarea 
                                                                    className={`w-full rounded-2xl border ${isDark ? 'bg-black border-zinc-700/50 text-zinc-300' : 'bg-white border-zinc-100 text-zinc-600 shadow-inner'} text-[13px] font-medium outline-none focus:ring-2 focus:ring-blue-500/20 active:border-blue-500/50 min-h-[160px] leading-relaxed resize-none p-4 transition-all`}
                                                                    placeholder="Escribe el contenido aquí..."
                                                                    value={sec.content}
                                                                    onChange={(e) => updateTermsSection(i, 'content', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Editable list end */}
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
