<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_one_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('user_two_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('last_message_id')->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->unsignedInteger('user_one_unread')->default(0);
            $table->unsignedInteger('user_two_unread')->default(0);
            $table->boolean('user_one_deleted')->default(false);
            $table->boolean('user_two_deleted')->default(false);
            $table->timestamps();
            $table->unique(['user_one_id', 'user_two_id']);
        });
    }

    public function down(): void { Schema::dropIfExists('conversations'); }
};
