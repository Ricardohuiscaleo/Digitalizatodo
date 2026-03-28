<?php

namespace App\Filament\Tenant\Resources;

use App\Filament\Tenant\Resources\BeltConfigResource\Pages;
use App\Models\BeltConfig;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class BeltConfigResource extends Resource
{
    protected static ?string $model = \App\Models\BeltConfig::class;

    protected static ?string $navigationIcon = 'heroicon-o-academic-cap';
    protected static ?string $navigationGroup = 'Configuración BJJ';
    protected static ?string $modelLabel = 'Configuración de Cinturón';
    protected static ?string $pluralModelLabel = 'Configuraciones de Cinturones';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Select::make('category')
                    ->options([
                        'adults' => 'Adultos / Juveniles',
                        'kids' => 'Kids (Niños)',
                        'professors' => 'Profesores / Maestros',
                    ])
                    ->required(),
                Forms\Components\TextInput::make('belt_rank')
                    ->label('Cinturón')
                    ->required(),
                Forms\Components\TextInput::make('next_belt')
                    ->label('Siguiente Cinturón'),
                Forms\Components\TextInput::make('classes_per_stripe')
                    ->label('Clases por Raya')
                    ->numeric()
                    ->default(30)
                    ->required(),
                Forms\Components\TextInput::make('total_for_belt')
                    ->label('Total para Ascenso')
                    ->numeric()
                    ->default(150)
                    ->required(),
                Forms\Components\TextInput::make('min_age')
                    ->label('Edad Mínima')
                    ->numeric()
                    ->default(0),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('category')
                    ->label('Categoría')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'adults' => 'info',
                        'kids' => 'success',
                        'professors' => 'warning',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('belt_rank')
                    ->label('Cinturón')
                    ->searchable(),
                Tables\Columns\TextColumn::make('classes_per_stripe')
                    ->label('Clases/Raya'),
                Tables\Columns\TextColumn::make('total_for_belt')
                    ->label('Total'),
                Tables\Columns\TextColumn::make('min_age')
                    ->label('Edad Mín.'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('category')
                    ->options([
                        'adults' => 'Adultos',
                        'kids' => 'Kids',
                    ]),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListBeltConfigs::route('/'),
            'create' => Pages\CreateBeltConfig::route('/create'),
            'edit' => Pages\EditBeltConfig::route('/{record}/edit'),
        ];
    }
}
