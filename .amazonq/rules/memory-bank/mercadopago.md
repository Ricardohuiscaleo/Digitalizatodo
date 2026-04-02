# Mercado Pago — Digitaliza Todo

## Estado Actual (Abril 2026)

### ✅ Lo que funciona
- **Checkout API con CardPayment Brick** — pago con tarjeta en producción
- **Vaulting** — tarjeta guardada en MP (`mercadopago_customer_id`, `mercadopago_card_id`)
- **Split marketplace** — 1.81% para Digitaliza Todo via `application_fee`
- **OAuth por tenant** — cada dojo vincula su cuenta MP, pagos van a su cuenta
- **Cron 3am** — `payments:process-recurring` cobra automáticamente alumnos con tarjeta guardada
- **Notificaciones** — staff y apoderado reciben notificación al pagar/rechazar

### ⚠️ Pendiente / Bugs conocidos
- `payment_method` no se guarda como `"mercadopago"` en `fee_payments` al pagar con tarjeta
- `payment_id`, `external_reference`, `subscription_id` quedan en `null` — campos de la tabla no se llenan
- La vista del alumno no detecta si tiene cobro automático activo y sigue mostrando botón PAGAR

---

## Arquitectura

### Dos servicios separados
| Servicio | Clase | Uso |
|---------|-------|-----|
| `MercadoPagoService` | `app/Services/MercadoPagoService.php` | Cobros a alumnos (Checkout API, vaulting, split) |
| `MPService` | `app/Services/MPService.php` | Suscripciones SaaS de tenants (preapproval_plan) |

### Dos flujos de pago para alumnos
| Flujo | Método | Descripción |
|-------|--------|-------------|
| Checkout API | `subscribeWithCard` | Pago directo + vaulting tarjeta → cobro automático activado |
| Checkout Pro | `initiateSubscription` | Redirección a MP → sin vaulting, sin cobro automático |

**Usar siempre `subscribeWithCard`** para activar cobro automático.

---

## Schema DB — `fee_payments`

Campos relevantes para MP (muchos en null actualmente):

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `payment_method` | string\|null | `"mercadopago"` \| `"transfer"` \| `"cash"` |
| `payment_id` | string\|null | ID del pago en MP (ej: `"123456789"`) |
| `payment_amount` | decimal\|null | Monto cobrado |
| `external_reference` | string\|null | Referencia externa (ej: `"1:56:16:5:2026"`) |
| `subscription_id` | string\|null | ID de suscripción MP (para preapproval) |
| `authorized_payment_id` | string\|null | ID de pago autorizado |
| `retry_attempts` | int | Intentos de cobro automático (máx 3) |
| `last_retry_at` | timestamp\|null | Último intento |

### Fix pendiente en `subscribeWithCard`
Al aprobar el pago, guardar los datos de MP en `fee_payments`:
```php
$feePayment->update([
    'status'             => 'paid',
    'paid_at'            => now(),
    'payment_method'     => 'mercadopago',
    'payment_id'         => (string) $payment->id,
    'payment_amount'     => $request->amount,
    'external_reference' => $payment->external_reference,
]);
```

---

## Schema DB — `students`

Campos de vaulting MP:

| Campo | Descripción |
|-------|-------------|
| `mercadopago_customer_id` | ID del cliente en MP |
| `mercadopago_card_id` | ID de la tarjeta guardada |
| `mercadopago_last_four` | Últimos 4 dígitos |
| `mercadopago_payment_method_id` | Ej: `"master"`, `"visa"` |

**Si estos campos están llenos → cobro automático activo.**

---

## Flujo Completo `subscribeWithCard`

```
Frontend (CardPayment Brick)
  → onSubmit(formData) con token, payment_method_id, payer.identification
  → POST /{tenant}/mercadopago/subscribe-with-card
  
Backend:
  1. Validar tenant conectado a MP
  2. Calcular split (1.81%)
  3. getOrCreateCustomer(email, name) → MP Customer ID
  4. addCardToCustomer(customerId, token) → MP Card ID
  5. updateOrCreate fee_payment (pending)
  6. setAccessToken(tenant.mercadopago_access_token) ← CRÍTICO para split
  7. createSubscriptionPayment({
       transaction_amount, token, payment_method_id, issuer_id,
       payer: { email, id, identification: { type: "RUT", number } },
       device_id, external_reference
     })
  8. Si approved:
     - student.update({ mercadopago_customer_id, card_id, last_four })
     - fee_payment.update({ status: paid, payment_method: mercadopago, payment_id })
     - Notificar staff + apoderado
     - event(FeeUpdated) → realtime
```

