"use client";

import React from "react";
import { getBeltHex, getBeltLabel } from "@/lib/industryUtils";

interface BeltDisplayProps {
    beltRank: string;       // 'white' | 'blue' | 'purple' | 'brown' | 'black'
    degrees?: number;       // 0-4 rayas
    size?: "sm" | "md";    // sm = tabla/card compacto, md = perfil
}

/**
 * Visualización de cinturón BJJ con rayas reales.
 * Muestra una barra del color del cinturón con ticks dorados para las rayas.
 */
export function BeltDisplay({ beltRank, degrees = 0, size = "sm" }: BeltDisplayProps) {
    if (!beltRank) return null;

    const hex = getBeltHex(beltRank);
    const label = getBeltLabel(beltRank);
    const isWhite = beltRank === 'white' || beltRank.toLowerCase().includes('blanco');
    const textColor = isWhite ? '#71717a' : '#fff';

    const barH = size === "md" ? "h-5" : "h-3.5";
    const textSize = size === "md" ? "text-[10px]" : "text-[8px]";
    const stripeW = size === "md" ? "w-3" : "w-2";

    return (
        <div className="flex items-center gap-2">
            {/* Barra del cinturón */}
            <div
                className={`relative flex items-center rounded-full overflow-hidden ${barH} ${size === "md" ? "w-28" : "w-20"} shrink-0`}
                style={{ backgroundColor: hex, border: isWhite ? '1px solid #d4d4d8' : 'none' }}
            >
                {/* Rayas doradas al extremo derecho (Máximo 4 visualmente) */}
                {degrees > 0 && (
                    <div className="absolute right-0 top-0 bottom-0 flex items-stretch">
                        {Array.from({ length: Math.min(degrees, 4) }).map((_, i) => (
                            <div
                                key={i}
                                className={`${stripeW} h-full bg-[#c9a84c]`}
                                style={{ marginLeft: i === 0 ? 1 : 0.5 }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Label */}
            <span className={`${textSize} font-black uppercase tracking-widest text-zinc-500 leading-none flex items-center gap-1`}>
                {label}{degrees > 0 ? (degrees === 5 ? ' · 🎓' : ` · ${degrees}★`) : ''}
            </span>
        </div>
    );
}
