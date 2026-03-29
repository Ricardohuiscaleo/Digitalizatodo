<?php

namespace App\Mail;

use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public $user,
        public string $token,
        public Tenant $tenant
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🔐 Instrucciones para restablecer tu contraseña',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.password-reset',
        );
    }
}
