/**
 * Utilidades compartidas para la industria de Artes Marciales
 */

// Acepta belt_rank (en inglés: 'white','blue',...) o label en español ('Blanco','Azul',...)
export const getBeltColor = (label: string) => {
    const lower = (label || '').toLowerCase();
    if (lower === 'white' || lower.includes('blanco')) return 'bg-zinc-100 text-zinc-900 border-zinc-200';
    if (lower === 'grey' || lower === 'gray' || lower.includes('gris')) return 'bg-zinc-400 text-white';
    if (lower === 'blue' || lower.includes('azul')) return 'bg-blue-600 text-white';
    if (lower === 'purple' || lower.includes('morado')) return 'bg-purple-600 text-white';
    if (lower === 'brown' || lower.includes('marron') || lower.includes('marrón') || lower.includes('café')) return 'bg-amber-900 text-white';
    if (lower === 'black' || lower.includes('negro')) return 'bg-zinc-900 text-white';
    if (lower.includes('amarillo')) return 'bg-yellow-400 text-zinc-900';
    if (lower.includes('naranja')) return 'bg-orange-500 text-white';
    if (lower.includes('verde')) return 'bg-emerald-600 text-white';
    if (lower.includes('rojo')) return 'bg-rose-600 text-white';
    return 'bg-zinc-100 text-zinc-500';
};

const BELT_LABELS: Record<string, string> = {
    white: 'Blanco', 
    grey: 'Gris', gray: 'Gris',
    yellow: 'Amarillo',
    orange: 'Naranja',
    green: 'Verde',
    blue: 'Azul', 
    purple: 'Morado', 
    brown: 'Marrón', marron: 'Marrón', 'marrón': 'Marrón', café: 'Marrón', cafe: 'Marrón',
    black: 'Negro',
    red: 'Rojo',
};

// Devuelve el label en español dado belt_rank en inglés o ya en español
export const getBeltLabel = (beltRank: string): string => {
    const lower = (beltRank || '').toLowerCase();
    return BELT_LABELS[lower] ?? beltRank;
};

// Colores CSS puros para el cinturón (sin Tailwind) — para uso en style=
export const getBeltHex = (beltRank: string): string => {
    const lower = (beltRank || '').toLowerCase();
    if (lower === 'white' || lower.includes('blanco')) return '#e4e4e7';
    if (lower === 'grey' || lower === 'gray' || lower.includes('gris')) return '#9ca3af';
    if (lower.includes('amarillo')) return '#facc15';
    if (lower.includes('naranja')) return '#f97316';
    if (lower.includes('verde')) return '#059669';
    if (lower === 'blue' || lower.includes('azul')) return '#2563eb';
    if (lower === 'purple' || lower.includes('morado')) return '#9333ea';
    if (lower === 'brown' || lower.includes('marron') || lower.includes('marrón') || lower.includes('café')) return '#78350f';
    if (lower === 'black' || lower.includes('negro')) return '#18181b';
    if (lower.includes('rojo')) return '#e11d48';
    return '#e4e4e7';
};

// Tabla de graduación Alliance BJJ — fuente de verdad compartida
export const ALLIANCE_BJJ_GRADUATION = [
    { id: 'Blanco',   name: 'Blanco', totalClasses: 150, classesPerStripe: 30,  stripes: 4, category: 'both' },
    { id: 'Gris',     name: 'Gris',   totalClasses: 80,  classesPerStripe: 20,  stripes: 4, category: 'kids' },
    { id: 'Amarillo', name: 'Amarillo', totalClasses: 100, classesPerStripe: 25,  stripes: 4, category: 'kids' },
    { id: 'Naranja',  name: 'Naranja',  totalClasses: 120, classesPerStripe: 30,  stripes: 4, category: 'kids' },
    { id: 'Verde',    name: 'Verde',    totalClasses: 140, classesPerStripe: 35,  stripes: 4, category: 'kids' },
    { id: 'Azul',     name: 'Azul',   totalClasses: 325, classesPerStripe: 65,  stripes: 4, category: 'both' },
    { id: 'Morado',   name: 'Morado', totalClasses: 375, classesPerStripe: 75,  stripes: 4, category: 'adults' },
    { id: 'Marrón',   name: 'Marrón', totalClasses: 375, classesPerStripe: 75,  stripes: 4, category: 'adults' },
    { id: 'Negro',    name: 'Negro',  totalClasses: null, classesPerStripe: null, stripes: null, category: 'adults' },
] as const;

const BELT_ORDER_KIDS = ['Blanco', 'Gris', 'Amarillo', 'Naranja', 'Verde', 'Azul'];
const BELT_ORDER_ADULTS = ['Blanco', 'Azul', 'Morado', 'Marrón', 'Negro'];

