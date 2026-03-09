# Product Overview — Digitaliza Todo

## Purpose
Digitaliza Todo is a multi-tenant SaaS platform for educational institutions (schools, academies) in Chile. It digitizes school management: student enrollment, attendance tracking, guardian (apoderado) management, and payment processing — all under a white-label, per-tenant model.

## Value Proposition
- Schools get their own isolated tenant environment with branded portals
- Teachers manage attendance via a mobile-first PWA (app-pwa)
- Parents/guardians access student info through a dedicated portal (portal-alumno)
- Admins manage everything via a Filament-powered admin panel
- Automated notifications via Telegram and email (Resend)

## Applications

### saas-backend (Laravel 12 + Filament 3)
The central API and admin panel. Handles:
- Multi-tenancy via `stancl/tenancy` (path-based tenant resolution)
- Authentication with Laravel Sanctum (token-based for APIs)
- Three Filament panels: Admin (superadmin), Tenant (school admin), Portal (student/guardian)
- REST API consumed by all frontend apps
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
