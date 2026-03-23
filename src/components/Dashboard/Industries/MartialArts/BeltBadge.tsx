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
    const W = 44;
    const H = 14;
    const knotW = 10; // ancho del nudo central
    const knotH = H;
    const stripeW = 4;
    const stripeGap = 1;
    const stripeCount = Math.min(degrees, 4);

    // Zona de rayas: al extremo derecho del cinturón
    const stripesZoneW = stripeCount > 0 ? stripeCount * stripeW + (stripeCount - 1) * stripeGap + 2 : 0;

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
            <rect
                x={0} y={2} width={W} height={H - 4}
                rx={4}
                fill={hex}
                stroke={beltStroke}
                strokeWidth={isWhite ? 0.8 : 0}
            />

            {/* Nudo central — rectángulo más alto con borde oscuro */}
            <rect
                x={(W - knotW) / 2} y={0}
                width={knotW} height={knotH}
                rx={2}
                fill={hex}
                stroke={isWhite ? "#c4c4c8" : "rgba(0,0,0,0.35)"}
                strokeWidth={0.8}
            />
            {/* Línea horizontal del nudo */}
            <line
                x1={(W - knotW) / 2 + 1} y1={H / 2}
                x2={(W + knotW) / 2 - 1} y2={H / 2}
                stroke={isWhite ? "#a1a1aa" : "rgba(0,0,0,0.4)"}
                strokeWidth={0.8}
            />

            {/* Rayas doradas — extremo derecho */}
            {stripeCount > 0 && Array.from({ length: stripeCount }).map((_, i) => {
                const x = W - stripesZoneW + 1 + i * (stripeW + stripeGap);
                return (
                    <rect
                        key={i}
                        x={x} y={2}
                        width={stripeW} height={H - 4}
                        rx={1}
                        fill="#c9a84c"
                    />
                );
            })}
        </svg>
    );
}
