<?php

namespace App\Filament\Tenant\Resources\AttendanceResource\Pages;

use App\Filament\Tenant\Resources\AttendanceResource;
use Filament\Actions;
use Filament\Resources\Pages\ManageRecords;

class ManageAttendances extends ManageRecords
{
    protected static string $resource = AttendanceResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
