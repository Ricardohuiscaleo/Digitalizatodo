<?php

namespace App\Mail;

use App\Models\Guardian;
use App\Models\Tenant;
use App\Models\Plan;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StudentRegistrationMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public Guardian $guardian,
        public Tenant $tenant,
        public Plan $plan,
        public int $studentCount,
        public bool $isForTenant = false
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = $this->isForTenant 
            ? "🆕 Nuevo Alumno Registrado: {$this->guardian->name}"
            : "✅ ¡Registro Exitoso en {$this->tenant->name}!";

        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.student-registration',
        );
    }
}