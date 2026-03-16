# Guía de Deploy — Digitaliza Todo

## Registro de Actualizaciones

Cada deploy significativo debe registrar un update en `app_updates` para que los usuarios vean el changelog.

### Opción 1: Comando Artisan (en producción)

```bash
php artisan app:register-update "1.4.0" "Sistema de notificaciones" "Notificaciones in-app en tiempo real cuando se registra asistencia o pagos." --target=all
```

Parámetros:
- `version`: Semver (1.4.0)
- `title`: Título corto
- `description`: Descripción del cambio
- `--target`: `all` | `staff` | `student`

### Opción 2: SQL Directo

```sql
INSERT INTO app_updates (version, title, description, target, published_at, created_at, updated_at) 
VALUES ('1.4.0', 'Sistema de notificaciones', 'Notificaciones in-app en tiempo real.', 'all', NOW(), NOW(), NOW());
```

### Opción 3: Desde Amazon Q (Recomendado)

Cuando completemos un feature, yo (Amazon Q) te daré el INSERT listo:

```sql
-- COPIAR Y EJECUTAR EN DB:
INSERT INTO app_updates (version, title, description, target, published_at, created_at, updated_at) 
VALUES ('1.4.0', 'Sistema de notificaciones', 'Notificaciones in-app en tiempo real cuando se registra asistencia o pagos.', 'all', NOW(), NOW(), NOW());
```

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
