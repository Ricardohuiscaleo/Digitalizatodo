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
    industry?: string;       // 'martial_arts' | 'school_treasury'
    checkedIn?: boolean;
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
    industry = 'martial_arts',
    checkedIn = false,
}: StudentAvatarProps) {
    const payerDot = payerStatus === 'paid'
        ? 'bg-emerald-500'
        : payerStatus === 'review'
        ? 'bg-amber-400'
        : 'bg-rose-500';

    const defaultRing = checkedIn 
        ? 'ring-emerald-500 bg-emerald-500/10' 
        : isDark ? 'ring-[#c9a84c] bg-zinc-700' : 'ring-amber-400 bg-zinc-100';
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
                    {photo && !photo.includes('unsplash.com') ? (
                        <img src={photo} className="w-full h-full object-cover" alt={name} />
                    ) : (
                        <div className={`w-full h-full flex items-center justify-center font-black uppercase tracking-tighter ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-500'}`}
                             style={{ fontSize: size * 0.4 }}
                        >
                            {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                    )}
                </div>
            </div>

            {/* Globito verde — clases (arriba izquierda) */}
            {classesCount != null && classesCount > 0 && (
                <div
                    className="absolute bg-emerald-500 border border-zinc-950 rounded-full flex items-center justify-center z-20 shadow-lg"
                    style={{ 
                        width: Math.max(14, size * 0.25),
                        height: Math.max(14, size * 0.25),
                        top: -(Math.max(14, size * 0.25) / 5), 
                        left: -(Math.max(14, size * 0.25) / 5) 
                    }}
                >
                    <span 
                        className="font-black text-black leading-none"
                        style={{ fontSize: Math.max(7, size / 10) }}
                    >{classesCount}</span>
                </div>
            )}

            {/* Modalidad Apple Watch Style — Curva Superior Derecha */}
            {modality && (
                <div 
                    className="absolute z-30 flex items-center justify-center bg-black border border-white/20 rounded-full shadow-lg overflow-hidden"
                    style={{ 
                        top: -size * 0.05, 
                        right: -size * 0.05,
                        padding: `${size * 0.04}px ${size * 0.08}px`,
                        minWidth: size * 0.25
                    }}
                >
                    <p 
                        className="font-black text-white uppercase tracking-widest leading-none text-center"
                        style={{ fontSize: Math.max(6, size / 12) }}
                    >
                        {modality === 'gi' ? 'GI' : modality === 'nogi' ? 'NOGI' : 'BOTH'}
                    </p>
                </div>
            )}

            {/* Globito dorado — grados (derecha centro) */}
            {industry === 'martial_arts' && degrees >= 0 && (
                <div
                    className="absolute rounded-full bg-[#c9a84c] border border-zinc-900 flex items-center justify-center z-10 shadow-lg"
                    style={{ 
                        width: Math.max(14, size * 0.25),
                        height: Math.max(14, size * 0.25),
                        top: (size / 2) - (Math.max(14, size * 0.25) / 2),
                        right: -(Math.max(14, size * 0.25) / 2.5) 
                    }}
                >
                    <span 
                        className="font-black text-zinc-900 leading-none"
                        style={{ fontSize: degrees === 5 ? Math.max(9, size / 8) : Math.max(7, size / 10) }}
                    >{degrees === 5 ? '🎓' : degrees}</span>
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
