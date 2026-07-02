<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('coin_ledger', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->enum('type', ['credit', 'debit'])->default('credit');
            $table->enum('source', ['purchase', 'subscription', 'referral', 'bonus', 'audio_call', 'video_call', 'gift', 'admin_adjustment'])->default('purchase');
            $table->decimal('balance_after', 10, 2);
            $table->text('description')->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('reference_type')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void { Schema::dropIfExists('coin_ledger'); }
};
