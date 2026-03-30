<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('admin_emails', function (Blueprint $table) {
            $table->id();
            $table->enum('direction', ['inbound', 'outbound']);
            $table->string('from_email');
            $table->string('to_email');
            $table->string('subject');
            $table->longText('content_html')->nullable();
            $table->longText('content_text')->nullable();
            $table->boolean('is_read')->default(false);
            $table->string('resend_id')->nullable()->index();
            $table->foreignId('parent_id')->nullable()->constrained('admin_emails')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_emails');
    }
};
