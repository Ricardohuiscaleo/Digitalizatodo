<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperar Contraseña</title>
    <style>
        body { background: #f4f4f5; font-family: system-ui, -apple-system, sans-serif; padding: 40px 20px; margin: 0; }
        .email-wrapper { background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.08); color: #27272a; max-width: 560px; margin: 0 auto; }
        .email-header { padding: 40px 40px 0 40px; }
        .badge { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 12px; border-radius: 99px; margin-bottom: 20px; background: #e0e7ff; color: #4338ca; }
        .email-title { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: #18181b; }
        .email-body { padding: 30px 40px 40px 40px; }
        .greeting { font-size: 16px; font-weight: 700; color: #18181b; margin-bottom: 8px; }
        .email-text { font-size: 15px; line-height: 1.6; color: #52525b; margin-top: 0; margin-bottom: 20px; }
        .btn { display: block; text-align: center; font-weight: 600; padding: 14px 24px; border-radius: 8px; text-decoration: none; margin-top: 30px; font-size: 15px; background: #4f46e5; color: #ffffff !important; }
        .email-footer { padding: 32px 40px; text-align: center; color: #71717a; font-size: 13px; border-top: 1px solid #f4f4f5; background: #fafafa; line-height: 1.6; }
        .footer-brand { font-weight: 800; color: #18181b; letter-spacing: 0.05em; margin-bottom: 4px; }
        .contact-link { color: #ea580c; text-decoration: none; font-weight: 700; }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-header">
            <span class="badge">Acceso y Seguridad</span>
            <h1 class="email-title">Recuperar tu acceso 🛡️</h1>
        </div>
        <div class="email-body">
            <p class="greeting">Hola {{ $user->name }},</p>
            <p class="email-text">Has solicitado un enlace para restablecer tu contraseña en <strong>{{ $tenant->name }}</strong>. Si no has sido tú, puedes ignorar este correo con seguridad.</p>

            <div style="background: #fafafa; border: 1px solid #f4f4f5; border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0;">
                <p style="font-size: 13px; color: #71717a; margin-bottom: 0;">Presiona el botón de abajo para continuar con el proceso:</p>
            </div>

            @php
                $slug = $tenant->slug ?? $tenant->id;
                $resetUrl = "https://{$slug}.digitalizatodo.cl/auth/reset-password?token={$token}&email=" . urlencode($user->email) . "&tenant={$slug}";
            @endphp
            <a href="{{ $resetUrl }}" class="btn">Restablecer Contraseña →</a>

            <p style="font-size: 12px; color: #a1a1aa; text-align: center; margin-top: 30px;">
                Este enlace expirará en 60 minutos por motivos de seguridad.
            </p>

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
