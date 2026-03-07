<?php

namespace App\Filament\Tenant\Resources\EnrollmentResource\Pages;

use App\Filament\Tenant\Resources\EnrollmentResource;
use Filament\Resources\Pages\ListRecords;

class ListEnrollments extends ListRecords
{
    protected static string $resource = EnrollmentResource::class;

    protected function getHeaderActions(): array
    {
        return [
            \Filament\Actions\CreateAction::make(),
        ];
    }
}