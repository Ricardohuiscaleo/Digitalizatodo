/**
 * Utilidades compartidas para la industria de Artes Marciales
 */

export const getBeltColor = (label: string) => {
    const lower = (label || '').toLowerCase();
    if (lower.includes('blanco')) return 'bg-zinc-100 text-zinc-900 border-zinc-200';
    if (lower.includes('azul')) return 'bg-blue-600 text-white';
    if (lower.includes('morado')) return 'bg-purple-600 text-white';
    if (lower.includes('marron') || lower.includes('marrón')) return 'bg-amber-900 text-white';
    if (lower.includes('negro')) return 'bg-zinc-900 text-white';
    if (lower.includes('amarillo')) return 'bg-yellow-400 text-zinc-900';
    if (lower.includes('naranja')) return 'bg-orange-500 text-white';
    if (lower.includes('verde')) return 'bg-emerald-600 text-white';
    if (lower.includes('rojo')) return 'bg-rose-600 text-white';
    return 'bg-zinc-100 text-zinc-500';
};

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
