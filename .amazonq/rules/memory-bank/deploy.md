# Guía de Deploy — Digitaliza Todo

## Registro de Actualizaciones

Cada deploy significativo registra automáticamente un update en `app_updates` para que los usuarios vean el changelog.

### Flujo Automático (Recomendado)

Crear/actualizar `deploy_update.sql` en la raíz de `saas-backend-repo`:

```sql
INSERT INTO app_updates (version, title, description, target, published_at, created_at, updated_at)
SELECT '1.5.0', 'Título del cambio', 'Descripción detallada.', 'all', NOW(), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM app_updates WHERE version = '1.5.0');
```

`start.sh` lo ejecuta automáticamente en cada deploy y lo elimina después. El `WHERE NOT EXISTS` previene duplicados si el container se reinicia.

### Desde Amazon Q

Cuando completemos un feature, yo (Amazon Q) creo el `deploy_update.sql` automáticamente antes del commit.

### Comando Artisan (manual, en producción)

```bash
php artisan app:register-update "1.5.0" "Título" "Descripción" --target=all
```

Parámetros:
- `version`: Semver (1.5.0)
- `title`: Título corto
- `description`: Descripción del cambio
- `--target`: `all` | `staff` | `student`

---

## Versionado Semántico

| Tipo | Ejemplo | Cuándo usar |
|------|---------|-------------|
| MAJOR (X.0.0) | 2.0.0 | Cambios breaking, rediseño completo |
| MINOR (1.X.0) | 1.4.0 | Nueva funcionalidad |
| PATCH (1.4.X) | 1.4.1 | Bug fixes, mejoras menores |

---

## Flujo de Deploy

### Backend (saas-backend-repo)

```bash
cd ~/saas-backend-repo
git add -A
git commit -m "feat: descripción del cambio"
git push
# Coolify detecta y hace deploy automático
```

### Frontend (digital2 monorepo)

```bash
cd ~/digital2
git add -A  
git commit -m "feat: descripción del cambio"
git push
# Coolify detecta y hace deploy automático
```

### Post-Deploy

1. Verificar que el deploy fue exitoso en Coolify
2. Probar la funcionalidad en producción
3. Registrar el update (SQL o comando artisan)

---

## Checklist Pre-Deploy

- [ ] Código probado localmente
- [ ] Sin console.log de debug (excepto [WS] logs)
- [ ] Archivos sincronizados entre monorepo y saas-backend-repo
- [ ] Commit message descriptivo
- [ ] Si es feature nuevo: preparar INSERT para app_updates

---

## Endpoints de Verificación

| Endpoint | Propósito |
|----------|-----------|
| `GET /api/debug` | Estado del servidor, config broadcast, health de Reverb |
| `GET /api/debug?emit={slug}` | Emitir evento de prueba WebSocket |
| `GET /api/app-updates` | Ver changelog registrado |
| `GET /api/app-updates?target=staff` | Changelog filtrado por target |
| `GET /api/{tenant}/push/vapid-public-key` | Clave pública VAPID (pública, sin auth) |
| `POST /api/{tenant}/push/subscribe` | Guardar suscripción Web Push (auth requerida) |
---

## Debugging en Producción

### Ver logs de Laravel en el container

```bash
# Encontrar el container del backend (el que tiene /var/www/html)
for c in $(docker ps --format '{{.Names}}'); do docker exec $c ls /var/www/html 2>/dev/null && echo "=== $c ===" && break; done

# Ejecutar código en tinker para ver error exacto de un endpoint
docker exec <container> php /var/www/html/artisan tinker --execute="..."
```

### Errores Conocidos y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `Column 'tenant_id' is ambiguous` | JOIN entre tablas que ambas tienen `tenant_id` | Calificar con nombre de tabla: `fee_payments.tenant_id` |
| 500 en endpoint con modelos | Modelo Eloquent no existe en `app/Models/` | Crear el modelo faltante |
| 404 en rutas que antes funcionaban | Controlador o ruta se perdió en un update | Recrear controlador y registrar ruta en `api.php` |
| `ShouldBroadcast` sin notificaciones | Queue worker no corre | Usar `ShouldBroadcastNow` siempre |
| 403 en endpoint para apoderados | Ruta duplicada en grupo `role:staff` sobreescribe la accesible | Eliminar el GET duplicado del grupo staff |
| 403 en rutas `auth:sanctum` para guardians | Guard `guardian-api` no configurado | Agregar guard sanctum en `auth.php` y usar `auth:sanctum,guardian-api` |
| Colores blancos/incorrectos en horario | Campo `color` guardado como nombre en español ("Naranja") en vez de hex | UPDATE schedules SET color = CASE color WHEN 'Naranja' THEN '#f97316'... |

### Modelos que deben existir (críticos)
Si alguno falta, los endpoints dan 500:
- `Fee`, `FeePayment`, `Expense` — para school_treasury
- `PushSubscription` — para Web Push
- `Schedule` — para horarios

---


Si el deploy falla durante el build de la imagen (específicamente en `composer install`):

### 1. Sincronización de `composer.lock` (CRÍTICO)
El error suele ocurrir porque `composer.lock` está desincronizado con `composer.json`. Esto obliga al servidor a "resolver" dependencias en vivo, agotando la RAM.
- **Solución**: Ejecutar `composer update --lock` localmente y hacer push del archivo `.lock`.

### 2. Configuración Docker Estable
Para el VPS (KVM 2) con RAM limitada (~2GB), la configuración más estable es:
- **Single-stage build**: Evita el overhead de capas intermedias.
- **Límite de RAM**: `ENV COMPOSER_MEMORY_LIMIT=2G`.
- **Instalación Manual**: La lista manual de extensiones PHP en el `Dockerfile` es más confiable que los instaladores automáticos en este entorno.

### 3. Check OOM
Si el build tarda menos de 3 minutos y falla con `exit code: 4`, es un pico de memoria. Si tarda más de 5 minutos, probablemente ya pasó la fase crítica de Composer.
