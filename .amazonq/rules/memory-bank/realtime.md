# Arquitectura Realtime — Digitaliza Todo

## Resumen

Sistema de WebSockets bidireccional usando **Laravel Reverb** (backend) y **Laravel Echo + Pusher.js** (frontend). Permite notificaciones en tiempo real entre dashboards (staff ↔ student) sin polling.

---

## Stack Tecnológico

| Capa | Tecnología | Rol |
|------|------------|-----|
| Backend WS Server | Laravel Reverb | Servidor WebSocket (puerto 8080) |
| Backend Events | Laravel Broadcasting | Emite eventos a Reverb |
| Frontend Client | laravel-echo + pusher-js | Conecta a Reverb, escucha canales |
| Protocolo | Pusher Protocol | Compatible con Reverb |

---

## Arquitectura de Red

```
┌─────────────────────────────────────────────────────────────────┐
│                        COOLIFY CONTAINER                        │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │   Nginx     │    │  PHP-FPM    │    │   Laravel Reverb    │ │
│  │  :80/:443   │───▶│  (Laravel)  │───▶│   0.0.0.0:8080      │ │
│  │  HTTP only  │    │             │    │   (WebSocket)       │ │
│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
│         │                  │                     ▲             │
│         │                  │    HTTP POST        │             │
│         │                  │    127.0.0.1:8080   │             │
│         │                  └─────────────────────┘             │
└─────────┼───────────────────────────────────────────┼──────────┘
          │ HTTPS :443                                │ WSS :8080
          ▼                                           ▼
    ┌───────────┐                              ┌───────────┐
    │  Browser  │                              │  Browser  │
    │  (API)    │                              │  (WS)     │
    └───────────┘                              └───────────┘
```

### Flujo de Conexiones

1. **Frontend → Reverb (WebSocket)**
   - Conecta a `wss://admin.digitalizatodo.cl:8080`
   - Puerto 8080 expuesto directamente por Coolify (NO pasa por Nginx)
   - Usa protocolo Pusher sobre WebSocket

2. **Laravel → Reverb (HTTP interno)**
   - Laravel emite eventos via HTTP POST a `http://127.0.0.1:8080`
   - Conexión local dentro del container
   - NO usa el dominio público ni HTTPS

---

## Configuración Backend

### Variables de Entorno (Coolify)

```env
# Broadcasting
BROADCAST_CONNECTION=reverb

# Reverb credentials (compartidas con frontend)
REVERB_APP_ID=722399
REVERB_APP_KEY=diedimtyjfxaurcuejrt
REVERB_APP_SECRET=hlhbsh7hcwbjf0m3anqw

# Reverb público (para clientes externos)
REVERB_HOST=admin.digitalizatodo.cl
REVERB_PORT=443
REVERB_SCHEME=https
```

### config/broadcasting.php

```php
'reverb' => [
    'driver' => 'reverb',
    'key' => env('REVERB_APP_KEY'),
    'secret' => env('REVERB_APP_SECRET'),
    'app_id' => env('REVERB_APP_ID'),
    'options' => [
        // CRÍTICO: Laravel conecta a Reverb LOCAL, no al dominio público
        'host' => env('REVERB_SERVER_HOST', '127.0.0.1'),
        'port' => env('REVERB_SERVER_PORT', 8080),
        'scheme' => 'http',
        'useTLS' => false,
    ],
],
```

### config/reverb.php

```php
'servers' => [
    'reverb' => [
        // Reverb ESCUCHA en todas las interfaces
        'host' => env('REVERB_SERVER_HOST', '0.0.0.0'),
        'port' => env('REVERB_SERVER_PORT', 8080),
        // ...
    ],
],
```

### supervisord.conf

```ini
[program:reverb]
command=php /var/www/html/artisan reverb:start --host=0.0.0.0 --port=8080
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/reverb.err.log
stdout_logfile=/var/log/supervisor/reverb.out.log
```

---

## Eventos Backend

### Crear un Evento Broadcast

```php
<?php
namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; // ⚠️ CRÍTICO: Now, no queued
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StudentCheckedIn implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $studentId;
    public $studentName;
    public $studentPhoto;
    public $tenantSlug;

    public function __construct($studentId, $studentName, $studentPhoto, $tenantSlug)
    {
        $this->studentId = $studentId;
        $this->studentName = $studentName;
        $this->studentPhoto = $studentPhoto;
        $this->tenantSlug = $tenantSlug;
    }

    // Canal público por tenant
    public function broadcastOn(): array
    {
        return [new Channel('attendance.' . $this->tenantSlug)];
    }

    // Nombre del evento que escucha el frontend
    public function broadcastAs(): string
    {
        return 'student.checked-in';
    }
}
```

