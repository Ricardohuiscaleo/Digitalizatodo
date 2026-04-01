# Servidor de Producción Digitalizatodo (Coolify)

Detalles de acceso y reglas de mantenimiento para el entorno de producción.

## Credenciales de Acceso ROOT
- **IP**: `76.13.126.63`
- **Usuario**: `root`
- **Acceso**: Vía SSH (llave autorizada en este Mac)

## Estructura de Aplicación
- **ID Coolify**: `bo888gk4kg8w0wossc00ccs8`
- **Regla de Contenedores**: Los nombres empiezan por `bo888gk4kg8w0wossc00ccs8`.
- **Ruta de Código**: `/var/www/html/` (dentro del contenedor)

## Automatización (Cronjob)
Se ha instalado un cronjob en el servidor **ROOT** que detecta automáticamente el contenedor activo:
```bash
* * * * * docker exec $(docker ps -qf name=bo888gk4kg8w0wossc00ccs8) php artisan schedule:run >> /dev/null 2>&1
```
Este comando corre cada minuto y procesa pagos recurrentes, notificaciones y tareas programadas.

## Reglas de Oro (Sincronización de Pagos)
1. **Migrations via Laravel**: A partir del 1 de abril de 2026, **TODOS** los cambios estructurales deben realizarse vía `php artisan migrate`. No realizar cambios manuales en MySQL.
2. **Dual Push Mandatory**: Siempre que se modifique `saas-backend`, se debe ejecutar el `git subtree push` al repositorio independiente para que Coolify despliegue.
3. **Mantenimiento**: Si las migraciones fallan, verificar primero si hay archivos obsoletos en `database/migrations/` que no estén en la tabla `migrations`.

## Base de Datos
- **Instancia**: Contenedor `eocws4gsgkk4ck800w8g8000`
- **Database**: `saas_backend`
- **Usuario**: `root`
