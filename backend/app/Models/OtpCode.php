<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OtpCode extends Model
{
    protected $fillable = ['phone', 'country_code', 'code', 'type', 'is_used', 'attempt_count', 'expires_at'];

    protected function casts(): array
    {
        return ['is_used' => 'boolean', 'expires_at' => 'datetime'];
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }
}
