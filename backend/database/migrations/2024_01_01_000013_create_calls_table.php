<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('calls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('caller_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('receiver_id')->constrained('users')->cascadeOnDelete();
            $table->enum('type', ['audio', 'video'])->default('audio');
            $table->enum('status', ['initiated', 'ringing', 'active', 'ended', 'missed', 'declined'])->default('initiated');
            $table->unsignedInteger('duration_seconds')->default(0);
            $table->decimal('coins_charged', 10, 2)->default(0);
            $table->decimal('coins_per_minute', 10, 2)->default(0);
            $table->string('session_id')->nullable();
            $table->timestamp('answered_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void { Schema::dropIfExists('calls'); }
};
