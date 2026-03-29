<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a Digitaliza Todo</title>
    <style>
        body { background: #f4f4f5; font-family: system-ui, -apple-system, sans-serif; padding: 40px 20px; margin: 0; }
        .email-wrapper { background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.08); color: #27272a; max-width: 560px; margin: 0 auto; }
        .email-header { padding: 40px 40px 0 40px; }
        .badge { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 12px; border-radius: 99px; margin-bottom: 20px; background: #fef3c7; color: #b45309; }
        .email-title { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: #18181b; }
        .email-body { padding: 30px 40px 40px 40px; }
        .greeting { font-size: 16px; font-weight: 700; color: #18181b; margin-bottom: 8px; }
        .email-text { font-size: 15px; line-height: 1.6; color: #52525b; margin-top: 0; margin-bottom: 20px; }
        .cred-section { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 24px; margin: 30px 0; }
        .cred-row { margin-bottom: 16px; }
        .cred-row.spaced { margin-top: 24px; }
        .cred-label { font-size: 12px; color: #b45309; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; margin-bottom: 6px; display: block; }
        .cred-value { font-size: 15px; font-weight: 500; color: #18181b; }
        .password-box { background-color: #ffffff; border: 1px dashed #fde68a; padding: 12px 16px; border-radius: 8px; font-family: monospace; font-size: 15px; color: #18181b; text-align: center; letter-spacing: 1px; margin-top: 8px; }
        .btn { display: block; text-align: center; font-weight: 600; padding: 14px 24px; border-radius: 8px; text-decoration: none; margin-top: 30px; font-size: 15px; background: #18181b; color: #ffffff !important; }
        .email-footer { padding: 32px 40px; text-align: center; color: #71717a; font-size: 13px; border-top: 1px solid #f4f4f5; background: #fafafa; line-height: 1.6; }
        .footer-brand { font-weight: 800; color: #18181b; letter-spacing: 0.05em; margin-bottom: 4px; }
        .contact-link { color: #ea580c; text-decoration: none; font-weight: 700; }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-header">
            <span class="badge">Socio Estratégico</span>
            <h1 class="email-title">Tu academia está lista ✨</h1>
        </div>
        <div class="email-body">
            <p class="greeting">Hola {{ $user->name }},</p>
            <p class="email-text">Tu institución <strong>{{ $tenant->name }}</strong> ya se encuentra activa en nuestra infraestructura. Tienes un periodo promocional listo para usar.</p>

            <div class="cred-section">
                <div class="cred-row">
                    <span class="cred-label">Correo Electrónico</span>
                    <div class="cred-value">{{ $user->email }}</div>
                </div>

                <div class="cred-row spaced">
                    <span class="cred-label">Contraseña Temporal</span>
                    <div class="password-box">
                        {{ $password }}
                    </div>
                </div>
            </div>

            <p class="email-text" style="font-size: 14px; color: #71717a;">
                Como dueño de la institución, tienes acceso total al Panel de Control para configurar planes, staff y reportes.
            </p>

            <a href="https://app.digitalizatodo.cl/{{ $tenant->slug ?? $tenant->id }}" class="btn">Ir a mi Panel de Control →</a>

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
