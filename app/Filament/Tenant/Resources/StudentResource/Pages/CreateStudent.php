<?php

namespace App\Filament\Tenant\Resources\StudentResource\Pages;

use App\Filament\Tenant\Resources\StudentResource;
use Filament\Actions;
use Filament\Resources\Pages\CreateRecord;

class CreateStudent extends CreateRecord
{
    protected static string $resource = StudentResource::class;
}
