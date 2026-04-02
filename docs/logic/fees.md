# Guía Técnica: Lógica de Cuotas y Pagos (Dashboard Estudiante)

Este documento detalla el funcionamiento interno de la gestión de cuotas para evitar tiempos de depuración prolongados en el futuro.

## 1. Arquitectura de Datos (La Cadena de Visibilidad)
Para que un pago aparezca en la App de Estudiantes, debe existir una cadena relacional ininterrumpida:
`Guardián (Apoderado)` -> `Student` -> `Enrollment (Contrato)` -> `Plan` -> `Fee (Cuota)`.

> [!IMPORTANT]
> Si el Alumno no tiene un `Enrollment` (Contrato) activo vinculado a un `Plan`, las cuotas del plan **NO** serán visibles para él, aunque la cuota exista en la base de datos.

## 2. Tipos de Cuota (`fee.type`)

Existen dos comportamientos críticos definidos por el campo `type`:

### A. Tipo `once` (Pago Único / Matrícula)
- **Comportamiento**: El sistema **NO** genera periodos automáticamente.
- **Requisito**: Debes crear manualmente un registro en la tabla `fee_payments` para el Alumno y la Fee correspondientes.
- **Uso**: Matrículas, uniformes, seminarios.

### B. Tipo `recurring` (Mensualidad / Anualidad)
- **Comportamiento**: El sistema **GENERA** periodos de forma virtual basándose en las fechas.
- **Lógica**: Utiliza la `due_date` (inicio) y la `end_date` de la Fee. Si no hay fecha de fin, genera hasta diciembre del año actual.
- **Uso**: Mensualidades recurrentes.

## 3. Manejo del "Ruido" y Duplicados (`fee.target`)

El campo `target` determina dónde se cuelga la cuota en el Dashboard:

- **`target = "all"`**: Aparece como una cuota "Suelta" (Global) para el apoderado Y TAMBIÉN en la fila de cada alumno. **(Esto causa el "ruido" o duplicados).**
- **`target = "students"`**: Solo aparece dentro de la lista de cada alumno. Es la opción recomendada para mensualidades.
- **`target = "guardians"`**: Solo aparece como una cuota global para el apoderado.

## 4. Ciclos de Facturación (`billing_cycle`)

Para que el botón de **PAGAR** funcione correctamente, el ciclo de facturación del Plan y de la Fee deben estar sincronizados:

- **`monthly_from_enrollment`**: Genera cuotas cada mes contando desde la fecha de ingreso del alumno. Es el estándar para Martial Arts.
- **`monthly_fixed`**: Genera cuotas en un día fijo del mes para todos.

## 5. Reglas de Oro para Debugging Rápido 🏹

1. **¿No se ve la cuota?**
   - Revisa si el alumno tiene un `enrollment_id` en la tabla de contratos.
   - Verifica que el `plan_id` de la Fee coincida con el `plan_id` del contrato del alumno.
2. **¿Se ve pero sin botón de pago?**
   - Asegúrate de que la Fee sea `recurring` o que exista un registro `pending` en `fee_payments`.
3. **¿Cambiaste algo en la BD y no se ve en la App?**
   - Ejecuta `php artisan cache:clear` y `php artisan config:clear` en el contenedor del backend.

---
*Manual creado para la eternidad y para salvar 5 horas de vida.* 🥋🥊💎
