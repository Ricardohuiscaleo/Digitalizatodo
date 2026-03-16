<?php

namespace App\Console\Commands;

use App\Models\AppUpdate;
use Illuminate\Console\Command;

class RegisterAppUpdate extends Command
{
    protected $signature = 'app:register-update
        {version : Versión semántica (ej: 1.4.0)}
        {title : Título corto del update}
        {description : Descripción del cambio}
        {--target=all : all|staff|student}';

    protected $description = 'Registra una actualización en app_updates';

    public function handle(): int
    {
        $update = AppUpdate::create([
            'version' => $this->argument('version'),
            'title' => $this->argument('title'),
            'description' => $this->argument('description'),
            'target' => $this->option('target'),
            'published_at' => now(),
        ]);

        $this->info("✅ Update {$update->version} registrado (id: {$update->id})");
        return 0;
    }
}
