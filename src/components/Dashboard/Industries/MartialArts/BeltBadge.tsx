"use client";

import React from "react";
import { getBeltHex } from "@/lib/industryUtils";

interface BeltBadgeProps {
    beltRank: string;
    degrees?: number;
}

/**
 * Cinturón BJJ dibujado como SVG — se superpone en la esquina inferior de la foto.
 * Representa visualmente el cinturón con su color y rayas doradas.
 */
export function BeltBadge({ beltRank, degrees = 0 }: BeltBadgeProps) {
    if (!beltRank) return null;

    const hex = getBeltHex(beltRank);
    const isWhite = beltRank === "white";
    const beltStroke = isWhite ? "#d4d4d8" : "transparent";

    // Ancho total del SVG: 44px, alto: 14px
    // Cinturón: rectángulo principal + nudo central + rayas doradas a la derecha
    const W = 52;
    const H = 14;
    const tipW = 14;  // punta negra al extremo derecho
    const knotW = 10;
    const knotH = H;
    const knotX = 8;  // nudo cerca del extremo izquierdo (como cinturón real)
    const stripeW = 3;
    const stripeGap = 1.5;
    const stripeCount = Math.min(degrees, 4);

    return (
        <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: "block" }}
        >
            {/* Cuerpo del cinturón */}
            <rect x={0} y={2} width={W} height={H - 4} rx={4} fill={hex}
                stroke={beltStroke} strokeWidth={isWhite ? 0.8 : 0}
            />

            {/* Punta negra — extremo derecho */}
            <rect x={W - tipW} y={2} width={tipW} height={H - 4} rx={0} fill="#18181b" />
            {/* Redondear solo la esquina derecha de la punta */}
            <rect x={W - 4} y={2} width={4} height={H - 4} rx={3} fill="#18181b" />

            {/* Nudo central — rectángulo más alto */}
            <rect x={knotX} y={0} width={knotW} height={knotH} rx={2}
                fill={hex}
                stroke={isWhite ? "#c4c4c8" : "rgba(0,0,0,0.35)"}
                strokeWidth={0.8}
            />
            <line
                x1={knotX + 1} y1={H / 2} x2={knotX + knotW - 1} y2={H / 2}
                stroke={isWhite ? "#a1a1aa" : "rgba(0,0,0,0.4)"} strokeWidth={0.8}
            />

            {/* Rayas doradas sobre la punta negra */}
            {Array.from({ length: stripeCount }).map((_, i) => {
                const x = W - tipW + 2 + i * (stripeW + stripeGap);
                return (
                    <rect key={i} x={x} y={2} width={stripeW} height={H - 4} rx={0.5} fill="#c9a84c" />
                );
            })}
        </svg>
    );
}
