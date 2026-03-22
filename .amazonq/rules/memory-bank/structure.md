# Project Structure — Digitaliza Todo

## Monorepo Layout

```
digital2/
├── Applications/
│   ├── saas-backend/       # Laravel 12 API + Filament admin panels
│   ├── app-pwa/            # Next.js 16 PWA for teachers
│   ├── portal-alumno/      # Next.js 16 portal for students/guardians
│   ├── landing/            # Astro 4 public marketing site
│   └── ricardohuiscaleo/   # Astro personal portfolio
├── docker-compose.yml      # Orchestrates landing + ricardohuiscaleo
├── package.json            # Root workspace (landing + ricardohuiscaleo only)
└── PENDIENTES.md           # Feature backlog
```

Root npm workspaces only cover `landing` and `ricardohuiscaleo`. The other apps (`app-pwa`, `portal-alumno`, `saas-backend`) are managed independently.

---

## saas-backend (Laravel 12)

```
saas-backend/
├── app/
│   ├── Filament/
│   │   ├── Pages/Auth/         # Custom Filament auth pages
│   │   ├── Resources/          # Superadmin resources (Tenant, User)
│   │   └── Tenant/Resources/   # Tenant-scoped resources (Student, Guardian, Attendance, Payment, Plan, Enrollment)
│   ├── Http/
│   │   ├── Controllers/Api/    # REST API controllers (Auth, Student, Attendance, Guardian, Payment, Plan, etc.)
│   │   ├── Middleware/         # ResolveTenantFromPath, CheckTenantTrial, RoleMiddleware
│   │   └── Responses/Auth/     # Custom Filament login/logout/register responses
│   ├── Models/                 # Eloquent models (Tenant, User, Student, Guardian, Attendance, Payment, Plan, Enrollment)
│   ├── Providers/Filament/     # AdminPanelProvider, TenantPanelProvider, PortalPanelProvider
│   ├── Services/               # PaymentService, TelegramService
│   └── Mail/                   # WelcomeTenantMail, TestResendMail
├── routes/
│   ├── api.php                 # All REST API routes (prefixed /api/{tenant}/...)
│   ├── tenant.php              # Domain-based tenant routes (stancl/tenancy)
│   └── web.php                 # Web routes
├── database/
│   ├── migrations/
│   └── seeders/
└── bootstrap/
    └── app.php                 # Middleware registration
```

### API Route Structure
All tenant-scoped API routes follow the pattern `/api/{tenant}/...`:
- Public: `POST /api/{tenant}/auth/login`, `GET /api/{tenant}/info`, `GET /api/{tenant}/plans`
- Sanctum-protected: `GET /api/{tenant}/me`, `GET /api/{tenant}/students`, `GET /api/{tenant}/attendance`
- Role-protected (`role:teacher,admin,owner`): `POST /api/{tenant}/attendance`, `GET /api/{tenant}/payers`, `POST /api/{tenant}/settings/*`
- Global (no tenant): `POST /api/register-tenant`, `POST /api/identify-tenant`

### Three Filament Panels
- `AdminPanelProvider` → `/admin` — superadmin, manages all tenants
- `TenantPanelProvider` → `/panel` — school admin, manages own tenant data
- `PortalPanelProvider` → `/portal` — student/guardian self-service

---

## app-pwa (Next.js 16)

```
app-pwa/src/
├── app/
│   ├── [slug]/             # Tenant-aware public pages (login, register)
│   │   └── register/
│   ├── dashboard/          # Protected teacher dashboard
│   │   ├── attendance/     # Attendance management page
│   │   ├── student/        # Student detail page
│   │   ├── layout.tsx      # Dashboard layout wrapper
│   │   └── page.tsx        # Main dashboard (students, payers, settings)
│   ├── login/              # Login page
│   ├── onboarding/         # New tenant onboarding
│   ├── payment/            # Payment success/failure pages
│   └── r/[code]/           # Registration page via code
├── components/ui/          # Shadcn/ui components (Button, Card, Badge, Input, Tabs, etc.)
├── context/
│   └── BrandingContext.tsx # Tenant branding
├── hooks/                  # Modular architecture
│   ├── useAdminDashboard.ts
│   ├── useDashboardCommon.ts
│   ├── useMartialArtsData.ts
│   ├── useTreasuryData.ts
│   ├── useStudentCommon.ts
│   ├── useStudentTreasuryData.ts
│   └── useStudentMartialArtsData.ts
└── lib/
    ├── api.ts              # API calls
    └── utils.ts            # Helpers
```

---



---

## landing (Astro 4)

```
landing/src/
├── components/
│   ├── animated-icons/     # Custom animated icon components
│   └── StaggeredMenu.tsx   # Animated navigation menu (React island)
├── pages/                  # Astro pages (static routes)
└── layouts/
api/                        # PHP backend for contact forms
```

---

## Architectural Patterns

- **Standardized IDs**: All primary entities (Tenants, Users, Guardians, Students) use numeric auto-incrementing IDs for internal logic and database foreign keys.
- **Multi-tenancy (Slug-based)**: Path-based resolution (`/api/{tenant}/...`) where `{tenant}` is a unique string `slug`. The `ResolveTenantFromPath` middleware translates this slug into a numeric `id` for internal use.
- **Auth flow**: Sanctum Bearer tokens stored in localStorage/cookies on frontend; sent as `Authorization: Bearer {token}` header.
- **Tenant context on frontend**: `BrandingContext` provides tenant slug, logo, and colors to all components.
- **Resilient API Layer**: Frontend apps use a `safeJson()` utility that gracefully handles non-JSON responses by returning `null`, preventing application crashes during server errors (e.g. 500s).
- **Role-based access**: `role:teacher,admin,owner` middleware on write routes; roles stored per-user per-tenant.
- **Filament panels**: Three separate panels with distinct providers, each scoped to a user role.
- **Realtime via WebSockets**: Laravel Reverb (port 8080) + Laravel Echo on frontend. Events use `ShouldBroadcastNow` (no queue worker needed). Public channels per tenant (`attendance.{slug}`). Full architecture documented in `realtime.md`.
- **Auth dual (staff + guardian)**: Rutas protegidas usan `auth:sanctum,guardian-api`. Staff autentica con guard `sanctum` (modelo `User`), apoderados con guard `guardian-api` (modelo `Guardian`). Configurado en `config/auth.php`.
- **Rutas duplicadas (PELIGRO)**: Si un `GET` existe en el grupo público/sanctum Y en el grupo `role:staff`, Laravel resuelve el último registrado. Eliminar siempre el GET del grupo staff y dejar solo POST/PUT/DELETE.
- **Schedules en student init**: `getSchedules` se llama en `Promise.all` junto con `refreshData()` en el `useEffect([], [])` inicial — garantiza que el horario esté disponible al primer render sin depender del profile.
- **Skeleton loading**: Ambas apps (staff `page.tsx` y student `page.tsx`) muestran skeleton `animate-pulse` mientras `loading=true`. Layout usa `bg-stone-50` (no negro) para evitar flash oscuro.
