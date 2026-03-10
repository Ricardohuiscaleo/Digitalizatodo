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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            padding: 2rem 1rem;
        }

        .wrapper {
            max-width: 600px;
            margin: 0 auto;
        }

        .logo-container {
            text-align: center;
            margin-bottom: 2rem;
        }

        .logo-container img {
            max-height: 80px;
            max-width: 200px;
            border-radius: 12px;
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
            padding: 2rem;
            text-align: center;
        }

        .header h1 {
            color: #ffffff;
            font-size: 1.5rem;
            font-weight: 800;
            letter-spacing: -0.025em;
            margin: 0;
        }

        .body {
            padding: 2.5rem;
        }

        .body p {
            color: #475569;
            line-height: 1.6;
            margin-bottom: 1.5rem;
            font-size: 1rem;
            text-align: center;
        }

        .body strong {
            color: #1e293b;
        }

        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin: 2rem 0;
        }

        .info-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 1rem;
            padding: 1.25rem;
            text-align: center;
        }

        .info-card.full-width {
            grid-column: span 2;
        }

        .info-label {
            display: block;
            color: #64748b;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.5rem;
        }

        .info-value {
            display: block;
            color: #1e293b;
            font-size: 1.125rem;
            font-weight: 800;
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
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .footer {
            padding: 2rem 1.5rem;
            text-align: center;
            color: #94a3b8;
            font-size: 0.75rem;
        }

        .footer a {
            color: #64748b;
            text-decoration: underline;
            text-underline-offset: 2px;
        }

        @media (max-width: 480px) {
            .info-grid {
                grid-template-columns: 1fr;
            }

            .info-card {
                grid-column: span 1;
            }

            .info-card.full-width {
                grid-column: span 1;
            }

            .body {
                padding: 1.5rem;
            }
        }
    </style>
</head>

<body>
    <div class="wrapper">
        @if(!empty($tenant->logo))
        <div class="logo-container">
            <img src="{{ str_starts_with($tenant->logo, 'http') ? $tenant->logo : config('app.url') . '/storage/' . $tenant->logo }}"
                alt="{{ $tenant->name }}">
        </div>
        @endif

        <div class="card">
            <div class="header" style="background-color: {{ $tenant->primary_color ?? '#1e293b' }}">
                <h1>{{ $isForTenant ? '🆕 Nuevo Registro' : '✅ Registro Exitoso' }}</h1>
            </div>
            <div class="body">
                @if($isForTenant)
                <p>Hola <strong>Administrador</strong>,<br>Se ha registrado un nuevo alumno en <strong>{{ $tenant->name
                        }}</strong>.</p>
                @else
                <p>Hola <strong>{{ $guardian->name }}</strong>,<br>¡Bienvenido a <strong>{{ $tenant->name }}</strong>!
                    Tu registro se ha completado correctamente.</p>
                @endif

                <div class="info-grid">
                    <div class="info-card">
                        <span class="info-label">Academia</span>
                        <span class="info-value">{{ $tenant->name }}</span>
                    </div>
                    <div class="info-card">
                        <span class="info-label">Plan</span>
                        <span class="info-value">{{ $plan->name }}</span>
                    </div>
                    <div class="info-card full-width">
                        <span class="info-label">Titular de Cuenta</span>
                        <span class="info-value">{{ $guardian->name }}</span>
                    </div>
                    <div class="info-card full-width">
                        <span class="info-label">Total Alumnos Inscritos</span>
                        <span class="info-value">{{ $studentCount }}</span>
                    </div>
                </div>

                @if(!$isForTenant)
                <p>Ya puedes acceder a tu panel de alumno para gestionar tus pagos, ver asistencias y obtener tu
                    credencial digital.</p>
                <div class="btn-wrap">
                    <a href="{{ config('app.url') }}/{{ $tenant->slug ?? $tenant->id }}" class="btn">
                        Entrar a mi Academia →
                    </a>
                </div>
                @endif

                <p style="font-size:0.875rem; color:#94a3b8; text-align:center; margin-bottom: 0;">
                    {{ $isForTenant ? 'Revisa tu panel de administración para ver los detalles completos.' : 'Si tienes
                    cualquier duda con tu inscripción, contáctanos directamente.' }}
                </p>
            </div>
            <div class="footer">
                © {{ date('Y') }} <a href="https://digitalizatodo.cl" target="_blank">Digitaliza Todo - The Software
                    Factory</a>
            </div>
        </div>
    </div>
</body>

</html>