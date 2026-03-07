<?php

namespace App\Filament\Tenant\Resources;

use App\Filament\Tenant\Resources\PaymentResource\Pages;
use App\Models\Payment;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class PaymentResource extends Resource
{
    protected static ?string $model = Payment::class;
    protected static ?string $tenantOwnershipRelationshipName = 'tenant';
    protected static ?string $navigationIcon = 'heroicon-o-banknotes';
    protected static ?string $modelLabel = 'Pago';
    protected static ?string $pluralModelLabel = 'Pagos';
    protected static ?int $navigationSort = 5;
    protected static ?string $navigationGroup = 'Finanzas';

    public static function canAccess(): bool
    {
        $tenant = \Filament\Facades\Filament::getTenant();
        return $tenant && $tenant->industry === 'Escuela de Artes Marciales';
    }

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Datos del Pago')
                    ->schema([
                        Forms\Components\Select::make('enrollment_id')
                            ->label('Inscripción')
                            ->relationship('enrollment', 'id')
                            ->getOptionLabelFromRecordUsing(fn ($record) => $record->student?->name . ' — ' . $record->plan?->name)
                            ->searchable()
                            ->preload()
                            ->required(),
                        Forms\Components\TextInput::make('amount')
                            ->label('Monto (CLP)')
                            ->required()
                            ->numeric()
                            ->prefix('$'),
                        Forms\Components\Select::make('status')
                            ->label('Estado')
                            ->options([
                                'pending' => 'Pendiente',
                                'proof_uploaded' => 'Comprobante Subido',
                                'approved' => 'Aprobado',
                                'rejected' => 'Rechazado',
                                'overdue' => 'Moroso',
                            ])
                            ->required()
                            ->default('pending'),
                    ])->columns(['sm' => 3]),

                Forms\Components\Section::make('Fechas')
                    ->schema([
                        Forms\Components\DatePicker::make('due_date')
                            ->label('Fecha de Vencimiento')
                            ->required()
                            ->native(false),
                        Forms\Components\DatePicker::make('paid_at')
                            ->label('Fecha de Pago Efectivo')
                            ->native(false),
                    ])->columns(['sm' => 2]),

                Forms\Components\Section::make('Método de Pago')
                    ->schema([
                        Forms\Components\Select::make('payment_method')
                            ->label('Método')
                            ->options([
                                'transfer' => 'Transferencia',
                                'webpay' => 'Webpay',
                                'mercadopago' => 'MercadoPago',
                                'cash' => 'Efectivo',
                                'other' => 'Otro',
                            ]),
                        Forms\Components\FileUpload::make('proof_image')
                            ->label('Comprobante de Pago')
                            ->image()
                            ->disk('s3')
                            ->directory('payment-proofs')
                            ->visibility('public')
                            ->columnSpanFull(),
                    ]),

                Forms\Components\Section::make('Revisión')
                    ->schema([
                        Forms\Components\Textarea::make('rejection_reason')
                            ->label('Razón de Rechazo')
                            ->placeholder('Solo si se rechaza el pago'),
                    ])
                    ->collapsed(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('enrollment.student.name')
                    ->label('Alumno')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('enrollment.plan.name')
                    ->label('Plan')
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('amount')
                    ->label('Monto')
                    ->money('CLP')
                    ->sortable(),
                Tables\Columns\TextColumn::make('due_date')
                    ->label('Vencimiento')
                    ->date()
                    ->sortable(),
                Tables\Columns\TextColumn::make('status')
                    ->label('Estado')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'approved' => 'success',
                        'pending' => 'warning',
                        'proof_uploaded' => 'info',
                        'rejected' => 'danger',
                        'overdue' => 'danger',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state) => match ($state) {
                        'pending' => 'Pendiente',
                        'proof_uploaded' => 'Comprobante',
                        'approved' => 'Aprobado',
                        'rejected' => 'Rechazado',
                        'overdue' => 'Moroso',
                        default => $state,
                    }),
                Tables\Columns\TextColumn::make('payment_method')
                    ->label('Método')
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('Estado')
                    ->options([
                        'pending' => 'Pendiente',
                        'proof_uploaded' => 'Comprobante Subido',
                        'approved' => 'Aprobado',
                        'rejected' => 'Rechazado',
                        'overdue' => 'Moroso',
                    ]),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\Action::make('approve')
                    ->label('Aprobar')
                    ->action(fn (Payment $record) => $record->update([
                        'status' => 'approved',
                        'approved_by' => auth()->id(),
                        'paid_at' => now(),
                    ]))
                    ->requiresConfirmation()
                    ->modalHeading('¿Aprobar este pago?')
                    ->color('success')
                    ->icon('heroicon-o-check-circle')
                    ->visible(fn (Payment $record) => in_array($record->status, ['pending', 'proof_uploaded'])),
                Tables\Actions\Action::make('reject')
                    ->label('Rechazar')
                    ->form([
                        Forms\Components\Textarea::make('rejection_reason')
                            ->label('Razón del Rechazo')
                            ->required(),
                    ])
                    ->action(fn (Payment $record, array $data) => $record->update([
                        'status' => 'rejected',
                        'rejection_reason' => $data['rejection_reason'],
                        'approved_by' => auth()->id(),
                    ]))
                    ->requiresConfirmation()
                    ->modalHeading('¿Rechazar este pago?')
                    ->color('danger')
                    ->icon('heroicon-o-x-circle')
                    ->visible(fn (Payment $record) => in_array($record->status, ['pending', 'proof_uploaded'])),
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
            'index' => Pages\ListPayments::route('/'),
            'create' => Pages\CreatePayment::route('/create'),
            'edit' => Pages\EditPayment::route('/{record}/edit'),
        ];
    }
}