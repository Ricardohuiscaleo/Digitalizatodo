"use client";

import React from 'react';
import { User } from 'lucide-react';
import { BeltBadge } from './BeltBadge';

interface StudentAvatarProps {
    photo?: string | null;
    name?: string;
    size?: number;          // px — default 56 (w-14 h-14)
    ring?: string;          // tailwind ring classes
    beltRank?: string | null;
    degrees?: number;
    classesCount?: number;  // globito verde izquierda
    payerStatus?: string;   // 'paid' | 'review' | 'pending'
    showPayerDot?: boolean;
    isDark?: boolean;
    modality?: string | null; // 'gi' | 'nogi' | 'both'
}

export function StudentAvatar({
    photo,
    name = '',
    size = 56,
    ring,
    beltRank,
    degrees = 0,
    classesCount,
    payerStatus,
    showPayerDot = false,
    isDark = true,
    modality,
}: StudentAvatarProps) {
    const payerDot = payerStatus === 'paid'
        ? 'bg-emerald-500'
        : payerStatus === 'review'
        ? 'bg-amber-400'
        : 'bg-rose-500';

    const defaultRing = isDark ? 'ring-[#c9a84c] bg-zinc-700' : 'ring-amber-400 bg-zinc-100';
    const ringClass = ring ?? defaultRing;

    // El globito (16px) centrado sobre el borde del círculo:
    const DOT = 16;
    const half = DOT / 2;
    const ringPx = 4; // ring-4 se dibuja hacia afuera del div
    const offset = -(half + ringPx);

    return (
        <div className="relative inline-block">
            {/* Foto */}
            <div
                className={`rounded-full ring-4 shadow-sm flex-shrink-0 ${ringClass}`}
                style={{ width: size, height: size }}
            >
                <div className="w-full h-full rounded-full overflow-hidden">
                    {photo ? (
                        <img src={photo} className="w-full h-full object-cover" alt={name} />
                    ) : (
                        <div className={`w-full h-full flex items-center justify-center ${isDark ? 'text-zinc-500' : 'text-zinc-300'}`}>
                            <User size={size * 0.36} />
                        </div>
                    )}
                </div>
            </div>

            {/* Globito verde — clases (arriba izquierda) */}
            {classesCount != null && classesCount > 0 && (
                <div
                    className="absolute w-4 h-4 bg-emerald-500 border border-zinc-950 rounded-full flex items-center justify-center z-20 shadow-lg"
                    style={{ top: -2, left: -2 }}
                >
                    <span className="text-[7px] font-black text-black leading-none">{classesCount}</span>
                </div>
            )}

            {/* Modalidad Apple Watch Style — Curva Superior Derecha */}
            {modality && (
                <div 
                    className="absolute z-30"
                    style={{ top: -2, right: -2 }}
                >
                    <div className="px-1.5 py-0.5 bg-black border border-white/20 rounded-full shadow-lg scale-[0.9]">
                        <p className="text-[6px] font-black text-white uppercase tracking-tighter leading-none">
                            {modality === 'gi' ? 'GI' : modality === 'nogi' ? 'NOGI' : 'BOTH'}
                        </p>
                    </div>
                </div>
            )}

            {/* Globito dorado — grados (derecha centro) */}
            {degrees > 0 && (
                <div
                    className="absolute w-4 h-4 rounded-full bg-[#c9a84c] border border-zinc-900 flex items-center justify-center z-10"
                    style={{ top: size / 2 - half, right: offset }}
                >
                    <span className="text-[7px] font-black text-zinc-900 leading-none">{degrees}</span>
                </div>
            )}

            {/* BeltBadge — abajo centro */}
            {beltRank && (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-10">
                    <BeltBadge beltRank={beltRank} degrees={degrees} />
                </div>
            )}

            {/* Punto morosidad — abajo izquierda */}
            {showPayerDot && payerStatus && (
                <div className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2 border-zinc-900 z-20 ${payerDot}`} />
            )}
        </div>
    );
}
