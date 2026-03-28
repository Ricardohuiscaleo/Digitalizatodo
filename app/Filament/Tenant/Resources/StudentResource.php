<?php

namespace App\Filament\Tenant\Resources;

use App\Filament\Tenant\Resources\StudentResource\Pages;
use App\Models\Student;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class StudentResource extends Resource
{
    protected static ?string $model = Student::class;
    protected static ?string $tenantOwnershipRelationshipName = 'tenant';
    protected static ?string $navigationIcon = 'heroicon-o-user-group';
    protected static ?string $modelLabel = 'Alumno';
    protected static ?string $pluralModelLabel = 'Alumnos';
    protected static ?int $navigationSort = 1;

    public static function canAccess(): bool
    {
        $tenant = \Filament\Facades\Filament::getTenant();
        
        // Show this specific Martial Arts Student resource ONLY if the Tenant is a Martial Arts School
        return $tenant && $tenant->industry === 'Escuela de Artes Marciales';
    }

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Información Personal')
                    ->description('Datos básicos del alumno')
                    ->schema([
                        Forms\Components\FileUpload::make('photo')
                            ->label('Foto')
                            ->image()
                            ->avatar()
                            ->disk('s3')
                            ->directory('students')
                            ->visibility('public')
                            ->columnSpan(['sm' => 1]),
                        Forms\Components\Group::make([
                            Forms\Components\TextInput::make('name')
                                ->label('Nombre Completo')
                                ->required()
                                ->maxLength(255),
                            Forms\Components\TextInput::make('phone')
                                ->label('Teléfono')
                                ->tel()
                                ->maxLength(255),
                            Forms\Components\DatePicker::make('birth_date')
                                ->label('Fecha de Nacimiento')
                                ->native(false),
                        ])->columnSpan(['sm' => 2]),
                    ])->columns(['sm' => 3]),

                Forms\Components\Section::make('EDITAR PERFIL BJJ')
                    ->description(fn ($record) => $record?->name)
                    ->schema([
                        Forms\Components\Grid::make(2)
                            ->schema([
                                Forms\Components\Placeholder::make('today_attendance')
                                    ->label('ASISTENCIA HOY')
                                    ->content(fn ($record) => $record?->belt_progress['today_status'] === 'present' ? '✅ Presente' : '❌ Ausente'),
                                
                                Forms\Components\Select::make('belt_rank')
                                    ->label('CINTURÓN ACTUAL')
                                    ->options([
                                        'Blanco' => 'BLANCO',
                                        'Azul' => 'AZUL',
                                        'Morado' => 'MORADO',
                                        'Marrón' => 'CAFÉ',
                                        'Negro' => 'NEGRO',
                                    ])
                                    ->searchable(),

                                Forms\Components\Select::make('degrees')
                                    ->label('RAYAS ACTUALES')
                                    ->options([
                                        0 => '0',
                                        1 => '1',
                                        2 => '2',
                                        3 => '3',
                                        4 => '4',
                                    ]),

                                Forms\Components\TextInput::make('category')
                                    ->label('CATEGORÍA')
                                    ->placeholder('Ej: adultos, kids'),

                                Forms\Components\Select::make('modality')
                                    ->label('MODALIDAD')
                                    ->options([
                                        'gi' => 'GI',
                                        'nogi' => 'NO-GI',
                                        'both' => 'AMBAS',
                                    ]),

                                Forms\Components\Grid::make(2)
                                    ->schema([
                                        Forms\Components\TextInput::make('weight')
                                            ->label('PESO (KG)')
                                            ->numeric(),
                                        Forms\Components\TextInput::make('height')
                                            ->label('ALTURA (M)')
                                            ->numeric()
                                            ->step(0.01),
                                    ]),
                            ]),

                        Forms\Components\Section::make('CLASES ANTERIORES al sistema')
                            ->compact()
                            ->schema([
                                Forms\Components\Grid::make(3)
                                    ->schema([
                                        Forms\Components\TextInput::make('previous_classes')
                                            ->label('ANTERIORES')
                                            ->numeric()
                                            ->default(0)
                                            ->live(),

                                        Forms\Components\Placeholder::make('system_classes')
                                            ->label('SISTEMA')
                                            ->content(fn ($record) => $record?->attendances()->where('status', 'present')->count() ?? 0),

                                        Forms\Components\Placeholder::make('total_classes')
                                            ->label(fn ($record) => "TOTAL / " . ($record?->belt_progress['classes_per_stripe'] ?? 30))
                                            ->content(function ($get, $record) {
                                                $prev = (int)$get('previous_classes');
                                                $sys = $record?->attendances()->where('status', 'present')->count() ?? 0;
                                                return ($prev + $sys);
                                            }),
                                    ]),
                            ]),
                    ]),

                Forms\Components\Section::make('Contacto de Emergencia')
                    ->schema([
                        Forms\Components\TextInput::make('emergency_contact_name')
                            ->label('Nombre de Contacto'),
                        Forms\Components\TextInput::make('emergency_contact_phone')
                            ->label('Teléfono de Emergencia')
                            ->tel(),
                    ])->columns(['sm' => 2]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('photo')
                    ->label('')
                    ->circular(),
                Tables\Columns\TextColumn::make('name')
                    ->label('Nombre')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('phone')
                    ->label('Teléfono')
                    ->searchable(),
                Tables\Columns\TextColumn::make('belt_rank')
                    ->label('Grado')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'Blanco' => 'gray',
                        'Azul' => 'info',
                        'Morado' => 'warning',
                        'Marrón' => 'primary',
                        'Negro' => 'danger',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('belt_progress.total_effective')
                    ->label('Acumulado')
                    ->suffix(' clases')
                    ->sortable(),
                Tables\Columns\TextColumn::make('belt_progress.current_stripe')
                    ->label('Rayas')
                    ->formatStateUsing(fn ($state) => str_repeat('★', $state) ?: '0')
                    ->color('emerald'),
                Tables\Columns\IconColumn::make('belt_progress.is_ready_for_belt')
                    ->label('Graduable')
                    ->boolean()
                    ->trueIcon('heroicon-o-academic-cap')
                    ->falseIcon('heroicon-o-minus-circle')
                    ->color(fn ($state) => $state ? 'success' : 'gray'),
                Tables\Columns\TextColumn::make('category')
                    ->label('Categoría')
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\IconColumn::make('active')
                    ->label('Activo')
                    ->boolean()
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Fecha Registro')
                    ->date()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('active')
                    ->label('Solo Activos'),
                Tables\Filters\SelectFilter::make('belt_rank')
                    ->label('Grado')
                    ->options([
                        'Blanco' => 'Blanco',
                        'Azul' => 'Azul',
                        'Morado' => 'Morado',
                        'Marrón' => 'Marrón',
                        'Negro' => 'Negro',
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
            'index' => Pages\ListStudents::route('/'),
            'create' => Pages\CreateStudent::route('/create'),
            'edit' => Pages\EditStudent::route('/{record}/edit'),
        ];
    }
}