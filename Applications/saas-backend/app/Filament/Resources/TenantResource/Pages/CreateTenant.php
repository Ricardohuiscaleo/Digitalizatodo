<?php

namespace App\Filament\Resources\TenantResource\Pages;

use App\Filament\Resources\TenantResource;
use Filament\Resources\Pages\CreateRecord;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Filament\Notifications\Notification;
use App\Services\TelegramService;

class CreateTenant extends CreateRecord
{
    protected static string $resource = TenantResource::class;

    protected function afterCreate(): void
    {
        $tenant = $this->record;
        $data = $this->form->getRawState();

        // Crear el Usuario Administrador asignado a este Tenant
        if (isset($data['admin_email']) && isset($data['admin_password']) && isset($data['admin_name'])) {
            $user = User::create([
                'name' => $data['admin_name'],
                'email' => $data['admin_email'],
                'password' => Hash::make($data['admin_password']),
                'tenant_id' => $tenant->id,
            ]);

            Notification::make()
                ->title('Tenant Creado Exitosamente')
                ->body("El usuario {$user->email} ha sido generado.")
                ->success()
                ->send();

            // Notificar por Telegram
            $trialDate = $tenant->saas_trial_ends_at?->format('d/m/Y') ?? 'N/A';
            $tgMessage = "*Nueva Empresa Creada (Manual)*\n\n";
            $tgMessage .= "*Empresa:* {$tenant->name}\n";
            $tgMessage .= "*Industria:* {$tenant->industry}\n";
            $tgMessage .= "*Admin:* {$user->name} ({$user->email})\n";
            $tgMessage .= "*Trial:* Vence el {$trialDate}\n\n";
            $tgMessage .= "🔗 [admin.digitalizatodo.cl/{$tenant->id}](https://admin.digitalizatodo.cl/{$tenant->id})";
            
            TelegramService::sendMessage($tgMessage);
        }
    }
}