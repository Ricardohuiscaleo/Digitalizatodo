# Pendientes — Digitaliza Todo

## 🔴 Alta Prioridad

### Escaneo QR de Asistencia (in-app, sin salir de la PWA)
**Objetivo:** El profesor abre la cámara dentro del tab de Asistencia, escanea el QR del alumno y se registra la asistencia automáticamente.

**Plan técnico:**
- Instalar `@zxing/browser` (lector QR via cámara con `getUserMedia`)
- Crear componente `QRScanner` en `src/components/QRScanner.tsx`:
  - Usa `<video>` tag para mostrar el stream de la cámara
  - `BrowserQRCodeReader` de `@zxing/browser` decodifica frames en tiempo real
  - Al detectar un QR válido (student_id), llama `storeAttendance` y cierra el scanner
  - Overlay con botón de cerrar para no salir de la PWA
- Agregar botón "Escanear QR" en `renderAttendance()` del dashboard
- Backend: el QR de cada alumno debe contener su `student_id` (ya existe en el modelo)
- Ruta backend existente: `POST /{tenant}/attendance/verify-qr` en `AttendanceController`

**Librerías:**
```bash
npm install @zxing/browser @zxing/library
```

**Notas:**
- `getUserMedia` requiere HTTPS (ya tenemos en producción ✅)
- En iOS Safari funciona desde iOS 14.3+
- El componente debe ser `"use client"` y usar `useRef` para el elemento `<video>`

---

## 🟡 Media Prioridad

### Generación de QR por Alumno
- Cada alumno necesita su QR único (contiene su `student_id`)
- Mostrar QR en la vista de detalle del alumno (app del apoderado/alumno)
- Librería sugerida: `qrcode.react`

---

## 🟢 Baja Prioridad / Ideas

- Notificaciones push cuando se registra asistencia
- Historial de asistencia por alumno individual
