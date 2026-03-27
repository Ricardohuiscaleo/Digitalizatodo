<?php

namespace App\Filament\Tenant\Resources\BeltConfigResource\Pages;

use App\Filament\Tenant\Resources\BeltConfigResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListBeltConfigs extends ListRecords
{
    protected static string $resource = BeltConfigResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
