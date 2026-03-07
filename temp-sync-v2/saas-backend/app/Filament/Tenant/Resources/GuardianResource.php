<?php

namespace App\Filament\Tenant\Resources;

use App\Filament\Tenant\Resources\GuardianResource\Pages;
use App\Models\Guardian;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class GuardianResource extends Resource
{
    protected static ?string $model = Guardian::class;
    protected static ?string $tenantOwnershipRelationshipName = 'tenant';
    protected static ?string $navigationIcon = 'heroicon-o-users';
    protected static ?string $modelLabel = 'Apoderado';
    protected static ?string $pluralModelLabel = 'Apoderados';
    protected static ?int $navigationSort = 4;
    protected static ?string $navigationGroup = 'Gestión';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
            Forms\Components\Section::make('Datos del Apoderado')
            ->schema([
                Forms\Components\TextInput::make('name')
                ->label('Nombre Completo')
                ->required()
                ->maxLength(255),
                Forms\Components\TextInput::make('email')
                ->label('Correo Electrónico')
                ->email()
                ->maxLength(255),
                Forms\Components\TextInput::make('phone')
                ->label('Teléfono')
                ->tel()
                ->maxLength(255),
                Forms\Components\Toggle::make('active')
                ->label('Activo')
                ->default(true),
            ])->columns(['sm' => 2]),

            Forms\Components\Section::make('Alumnos Asociados')
            ->description('Selecciona los alumnos que este apoderado tiene a su cargo')
            ->schema([
                Forms\Components\Select::make('students')
                ->label('Alumnos')
                ->relationship('students', 'name')
                ->multiple()
                ->searchable()
                ->preload(),
            ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
            Tables\Columns\TextColumn::make('name')
            ->label('Nombre')
            ->searchable()
            ->sortable(),
            Tables\Columns\TextColumn::make('email')
            ->label('Correo')
            ->searchable(),
            Tables\Columns\TextColumn::make('phone')
            ->label('Teléfono'),
            Tables\Columns\TextColumn::make('students_count')
            ->label('Alumnos')
            ->counts('students')
            ->badge()
            ->color('info'),
            Tables\Columns\IconColumn::make('active')
            ->label('Activo')
            ->boolean(),
        ])
            ->filters([
            Tables\Filters\TernaryFilter::make('active')
            ->label('Solo Activos'),
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
            'index' => Pages\ListGuardians::route('/'),
            'create' => Pages\CreateGuardian::route('/create'),
            'edit' => Pages\EditGuardian::route('/{record}/edit'),
        ];
    }
}