### ⚠️ ShouldBroadcastNow vs ShouldBroadcast

| Interface | Comportamiento | Requiere |
|-----------|---------------|----------|
| `ShouldBroadcast` | Encola el evento | `php artisan queue:work` corriendo |
| `ShouldBroadcastNow` | Envía inmediatamente | Nada extra |

**USAR SIEMPRE `ShouldBroadcastNow`** a menos que tengas queue workers configurados.

### Emitir Evento

```php
// En cualquier controller
event(new StudentCheckedIn(
    $student->id,
    $student->name,
    $student->photo_url,
    $tenant->slug
));
```

---

## Configuración Frontend

### Variables de Entorno (.env.local)

```env
NEXT_PUBLIC_REVERB_APP_KEY=diedimtyjfxaurcuejrt
NEXT_PUBLIC_REVERB_HOST=admin.digitalizatodo.cl
NEXT_PUBLIC_REVERB_PORT=8080
NEXT_PUBLIC_REVERB_SCHEME=https
```

### lib/echo.ts

```typescript
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<any>;
  }
}

let echoInstance: Echo<any> | null = null;

export const getEcho = (): Echo<any> | null => {
  if (typeof window === 'undefined') return null;
  if (echoInstance) return echoInstance;

  window.Pusher = Pusher;

  const key = process.env.NEXT_PUBLIC_REVERB_APP_KEY;
  const host = process.env.NEXT_PUBLIC_REVERB_HOST || 'localhost';
  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME || 'http';

  if (!key) return null;

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key,
    wsHost: host,
    wsPort: scheme === 'https' ? 443 : 8080,
    wssPort: 443,
    forceTLS: scheme === 'https',
    enabledTransports: ['ws', 'wss'],
    // Reconexión agresiva para móviles
    activityTimeout: 30000,
    pongTimeout: 10000,
  });

  // Logging de estado
  const pusher = (echoInstance.connector as any)?.pusher;
  if (pusher) {
    pusher.connection.bind('connected', () => console.log('[WS] ✅ Connected'));
    pusher.connection.bind('disconnected', () => console.log('[WS] ❌ Disconnected'));
    pusher.connection.bind('error', (err: any) => console.log('[WS] Error:', err));
  }

  return echoInstance;
};

export const reconnect = () => {
  if (!echoInstance) return;
  const pusher = (echoInstance.connector as any)?.pusher;
  if (pusher?.connection?.state !== 'connected') {
    pusher?.connect();
  }
};
```

### Escuchar Eventos en Componente

```typescript
import { useEffect, useRef } from 'react';
import { getEcho, reconnect } from '@/lib/echo';

export default function Dashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const refreshDataRef = useRef<() => void>();

  // Mantener ref actualizada
  useEffect(() => {
    refreshDataRef.current = refreshData;
  }, [refreshData]);

  // WebSocket subscription
  useEffect(() => {
    const echo = getEcho();
    if (!echo || !tenantSlug) return;

    const channel = echo.channel(`attendance.${tenantSlug}`);
    
    channel.listen('.student.checked-in', (e: any) => {
      console.log('[WS] ✅ checked-in:', e);
      refreshDataRef.current?.();
    });

    channel.listen('.student.checked-out', (e: any) => {
      console.log('[WS] ❌ checked-out:', e);
      refreshDataRef.current?.();
    });

    // Reconectar cuando la app vuelve del background (móvil)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        reconnect();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      channel.stopListening('.student.checked-in');
      channel.stopListening('.student.checked-out');
      echo.leaveChannel(`attendance.${tenantSlug}`);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [tenantSlug]); // Solo depende del slug, NO de refreshData
}
```

---

## Patrón Canónico: Señal WS + Fetch HTTP

### Regla
Los eventos WebSocket son **señales** ("algo cambió"), no transportan datos. El frontend siempre hace un fetch HTTP después de recibir la señal para obtener los datos frescos.

```
Backend guarda en DB → emite evento WS → Frontend recibe señal → fetch HTTP → actualiza UI
```

### ¿Por qué no mandar los datos en el payload WS?
- Límite de ~10KB por evento
- Si llegan múltiples eventos rápido, el último fetch siempre gana (idempotente)
- El fetch garantiza datos consistentes con la DB

### Anti-patrón: event() dentro de DB::transaction()
```php
// ❌ MAL — el evento llega al frontend ANTES de que MySQL commitee
DB::transaction(function() use ($data) {
    $model->update($data);
    event(new ModelUpdated($slug)); // race condition: frontend fetchea datos viejos
});

// ✅ BIEN — el evento se emite DESPUÉS del commit
DB::transaction(function() use ($data) {
    $model->update($data);
});
event(new ModelUpdated($slug)); // DB ya commiteó, fetch devuelve datos nuevos
```

