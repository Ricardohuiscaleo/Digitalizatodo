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

## Tipos de Canales

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

### Logs Útiles

```bash
# Logs de Reverb
docker exec -it <container> cat /var/log/supervisor/reverb.out.log
docker exec -it <container> cat /var/log/supervisor/reverb.err.log

# Estado de supervisord
docker exec -it <container> supervisorctl status
```

---

## Eventos Implementados

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

---

## Próximos Eventos (Pendientes)

### NotificationSent (Sistema de Notificaciones)
- **Trigger**: Backend envía notificación a usuario
- **Canal**: `private-user.{userId}` (canal privado)
- **Evento**: `notification.sent`
- **Payload**: `{ id, title, body, type, createdAt }`

### PaymentReceived
- **Trigger**: Pago confirmado
- **Canal**: `attendance.{tenantSlug}` o `private-user.{userId}`
- **Evento**: `payment.received`
- **Payload**: `{ paymentId, studentId, amount, status }`
