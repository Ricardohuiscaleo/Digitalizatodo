/**
 * Utilidades compartidas para la industria de Artes Marciales
 */

// Acepta belt_rank (en inglés: 'white','blue',...) o label en español ('Blanco','Azul',...)
export const getBeltColor = (label: string) => {
    const lower = (label || '').toLowerCase();
    if (lower === 'white' || lower.includes('blanco')) return 'bg-zinc-100 text-zinc-900 border-zinc-200';
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
    white: 'Blanco', blue: 'Azul', purple: 'Morado', brown: 'Café', black: 'Negro',
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
    if (lower === 'blue' || lower.includes('azul')) return '#2563eb';
    if (lower === 'purple' || lower.includes('morado')) return '#9333ea';
    if (lower === 'brown' || lower.includes('marron') || lower.includes('café')) return '#78350f';
    if (lower === 'black' || lower.includes('negro')) return '#18181b';
    return '#e4e4e7';
};

// Tabla de graduación Alliance BJJ — fuente de verdad compartida
export const ALLIANCE_BJJ_GRADUATION = [
    { id: 'white',  name: 'Blanco', totalClasses: 150, classesPerStripe: 30,  stripes: 4 },
    { id: 'blue',   name: 'Azul',   totalClasses: 325, classesPerStripe: 65,  stripes: 4 },
    { id: 'purple', name: 'Morado', totalClasses: 375, classesPerStripe: 75,  stripes: 4 },
    { id: 'brown',  name: 'Café',   totalClasses: 375, classesPerStripe: 75,  stripes: 4 },
    { id: 'black',  name: 'Negro',  totalClasses: null, classesPerStripe: null, stripes: null },
] as const;

const BELT_ORDER = ['white', 'blue', 'purple', 'brown', 'black'] as const;

/** Calcula el progreso de un alumno hacia el siguiente nivel */
export function calcBeltProgress(beltRank: string, degrees: number, beltClassesAtPromotion: number, totalAttendances: number) {
    const beltData = ALLIANCE_BJJ_GRADUATION.find(b => b.id === beltRank);
    if (!beltData || beltData.totalClasses === null) return null;
    const belt = beltData as { id: string; name: string; totalClasses: number; classesPerStripe: number | null; stripes: number | null };

    const classesInBelt = Math.max(0, totalAttendances - beltClassesAtPromotion);
    const nextBeltIdx = BELT_ORDER.indexOf(beltRank as any) + 1;
    const nextBelt = nextBeltIdx < ALLIANCE_BJJ_GRADUATION.length ? ALLIANCE_BJJ_GRADUATION[nextBeltIdx] : null;

    // Raya actual calculada por clases (no la manual del staff)
    const currentStripe = belt.classesPerStripe ? Math.min(4, Math.floor(classesInBelt / belt.classesPerStripe)) : 0;
    const classesInCurrentStripe = belt.classesPerStripe ? classesInBelt % belt.classesPerStripe : 0;
    const classesForNextStripe = belt.classesPerStripe ? belt.classesPerStripe - classesInCurrentStripe : null;
    const nextStripe = currentStripe + 1;
    const isReadyForBelt = classesInBelt >= belt.totalClasses;

    // Progreso hacia la PRÓXIMA RAYA (no el cinturón completo)
    const progressPct = belt.classesPerStripe
        ? Math.min(100, Math.round((classesInCurrentStripe / belt.classesPerStripe) * 100))
        : Math.min(100, Math.round((classesInBelt / (belt.totalClasses ?? 1)) * 100));

    return {
        classesInBelt,
        totalForBelt: belt.totalClasses,
        classesPerStripe: belt.classesPerStripe,
        classesInCurrentStripe,
        classesForNextStripe,
        currentStripe,
        nextStripe: nextStripe <= 4 ? nextStripe : null,
        progressPct,
        nextBeltName: nextBelt?.name ?? null,
        isReadyForBelt,
        isReadyForPromotion: isReadyForBelt, // alias para compatibilidad
        classesForPromotion: Math.max(0, belt.totalClasses - classesInBelt),
    };
}

/** Clases desde la última rayita — para el globito verde del StudentAvatar */
export function getClassesSinceLastStripe(student: {
    belt_rank?: string | null;
    previous_classes?: number;
    degrees?: number;
}, totalHistoryClasses: number): number | null {
    const belt = (student.belt_rank || '').toLowerCase();
    const beltData = ALLIANCE_BJJ_GRADUATION.find(b => b.id === belt);
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
