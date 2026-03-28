<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido al Equipo</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .wrapper { max-width: 560px; margin: 0 auto; padding: 2rem 1rem; }
        .card { background: #1e293b; border-radius: 1rem; overflow: hidden; border: 1px solid #334155; }
        .header { background: #6366f1; padding: 2rem; text-align: center; }
        .header h1 { color: #ffffff; font-size: 1.4rem; font-weight: 800; }
        .body { padding: 2rem 2.5rem; }
        .body p { color: #cbd5e1; line-height: 1.7; margin-bottom: 1rem; font-size: 0.95rem; }
        .body strong { color: #f8fafc; }
        .highlight { background: #0f172a; border-radius: 0.5rem; padding: 1.25rem; margin: 1.5rem 0; border-left: 3px solid #6366f1; }
        .highlight p { margin-bottom: 0.5rem; color: #94a3b8; font-size: 0.85rem; }
        .highlight div { color: #6366f1; font-weight: 700; font-size: 1rem; margin-top: 0.5rem; }
        .btn-wrap { text-align: center; margin: 2rem 0; }
        .btn { display: inline-block; background: #6366f1; color: #ffffff; font-weight: 800; padding: 0.875rem 2.5rem; border-radius: 0.5rem; text-decoration: none; font-size: 1rem; }
        .footer { padding: 1.5rem; text-align: center; color: #475569; font-size: 0.75rem; border-top: 1px solid #334155; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="card">
            <div class="header">
                <h1>🎉 ¡Bienvenido a {{ $tenant->name }}!</h1>
            </div>
            <div class="body">
                <p>Hola <strong>{{ $user->name }}</strong>,</p>
                <p>
                    Te han invitado a formar parte del equipo administrativo de <strong>{{ $tenant->name }}</strong> en nuestra plataforma.
                </p>

                <div class="highlight">
                    <p>Tus credenciales de acceso</p>
                    <div style="color: #cbd5e1; font-size: 0.9rem;">Email: <span style="color: #6366f1;">{{ $user->email }}</span></div>
                    <div style="color: #cbd5e1; font-size: 0.9rem;">Contraseña: <span style="color: #6366f1;">{{ $password }}</span></div>
                </div>

                <p>Desde tu panel podrás gestionar alumnos, asistencias y pagos según los permisos asignados a tu rol.</p>

                <div class="btn-wrap">
                    <a href="https://{{ $tenant->id }}.digitalizatodo.cl" class="btn">
                        Entrar a mi Panel →
                    </a>
                </div>

                <p style="font-size:0.85rem; color:#64748b;">
                    Por seguridad, te recomendamos cambiar tu contraseña una vez que hayas ingresado por primera vez en los ajustes de tu perfil.
                </p>
            </div>
            <div class="footer">
                © {{ date('Y') }} Digitaliza Todo — Gestión SaaS para Academias
            </div>
        </div>
    </div>
</body>
</html>
