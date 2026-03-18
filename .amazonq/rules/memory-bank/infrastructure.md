# Infraestructura — Digitaliza Todo

## Servidor VPS (Hostinger)

- **Nombre:** `srv1331519.hstgr.cloud`
- **Plan:** Hostinger KVM 2
- **Sistema:** Ubuntu 24.04 con Coolify pre-instalado.
- **Specs Técnicas:**
    - **CPU:** 2 vCPUs
    - **RAM:** 8192 MB (8GB)
    - **Disco:** 100 GB SSD
    - **Bandwidth:** 8 TB
- **IP Principal:** `76.13.126.63`

## Gestión vía API (Hostinger)

Se dispone de un API Token para gestionar el VPS programáticamente:
- **Token:** `QoKAvSEB08CRDD8qA9ARkFiwwVcOyLVSUQfwqCXD7a04f20d`

### Comandos Útiles

**Ver estado del VPS (Power, RAM, CPU):**
```bash
curl -X GET "https://developers.hostinger.com/api/vps/v1/virtual-machines" \
-H "Authorization: Bearer QoKAvSEB08CRDD8qA9ARkFiwwVcOyLVSUQfwqCXD7a04f20d" \
-H "Content-Type: application/json"
```

**Reiniciar VPS (Solo en emergencia):**
```bash
curl -X POST "https://developers.hostinger.com/api/vps/v1/virtual-machines/1331519/reboot" \
-H "Authorization: Bearer QoKAvSEB08CRDD8qA9ARkFiwwVcOyLVSUQfwqCXD7a04f20d" \
-H "Content-Type: application/json"
```

## Arquitectura de Deploy (Coolify)

El servidor utiliza **Coolify** para orquestar contenedores Docker.
- **Backend:** Se deploya desde `Ricardohuiscaleo/saas-backend` (main).
- **Frontend/Mobile PWA:** Se orquesta vía Webhooks desde este monorepo.

### Límites de Build
Aunque el VPS tiene 8GB de RAM, los builds de Docker pueden ser intensivos. Se recomienda mantener el `composer.lock` sincronizado para evitar que el motor de resolución de dependencias de Composer agote los recursos durante el despliegue.