---

## Hook Reutilizable: `useRealtimeChannel`

Ubiación: `app-pwa/src/hooks/useRealtimeChannel.ts`

```typescript
// Suscribirse a un canal con múltiples eventos
useRealtimeChannel(`attendance.${slug}`, {
    'schedule.updated': () => getSchedules(slug, tk).then(setSchedules),
    'student.checked-in': () => refreshData(),
    'payment.updated': (ev) => { if (ev.guardianId === myId) refreshFees(); },
}, !!slug);

// Reconectar al volver del background (usar una vez en el componente raíz)
useRealtimeVisibility(() => refreshData());
```

### Características
- **handlersRef**: los handlers se guardan en ref → los closures siempre tienen valores frescos sin re-suscribir
- **enabled**: flag para suscribir solo cuando slug/id están disponibles
- **cleanup automático**: `stopListening` + `leaveChannel` en el return del useEffect
- **prefijo `.` automático**: puedes pasar `'schedule.updated'` o `'.schedule.updated'`, ambos funcionan

### Canales en uso
| Canal | Eventos | Quién escucha |
|-------|---------|---------------|
| `attendance.{slug}` | `student.checked-in`, `student.checked-out`, `schedule.updated` | staff + student |
| `payments.{slug}` | `payment.updated`, `fee.updated`, `expense.updated` | staff + student |
| `dashboard.{slug}` | `student.registered` | staff |
| `notifications.{slug}.{userId}` | `notification.sent` | staff + student (canal separado por userId) |

---

| Tipo | Sintaxis | Autenticación | Uso |
|------|----------|---------------|-----|
| Public | `Channel('name')` | Ninguna | Eventos públicos por tenant |
| Private | `PrivateChannel('name')` | Sanctum token | Datos sensibles por usuario |
| Presence | `PresenceChannel('name')` | Sanctum + user info | Quién está online |

Para este proyecto usamos **canales públicos por tenant** (`attendance.{slug}`). Cualquier cliente conectado al tenant puede escuchar.

---

## Debugging

### Endpoint de Debug

```php
// GET /api/debug
return [
    'broadcast' => [
        'driver' => config('broadcasting.default'),
        'client_host' => config('broadcasting.connections.reverb.options.host'),
        'client_port' => config('broadcasting.connections.reverb.options.port'),
        'client_scheme' => config('broadcasting.connections.reverb.options.scheme'),
        'server_listen' => config('reverb.servers.reverb.host'),
    ],
    'reverb_health' => $this->checkReverbHealth(), // curl a 127.0.0.1:8080
];

// GET /api/debug?emit={slug} — emite evento de prueba
```

### Checklist de Problemas

| Síntoma | Causa Probable | Solución |
|---------|---------------|----------|
| Frontend no conecta | Puerto 8080 no expuesto | Verificar Coolify expone 8080 |
| Conecta pero no recibe eventos | `ShouldBroadcast` sin queue worker | Cambiar a `ShouldBroadcastNow` |
| `EMITTED` pero nada llega | Laravel apunta a host incorrecto | Verificar `broadcasting.php` usa `127.0.0.1` |
| Reverb no responde | Supervisord no lo inició | Verificar logs de supervisor |
| Eventos llegan duplicados | Múltiples subscriptions | Limpiar listeners en useEffect cleanup |
| Badge notificaciones siempre muestra 1 | Ver sección "Anti-patrones de contador" abajo | Fetch desde DB al recibir evento |
| Handler WS no ejecuta fetch (datos vacíos) | Closure stale — función captura `slug`/`token` del primer render (vacíos) | Usar `brandingSlugRef.current` y `tokenRef.current` dentro de la función |

### Logs Útiles

```bash
# Logs de Reverb
docker exec -it <container> cat /var/log/supervisor/reverb.out.log
docker exec -it <container> cat /var/log/supervisor/reverb.err.log

# Estado de supervisord
docker exec -it <container> supervisorctl status
```

---

## Anti-patrones de Contador (Notificaciones)

### ❌ Closure stale en funciones llamadas desde handlers WS
`useRealtimeChannel` guarda los handlers en `handlersRef` para evitar re-suscripciones. Pero si la función que llama el handler (ej: `loadExpenses`) captura `branding?.slug` y `token` del closure, esos valores son los del primer render — vacíos.

