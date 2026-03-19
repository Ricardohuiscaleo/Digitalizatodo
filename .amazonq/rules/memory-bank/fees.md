# Sistema de Cuotas (Fees) — Digitaliza Todo

## Modelo de Negocio

- Una **fee** = concepto de cobro independiente (ej: "Caja chica $3.000", "Actividad $5.000")
- Un apoderado puede pagar múltiples fees en un solo comprobante (1 foto → N `fee_payments`)
- **Pago adelantado**: N `fee_payments` con mismo `proof_url`
- Solo aplica a tenants con `industry = school_treasury` (ej: tenant 4 = colegio-fines-relmu)

---

## Schema DB

### Tabla `fees`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | int | PK |
| `tenant_id` | int | FK |
| `title` | string | Nombre del concepto |
| `description` | string\|null | Descripción opcional |
| `amount` | decimal | Monto mensual |
| `type` | enum | `once` \| `recurring` |
| `due_date` | date\|null | Fecha inicio (recurring) o vencimiento (once) |
| `end_date` | date\|null | Fecha fin (solo recurring). Si null → hasta dic del año en curso |
| `recurring_day` | int\|null | Día del mes para vencimiento (1-31) |
| `target` | enum | `all` \| `custom` |
| `created_by` | int | FK usuario staff |

### Tabla `fee_payments`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | int | PK |
| `fee_id` | int | FK |
| `tenant_id` | int | FK |
| `guardian_id` | int | FK apoderado |
| `period_month` | int\|null | Mes del período (1-12) |
| `period_year` | int\|null | Año del período |
| `status` | enum | `pending` \| `review` \| `paid` |
| `payment_method` | enum\|null | `transfer` \| `cash` |
| `proof_url` | string\|null | URL S3 del comprobante |
| `paid_at` | timestamp\|null | Fecha de aprobación |
| `approved_by` | int\|null | FK usuario staff que aprobó |
| `notes` | string\|null | Notas del staff |

> **IMPORTANTE**: `fee_payments` se crean al pagar, NO al crear la fee.

---

## Backend — FeeController.php

### Métodos

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `index` | `GET /fees` | staff | Lista fees con conteos de pagos |
| `show` | `GET /fees/{id}` | staff | Detalle fee + todos sus pagos |
| `store` | `POST /fees` | staff | Crea fee (sin generar fee_payments) |
| `destroy` | `DELETE /fees/{id}` | staff | Elimina fee + pagos + S3 |
| `guardiansSummary` | `GET /fees/guardians-summary` | staff | Apoderados con estado agregado |
| `approvePayment` | `POST /fees/{id}/approve-payment` | staff | Aprueba uno o todos los períodos |
| `myFees` | `GET /fees/my` | guardian | Fees con períodos calculados y status |
| `submitPayment` | `POST /fees/submit-payment` | guardian | Paga N períodos de N fees con 1 comprobante |
| `uploadProof` | `POST /fees/{id}/upload-proof` | guardian | Sube comprobante a fee específica (legacy) |

### `calculatePeriods(Fee $fee)` — helper privado
- `type = once`: retorna 1 período basado en `due_date`
- `type = recurring`: genera períodos mes a mes desde `due_date` hasta `end_date`
  - Si `end_date` es null → hasta **31 de diciembre del año en curso**
  - Cada período incluye: `month`, `year`, `due_date`, `label`

### `myFees` — respuesta
```json
{
  "fees": [
    {
      "fee": { "id": 1, "title": "Caja chica", "amount": 3000, "type": "recurring", ... },
      "periods": [
        { "month": 1, "year": 2025, "label": "Jan 2025", "status": "paid", "payment_id": 5, "proof_url": "...", "paid_at": "..." },
        { "month": 2, "year": 2025, "label": "Feb 2025", "status": "review", "payment_id": 6, "proof_url": "...", "paid_at": null },
        { "month": 3, "year": 2025, "label": "Mar 2025", "status": "pending", "payment_id": null, "proof_url": null, "paid_at": null }
      ]
    }
  ]
}
```

