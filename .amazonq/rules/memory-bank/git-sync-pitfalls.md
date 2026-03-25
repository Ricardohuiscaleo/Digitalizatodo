# Git Sync Pitfalls — Digitaliza Todo

## Arquitectura de Repos

Hay **dos repos separados** que deben mantenerse sincronizados manualmente:

| Repo | Path local | Remote | Deploy |
|------|-----------|--------|--------|
| Frontend | `~/digital2/` | `Ricardohuiscaleo/Digitalizatodo.git` | Coolify auto |
| Backend | `~/saas-backend-repo/` | `Ricardohuiscaleo/saas-backend.git` | Coolify auto |

El monorepo `digital2/Applications/saas-backend/` es una **copia de referencia** — los cambios deben aplicarse en `~/saas-backend-repo/` para que lleguen a producción.

---

## ⚠️ Problema: `git pull --rebase` descarta commits silenciosamente

### Qué pasó (sesión actual)
1. Edité `digital2/Applications/saas-backend/routes/api.php` → fix correcto
2. Copié con `cp` a `saas-backend-repo/routes/api.php`
3. Hice commit en `saas-backend-repo`
4. Push falló (remote tenía cambios nuevos)
5. Hice `git stash && git pull --rebase && git stash pop && git push`
6. El rebase imprimió: **"dropping ... patch contents already upstream"** → descartó mi commit
7. Push dijo "Everything up-to-date" — parecía exitoso
8. En realidad el fix **nunca llegó** al remoto

### Por qué ocurre
`git rebase` compara el **diff del patch**, no el estado final del archivo. Si el remoto tenía cambios en el mismo archivo (aunque distintos), git puede marcar el patch como "ya aplicado" y descartarlo — incluso si el resultado final es diferente.

### Cómo detectarlo
```bash
# Después de un rebase, SIEMPRE verificar que el cambio está en el remoto:
git log --oneline origin/main | head -5
# Si tu commit no aparece → fue descartado

# O verificar el contenido directamente:
grep -n "tu_cambio" archivo_modificado
```

---

## ✅ Flujo Correcto para Cambios en Backend

### Opción A — Editar directamente en `saas-backend-repo` (recomendado)
```bash
# 1. Editar el archivo en el repo correcto
nano ~/saas-backend-repo/routes/api.php

# 2. Verificar el cambio
grep -n "lo_que_cambié" ~/saas-backend-repo/routes/api.php

# 3. Commit y push
cd ~/saas-backend-repo
git add archivo
git commit -m "fix: descripción"
git push
```

### Opción B — Si el remoto tiene cambios nuevos (push rechazado)
```bash
# NUNCA hacer git pull --rebase sin verificar después

# Opción segura:
git fetch origin
git diff HEAD origin/main -- archivo_modificado  # ver conflictos reales
git pull --rebase
# Verificar que el commit NO fue descartado:
git log --oneline | head -3
grep -n "mi_cambio" archivo  # confirmar que está
git push
```

### Opción C — Si el rebase descartó el commit
```bash
# El archivo quedó sin el cambio → reaplicar manualmente
# Editar de nuevo, commit, push
git add archivo
git commit -m "fix: re-apply [descripción] (lost in rebase)"
git push
```

---

## ⚠️ Problema: Rutas duplicadas en `api.php` causan 403

### Regla crítica de Laravel
Laravel resuelve la **última ruta registrada** que coincide con el método+path. Si un `GET /schedules` existe en el grupo público Y en el grupo `role:staff`, el del grupo staff gana → guardians reciben 403.

### Patrón correcto
```php
// ✅ GET solo en el grupo público (o sanctum sin rol)
Route::get('schedules', [ScheduleController::class, 'index']); // línea ~71

// ✅ Solo escritura en el grupo staff
Route::middleware('role:teacher,admin,owner')->group(function () {
    // NO poner Route::get('schedules') aquí
    Route::post('schedules', [...]);
    Route::put('schedules/{id}', [...]);
    Route::delete('schedules/{id}', [...]);
});
```

### Checklist al agregar rutas
- [ ] Buscar si ya existe el mismo método+path en otro grupo: `grep -n "Route::get('schedules'" routes/api.php`
- [ ] Si existe en grupo público → NO duplicar en grupo staff
- [ ] Si el endpoint debe ser accesible por guardians Y staff → ponerlo en `auth:sanctum,guardian-api` (no en `role:staff`)

---

## ⚠️ Problema: Schedules de `martial_arts` usan `name`, no `subject`

### Diferencia entre industrias
| Campo | `school_treasury` | `martial_arts` |
|-------|------------------|----------------|
| `subject` | `"MATEMÁTICAS"` | `NULL` |
| `name` | `NULL` o igual | `"GI - Adultos (Noche)"` |
| `color` | hex `"#3b82f6"` | `NULL` |
| `category` | `NULL` | `"Adulto"` / `"Kids"` |

### Solución en frontend
```typescript
// En cualquier componente que muestre schedules:
const getLabel = (s: ScheduleEntry) => s.subject || s.name || null;
```

Implementado en `WeeklySchedule.tsx` — usar `getLabel(schedule)` en vez de `schedule.subject` directamente.

---

## Checklist Pre-Push Backend

```bash
cd ~/saas-backend-repo

# 1. Verificar que el cambio está en el archivo
grep -n "mi_cambio" routes/api.php

# 2. Sin rutas GET duplicadas
grep -n "Route::get('schedules'" routes/api.php  # debe aparecer solo 1 vez

# 3. Push y confirmar
git push
git log --oneline origin/main | head -3  # mi commit debe estar aquí
```
