<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prueba Expirada | Digitaliza Todo</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            font-family: 'Outfit', sans-serif;
            background: radial-gradient(circle at top right, #1e1b4b, #0f172a);
        }

        .glass {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
    </style>
</head>

<body class="min-h-screen flex items-center justify-center p-6 text-white text-center">
    <div class="max-w-xl w-full glass rounded-3xl p-10 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-700">
        <!-- Logo -->
        <div class="flex justify-center">
            <img src="{{ asset('DLogo-v2.webp', true) }}" alt="Digitaliza Todo" class="h-16 w-auto">
        </div>

        <!-- Timer Icon -->
        <div class="flex justify-center">
            <div
                class="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/30 animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                    stroke="currentColor" class="w-10 h-10 text-amber-500">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
            </div>
        </div>

        <!-- Message -->
        <div class="space-y-4">
            <h1 class="text-4xl font-bold tracking-tight">Tu periodo de prueba ha finalizado</h1>
            <p class="text-gray-400 text-lg leading-relaxed">
                Esperamos que hayas disfrutado explorando <strong>Digitaliza Todo</strong> durante estos 7 días. Tu
                cuenta y datos siguen seguros, pero para continuar transformando tu gestión, necesitas activar un plan.
            </p>
        </div>

        <!-- Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <a href="https://wa.me/56922504275?text=Hola! Mi prueba en Digitaliza Todo ha terminado y quiero activar un plan."
                target="_blank"
                class="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-4 px-8 rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20">
                Hablar con Soporte por WhatsApp
            </a>
            <a href="/" class="glass hover:bg-white/10 font-semibold py-4 px-8 rounded-2xl transition-all">
                Volver al inicio
            </a>
        </div>

        <!-- Footer -->
        <p class="text-gray-500 text-sm">
            &copy; {{ date('Y') }} Digitaliza Todo. Impulsando tu crecimiento.
        </p>
    </div>
</body>

</html>