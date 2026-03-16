# Pendientes — Digitaliza Todo

## ✅ Completado Recientemente

### WebSockets / Realtime ✅
- Laravel Reverb configurado y funcionando en producción
- Eventos `StudentCheckedIn` y `StudentCheckedOut` broadcast en tiempo real
- Staff dashboard y Student dashboard escuchan eventos via WebSocket
- Reconexión automática en móviles (visibilitychange listener)
- Documentación completa en `.amazonq/rules/memory-bank/realtime.md`

### Mejoras UI Student Card ✅
- Tag "Presente" condicional cuando alumno tiene asistencia hoy
- Botón QR con icono más grande (28px), fondo negro, borde gris
- Texto simplificado: "Registra tu asistencia 👉🏻"

### Timezone Chile ✅
- Helpers `todayCL()` y `nowCL()` en `utils.ts`
- Todas las comparaciones de fecha usan timezone `America/Santiago`

### Optimistic Updates ✅
- `toggleAttendance()` actualiza `attendanceHistory` inmediatamente
- UI responde sin esperar respuesta del servidor

### Compresión de Fotos ✅
- Fotos de perfil: 150x150 WebP @ 80% quality
- Comprobantes de pago: 1200x1200 (sin cambio)

### Service Worker Cache Fix ✅
- SW solo cachea assets estáticos (manifest, iconos)
- API calls bypasean el cache completamente

---

## 🔴 Alta Prioridad

### Sistema de Notificaciones In-App ✅ (Backend listo)
**Estado:** Backend completo, falta frontend.

**Backend completado:**
- [x] Tabla `notifications` creada
- [x] Modelo `Notification` con scopes
- [x] Evento `NotificationSent` (ShouldBroadcastNow)
- [x] Canal: `notifications.{tenantSlug}.{userId}` (público, no requiere auth)
- [x] `GET /api/{tenant}/notifications` — listar
- [x] `POST /api/{tenant}/notifications/{id}/read` — marcar leída
- [x] `POST /api/{tenant}/notifications/read-all` — marcar todas leídas

**Frontend pendiente:**
- [ ] Componente `NotificationBell` con badge de no leídas
- [ ] Dropdown/panel de notificaciones
- [ ] Escuchar canal `notifications.{slug}.{userId}`
- [ ] Toast cuando llega notificación nueva

**Triggers pendientes (backend):**
- [ ] Asistencia registrada → notificar al apoderado
- [ ] Pago recibido → notificar al apoderado
- [ ] Pago vencido → notificar al apoderado

---

### Escaneo QR de Asistencia (in-app)
**Objetivo:** El profesor abre la cámara dentro del tab de Asistencia, escanea el QR del alumno y se registra la asistencia automáticamente.

**Plan técnico:**
- [ ] Instalar `@zxing/browser` (lector QR via cámara)
- [ ] Crear componente `QRScanner` en `src/components/QRScanner.tsx`
- [ ] Agregar botón "Escanear QR" en tab Asistencia del staff dashboard
- [ ] Backend: ruta existente `POST /{tenant}/attendance/verify-qr`

**Librerías:**
```bash
npm install @zxing/browser @zxing/library
```

**Notas:**
- `getUserMedia` requiere HTTPS ✅
- iOS Safari funciona desde iOS 14.3+

---

## 🟡 Media Prioridad

### App Updates / Changelog ✅ (Backend listo)
**Estado:** Backend completo, falta UI frontend.

- [x] Tabla `app_updates` creada y poblada con historial
- [x] Modelo `AppUpdate`
- [x] `GET /api/app-updates` con filtro `?target=staff|student`
- [x] Comando `php artisan app:register-update` para deploy scripts
- [x] Documentación en `.amazonq/rules/memory-bank/deploy.md`
- [ ] UI en perfil para mostrar changelog
- [ ] Notificación de "nueva versión disponible" en PWA

### Limpieza UI Student Dashboard
- [ ] Mover títulos redundantes del body al header
- [ ] Remover logo duplicado del body en vista Home

---

## 🟢 Baja Prioridad / Ideas

- Historial de asistencia exportable (PDF/Excel)
- Dashboard de métricas para admin (asistencia promedio, pagos pendientes)
- Modo offline completo con sync cuando vuelve conexión
- Notificaciones push nativas (requiere service worker + VAPID keys)
