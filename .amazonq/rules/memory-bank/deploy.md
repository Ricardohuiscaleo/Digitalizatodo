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
| `GET /api/{tenant}/push/vapid-public-key` | Clave pública VAPID (auth requerida) |
| `POST /api/{tenant}/push/subscribe` | Guardar suscripción Web Push |
| `POST /api/{tenant}/push/unsubscribe` | Eliminar suscripción Web Push |
