# Sistema de Horarios (Schedules) — Digitaliza Todo

## Modelo de Negocio

- Solo aplica a tenants con `industry = school_treasury`
- Cada bloque = 1 registro en `schedules` con día, hora inicio, hora fin, materia y color
- **REGLA CRÍTICA**: 1 bloque = 1 registro completo. NO dividir en bloques de 45min si la clase dura 1h30min
- El frontend agrupa bloques consecutivos de la misma materia, pero la fuente de verdad debe ser 1 registro por clase

---

## Schema DB

### Tabla `schedules`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | int | PK |
| `tenant_id` | int | FK |
| `name` | string | Nombre del bloque (igual a subject) |
| `subject` | string | Nombre de la materia |
| `day_of_week` | int | 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes |
| `start_time` | time | Hora inicio (HH:MM:SS) |
| `end_time` | time | Hora fin (HH:MM:SS) |
| `color` | string\|null | Hex del color (ej: `#ef4444`) |
| `capacity` | int\|null | Capacidad máxima (no usado en school_treasury) |
| `deleted_at` | timestamp\|null | Soft delete |

---

## Horario Actual — Tenant 4 (colegio-fines-relmu)

Después de consolidación (1 registro por clase):

| Día | Inicio | Fin | Materia | Color |
|-----|--------|-----|---------|-------|
| Lunes | 14:00 | 15:30 | Aymara | #f97316 |
| Lunes | 15:45 | 17:15 | Lenguaje | #ef4444 |
| Lunes | 17:30 | 18:15 | Tecnología/Orientación | #92400e |
| Martes | 14:00 | 15:30 | Lenguaje | #ef4444 |
| Martes | 15:45 | 17:15 | Ed. Física | #7c3aed |
| Martes | 17:30 | 19:00 | Matemáticas | #3b82f6 |
| Miércoles | 14:00 | 15:30 | Lenguaje | #ef4444 |
| Miércoles | 15:45 | 17:15 | Aymara | #f97316 |
| Miércoles | 17:30 | 19:00 | Matemáticas | #3b82f6 |
| Jueves | 14:00 | 15:30 | Historia | #eab308 |
| Jueves | 15:45 | 17:15 | Ciencias | #22c55e |
| Jueves | 17:30 | 19:00 | Matemáticas | #3b82f6 |
| Viernes | 14:00 | 15:30 | Artes Visuales | #38bdf8 |
| Viernes | 15:45 | 17:15 | Música | #f472b6 |
| Viernes | 17:30 | 19:00 | Religión | #f4f4f5 |

> Nota: Lunes tiene solo 2h45min de clases (sale temprano a las 18:15 aprox)

---

## Recreos (calculados automáticamente por el frontend)

El frontend detecta gaps entre bloques y muestra recreo:
- Gap de 15min entre bloques → `🍎🧃 15 MIN`
- Gap de otro tamaño → muestra la duración

Recreos estándar de este tenant:
- 15:30 → 15:45 (15 min)
- 17:15 → 17:30 (15 min)

---

## Frontend — WeeklySchedule.tsx

Ubicación: `app-pwa/src/components/Schedule/WeeklySchedule.tsx`

### Lógica de agrupación (`buildDayItems`)
Agrupa bloques consecutivos de la misma materia en uno solo. Usa `_end` acumulado (no `end_time` original) para comparar si el siguiente bloque es consecutivo.

```typescript
const lastEnd = (last?.cell as any)?._end || (last ? fmtTime(last.cell.end_time) : null);
if (last && last.cell.subject === cell!.subject && lastEnd === start) {
    (last.cell as any)._end = end; // acumular fin
}
```

> **IMPORTANTE**: Aunque existe lógica de agrupación, la fuente de verdad debe ser 1 registro por clase en DB. La agrupación es solo fallback para datos legacy.

### Recreos
Se insertan automáticamente entre bloques cuando hay un gap > 0 minutos.

---

## Backend — ScheduleController.php

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `index` | `GET /schedules` | staff + guardian | Lista todos los schedules del tenant |
| `store` | `POST /schedules` | staff | Crea bloque |
| `update` | `PUT /schedules/{id}` | staff | Edita bloque |
| `destroy` | `DELETE /schedules/{id}` | staff | Elimina bloque |

### Evento Realtime
Al crear/actualizar/eliminar un schedule, se emite `ScheduleUpdated` **fuera** de `DB::transaction()`:

```php
DB::transaction(function() { ... }); // guardar en DB
event(new ScheduleUpdated($tenant->slug)); // FUERA de la transacción
```

Canal: `attendance.{slug}`, evento: `schedule.updated`

---

## Colores Estándar

| Materia | Hex |
|---------|-----|
| Lenguaje | #ef4444 |
| Matemáticas | #3b82f6 |
| Ciencias | #22c55e |
| Historia | #eab308 |
| Inglés | #a855f7 |
| Religión | #f4f4f5 |
| Artes Visuales | #38bdf8 |
| Tecnología | #92400e |
| Ed. Física | #7c3aed |
| Música | #f472b6 |
| Aymara | #f97316 |
