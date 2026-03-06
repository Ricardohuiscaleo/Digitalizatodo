<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a Digitaliza Todo</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .wrapper { max-width: 560px; margin: 0 auto; padding: 2rem 1rem; }
        .card { background: #1e293b; border-radius: 1rem; overflow: hidden; border: 1px solid #334155; }
        .header { background: #f59e0b; padding: 2rem; text-align: center; }
        .header h1 { color: #0f172a; font-size: 1.4rem; font-weight: 800; }
        .body { padding: 2rem 2.5rem; }
        .body p { color: #cbd5e1; line-height: 1.7; margin-bottom: 1rem; font-size: 0.95rem; }
        .body strong { color: #f8fafc; }
        .highlight { background: #0f172a; border-radius: 0.5rem; padding: 1rem 1.25rem; margin: 1.5rem 0; border-left: 3px solid #f59e0b; }
        .highlight p { margin: 0; color: #94a3b8; font-size: 0.85rem; }
        .highlight span { color: #f59e0b; font-weight: 700; font-size: 1rem; }
        .btn-wrap { text-align: center; margin: 2rem 0; }
        .btn { display: inline-block; background: #f59e0b; color: #0f172a; font-weight: 800; padding: 0.875rem 2.5rem; border-radius: 0.5rem; text-decoration: none; font-size: 1rem; }
        .footer { padding: 1.5rem; text-align: center; color: #475569; font-size: 0.75rem; border-top: 1px solid #334155; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="card">
            <div class="header">
                <h1>🎉 ¡Bienvenido a Digitaliza Todo!</h1>
            </div>
            <div class="body">
                <p>Hola <strong>{{ $user->name }}</strong>,</p>
                <p>
                    Tu empresa <strong>{{ $tenant->name }}</strong> ya está activa en nuestra plataforma.
                    Tienes <strong>7 días de prueba gratuita</strong> para explorar todo lo que podemos hacer por ti.
                </p>

                <div class="highlight">
                    <p>Tu panel de control</p>
                    <span>{{ config('app.url') }}/{{ $tenant->id }}</span>
                </div>

                <p>Dentro encontrarás alumnos de demo, pagos y asistencias ya cargados para que veas el sistema funcionando desde el primer segundo.</p>

                <div class="btn-wrap">
                    <a href="{{ config('app.url') }}/{{ $tenant->id }}" class="btn">
                        Ir a mi Panel →
                    </a>
                </div>

                <p style="font-size:0.85rem; color:#64748b;">
                    Si tienes dudas, responde este correo o escríbenos por WhatsApp. Estamos para ayudarte.
                </p>
            </div>
            <div class="footer">
                © {{ date('Y') }} Digitaliza Todo — Todos los derechos reservados
            </div>
        </div>
    </div>
</body>
</html>
