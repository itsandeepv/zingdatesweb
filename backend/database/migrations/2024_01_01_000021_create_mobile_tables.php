<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('app_versions', function (Blueprint $table) {
            $table->id();
            $table->string('version', 20);
            $table->enum('platform', ['ios', 'android', 'both'])->default('both');
            $table->enum('status', ['latest', 'supported', 'deprecated', 'blocked'])->default('supported');
            $table->text('changelog')->nullable();
            $table->text('release_notes')->nullable();
            $table->boolean('force_update')->default(false);
            $table->string('download_url')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->timestamps();
        });

        Schema::create('feature_flags', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_enabled')->default(false);
            $table->unsignedTinyInteger('rollout_percentage')->default(0);
            $table->json('target_user_ids')->nullable();
            $table->timestamps();
        });

        Schema::create('app_config', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('group')->nullable();
            $table->string('type')->default('string');
            $table->boolean('is_public')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_config');
        Schema::dropIfExists('feature_flags');
        Schema::dropIfExists('app_versions');
    }
};
