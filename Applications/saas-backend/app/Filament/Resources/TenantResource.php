<?php

namespace App\Filament\Resources;

use App\Filament\Resources\TenantResource\Pages;
use App\Models\Tenant;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Filament\Notifications\Notification;

class TenantResource extends Resource
{
    protected static ?string $model = Tenant::class;
    protected static ?string $navigationIcon = 'heroicon-o-building-office-2';
    protected static ?string $modelLabel = 'Empresa';
    protected static ?string $pluralModelLabel = 'Empresas';
    protected static ?int $navigationSort = 0;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('id')
                    ->label('Slug')
                    ->required()
                    ->unique(ignoreRecord: true)
                    ->maxLength(255),
                Forms\Components\TextInput::make('name')
                    ->required()
                    ->maxLength(255),
                Forms\Components\Select::make('industry')
                    ->label('Industria / Giro')
                    ->options([
                        'Escuela de Artes Marciales' => 'Escuela de Artes Marciales',
                        'Colegio o Instituto' => 'Colegio o Instituto',
                        'Clínica o Centro Médico' => 'Clínica o Centro Médico',
                        'Otra Empresa' => 'Otra Empresa',
                    ])
                    ->required()
                    ->default('Escuela de Artes Marciales'),
                Forms\Components\TextInput::make('email')
                    ->email()
                    ->maxLength(255),
                Forms\Components\TextInput::make('phone')
                    ->tel()
                    ->maxLength(255),
                Forms\Components\FileUpload::make('logo_url')
                    ->image()
                    ->disk('s3')
                    ->directory('tenants')
                    ->visibility('public'),
                Forms\Components\ColorPicker::make('primary_color'),
                Forms\Components\Select::make('saas_plan')
                    ->options([
                        'free' => 'Free',
                        'pro' => 'Pro',
                        'enterprise' => 'Enterprise',
                    ])
                    ->default('free'),
                Forms\Components\DatePicker::make('saas_trial_ends_at')
                    ->default(now()->addDays(7)),
                Forms\Components\Toggle::make('active')
                    ->label('Activo')
                    ->default(true)
                    ->helperText('Desactiva esta opción para suspender el acceso a la empresa y sus usuarios.'),
                
                Forms\Components\Section::make('Datos del Administrador Inicial')
                    ->description('Crea la primera cuenta de usuario con la que tu cliente accederá a su Panel')
                    ->schema([
                        Forms\Components\TextInput::make('admin_name')
                            ->label('Nombre del Dueño')
                            ->required()
                            ->dehydrated(false) // No guardar esto en la tabla Tenants
                            ->maxLength(255),
                        Forms\Components\TextInput::make('admin_email')
                            ->label('Correo Electrónico')
                            ->email()
                            ->required()
                            ->dehydrated(false) // No guardar en Tenants, lo usaremos para crear el User
                            ->maxLength(255),
                        Forms\Components\TextInput::make('admin_password')
                            ->label('Contraseña')
                            ->password()
                            ->required()
                            ->dehydrated(false)
                            ->revealable()
                            ->maxLength(255),
                    ])->columns(['sm' => 3]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->label('Slug')
                    ->searchable(),
                Tables\Columns\TextColumn::make('name')
                    ->searchable(),
                Tables\Columns\TextColumn::make('plan_type')
                    ->badge(),
                Tables\Columns\TextColumn::make('trial_ends_at')
                    ->date()
                    ->sortable(),
                Tables\Columns\ToggleColumn::make('active')
                    ->label('Estado')
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('plan_type')
                    ->options([
                        'free' => 'Free',
                        'pro' => 'Pro',
                        'enterprise' => 'Enterprise',
                    ]),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\Action::make('resetPassword')
                    ->label('Resetear Contraseña')
                    ->icon('heroicon-o-key')
                    ->color('warning')
                    ->requiresConfirmation()
                    ->modalHeading('Resetear Contraseña del Administrador')
                    ->modalDescription('Esto asignará una nueva contraseña de 5 caracteres al primer usuario asociado a esta Empresa. El usuario podrá cambiarla después desde su perfil.')
                    ->action(function (Tenant $record) {
                        $user = $record->users()->first();
                        
                        if (!$user) {
                            Notification::make()
                                ->title('Error')
                                ->body('Esta Empresa no tiene ningún usuario asignado.')
                                ->danger()
                                ->send();
                            return;
                        }

                        $newPassword = Str::random(5);
                        
                        $user->update([
                            'password' => Hash::make($newPassword)
                        ]);

                        Notification::make()
                            ->title('Contraseña Reseteada')
                            ->body("La nueva contraseña para {$user->email} es: **{$newPassword}**")
                            ->success()
                            ->persistent()
                            ->send();
                    }),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListTenants::route('/'),
            'create' => Pages\CreateTenant::route('/create'),
            'edit' => Pages\EditTenant::route('/{record}/edit'),
        ];
    }
}