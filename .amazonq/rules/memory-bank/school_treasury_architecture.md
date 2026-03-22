# Arquitectura VERIFICADA: school_treasury

Basado en la auditoría del código fuente (`OverviewSection`, `StudentHomeSection`, `BottomNav`), este es el comportamiento exacto de la industria.

---

## 👨‍💼 Perfil: STAFF (Administración/Tesorero)
El enfoque es 100% financiero y operativo, eliminando ruidos de asistencia QR.

### 1. Dashboard (Resumen)
- **Tarjetas Superiores**: Muestra exclusivamente el estado de cuotas: **Total Alumnos**, **Al Día**, **En Revisión** y **Morosos**.
- **Sección de Asistencia**: Esta sección **se oculta completamente** en el dashboard (no se muestra la lista de presentes del día).
- **Horario**: Se mantiene la visualización de las clases/talleres programados para hoy.

### 2. Navegación (Staff)
- **Móvil**: Se **elimina** el botón de "Asistencia" del BottomNav. Solo quedan Inicio, Cuotas, Compras, Horario y Perfil.
- **Escritorio**: Se prioriza "Cuotas" (gestión granular por apoderado) y "Compras" (gestión de egresos del colegio).

---

## 👪 Perfil: APODERADO / ALUMNO
El portal cambia para ser un centro de pagos y agenda, eliminando la función de "Auto-marcado QR".

### 1. Inicio (Home)
- **Status Financiero**: Una tarjeta de gran formato que indica si el apoderado está al día o tiene deudas/pagos en revisión.
- **Pupilos**: Lista de los alumnos a cargo con su curso (categoría) formateado (ej: "1° Medio A").
- **Asistencia QR**: Las tarjetas de "Registrar asistencia" con botón QR **están desactivadas** para esta industria.
- **Horario**: Consulta de las clases que tienen sus pupilos hoy.

### 2. Navegación (Guardian)
- **Inicio**: Dashboard financiero y resumen semanal.
- **Horario**: Calendario de clases (renombrado de "Clases" a "Horario").
- **Cuotas**: Centro de pagos y subida de comprobantes (renombrado de "Pagos" a "Cuotas").
- **Rendición**: Pestaña **exclusiva** para ver los gastos del colegio/curso.
- **Perfil**: Configuración y notificaciones.

---

## 🏗️ Implementación Backend (LISTO)
Se han creado los siguientes componentes para soportar la lógica de cursos:
- **Modelo `Course`**: Localizado en `app/Models/Course.php`.
- **Relación en `Student`**: Cada alumno tiene un `course_id` vinculado al modelo `Course`.
- **Endpoints**:
    - `GET /api/{tenant}/courses`: Listar cursos del colegio.
    - `POST /api/{tenant}/courses`: Crear nuevo curso (Staff).
    - `PATCH /api/{tenant}/students/{id}/course`: Vincular/Cambiar curso de un alumno.

## 🤖 Automatización: Registro Universal por Curso
Para que sea 100% automático sin crear múltiples links, el proceso ahora es:

1.  **Link Universal**: Usa el mismo link siempre: `https://app.digitalizatodo.cl/register`.
2.  **Identificación**: Cuando el apoderado pone su email, el sistema detecta el colegio.
3.  **Selección Dinámica**: Si el colegio es de `school_treasury`, aparecerá un selector de **"Curso"** en el formulario de cada alumno.
4.  **Auto-Vínculo**: Si el colegio solo tiene **un curso creado**, el sistema lo pre-selecciona automáticamente.

> [!TIP]
> Si aún así quieres forzar un curso específico desde un botón en tu web, puedes seguir usando `?course=[ID]` y el selector se ocultará para usar ese ID directamente.

## 🗄️ Estructura SQL (Para Beekeeper)

```sql
/** 
 * 1. Crear tabla de cursos (entidad dedicada)
 */
CREATE TABLE IF NOT EXISTS `courses` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `tenant_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL, -- Ej: "1ro Medio A"
  `description` TEXT NULL,
  `level` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL,
  INDEX `courses_tenant_id_index` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/**
 * 2. Vincular alumnos con cursos
 */
ALTER TABLE `students` ADD COLUMN `course_id` BIGINT UNSIGNED NULL AFTER `tenant_id`;
ALTER TABLE `students` ADD INDEX `students_course_id_index` (`course_id`);

/**
 * 3. Vincular Alumnos (Ejemplo Beekeeper)
 */
-- Vincular un alumno específico
UPDATE students SET course_id = [ID_CURSO] WHERE id = [ID_ALUMNO] AND tenant_id = [ID_COLEGIO];

-- Vincular masivamente por categoría (ej: traspasar datos antiguos)
UPDATE students 
SET course_id = [ID_CURSO] 
WHERE tenant_id = [ID_COLEGIO] 
AND category = '1_medio_a';
```

## 🏗️ Frontend 2.0: Arquitectura Modular (NUEVO)
Se ha implementado una separación física y lógica para evitar la contaminación entre industrias:

### 1. Ubicación de Componentes
Los archivos de esta industria residen en:
`src/components/Dashboard/Industries/SchoolTreasury/`
- **`OverviewTreasury.tsx`**: Orquestador visual de métricas financieras.
- **`FeesGuardiansSection.tsx`**: Lista avanzada de apoderados con filtros de mora.
- **`GuardianSettlementModal.tsx`**: Gestión de finiquitos y devoluciones.

### 2. Gestión de Estado (Hooks Modulares)
Se ha implementado una separación física y lógica para cada perfil:

#### Staff (Administración)
- **`useAdminDashboard.ts`**: Orquestador principal.
- **`useDashboardCommon.ts`**: Lógica compartida (branding, notificaciones).
- **`useTreasuryData.ts`**: Lógica de negocio (cuotas, egresos, apoderados).
- **`useMartialArtsData.ts`**: Asistencia y cinturones (desactivado en esta industria).

#### Estudiante (Apoderado)
- **`useStudentCommon.ts`**: Orquestador y autenticación.
- **`useStudentTreasuryData.ts`**: Cuotas y rendición (Auto-reactivo).
- **`useStudentMartialArtsData.ts`**: Horarios y asistencia.

### 3. Integración en Dashboard
El `Dashboard/page.tsx` actúa como un **Switch** que invoca estos componentes según la industria, garantizando un rendimiento óptimo.

### 4. Portal del Estudiante
Los componentes específicos residen en `src/components/Dashboard/Student/Industries/SchoolTreasury/` (`HomeTreasury.tsx`, `PaymentsTreasury.tsx`).

---

## 🔐 Multi-Tenancy
Cada entidad está aislada por `tenant_id`. Un Staff de un colegio solo gestiona sus propios Cursos, Alumnos y Cuotas. El sistema resuelve el colegio automáticamente desde el slug de la URL.
