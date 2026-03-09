---
description: Despliegue dual sincronizado (Monorepo + Standalone Backend)
---
Este proceso asegura que los cambios realizados en el monorepo `Digitalizatodo` se reflejen correctamente en el repositorio independiente `saas-backend` que usa Coolify para el despliegue.

### Pasos obligatorios:

1. **Commit en Monorepo**:
   - Asegúrate de estar en la raíz de `digital2`.
   - Haz commit de todos los cambios (incluyendo los de `Applications/saas-backend`).
   ```bash
   git add .
   git commit -m "tu mensaje"
   git push origin main
   ```

// turbo
2. **Push a Standalone Backend**:
   - Ejecuta este comando para extraer la subcarpeta del backend y subirla al repositorio independiente.
   ```bash
   git subtree split --prefix Applications/saas-backend -b tmp-deploy && \
   git push backend tmp-deploy:main -f && \
   git branch -D tmp-deploy
   ```

3. **Verificación en Coolify**:
   - Accede al panel de Coolify.
   - Verifica que el despliegue haya comenzado con el último commit (puedes ver el SHA en los logs).
   - Confirma que el "Rolling update" termine sin errores.

### Notas importantes:
- **No saltes el paso 1**: Si no haces commit local, el `subtree split` subirá una versión antigua.
- **Remoto 'backend'**: El alias `backend` debe apuntar a `https://github.com/Ricardohuiscaleo/saas-backend.git`.
