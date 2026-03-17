# Product Overview — Digitaliza Todo

## Purpose
Digitaliza Todo is a multi-tenant SaaS platform designed for any business or industry (academies, clinics, gyms, schools, etc.) in Chile. It provides a universal infrastructure for management: client/student enrollment, attendance tracking, guardian/payer management, and automated payment processing — all under a modular, per-tenant white-label model.

## Value Proposition
- **Versatility**: Adaptable vocabularies and configurations for different industries (Martial Arts, Fitness, Dance, Music, etc.)
- **Isolated Environments**: Each business gets its own isolated tenant environment with custom branding
- **Mobile-First Management**: Manage everything from a PWA (app-pwa) designed for field operation
- **Self-Service Portals**: Clients can access their information, history, and payments through a branded portal
- **Automated Communication**: Notifications via Telegram, WhatsApp, and email

## Applications

### saas-backend (Laravel 12 + Filament 3)
The central API and admin panel. Handles:
- Multi-tenancy via `stancl/tenancy` (path-based tenant resolution)
- Authentication with Laravel Sanctum (token-based for APIs)
- Three Filament panels: Admin (superadmin), Tenant (school admin), Portal (student/guardian)
- REST API consumed by all frontend apps
- Realtime broadcasting via Laravel Reverb (WebSockets)
- Payment processing integration
- Telegram bot notifications
- Email via Resend

### app-pwa (Next.js 16 + React 19)
Mobile-first Progressive Web App for teachers. Features:
- Dashboard with attendance management
- Student listing and detail views
- Guardian (payer) management
- QR code scanning for attendance (planned: `@zxing/browser`)
- QR code generation per student (`qrcode.react`)
- Tenant-aware routing via `[slug]` dynamic segments

### portal-alumno (Next.js 16 + React 19)
Student/guardian self-service portal. Features:
- Attendance history viewing
- Payment status
- Student registration flow (`[tenant]/registro`)
- Tenant-branded experience via BrandingContext

### landing (Astro 4 + React 19)
Public marketing site for Digitaliza Todo. Features:
- Animated UI with GSAP, Motion (Framer Motion), Three.js/OGL
- Shadcn/ui components with Radix UI primitives
- Contact/lead capture forms (PHP API backend in `/api`)
- SEO-optimized static pages

### ricardohuiscaleo (Astro)
Personal portfolio site for the developer.

## Target Users
- **School administrators**: manage students, enrollments, payments via Filament panel
- **Teachers**: record attendance, view student lists via app-pwa
- **Parents/Guardians (Apoderados)**: view student info, attendance, payments via portal-alumno
- **Superadmin**: manage all tenants via the central admin panel

## Key Business Features
- **Standardized Architecture**: Uses numeric auto-incrementing IDs for all primary entities (Tenants, Users, Students, Guardians) for better performance and integrity.
- **Multi-tenant Isolation**: Each school = one tenant, own DB schema. URLs and identification use `slugs` (friendly names) resolved internally to numeric IDs.
- **Trial period management**: `CheckTenantTrial` middleware.
- Subscription plans per tenant
- QR-based attendance verification
- Payment tracking with success/failure flows
- Telegram bot for notifications

## Realtime Architecture
- **Server**: Laravel Reverb on port 8080 (managed by supervisord)
- **Client**: laravel-echo + pusher-js on Next.js frontends
- **Events**: `ShouldBroadcastNow` (synchronous, no queue worker needed)
- **Channels**: Public per-tenant (`attendance.{slug}`), Private per-user planned (`private-user.{id}`)
- **Full documentation**: `.amazonq/rules/memory-bank/realtime.md`

## Web Push Architecture
- **VAPID keys**: generadas con `npx web-push generate-vapid-keys`, guardadas en Coolify env vars (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`)
- **Backend**: `minishlink/web-push` (composer), `PushSubscription` model, `PushController`, `Notification::sendWebPush()` llamado desde `Notification::send()`
- **Frontend**: `lib/push.ts` → `subscribeToPush()` llamado en dashboard al autenticar
- **SW**: handler `push` en `sw.js` → `showNotification()` + `setAppBadge()`
- **Tabla**: `push_subscriptions` (user_id, tenant_id, endpoint, public_key, auth_token)
- **Flujo**: Notificación creada → WebSocket (app abierta) + Web Push (app cerrada, badge garantizado iOS/Android)