/** Calcula el progreso de un alumno hacia el siguiente nivel */
export function calcBeltProgress(beltRank: string, degrees: number, beltClassesAtPromotion: number, totalAttendances: number, category: string = 'adults') {
    const normalizedRank = getBeltLabel(beltRank);
    const beltData = ALLIANCE_BJJ_GRADUATION.find(b => b.id === normalizedRank);
    if (!beltData || beltData.totalClasses === null) return null;
    const belt = beltData as { id: string; name: string; totalClasses: number; classesPerStripe: number | null; stripes: number | null };

    // Clases reales en este cinturón (desde la última promoción digital)
    const realClassesInBelt = Math.max(0, totalAttendances - beltClassesAtPromotion);
    
    // Clases VIRTUALES: Si el alumno ya tiene grados manuales (existen records previos), 
    // asumimos que ya "pagó" las clases correspondientes a esos grados.
    let virtualClassesFromStripes = (degrees ?? 0) * (belt.classesPerStripe ?? 0);
    if (degrees >= 5) virtualClassesFromStripes = belt.totalClasses;
    
    // Total efectivo = Clases virtuales + Clases reales registradas
    const totalEffectiveClasses = virtualClassesFromStripes + realClassesInBelt;
    
    const beltOrder = category === 'kids' ? BELT_ORDER_KIDS : BELT_ORDER_ADULTS;
    const nextBeltIdx = beltOrder.indexOf(beltRank) + 1;
    const nextBeltName = nextBeltIdx < beltOrder.length ? beltOrder[nextBeltIdx] : null;
    const nextBelt = nextBeltName ? ALLIANCE_BJJ_GRADUATION.find(b => b.id === nextBeltName) : null;

    // Milestone actual y siguiente
    // El 5to estado es visualmente 4 rayas + Ready
    const currentStripe = Math.min(4, Math.floor(totalEffectiveClasses / (belt.classesPerStripe ?? 1)));
    const classesForNextMilestone = belt.classesPerStripe 
        ? (currentStripe < 4 
            ? (currentStripe + 1) * belt.classesPerStripe 
            : belt.totalClasses)
        : belt.totalClasses;

    const remainingForNext = Math.max(0, classesForNextMilestone - totalEffectiveClasses);
    const isReadyForBelt = totalEffectiveClasses >= belt.totalClasses;

    // Porcentaje de progreso hacia el PRÓXIMO hito (raya o cinturón)
    const milestoneStart = currentStripe * (belt.classesPerStripe ?? 0);
    const milestoneEnd = classesForNextMilestone;
    const progressInMilestone = totalEffectiveClasses - milestoneStart;
    const milestoneRange = milestoneEnd - milestoneStart;
    const progressPct = milestoneRange > 0 ? Math.min(100, Math.round((progressInMilestone / milestoneRange) * 100)) : 100;

    return {
        classesInBelt: totalEffectiveClasses, // Devolvemos el total efectivo para la UI
        totalForBelt: belt.totalClasses,
        classesPerStripe: belt.classesPerStripe,
        classesInCurrentStripe: progressInMilestone,
        currentStripe,
        nextStripe: currentStripe < 4 ? currentStripe + 1 : null,
        progressPct,
        nextBeltName: nextBelt?.name ?? null,
        isReadyForBelt,
        isReadyForPromotion: isReadyForBelt, 
        classesForPromotion: Math.max(0, belt.totalClasses - totalEffectiveClasses),
        classesForNextStripe: remainingForNext,
    };
}

/** Clases desde la última rayita — para el globito verde del StudentAvatar */
export function getClassesSinceLastStripe(student: {
    belt_rank?: string | null;
    previous_classes?: number;
    degrees?: number;
}, totalHistoryClasses: number): number | null {
    const normalizedRank = getBeltLabel(student.belt_rank || '');
    const beltData = ALLIANCE_BJJ_GRADUATION.find(b => b.id === normalizedRank);
    if (!beltData || beltData.classesPerStripe === null) return null;
    // previous_classes = clases desde la última raya (ingresadas por el profe)
    // totalHistoryClasses = clases registradas en el sistema
    return (student.previous_classes ?? 0) + totalHistoryClasses;
}

export const formatStudentCategory = (category: string | undefined, industry: string | undefined, defaultLabel: string = '') => {
    if (!category) return defaultLabel;
    
    if (industry === 'school_treasury') {
        const l = category.toLowerCase();
        if (l === 'prekinder') return 'Pre-Kinder';
        if (l === 'kinder') return 'Kinder';
        const m = category.match(/^(\d+)_(.+)$/);
        if (m) return `${m[1]}° ${m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase()}`;
        return category.replace(/_/g, ' ');
    }

    // Default or Martial Arts
    if (category.toLowerCase() === 'kids') return 'Infantil';
    if (category.toLowerCase() === 'adult') return 'Adulto';
    return category.replace(/_/g, ' ');
};
