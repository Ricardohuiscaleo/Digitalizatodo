<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registro Exitoso</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .wrapper {
            max-width: 600px;
            margin: 0 auto;
            padding: 2rem 1rem;
        }

        .card {
            background: #ffffff;
            border-radius: 1.5rem;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .header {
            background: #1e293b;
            padding: 2.5rem 2rem;
            text-align: center;
        }

        .header h1 {
            color: #ffffff;
            font-size: 1.5rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: -0.025em;
        }

        .body {
            padding: 2.5rem;
        }

        .body p {
            color: #475569;
            line-height: 1.6;
            margin-bottom: 1.25rem;
            font-size: 1rem;
        }

        .body strong {
            color: #1e293b;
        }

        .info-box {
            background: #f1f5f9;
            border-radius: 1rem;
            padding: 1.5rem;
            margin: 2rem 0;
            border: 1px solid #e2e8f0;
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px solid #e2e8f0;
        }

        .info-row:last-child {
            border-bottom: none;
        }

        .info-label {
            color: #64748b;
            font-size: 0.875rem;
            font-weight: 600;
            text-transform: uppercase;
        }

        .info-value {
            color: #1e293b;
            font-size: 0.95rem;
            font-weight: 700;
        }

        .btn-wrap {
            text-align: center;
            margin: 2.5rem 0;
        }

        .btn {
            display: inline-block;
            background: #1e293b;
            color: #ffffff;
            font-weight: 800;
            padding: 1rem 2.5rem;
            border-radius: 0.75rem;
            text-decoration: none;
            font-size: 1rem;
            transition: all 0.2s;
        }

        .footer {
            padding: 1.5rem;
            text-align: center;
            color: #94a3b8;
            font-size: 0.75rem;
        }
    </style>
</head>

<body>
    <div class="wrapper">
        <div class="card">
            <div class="header" style="background-color: {{ $tenant->primary_color ?? '#1e293b' }}">
                <h1>{{ $isForTenant ? '🆕 Nuevo Registro' : '✅ Registro Exitoso' }}</h1>
            </div>
            <div class="body">
                @if($isForTenant)
                <p>Hola <strong>Administrador</strong>,</p>
                <p>Se ha registrado un nuevo alumno en <strong>{{ $tenant->name }}</strong> a través de la página de
                    registro.</p>
                @else
                <p>Hola <strong>{{ $guardian->name }}</strong>,</p>
                <p>¡Bienvenido a <strong>{{ $tenant->name }}</strong>! Tu registro se ha completado correctamente. Aquí
                    tienes los detalles:</p>
                @endif

                <div class="info-box">
                    <div class="info-row">
                        <span class="info-label">Academia</span>
                        <span class="info-value">{{ $tenant->name }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Titular</span>
                        <span class="info-value">{{ $guardian->name }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Alumnos</span>
                        <span class="info-value">{{ $studentCount }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Plan Solicitado</span>
                        <span class="info-value">{{ $plan->name }}</span>
                    </div>
                </div>

                @if(!$isForTenant)
                <p>Ya puedes acceder a tu panel para ver tus pagos, asistencias y credencial digital.</p>
                <div class="btn-wrap">
                    <a href="{{ config('app.url') }}/{{ $tenant->slug ?? $tenant->id }}" class="btn">
                        Entrar a mi Academia →
                    </a>
                </div>
                @endif

                <p style="font-size:0.875rem; color:#94a3b8; text-align:center;">
                    {{ $isForTenant ? 'Revisa tu panel de administración para gestionar este nuevo registro.' : 'Si
                    tienes cualquier duda, contáctanos directamente.' }}
                </p>
            </div>
            <div class="footer">
                © {{ date('Y') }} Digitaliza Todo — Tecnología para tu Academia
            </div>
        </div>
    </div>
</body>

</html>