```typescript
// ❌ MAL — loadExpenses captura slug='' y token=null del primer render
const loadExpenses = async () => {
    const data = await getExpenses(branding?.slug || '', token || ''); // stale!
};
useRealtimeChannel(`payments.${slug}`, {
    'expense.updated': () => loadExpenses(), // nunca fetchea nada
});

// ✅ BIEN — leer de refs siempre tienen el valor actual
const loadExpenses = async () => {
    const s = brandingSlugRef.current || '';
    const tk = tokenRef.current || '';
    if (!s || !tk) return;
    const data = await getExpenses(s, tk);
};
```

**Regla**: Toda función que se llame desde un handler WS debe leer `slug` y `token` de refs (`brandingSlugRef.current`, `tokenRef.current`), no de estado/props directamente.

### ❌ `setUnreadCount(c => c + 1)` en handler WS
El contador local se desincroniza cuando `refreshData()` (disparado por otros canales) sobreescribe el estado con el valor de la DB, que puede ser menor si el fetch llega antes del commit de la notificación.

```typescript
// ❌ MAL — se desincroniza con refreshData
'notification.sent': (ev) => {
    setUnreadCount(c => c + 1); // refreshData() puede pisarlo con un valor menor
}

// ✅ BIEN — fetch desde DB garantiza count exacto
'notification.sent': (ev) => {
    setToastNotification(...);
    const slug = localStorage.getItem('tenant_slug') || '';
    const tk = localStorage.getItem('auth_token') || localStorage.getItem('staff_token') || '';
    if (slug && tk) getNotifications(slug, tk).then(d => {
        if (d?.unread !== undefined) setUnreadCount(d.unread);
        if (d?.notifications) setNotifications(d.notifications);
    });
}
```

### ❌ Usar `ref.current` en `channelName` de `useRealtimeChannel`
El hook depende de `channelName` como string para re-suscribirse. Si se construye con `ref.current?.id`, cuando el valor de la ref cambia (ej: después del fetch del perfil), el `channelName` no cambia reactivamente → el canal queda como `notifications.slug.undefined` y nunca recibe eventos.

```typescript
// ❌ MAL — ref no es reactiva, el canal queda como notifications.slug.undefined
useRealtimeChannel(
    `notifications.${branding?.slug}.${userRef.current?.id}`,
    { ... },
    !!branding?.slug && !!userRef.current?.id  // siempre false al inicio
);

// ✅ BIEN — estado es reactivo, el hook re-suscribe cuando user?.id llega
useRealtimeChannel(
    `notifications.${branding?.slug}.${user?.id}`,
    { ... },
    !!branding?.slug && !!user?.id
);
```

### Regla general para canales con IDs dinámicos
- Usar **estado** (`useState`) en el `channelName`, nunca refs
- El `enabled` flag debe depender del mismo estado para que la suscripción ocurra cuando el dato esté disponible
- Cargar el `unreadCount` inicial desde la DB en el `init()` (no asumir que empieza en 0)

---

## Eventos Implementados

### ExpenseUpdated
- **Trigger**: Staff crea o elimina un gasto (`ExpenseController::store`, `destroy`)
- **Canal**: `payments.{tenantSlug}`
- **Evento**: `expense.updated`
- **Payload**: `{ ts }` (solo señal, sin datos)
- **Frontend staff**: `useAdminDashboard` — handler llama `loadExpenses()` si `activeTabRef.current === 'expenses'`
- **Frontend student**: `student/page.tsx` — handler llama `getExpenses()` siempre (datos frescos al entrar a rendición)
- **CRÍTICO**: `loadExpenses`, `loadSchedules`, `loadFees` en `useAdminDashboard` deben leer de `brandingSlugRef.current` y `tokenRef.current`, NO de `branding?.slug` y `token` directamente — de lo contrario el closure queda stale con valores vacíos del primer render

### StudentCheckedIn
- **Trigger**: Staff marca asistencia o alumno escanea QR
- **Canal**: `attendance.{tenantSlug}`
- **Evento**: `student.checked-in`
- **Payload**: `{ studentId, studentName, studentPhoto, tenantSlug }`

### StudentCheckedOut
- **Trigger**: Staff desmarca asistencia
- **Canal**: `attendance.{tenantSlug}`
- **Evento**: `student.checked-out`
- **Payload**: `{ studentId, studentName, tenantSlug }`

### NotificationSent
- **Trigger**: Backend crea notificación para usuario
- **Canal**: `notifications.{tenantSlug}.{userId}` (público)
- **Evento**: `notification.sent`
- **Payload**: `{ notificationId, title, body, type, userId, tenantSlug }`
- **Nota**: Canal público con userId en el nombre (no requiere auth endpoint)

---

## Próximos Eventos (Pendientes)

### PaymentReceived
- **Trigger**: Pago confirmado
- **Canal**: `notifications.{tenantSlug}.{userId}`
- **Evento**: `payment.received`
- **Payload**: `{ paymentId, studentId, amount, status }`
