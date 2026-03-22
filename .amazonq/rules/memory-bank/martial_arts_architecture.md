# Arquitectura de Industria: martial_arts

Esta industria está diseñada para el mercado de academias de artes marciales (Dojos), donde el foco principal es el entrenamiento diario, la asistencia dinámica y el progreso de grados.

---

## 🥋 Conceptos y Vocabulario
| Término General | Término Martial Arts |
|-----------------|-------------------------|
| Lugar           | Dojo                    |
| Unidad          | Tatami                  |
| Miembro         | Alumno                  |
| Asistencia      | Marcar Tatami           |
| Categorías      | Infantil / Adulto      |

## 🏗️ Implementación de Lógica (Aislamiento)

Para evitar colisiones con otras industrias, se utiliza un sistema de **Hooks Especializados** y **Utilidades de Industria**.

### 1. Utilidades Compartidas (`src/lib/industryUtils.ts`)
- **`getBeltColor(label)`**: Mapea nombres de colores (Blanco, Azul, etc.) a clases CSS de Tailwind. Centraliza el diseño visual de los grados.
- **`formatStudentCategory(category, industry)`**: Formateador inteligente que distingue entre grados escolares y categorías deportivas.

### 2. Dashboard Home Staff (`OverviewSection.tsx`)
- **Fusión de Historial**: Se unificó la sección "Tatami Hoy" con el Historial Mensual. Las tarjetas diarias ahora centralizan toda la información de presencia.
- **Visor Interactivo**: Implementación de un pre-visor dinámico de alumnos que reacciona al toque de cada tarjeta, eliminando la necesidad de abrir modales para consultas rápidas.
- **Enfoque Operativo**: Se oculta la sección de horarios escolares (`TodaySchedule`) en contextos de artes marciales para mantener la interfaz centrada en la actividad del día.
- **Animaciones Premium**: Uso de entradas escalonadas (staggered) y curvas elásticas (`spring`) para transiciones de alta calidad táctil.

### 3. Hooks de Lógica Staff (`src/hooks/useMartialArtsData.ts`)
- Gestiona el historial de asistencia al Tatami.
- Implementa `toggleAttendance` con una **guarda estricta** (`industry === 'martial_arts'`) para evitar que la lógica especializada se dispare en contextos genéricos.

### 4. Orquestación Staff (`src/hooks/useAdminDashboard.ts`)
- Utiliza un patrón de **Ruteo Explícito** para la asistencia:
  ```typescript
  if (industry === 'martial_arts') {
      await martialArts.toggleAttendance(studentId, allStudents);
  } else {
      await common.toggleAttendance(studentId);
  }
  ```

### 4. Portal del Estudiante (Refinamiento Visual)
- **Home (`HomeMartialArts.tsx`)**: Foco en el registro de asistencia mediante QR y visualización del cinturón actual.
- **Perfil**: Muestra el nombre y color del grado de forma prominente.

---

## 🛡️ Garantía de Aislamiento
Cualquier modificación en los componentes dentro de `src/components/Dashboard/Industries/MartialArts/` o en el hook `useMartialArtsData.ts` **NO** afectará a la industria `school_treasury`, gracias a:
1.  Uso de props de vocabulario dinámico.
2.  Separación física de archivos de UI.
3.  Uso de funciones de utilidad puras e independientes.
