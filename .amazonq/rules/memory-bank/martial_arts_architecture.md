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
- **`getClassesSinceLastStripe(student, totalHistoryClasses)`**: Calcula clases desde la última raya según sistema BJJ Alliance. Retorna `null` para negro (sin límite). Fórmula: `(previous_classes + historial - belt_classes_at_promotion) % classesPerStripe`.
- **`ALLIANCE_BJJ_GRADUATION`**: Tabla de graduación BJJ Alliance — Blanco: 30 clases/raya (150 total), Azul: 65/raya (325 total), Morado: 75/raya (375 total), Café: 75/raya (375 total), Negro: criterio del profesor.

### 2. Dashboard Home Staff (`OverviewSection.tsx`)
- **Fusión de Historial**: Se unificó la sección "Tatami Hoy" con el Historial Mensual. Las tarjetas diarias ahora centralizan toda la información de presencia.
- **Visor Interactivo**: Implementación de un pre-visor dinámico de alumnos que reacciona al toque de cada tarjeta, eliminando la necesidad de abrir modales para consultas rápidas.
- **Enfoque Operativo**: Se oculta la sección de horarios escolares (`TodaySchedule`) en contextos de artes marciales para mantener la interfaz centrada en la actividad del día.
- **Animaciones Premium**: Uso de entradas escalonadas (staggered) y curvas elásticas (`spring`) para transiciones de alta calidad táctil.
- **`totalCountByStudent`**: Cuenta el historial **completo** del alumno (no solo el mes) para alimentar `getClassesSinceLastStripe`.

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

### 5. Componente `StudentAvatar.tsx`
Ubicación: `src/components/Dashboard/Industries/MartialArts/StudentAvatar.tsx`

Muestra la foto del alumno con dos globitos de estado:
- **Verde** (clases desde última raya): `style={{ top: -2, left: -2 }}`. Usa `getClassesSinceLastStripe()`. No se muestra para negro ni si retorna `null`.
- **Dorado** (rayas actuales): `const ringPx=4; const offset=-(half+ringPx)=-12; style={{ top: size/2-half, right: offset }}`. No se muestra si `degrees === 0`.
- Constantes: `const DOT=16; const half=8`
- Contenedor: `relative inline-block` (sin padding extra)

---

## 🥋 Sistema BJJ Alliance — Validaciones de Graduación

### Regla de Consistencia (a implementar en editar perfil)
La suma `previous_classes + total_attendances` **no puede superar el máximo del cinturón actual**. Si la supera, el alumno ya debería haber sido promovido.

| Cinturón | Clases/Raya | Máximo Total | Rayas máx |
|----------|-------------|--------------|----------|
| Blanco   | 30          | 150          | 5        |
| Azul     | 65          | 325          | 5        |
| Morado   | 75          | 375          | 5        |
| Café     | 75          | 375          | 5        |
| Negro    | —           | ∞            | —        |

### Validaciones en el form de edición
1. Al cambiar `belt_rank` → recalcular rayas máximas y clases máximas permitidas
2. `previous_classes + total_attendances ≤ max_del_cinturon`
3. `degrees × clases_por_raya ≤ previous_classes + total_attendances`
4. `degrees` máximo = 4 (la 5ta raya implica promoción al siguiente cinturón)

### Campos backend requeridos en listado de students
`belt_rank`, `degrees`, `previous_classes`, `belt_classes_at_promotion`, `total_attendances` — todos retornados por `StudentController::index()` map().

---

## 🛡️ Garantía de Aislamiento
Cualquier modificación en los componentes dentro de `src/components/Dashboard/Industries/MartialArts/` o en el hook `useMartialArtsData.ts` **NO** afectará a la industria `school_treasury`, gracias a:
1.  Uso de props de vocabulario dinámico.
2.  Separación física de archivos de UI.
3.  Uso de funciones de utilidad puras e independientes.