---

## Errores Conocidos y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `collector_id invalid` | Crear preferencia con token de plataforma en vez del tenant | Usar `tenant.mercadopago_access_token` |
| `identification_number: null` | Brick v2 envía RUT en `payer.identification.number`, no en `cardholder` | Leer `formData.payer?.identification?.number \|\| formData.cardholder?.identification?.number` |
| `The name of the following parameters is wrong: [items]` | Campo `items` no existe en `/v1/payments` (solo en preferencias) | Eliminar `items` del payload de `createSubscriptionPayment` |
| `Error al procesar el pago` genérico | Backend no exponía el error real de MP | Capturar `$e->getApiResponse()->getContent()` y retornar `$content['message']` |
| Pago aprobado pero `payment_method: null` | Backend no guarda datos MP en `fee_payments` | Fix pendiente: guardar `payment_id`, `payment_method`, `payment_amount` |

---

## Lógica Visual Pendiente — Vista Alumno

### Estado actual
El alumno con cobro automático activo ve igual que uno sin tarjeta — botón PAGAR en cada período.

### Lo que debería verse

**Si `student.mercadopago_card_id` está lleno:**
```
✅ Cobro automático activo
•••• 7853 (Mastercard)
Próximo cobro: 1 Jun 2026 — $45.000
[Cancelar suscripción]
```

**Si NO tiene tarjeta:**
```
⚠️ Jun 2026 — $45.000
[PAGAR] → abre CardPayment Brick
```

### Implementación sugerida
En `PaymentsMartialArts.tsx`, en el bloque de períodos pendientes:
```typescript
const hasCard = !!(students[0]?.mercadopago_customer_id && students[0]?.mercadopago_card_id);

if (hasCard) {
    // Mostrar badge "Cobro automático ✓" + últimos 4 dígitos
    // No mostrar botón PAGAR — el cron cobra solo
} else {
    // Mostrar botón PAGAR con CardPayment Brick
}
```

El campo `mercadopago_last_four` ya viene en el `/me` → `students[0].mercadopago_last_four`.

---

## Cron — Cobros Automáticos

**Archivo**: `app/Console/Commands/ProcessRecurringPayments.php`
**Schedule**: `payments:process-recurring` → diariamente a las 3am
**Lógica**:
1. Busca `fee_payments` con `status=pending` y `retry_attempts < 3`
2. Filtra alumnos con `mercadopago_customer_id` y `mercadopago_card_id`
3. Verifica que el tenant esté `connected` a MP
4. Usa `tenant.mercadopago_access_token` para el split correcto
5. Cobra con `createDirectPayment`
6. Si falla → incrementa `retry_attempts`, notifica al staff

---

## Variables de Entorno Requeridas (Coolify)

```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...   # Token de la plataforma (Digitaliza Todo)
MERCADOPAGO_PUBLIC_KEY=APP_USR-...     # Public key para el Brick en frontend
MERCADOPAGO_CLIENT_ID=...              # Para OAuth de tenants
MERCADOPAGO_CLIENT_SECRET=...          # Para OAuth de tenants
MERCADOPAGO_PLATFORM_FEE=1.81          # % que cobra Digitaliza Todo
MERCADOPAGO_MODE=production            # ⚠️ Cambiar de sandbox a production
```

**IMPORTANTE**: `MERCADOPAGO_MODE` estaba en `sandbox` — cambiar a `production` en Coolify.

---

## Split Marketplace

Por cada cobro de $45.000:
| Quién | % | Monto |
|-------|---|-------|
| Tenant (dojo) | ~95.2% | ~$42.840 |
| Mercado Pago | ~2.99% | ~$1.346 |
| Digitaliza Todo | 1.81% | ~$815 |

El split se aplica via `application_fee` en Checkout API y `marketplace_fee` en Checkout Pro.
**Requiere** que el tenant haya completado el OAuth (`mercadopago_auth_status = "connected"`).

---

## OAuth Marketplace — Flujo de Vinculación

1. Staff toca "Conectar Mercado Pago" en Ajustes
2. `GET /mercadopago/auth/url` → genera URL de autorización MP
3. Staff autoriza en MP → redirect a `/api/mercadopago/auth/callback?code=...&state={tenant_id}`
4. Backend intercambia `code` por `access_token` + `refresh_token` + `user_id`
5. Guarda en `tenant`: `mercadopago_access_token`, `mercadopago_user_id`, `mercadopago_auth_status = "connected"`
6. Desde ese momento los pagos van a la cuenta del dojo con split automático