### `submitPayment` — flujo
1. Valida `proof` (imagen) + `items[]` (fee_id + períodos)
2. Sube 1 foto a S3 → `tenants/{tenant_id}/fees/fee_proof_bulk_{guardian_id}_{time}.webp`
3. Por cada período: `updateOrCreate` en `fee_payments` con `status = review`
4. Evita duplicados si ya existe un pago en `review` o `paid` para ese período
5. Retorna `{ created: N, proof_url: "..." }`

### `approvePayment` — flujo
- Recibe `guardian_id`, `payment_method`, `notes`, `payment_id` (opcional)
- Si `payment_id` viene → aprueba solo ese registro
- Si no → aprueba todos los `fee_payments` del guardian para esa fee

---

## Frontend — app-pwa

### Estado en `student/page.tsx`
```typescript
const [myFees, setMyFees] = useState<any[]>([]);         // array de { fee, periods[] }
const [feePayModal, setFeePayModal] = useState<{ fees: any[] } | null>(null);
```

### Carga inicial
```typescript
// En useEffect([], []) junto con refreshData() y getSchedules()
slug && tk ? getMyFees(slug, tk).then(d => setMyFees(d?.fees ?? [])) : Promise.resolve()
```

### `refreshMyFees()` — recarga fees sin recargar todo el perfil

### Componentes

#### `FeeCard`
- Muestra fee con título, monto/mes, estado general (pending/review/paid)
- Barra de progreso de meses: verde=paid, amarillo=review, gris=pending
- Botón "Pagar" si no está al día → abre `FeePayModal`

#### `FeePayModal` (bottom sheet)
- Chips de meses seleccionables (solo pendientes)
- Selección consecutiva obligatoria desde el primer pendiente
- Botón "Todo el año" → selecciona todos los pendientes
- Total calculado dinámicamente
- Adjuntar comprobante (imagen)
- Submit → `submitFeePayment()` → success state → `onSuccess()` + `onClose()`

### Tarjeta status en `renderHome()` (school_treasury)
Aparece antes de `TodaySchedule`. Lógica IIFE:
1. Aplana todos los períodos de todas las fees
2. Si hay alguno en `review` → tarjeta **amarilla** "Comprobante en revisión"
3. Si hay alguno `pending` → tarjeta **roja** con monto + título + mes/año del próximo vencimiento
4. Si ninguno → tarjeta **verde** "¡Estás al día!"

### Sección `renderPayments()` (tab Pendientes)
- Muestra `FeeCard` por cada fee con botón "Pagar cuotas" global
- Debajo: `PaymentRow` para mensualidades clásicas (no school_treasury)

---

## Frontend — api.ts

```typescript
getMyFees(tenantId, token)           // GET /fees/my → { fees: [] }
submitFeePayment(tenantId, token, items, proofFile)  // POST /fees/submit-payment
// items: { fee_id: number, periods: { month, year }[] }[]
```

---

## Rutas API

```
# Apoderado (auth:sanctum,guardian-api)
GET  /{tenant}/fees/my
POST /{tenant}/fees/submit-payment
POST /{tenant}/fees/{id}/upload-proof

# Staff (role:teacher,admin,owner)
GET  /{tenant}/fees
GET  /{tenant}/fees/guardians-summary
POST /{tenant}/fees
GET  /{tenant}/fees/{id}
DELETE /{tenant}/fees/{id}
POST /{tenant}/fees/{id}/approve-payment
```

---

## Flujo Completo de Pago

```
Apoderado abre tab Pagos
  → ve FeeCard con barra de progreso
  → toca "Pagar" → FeePayModal
  → selecciona meses (consecutivos)
  → adjunta comprobante
  → submit → POST /fees/submit-payment
  → fee_payments creados con status=review
  → tarjeta home cambia a amarilla
  → staff ve en guardians-summary status=review
  → staff aprueba → POST /fees/{id}/approve-payment
  → fee_payments status=paid
  → WebSocket payment.updated → apoderado ve tarjeta verde
```

---

## Notas Importantes

- `Guardian` NO tiene `user_id` — se autentica directamente con guard `guardian-api`
- En `myFees`, el guardian se obtiene con `$user instanceof Guardian ? $user : Guardian::where('user_id'...)`
- Soporte legacy: pagos sin `period_month` se mapean al primer período disponible
- `bulk_payments` usan `updateOrCreate` para idempotencia
