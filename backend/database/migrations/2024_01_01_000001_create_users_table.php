<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('username')->unique()->nullable();
            $table->string('email')->unique()->nullable();
            $table->string('phone', 20)->unique()->nullable();
            $table->string('country_code', 5)->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('phone_verified_at')->nullable();
            $table->string('password')->nullable();
            $table->enum('gender', ['male', 'female', 'non_binary', 'prefer_not_to_say'])->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('bio', 500)->nullable();
            $table->string('profession')->nullable();
            $table->string('city')->nullable();
            $table->string('country')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->json('interests')->nullable();
            $table->string('avatar')->nullable();
            $table->enum('role', ['user', 'moderator', 'support', 'analyst', 'marketing', 'finance', 'admin', 'super_admin'])->default('user');
            $table->enum('status', ['active', 'suspended', 'banned', 'pending_verification'])->default('active');
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_premium')->default(false);
            $table->enum('kyc_status', ['none', 'pending', 'approved', 'rejected'])->default('none');
            $table->string('kyc_document')->nullable();
            $table->decimal('coin_balance', 10, 2)->default(0);
            $table->string('two_factor_secret')->nullable();
            $table->boolean('two_factor_enabled')->default(false);
            $table->string('google_id')->nullable();
            $table->string('facebook_id')->nullable();
            $table->string('referral_code', 10)->unique()->nullable();
            $table->unsignedBigInteger('referred_by')->nullable()->index();
            $table->text('suspension_reason')->nullable();
            $table->timestamp('suspended_until')->nullable();
            $table->timestamp('last_active_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
