<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // En MySQL, los ENUMs se modifican con ALTER TABLE
        // Añadimos 'pending_review' a la lista de estados permitidos
        DB::statement("ALTER TABLE payments MODIFY COLUMN status ENUM('pending', 'proof_uploaded', 'approved', 'rejected', 'overdue', 'pending_review') NOT NULL DEFAULT 'pending'");
        
        // Opcionalmente, migramos los datos existentes de 'proof_uploaded' a 'pending_review'
        DB::table('payments')
            ->where('status', 'proof_uploaded')
            ->update(['status' => 'pending_review']);
    }

    public function down(): void
    {
        // Volver al estado anterior requiere revertir los datos primero
        DB::table('payments')
            ->where('status', 'pending_review')
            ->update(['status' => 'proof_uploaded']);
            
        DB::statement("ALTER TABLE payments MODIFY COLUMN status ENUM('pending', 'proof_uploaded', 'approved', 'rejected', 'overdue') NOT NULL DEFAULT 'pending'");
    }
};
