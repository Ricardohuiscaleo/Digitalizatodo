<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $isForTenant ? 'Nuevo Registro' : 'Registro Exitoso' }}</title>
    <style>
        body { background: #f4f4f5; font-family: system-ui, -apple-system, sans-serif; padding: 40px 20px; margin: 0; }
        .email-wrapper { background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.08); color: #27272a; max-width: 560px; margin: 0 auto; }
        .email-header { padding: 40px 40px 0 40px; }
        .brand-logo { margin-bottom: 24px; }
        .brand-logo img { max-height: 48px; border-radius: 8px; }
        .badge { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 12px; border-radius: 99px; margin-bottom: 20px; }
        .badge.emerald { background: #d1fae5; color: #059669; }
        .badge.indigo { background: #e0e7ff; color: #4338ca; }
        .email-title { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: #18181b; }
        .email-body { padding: 30px 40px 40px 40px; }
        .greeting { font-size: 16px; font-weight: 700; color: #18181b; margin-bottom: 8px; }
        .email-text { font-size: 15px; line-height: 1.6; color: #52525b; margin-top: 0; margin-bottom: 20px; }
        .cred-section { background: #fafafa; border: 1px solid #f4f4f5; border-radius: 12px; padding: 24px; margin: 30px 0; }
        .cred-grid { display: table; width: 100%; border-collapse: collapse; }
        .cred-col { display: table-cell; width: 50% !important; padding-bottom: 16px; vertical-align: top; }
        .cred-label { font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; margin-bottom: 6px; display: block; }
        .cred-value { font-size: 15px; font-weight: 500; color: #18181b; }
        .btn { display: block; text-align: center; font-weight: 600; padding: 14px 24px; border-radius: 8px; text-decoration: none; margin-top: 30px; font-size: 15px; background: #4f46e5; color: #ffffff !important; }
        .email-footer { padding: 32px 40px; text-align: center; color: #71717a; font-size: 13px; border-top: 1px solid #f4f4f5; background: #fafafa; line-height: 1.6; }
        .footer-brand { font-weight: 800; color: #18181b; letter-spacing: 0.05em; margin-bottom: 4px; }
        .contact-link { color: #ea580c; text-decoration: none; font-weight: 700; }
        @media only screen and (max-width: 480px) {
            .cred-col { display: block !important; width: 100% !important; }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-header">
            @if(!empty($tenant->logo))
            <div class="brand-logo">
                <img src="{{ str_starts_with($tenant->logo, 'http') ? $tenant->logo : config('app.url') . '/storage/' . $tenant->logo }}" alt="{{ $tenant->name }}">
            </div>
            @endif
            <span class="badge {{ $isForTenant ? 'indigo' : 'emerald' }}">
                {{ $isForTenant ? 'Notificación de Staff' : 'Inscripción Confirmada' }}
            </span>
            <h1 class="email-title">{{ $isForTenant ? 'Nuevo Registro' : '¡Bienvenido(a)!' }}</h1>
        </div>
        <div class="email-body">
            @if($isForTenant)
                <p class="greeting">Hola Administrador,</p>
                <p class="email-text">Se ha registrado un nuevo alumno en <strong>{{ $tenant->name }}</strong>. Aquí tienes los detalles básicos:</p>
            @else
                <p class="greeting">Hola {{ $guardian->name }},</p>
                <p class="email-text">¡Tu registro se ha completado correctamente en <strong>{{ $tenant->name }}</strong>! Ya eres parte de nuestra comunidad.</p>
            @endif

            <div class="cred-section">
                <!-- Grid de información -->
                <div class="cred-grid">
                    <tr>
                        <td class="cred-col">
                            <span class="cred-label">Academia</span>
                            <div class="cred-value">{{ $tenant->name }}</div>
                        </td>
                        <td class="cred-col">
                            <span class="cred-label">Plan Adquirido</span>
                            <div class="cred-value">{{ $plan->name }}</div>
                        </td>
                    </tr>
                </div>

                <div style="margin-top: 16px;">
                    <span class="cred-label">Titular de Cuenta</span>
                    <div class="cred-value">{{ $guardian->name }}</div>
                </div>

                <div style="margin-top: 16px;">
                    <span class="cred-label">Total Alumnos Inscritos</span>
                    <div class="cred-value">{{ $studentCount }} {{ $studentCount == 1 ? 'Alumno' : 'Alumnos' }}</div>
                </div>
            </div>

            @if(!$isForTenant)
                <p class="email-text" style="font-size: 14px; color: #71717a;">
                    Ya puedes acceder a tu panel para gestionar tus pagos y asistencias.
                </p>
                <a href="https://app.digitalizatodo.cl/{{ $tenant->slug ?? $tenant->id }}" class="btn">Entrar a mi Academia →</a>
            @endif

            <p style="font-size: 13px; color: #a1a1aa; text-align: center; margin-top: 24px; margin-bottom: 0;">
                Para soporte técnico, consultas de ventas o desarrollo a medida<br>
                <a href="https://wa.me/56945392581" target="_blank" class="contact-link">contacto directo</a>
            </p>
        </div>
        <div class="email-footer">
            <div class="footer-brand">DIGITALIZA TODO</div>
            <div>Somos una empresa de desarrollo de software a la medida</div>
            <div style="margin: 12px 0;">
                <a href="https://digitalizatodo.cl/" target="_blank" style="color: #4f46e5; text-decoration: none; font-weight: 600;">¿Necesitas nuestros servicios? Haz click aquí</a>
            </div>
            <div style="font-size: 11px; color: #a1a1aa; margin-top: 20px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">DIGITALIZANDO EN ARICA, CHILE 🇨🇱</div>
        </div>
    </div>
</body>
</html>