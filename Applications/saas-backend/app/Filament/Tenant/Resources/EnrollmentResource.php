<?php

namespace App\Filament\Tenant\Resources;

use App\Filament\Tenant\Resources\EnrollmentResource\Pages;
use App\Models\Enrollment;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class EnrollmentResource extends Resource
{
    protected static ?string $model = Enrollment::class;
    protected static ?string $tenantOwnershipRelationshipName = 'tenant';
    protected static ?string $navigationIcon = 'heroicon-o-clipboard-document-check';
    protected static ?string $modelLabel = 'Inscripción';
    protected static ?string $pluralModelLabel = 'Inscripciones';
    protected static ?int $navigationSort = 3;
    protected static ?string $navigationGroup = 'Gestión';

    public static function canAccess(): bool
    {
        $tenant = \Filament\Facades\Filament::getTenant();
        return $tenant && $tenant->industry === 'Escuela de Artes Marciales';
    }

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Datos de la Inscripción')
                    ->schema([
                        Forms\Components\Select::make('student_id')
                            ->label('Alumno')
                            ->relationship('student', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),
                        Forms\Components\Select::make('plan_id')
                            ->label('Plan')
                            ->relationship('plan', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),
                        Forms\Components\Select::make('status')
                            ->label('Estado')
                            ->options([
                                'active' => 'Activa',
                                'paused' => 'Pausada',
                                'cancelled' => 'Cancelada',
                                'expired' => 'Vencida',
                            ])
                            ->default('active')
                            ->required(),
                    ])->columns(['sm' => 3]),

                Forms\Components\Section::make('Periodo')
                    ->schema([
                        Forms\Components\DatePicker::make('start_date')
                            ->label('Fecha de Inicio')
                            ->required()
                            ->default(now())
                            ->native(false),
                        Forms\Components\DatePicker::make('end_date')
                            ->label('Fecha de Término')
                            ->native(false),
                    ])->columns(['sm' => 2]),

                Forms\Components\Section::make('Precio y Descuentos')
                    ->description('Deja vacío el precio personalizado para usar el precio del plan')
                    ->schema([
                        Forms\Components\TextInput::make('custom_price')
                            ->label('Precio Personalizado (CLP)')
                            ->numeric()
                            ->prefix('$')
                            ->placeholder('Usar precio del plan'),
                        Forms\Components\TextInput::make('discount_applied')
                            ->label('Descuento Aplicado (%)')
                            ->numeric()
                            ->suffix('%')
                            ->default(0),
                        Forms\Components\TextInput::make('discount_reason')
                            ->label('Razón del Descuento')
                            ->placeholder('Ej: Descuento familiar, Promoción'),
                    ])->columns(['sm' => 3]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('student.name')
                    ->label('Alumno')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('plan.name')
                    ->label('Plan')
                    ->sortable(),
                Tables\Columns\TextColumn::make('start_date')
                    ->label('Inicio')
                    ->date()
                    ->sortable(),
                Tables\Columns\TextColumn::make('end_date')
                    ->label('Término')
                    ->date()
                    ->placeholder('Sin vencimiento'),
                Tables\Columns\TextColumn::make('status')
                    ->label('Estado')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'active' => 'success',
                        'paused' => 'warning',
                        'cancelled' => 'danger',
                        'expired' => 'gray',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state) => match ($state) {
                        'active' => 'Activa',
                        'paused' => 'Pausada',
                        'cancelled' => 'Cancelada',
                        'expired' => 'Vencida',
                        default => $state,
                    }),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Creada')
                    ->date()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('Estado')
                    ->options([
                        'active' => 'Activa',
                        'paused' => 'Pausada',
                        'cancelled' => 'Cancelada',
                        'expired' => 'Vencida',
                    ]),
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
            'index' => Pages\ListEnrollments::route('/'),
            'create' => Pages\CreateEnrollment::route('/create'),
            'edit' => Pages\EditEnrollment::route('/{record}/edit'),
        ];
    }
}