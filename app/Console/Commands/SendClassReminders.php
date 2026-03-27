<?php

namespace App\Console\Commands;

use App\Models\Schedule;
use App\Models\Notification;
use Illuminate\Console\Command;
use Carbon\Carbon;

class SendClassReminders extends Command
{
    /**
     * El nombre y la firma del comando.
     *
     * @var string
     */
    protected $signature = 'classes:send-reminders';

    /**
     * La descripción del comando.
     *
     * @var string
     */
    protected $description = 'Envía recordatorios de clases a los apoderados 30 minutos antes del inicio';

    /**
     * Ejecuta el comando de consola.
     */
    public function handle(): void
    {
        // Usamos la hora actual del sistema (debe estar en la misma zona que los horarios guardados)
        $now = Carbon::now();
        
        // Buscamos clases que comiencen exactamente en 30 minutos (basado en HH:MM)
        $targetTime = $now->copy()->addMinutes(30)->format('H:i');
        $dayOfWeek = $now->dayOfWeek; // 0 (Domingo) a 6 (Sábado)

        $this->info("Buscando clases para hoy (Día {$dayOfWeek}) a las {$targetTime}...");

        $schedules = Schedule::where('day_of_week', $dayOfWeek)
            ->where('start_time', 'like', $targetTime . '%')
            ->with(['students.guardians', 'tenant'])
            ->get();

        if ($schedules->isEmpty()) {
            $this->info("No hay clases programadas para esta ventana de tiempo.");
            return;
        }

        foreach ($schedules as $schedule) {
            foreach ($schedule->students as $student) {
                foreach ($student->guardians as $guardian) {
                    $title = "🥋 Recordatorio de Clase";
                    $body = "¡Hola! {$student->name} tiene clase de " . ($schedule->name ?? $schedule->subject ?? 'Artes Marciales') . " a las {$schedule->start_time}. ¡Te esperamos!";
                    
                    // Notification::send se encarga de Web Push y WebSockets automáticamente
                    Notification::send(
                        (int) $schedule->tenant_id,
                        (int) $guardian->id,
                        $title,
                        $body,
                        'class_reminder',
                        $schedule->tenant->slug
                    );
                    
                    $this->info("Enviado recordatorio a {$guardian->name} por el alumno {$student->name}.");
                }
            }
        }

        $this->info('Proceso de recordatorios finalizado.');
    }
}
