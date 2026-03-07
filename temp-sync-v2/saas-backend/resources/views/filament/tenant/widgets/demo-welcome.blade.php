<x-filament-widgets::widget>
    <x-filament::section>
        <div class="flex items-center gap-x-3">
            <div class="p-2 bg-primary-500/10 rounded-lg">
                <x-filament::icon icon="heroicon-o-sparkles" class="h-6 w-6 text-primary-500" />
            </div>
            <div>
                <h2 class="text-lg font-bold tracking-tight">¡Bienvenido a tu Academia Digital!</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    Hemos cargado 5 alumnos de prueba para que explores el sistema.
                </p>
            </div>
        </div>

        <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                <h3 class="font-semibold text-sm flex items-center gap-2">
                    <x-filament::icon icon="heroicon-m-device-phone-mobile" class="h-4 w-4" />
                    Prueba el Portal de Alumnos
                </h3>
                <p class="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    Tus alumnos y sus familias acceden desde <a href="https://mi.digitalizatodo.cl" target="_blank"
                        class="text-primary-500 font-bold underline">mi.digitalizatodo.cl</a>.
                </p>
                <div
                    class="mt-3 p-2 rounded bg-white dark:bg-white/5 text-[10px] font-mono border border-gray-100 dark:border-white/10">
                    <p><strong>Email:</strong> {{ auth()->user()->email }}</p>
                    <p><strong>Password:</strong> (Tu misma contraseña)</p>
                </div>
                <p class="mt-2 text-[10px] text-gray-500">
                    * También puedes usar: <strong>familia@digitalizatodo.cl</strong> / <strong>demo1234</strong>
                </p>
            </div>

            <div class="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                <h3 class="font-semibold text-sm flex items-center gap-2">
                    <x-filament::icon icon="heroicon-m-academic-cap" class="h-4 w-4" />
                    ¿Qué sigue?
                </h3>
                <ul class="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Crea tus propios **Planes de Pago**.</li>
                    <li>• Registra a tus **Alumnos** reales.</li>
                    <li>• Gestiona **Asistencias** desde el móvil.</li>
                </ul>
                <div class="mt-4">
                    <x-filament::button href="/guardians" tag="a" size="xs" color="gray">
                        Ver Apoderados Demo
                    </x-filament::button>
                </div>
            </div>
        </div>
    </x-filament::section>
</x-filament-widgets::widget>