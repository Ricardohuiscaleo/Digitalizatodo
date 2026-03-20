export const industryConfig: Record<string, { 
    attendance: string; 
    cat1: string; 
    cat2: string; 
    memberLabel: string; 
    placeLabel: string;
    unitLabel: string;
}> = {
    school_treasury: { 
        attendance: 'Asistencia', 
        cat1: 'Mensualidad', 
        cat2: 'Matrícula', 
        memberLabel: 'Alumno', 
        placeLabel: 'Colegio',
        unitLabel: 'Curso'
    },
    martial_arts: { 
        attendance: 'Tatami', 
        cat1: 'Kids', 
        cat2: 'Adultos', 
        memberLabel: 'Alumno', 
        placeLabel: 'Dojo',
        unitLabel: 'Tatami'
    },
    clinic: { 
        attendance: 'Box', 
        cat1: 'Consulta', 
        cat2: 'Procedimiento', 
        memberLabel: 'Paciente', 
        placeLabel: 'Clínica',
        unitLabel: 'Box'
    },
    education: { 
        attendance: 'Aula', 
        cat1: 'Taller', 
        cat2: 'Curso', 
        memberLabel: 'Alumno', 
        placeLabel: 'Centro',
        unitLabel: 'Aula'
    },
    fitness: { 
        attendance: 'Clase', 
        cat1: 'Mensual', 
        cat2: 'Trimestral', 
        memberLabel: 'Socio', 
        placeLabel: 'Gimnasio',
        unitLabel: 'Sala'
    },
    dance: { 
        attendance: 'Sala', 
        cat1: 'Infantil', 
        cat2: 'Adultos', 
        memberLabel: 'Alumno', 
        placeLabel: 'Academia',
        unitLabel: 'Sala'
    },
    music: { 
        attendance: 'Sala', 
        cat1: 'Individual', 
        cat2: 'Grupal', 
        memberLabel: 'Alumno', 
        placeLabel: 'Escuela',
        unitLabel: 'Sala'
    },
    default: { 
        attendance: 'Clase', 
        cat1: 'Categoría 1', 
        cat2: 'Categoría 2', 
        memberLabel: 'Miembro', 
        placeLabel: 'Clientes',
        unitLabel: 'Unidad'
    },
};
