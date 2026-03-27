---
description: Despliegue dual sincronizado (Monorepo + Standalone Backend)
---

# Arquitectura de Repositorios

Este proyecto usa un monorepo (`Ricardohuiscaleo/Digitalizatodo`) pero Coolify despliega desde repositorios independientes:

| Carpeta | Remote para Coolify | Comando de push |
|---------|---------------------|-----------------|
| `Applications/saas-backend` | `backend` → `Ricardohuiscaleo/saas-backend` | `git subtree push --prefix=Applications/saas-backend backend main` |
| `Applications/admin-pwa` | (monorepo) | `git push origin main` |
| `Applications/app-pwa` | (monorepo) | `git push origin main` |
| `Applications/landing` | (monorepo) | `git push origin main` |

# ⚠️ REGLA CRÍTICA

**Siempre** que se modifiquen archivos en `Applications/saas-backend/`, DEBES ejecutar AMBOS comandos:

1. Push al monorepo (normal):
```
git add Applications/saas-backend/... && git commit -m "..." && git push origin main
```

// turbo
2. Push al repo independiente del backend (para que Coolify lo detecte):
```
git subtree push --prefix=Applications/saas-backend backend main
```

# Flujo Completo de Despliegue

1. Hacer cambios en los archivos del proyecto
2. `git add` + `git commit` + `git push origin main` (monorepo)
3. Si hay cambios en `saas-backend`: `git subtree push --prefix=Applications/saas-backend backend main`
4. Esperar que Coolify detecte el nuevo commit en `Ricardohuiscaleo/saas-backend` y despliegue automáticamente
