# CONTEXTO DEL PROYECTO — Digitaliza Todo
_Última actualización: 2026-03-08_

## Arquitectura
- **Monorepo local:** `/Users/ricardohuiscaleollafquen/digital2/`
  - `Applications/app-pwa/` → Next.js 16 PWA → deploy en `https://app.digitalizatodo.cl`
  - `Applications/saas-backend/` → copia de referencia del backend (NO es el repo que deploya)
- **Repo backend real (Coolify):** `https://github.com/Ricardohuiscaleo/saas-backend.git`
  - Clonado localmente en `/Users/ricardohuiscaleollafquen/saas-backend-repo/`
  - Deploya en `https://admin.digitalizatodo.cl`
- **Servidor:** `srv1331519.hstgr.cloud` (Hostinger KVM 2)
  - **Specs:** 2 vCPUs | **8GB RAM** | 100GB SSD (Ubuntu 24.04 + Coolify)
  - **IP:** `76.13.126.63`
  - **Hostinger API Token:** `QoKAvSEB08CRDD8qA9ARkFiwwVcOyLVSUQfwqCXD7a04f20d` (usar para monitoreo/reinicio)
- **Contenedor backend activo:** `bo888gk4kg8w0wossc00ccs8-001837956620`

## REGLA IMPORTANTE
Cualquier cambio al backend PHP/Laravel debe hacerse en **DOS lugares**:
1. `/Users/ricardohuiscaleollafquen/saas-backend-repo/` → push a `Ricardohuiscaleo/saas-backend`
2. `/Users/ricardohuiscaleollafquen/digital2/Applications/saas-backend/` → push al monorepo (referencia)

## Estado Actual (lo que funciona ✅)
- Login PWA → `/` funciona
- Dashboard con payers, attendance, payments → funciona
- Webhook Coolify → Telegram → funciona
- Rutas `settings/registration-page` → **YA EXISTEN** en el contenedor (verificado con `route:list`)
- Tabla `registration_pages` → **YA EXISTE** en MySQL

## Problema Activo 🔴
- `POST /api/integracao/settings/registration-page` devuelve 500
- Las rutas existen, la tabla existe
- Pendiente: ver respuesta real del curl dentro del contenedor
- Comando para debuggear:
  ```bash
  docker exec bo888gk4kg8w0wossc00ccs8-001837956620 curl -s -X POST 'http://localhost/api/integracao/settings/registration-page' -H 'Authorization: Bearer TOKEN' -H 'Accept: application/json'
  ```
- Sospecha: `app('currentTenant')` puede no estar disponible si el middleware `ResolveTenantFromPath` no se ejecuta correctamente

## Cambios Recientes (commits)
| Commit | Repo | Descripción |
|--------|------|-------------|
| `02c3810` | monorepo | fix: Loader2 import |
| `61af32a` | monorepo | fix: link /onboarding + migración registration_pages |
| `030de76` | monorepo | fix: telegram webhook siempre 200 + icon + título |
| `6c309c0` | monorepo | docs: PENDIENTES.md con plan QR scanner |
| `00948c0` | monorepo | feat: textos onboarding + pie de firma |
| `2397ecb` | saas-backend | sync: rutas + RoleMiddleware + TelegramBot |
| `652e81c` | saas-backend | fix: migración idempotente |
| `b536f5a` | saas-backend | fix: usar currentTenant en lugar de findOrFail |
| `db867ae` | saas-backend | fix: eliminar ruta AttendanceQRController inexistente |

## Variables de Entorno Backend (Coolify)
Configuradas directamente en Coolify. No se versionan aquí.

## Pendientes (ver PENDIENTES.md)
1. 🔴 Fix 500 en `settings/registration-page`
2. 🟡 QR Scanner in-app para asistencia (ver PENDIENTES.md)
3. 🟡 Generación de QR por alumno
