# Resolución de Problemas: Dashboard Vacío y Errores WebSocket

Este documento detalla la investigación y solución de un problema crítico donde el dashboard no mostraba estudiantes ("SIN RESULTADOS") y la conexión WebSocket fallaba en el entorno local.

## 1. Problema de Datos: Dashboard Vacío

### Diagnóstico
El dashboard administrativo (`app-pwa`) realizaba peticiones a `/api/{slug}/payers` pero no mostraba ningún dato, a pesar de que la API devolvía registros válidos en las herramientas de red.

**Causa Raíz:**
Mala comunicación entre el formato de respuesta del backend y la expectativa del frontend:
- **Backend (`GuardianController@index`)**: Retornaba un array directo `[ {id: 1, ...}, ... ]`.
- **Frontend (`useDashboardCommon.ts`)**: Buscaba los datos estrictamente en `data.payers`. Al recibir un array, `data.payers` resultaba `undefined`, lo que provocaba que el estado se inicializara vacío.

### Solución Aplicada
1. **Back-end**: Se envolvió la respuesta de `GuardianController.php` en una clave `payers` para ser consistente con otros controladores (como `StudentController`).
2. **Front-end (Resiliencia)**: Se actualizaron los hooks `useDashboardCommon` y `useAdminDashboard` para manejar ambos formatos (array directo o envuelto), evitando fallos similares en el futuro:
   ```typescript
   const payersList = data?.payers || (Array.isArray(data) ? data : []);
   ```

---

## 2. Problema de WebSocket: Conexión Inválida

### Diagnóstico
En el entorno local, la consola mostraba errores de conexión WebSocket:
`[Error] WebSocket connection to 'wss://admin.digitalizatodo.cl:8080/app/...' failed`.

**Causa Raíz:**
Configuración de puerto incorrecta en el entorno local:
- El servidor Reverb escucha internamente en el puerto `8080` (HTTP).
- El proxy SSL (Nginx/Coolify) expone la conexión segura en el puerto `443` (HTTPS/WSS).
- Intentar conectar a `wss://...:8080` fallaba porque el puerto `8080` no tiene certificado SSL directo ni suele estar abierto al tráfico público.

### Solución Aplicada
Se actualizó el puerto en `.env.local`:
- **Antes**: `NEXT_PUBLIC_REVERB_PORT=8080`
- **Después**: `NEXT_PUBLIC_REVERB_PORT=443`
Esto permite que la conexión pase por el puerto estándar de HTTPS, donde el proxy se encarga de redirigir el tráfico al puerto interno `8080` de Reverb de forma segura.

---

## 3. Despliegue de Cambios

Para asegurar la sincronización entre el monorepo y el despliegue de Coolify, se utilizó el workflow de **Dual Push**:
1. Commit en el Monorepo (`Digitalizatodo`).
2. Push al repositorio independiente del backend (`saas-backend`) mediante `git subtree push`.

**Nota:** Siempre que se modifique `Applications/saas-backend`, se debe sincronizar el repositorio secundario para que Coolify pueda reconstruir los contenedores.
