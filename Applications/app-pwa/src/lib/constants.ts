export const industryConfig: Record<string, { 
    attendance: string; 
    cat1: string; 
    cat2: string; 
    memberLabel: string; 
    placeLabel: string;
    unitLabel: string;
    settingsTitle: string;
    profileDescription: string;
    registrationLinkTitle: string;
    scheduleTitle: string;
}> = {
    school_treasury: { 
        attendance: 'Asistencia', 
        cat1: 'Mensualidad', 
        cat2: 'Matrícula', 
        memberLabel: 'Alumno', 
        placeLabel: 'Colegio',
        unitLabel: 'Curso',
        settingsTitle: 'Ajustes Institución',
        profileDescription: 'Sistemas a medida para gestión financiera escolar.',
        registrationLinkTitle: 'Inscripción Escolar',
        scheduleTitle: 'Horarios / Talleres'
    },
    martial_arts: { 
        attendance: 'Tatami', 
        cat1: 'Kids', 
        cat2: 'Adultos', 
        memberLabel: 'Alumno', 
        placeLabel: 'Dojo',
        unitLabel: 'Tatami',
        settingsTitle: 'Configuración Dojo',
        profileDescription: 'Sistemas a medida para academias de alto rendimiento.',
        registrationLinkTitle: 'Página de Registro Público',
        scheduleTitle: 'Horarios Dojo'
    },
    default: { 
        attendance: 'Clase', 
        cat1: 'Categoría 1', 
        cat2: 'Categoría 2', 
        memberLabel: 'Miembro', 
        placeLabel: 'Clientes',
        unitLabel: 'Unidad',
        settingsTitle: 'Ajustes de Cuenta',
        profileDescription: 'Sistemas a medida para la gestión de tu negocio.',
        registrationLinkTitle: 'Página de Registro Público',
        scheduleTitle: 'Horarios'
    },
};
