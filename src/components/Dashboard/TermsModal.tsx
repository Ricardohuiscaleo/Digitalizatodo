"use client";

import React from 'react';
import { ShieldCheck, ArrowRight, ExternalLink, Lock } from 'lucide-react';

interface TermsModalProps {
    isOpen: boolean;
    onAccept: () => void;
    primaryColor?: string;
}

export default function TermsModal({ isOpen, onAccept, primaryColor = '#6366f1' }: TermsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-zinc-100">
                
                {/* Header */}
                <div className="relative p-8 text-center space-y-4">
                    <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto rotate-3 shadow-sm" style={{ backgroundColor: `${primaryColor}15` }}>
                        <ShieldCheck size={40} style={{ color: primaryColor }} />
                    </div>
                    
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-zinc-900 leading-none">
                            Actualización de <br/> <span style={{ color: primaryColor }}>Términos y Privacidad</span>
                        </h2>
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest px-4">
                            Necesitamos tu confirmación para continuar volando juntos.
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 pb-4 space-y-4">
                    <div className="bg-zinc-50 rounded-2xl p-4 space-y-3 border border-zinc-100">
                        <p className="text-[10px] font-bold text-zinc-500 leading-relaxed">
                            Al continuar utilizando nuestra plataforma SaaS, confirmas que has leído y aceptas nuestras políticas actualizadas para garantizar la seguridad de tus datos y la mejor experiencia de servicio.
                        </p>
                        
                        <div className="flex flex-col gap-2 pt-2">
                            <a 
                                href="https://digitalizatodo.cl/terminos" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3 bg-white rounded-xl border border-zinc-100 hover:border-indigo-200 transition-all group"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-700">Términos del Servicio</span>
                                </div>
                                <ExternalLink size={12} className="text-zinc-300 group-hover:text-indigo-400 transition-colors" />
                            </a>
                            
                            <a 
                                href="https://digitalizatodo.cl/privacidad" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3 bg-white rounded-xl border border-zinc-100 hover:border-indigo-200 transition-all group"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-700">Política de Privacidad</span>
                                </div>
                                <ExternalLink size={12} className="text-zinc-300 group-hover:text-indigo-400 transition-colors" />
                            </a>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 px-2 py-1">
                        <div className="bg-amber-100 p-2 rounded-lg">
                            <Lock size={14} className="text-amber-600" />
                        </div>
                        <p className="text-[9px] font-bold text-zinc-400 italic">
                            Tus datos y los de tus alumnos están protegidos por la Ley 19.628 de Protección de la Vida Privada.
                        </p>
                    </div>

                </div>

                {/* Button */}
                <div className="p-8 pt-4">
                    <button
                        onClick={onAccept}
                        className="w-full h-16 bg-zinc-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-xl shadow-zinc-200"
                        style={{ backgroundColor: primaryColor }}
                    >
                        Aceptar y Continuar <ArrowRight size={18} />
                    </button>
                    <p className="text-[8px] text-center font-black text-zinc-300 uppercase tracking-widest mt-6">
                        Digitaliza Todo Engine &copy; 2026
                    </p>
                </div>

            </div>
        </div>
    );
}
