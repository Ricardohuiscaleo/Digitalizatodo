<?php

namespace App\Filament\Tenant\Resources;

use App\Filament\Tenant\Resources\PlanResource\Pages;
use App\Models\Plan;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class PlanResource extends Resource
{
    protected static ?string $model = Plan::class;
    protected static ?string $tenantOwnershipRelationshipName = 'tenant';
    protected static ?string $navigationIcon = 'heroicon-o-credit-card';
    protected static ?string $modelLabel = 'Plan';
    protected static ?string $pluralModelLabel = 'Planes';
    protected static ?int $navigationSort = 2;

    public static function canAccess(): bool
    {
        $tenant = \Filament\Facades\Filament::getTenant();
        if (!$tenant) return false;
        
        $allowedIndustries = [
            'Escuela de Artes Marciales',
            'martial_arts',
            'school_treasury',
            'education',
        ];

        return in_array($tenant->industry, $allowedIndustries);
    }

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
            Forms\Components\Section::make('Información del Plan')
            ->schema([
                Forms\Components\TextInput::make('name')
                ->label('Nombre del Plan')
                ->placeholder('Ej: Mensualidad Adultos, Matrícula Anual')
                ->required()
                ->maxLength(255),
                Forms\Components\Select::make('category')
                    ->label('Categoría')
                    ->options([
                        'dojo' => 'Gimnasio / Dojo (Mensualidad)',
                        'vip' => 'VIP / Sesiones (Pack)',
                        'public_school' => 'Colegio Público (Plan Escolar)',
                        'private_school' => 'Colegio Privado (Plan Escolar)',
                    ])
                    ->required()
                    ->default('dojo'),
                Forms\Components\Select::make('target_audience')
                    ->label('Público Objetivo')
                    ->options([
                        'all' => 'Todo Público',
                        'adults' => 'Adultos / Apoderados',
                        'kids' => 'Niños / Alumnos',
                    ])
                    ->required()
                    ->default('all'),
                Forms\Components\Textarea::make('description')
                ->label('Descripción')
                ->maxLength(65535)
                ->columnSpanFull(),
            ]),

            Forms\Components\Section::make('Precio y Facturación')
            ->schema([
                Forms\Components\TextInput::make('price')
                ->label('Precio (CLP)')
                ->required()
                ->numeric()
                ->prefix('$'),
                Forms\Components\Select::make('billing_cycle')
                ->label('Ciclo de Cobro')
                ->options([
                    'monthly_fixed' => 'Mensual (día fijo)',
                    'monthly_from_enrollment' => 'Mensual (desde inscripción)',
                ])
                ->required()
                ->default('monthly_fixed')
                ->live(),
                Forms\Components\TextInput::make('billing_day')
                ->label('Día de cobro (1-28)')
                ->numeric()
                ->minValue(1)
                ->maxValue(28)
                ->default(1)
                ->visible(fn(Forms\Get $get) => $get('billing_cycle') === 'monthly_fixed'),
            ])->columns(['sm' => 3]),

            Forms\Components\Section::make('Descuento Familiar')
            ->description('Se aplica automáticamente si un apoderado tiene múltiples alumnos inscritos')
            ->schema([
                Forms\Components\TextInput::make('family_discount_percent')
                ->label('Descuento (%)')
                ->numeric()
                ->default(0)
                ->suffix('%'),
                Forms\Components\TextInput::make('family_discount_min_students')
                ->label('Mínimo de alumnos para aplicar')
                ->numeric()
                ->default(2),
                Forms\Components\Toggle::make('active')
                ->label('Plan Activo')
                ->default(true)
                ->required(),
            ])->columns(['sm' => 3]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
            Tables\Columns\TextColumn::make('name')
            ->label('Plan')
            ->searchable()
            ->sortable(),
            Tables\Columns\TextColumn::make('category')
            ->label('Categoría')
            ->badge()
            ->color(fn (string $state): string => match ($state) {
                'dojo' => 'info',
                'vip' => 'warning',
                'public_school' => 'success',
                'private_school' => 'primary',
                default => 'gray',
            }),
            Tables\Columns\TextColumn::make('price')
            ->label('Precio')
            ->money('CLP')
            ->sortable(),
            Tables\Columns\TextColumn::make('billing_cycle')
            ->label('Ciclo')
            ->badge()
            ->formatStateUsing(fn(string $state) => match ($state) {
            'monthly_fixed' => 'Mensual (fijo)',
            'monthly_from_enrollment' => 'Mensual (inscripción)',
            default => $state,
        }),
            Tables\Columns\TextColumn::make('family_discount_percent')
            ->label('Desc. Familiar')
            ->suffix('%')
            ->sortable(),
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
                Tables\Actions\DeleteAction::make(),
                Tables\Actions\ForceDeleteAction::make(),
                Tables\Actions\RestoreAction::make(),
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
            'index' => Pages\ListPlans::route('/'),
            'create' => Pages\CreatePlan::route('/create'),
            'edit' => Pages\EditPlan::route('/{record}/edit'),
        ];
    }
}