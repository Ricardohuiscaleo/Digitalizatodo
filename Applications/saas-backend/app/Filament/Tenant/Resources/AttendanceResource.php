<?php

namespace App\Filament\Tenant\Resources;

use App\Filament\Tenant\Resources\AttendanceResource\Pages;
use App\Models\Attendance;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class AttendanceResource extends Resource
{
    protected static ?string $model = Attendance::class;
    protected static ?string $tenantOwnershipRelationshipName = 'tenant';
    protected static ?string $navigationIcon = 'heroicon-o-check-badge';
    protected static ?string $modelLabel = 'Asistencia';
    protected static ?string $pluralModelLabel = 'Asistencias';
    protected static ?int $navigationSort = 5;
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
            Forms\Components\Section::make('Registro de Asistencia')
            ->schema([
                Forms\Components\Select::make('student_id')
                ->label('Alumno')
                ->relationship('student', 'name')
                ->searchable()
                ->preload()
                ->required(),
                Forms\Components\DatePicker::make('date')
                ->label('Fecha')
                ->default(now())
                ->required()
                ->native(false),
                Forms\Components\Select::make('status')
                ->label('Estado')
                ->options([
                    'present' => 'Presente',
                    'absent' => 'Ausente',
                    'late' => 'Atrasado',
                    'justified' => 'Justificado',
                ])
                ->default('present')
                ->required(),
                Forms\Components\Textarea::make('notes')
                ->label('Notas')
                ->placeholder('Opcional. Ej: Llegó 15 min tarde')
                ->columnSpanFull(),
            ])->columns(['sm' => 3]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
            Tables\Columns\Layout\Stack::make([
                Tables\Columns\ImageColumn::make('student.photo')
                ->height('8rem')
                ->width('100%')
                ->extraImgAttributes([
                    'class' => 'object-cover rounded-t-xl',
                ]),
                Tables\Columns\Layout\Stack::make([
                    Tables\Columns\TextColumn::make('student.name')
                    ->weight('bold')
                    ->size('lg'),
                    Tables\Columns\TextColumn::make('date')
                    ->date()
                    ->color('gray'),
                    Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn(string $state): string => match ($state) {
            'present' => 'success',
            'absent' => 'danger',
            'late' => 'warning',
            'justified' => 'info',
            default => 'gray',
        })
                    ->formatStateUsing(fn(string $state): string => match ($state) {
            'present' => 'Presente',
            'absent' => 'Ausente',
            'late' => 'Atrasado',
            'justified' => 'Justificado',
            default => $state,
        }),
                ])->space(2)->extraAttributes(['class' => 'p-4']),
            ]),
        ])
            ->contentGrid([
            'md' => 3,
            'lg' => 4,
            'xl' => 5,
        ])
            ->filters([
            Tables\Filters\Filter::make('hoy')
            ->label('Solo Hoy')
            ->query(fn($query) => $query->whereDate('date', now())),
            Tables\Filters\SelectFilter::make('status')
            ->label('Estado')
            ->options([
                'present' => 'Presente',
                'absent' => 'Ausente',
                'late' => 'Atrasado',
                'justified' => 'Justificado',
            ]),
        ])
            ->actions([
            Tables\Actions\EditAction::make(),
            Tables\Actions\DeleteAction::make(),
        ])
            ->bulkActions([
            Tables\Actions\BulkActionGroup::make([
                Tables\Actions\DeleteBulkAction::make(),
            ]),
        ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ManageAttendances::route('/'),
        ];
    }
}