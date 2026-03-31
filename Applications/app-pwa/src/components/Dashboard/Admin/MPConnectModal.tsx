import React, { useState } from 'react';
import { 
    X, 
    ShieldCheck, 
    AlertCircle, 
    CheckCircle2, 
    ExternalLink, 
    Loader2, 
    CreditCard,
    DollarSign
} from 'lucide-react';

interface MPConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDark: boolean;
    onConnect: () => void;
    loading: boolean;
}

export const MPConnectModal: React.FC<MPConnectModalProps> = ({ 
    isOpen, 
    onClose, 
    isDark, 
    onConnect,
    loading
}) => {
    const [accepted, setAccepted] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
            <div className={`w-full sm:max-w-lg rounded-t-[40px] sm:rounded-[48px] border shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-500 ${
                isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'
            }`}>
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80" />
                
                {/* Header */}
                <div className="px-6 pt-8 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                            <CreditCard className="text-indigo-500" size={24} />
                        </div>
                        <div>
                            <h4 className={`text-[17px] font-black uppercase tracking-tighter leading-none mb-1 ${isDark ? 'text-zinc-100' : 'text-zinc-950'}`}>
                                Pagos Automatizados
                            </h4>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Powered by Digitaliza Todo</p>
                        </div>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full transition-all active:scale-90 ${
                        isDark ? 'bg-zinc-950 text-zinc-600 hover:text-zinc-400' : 'bg-zinc-50 text-zinc-400 hover:text-zinc-600'
                    }`}>
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 py-4 flex-1 overflow-y-auto space-y-6 hide-scrollbar">
                    {/* INFO BOX: COMISIÓN */}
                    <div className={`p-5 rounded-[32px] border ${
                        isDark ? 'bg-zinc-950/50 border-zinc-800' : 'bg-indigo-50/50 border-indigo-100'
                    }`}>
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                                <DollarSign className="text-white" size={20} />
                            </div>
                            <div>
                                <h5 className={`text-[13px] font-black uppercase tracking-tight mb-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Transparencia en Comisiones</h5>
                                <p className={`text-[11px] font-medium leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                    Al activar los pagos automáticos, se aplicará un descuento total del <strong className={`font-black ${isDark ? 'text-white' : 'text-zinc-950'}`}>5%</strong> por cada transacción procesada con éxito.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* FEATURES */}
                    <div className="space-y-4">
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>¿Qué obtendrás?</p>
                        <div className="grid gap-3">
                            <div className="flex items-center gap-4 group">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all ${
                                    isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-100 border-emerald-200'
                                }`}>
                                    <ShieldCheck className="text-emerald-500" size={20} />
                                </div>
                                <p className={`text-[12px] font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>Liquidación directamente en tu cuenta</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                                    isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-100 border-blue-200'
                                }`}>
                                    <CheckCircle2 className="text-blue-500" size={20} />
                                </div>
                                <p className={`text-[12px] font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>Conciliación automática de suscripciones</p>
                            </div>
                        </div>
                    </div>

                    {/* TERMS */}
                    <div className="pt-2">
                        <label className={`flex items-start gap-4 p-5 rounded-[28px] cursor-pointer transition-all border group ${
                            accepted ? (isDark ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200') 
                                     : (isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100')
                        }`}>
                            <div className="relative flex items-center h-5 mt-0.5">
                                <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    checked={accepted} 
                                    onChange={() => setAccepted(!accepted)}
                                />
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                    accepted ? 'border-indigo-500 bg-indigo-500 shadow-lg shadow-indigo-500/20' : isDark ? 'border-zinc-700 bg-zinc-900 group-hover:border-zinc-500' : 'border-zinc-300 bg-white group-hover:border-indigo-400'
                                }`}>
                                    {accepted && <CheckCircle2 className="text-white" size={14} />}
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className={`text-[12px] font-bold leading-tight ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                                    Acepto la <a href="https://digitalizatodo.cl/terminos/" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline decoration-indigo-500/30 underline-offset-4">Comisión</a>, <a href="https://digitalizatodo.cl/legal/" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline decoration-indigo-500/30 underline-offset-4">Legal</a> y <a href="https://digitalizatodo.cl/privacidad/" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline decoration-indigo-500/30 underline-offset-4">Privacidad</a> de Digitaliza Todo.
                                </p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="px-6 pt-2 pb-8">
                    <button
                        onClick={onConnect}
                        disabled={!accepted || loading}
                        className={`w-full h-16 rounded-[24px] flex items-center justify-center gap-3 text-[14px] font-black uppercase tracking-[0.15em] transition-all shadow-xl active:scale-[0.98] disabled:opacity-30 disabled:scale-100 ${
                            isDark ? 'bg-white text-zinc-950 shadow-white/5' : 'bg-zinc-950 text-white shadow-zinc-950/20'
                        }`}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                                Conectar con Digitaliza Todo
                                <ExternalLink size={18} />
                            </>
                        )}
                    </button>
                    <p className="text-center text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-4 opacity-40">
                        Proceso seguro vía protocolo OAuth 2.0
                    </p>
                </div>
            </div>
        </div>
    );
};
