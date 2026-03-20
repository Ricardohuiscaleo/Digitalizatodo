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
    showInactivePayers: boolean;
    setShowInactivePayers: (v: boolean) => void;
    loadingSync: boolean;
    forceSync: () => void;
    handleLogout: () => void;
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
    showInactivePayers,
    setShowInactivePayers,
    loadingSync,
    forceSync,
    handleLogout
}) => {
    const [copied, setCopied] = useState(false);

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
