"use client";

import React from "react";
import { Trash2, X } from "lucide-react";

/* ─── Confirm Dialog ─── */
interface ConfirmDialogProps {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({ title, message, onConfirm, onCancel }: ConfirmDialogProps) {
    return (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={onCancel}>
            <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
                    <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <div className="text-center">
                    <h3 className="text-base font-black text-zinc-900">{title}</h3>
                    <p className="text-xs text-zinc-400 mt-1">{message}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="flex-1 h-11 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all">Cancelar</button>
                    <button onClick={onConfirm} className="flex-1 h-11 bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all">Eliminar</button>
                </div>
            </div>
        </div>
    );
}

/* ─── Payment Proof Modal ─── */
interface ProofModalProps {
    url: string;
    canDelete: boolean;
    onClose: () => void;
    onDelete?: () => void;
}

export function ProofModal({ url, canDelete, onClose, onDelete }: ProofModalProps) {
    return (
        <div
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div className="relative max-w-sm w-full space-y-3" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute -top-4 -right-4 z-10 w-9 h-9 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                    <X className="w-4 h-4" />
                </button>
                <div className="rounded-3xl overflow-hidden border border-white/10">
                    <img src={url} alt="Comprobante de pago" className="w-full object-contain max-h-[60vh]" />
                </div>
                {/* Footer con acciones */}
                <div className="flex gap-2">
                    {canDelete && onDelete && (
                        <button
                            onClick={onDelete}
                            className="flex-1 h-12 bg-red-500/20 border border-red-500/30 text-red-400 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/30 transition-all"
                        >
                            <Trash2 size={14} /> Eliminar comprobante
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className={`${canDelete ? '' : 'flex-1'} h-12 bg-white/10 border border-white/20 text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all ${canDelete ? 'flex-1' : 'w-full'}`}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
