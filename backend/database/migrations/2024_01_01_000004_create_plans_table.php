<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->enum('tier', ['free', 'premium', 'vip', 'corporate'])->default('free');
            $table->decimal('price_monthly', 10, 2)->default(0);
            $table->decimal('price_yearly', 10, 2)->default(0);
            $table->string('currency', 3)->default('USD');
            $table->json('features')->nullable();
            $table->unsignedInteger('max_likes_per_day')->nullable();
            $table->unsignedInteger('max_messages_per_day')->nullable();
            $table->unsignedInteger('coins_included')->default(0);
            $table->boolean('can_see_who_liked')->default(false);
            $table->boolean('priority_match')->default(false);
            $table->boolean('hide_ads')->default(false);
            $table->boolean('read_receipts')->default(false);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_popular')->default(false);
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
