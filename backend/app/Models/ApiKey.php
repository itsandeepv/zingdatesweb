<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApiKey extends Model
{
    protected $fillable = ['name', 'key', 'secret', 'type', 'permissions', 'is_active', 'ip_whitelist', 'request_count', 'rate_limit_per_minute', 'last_used_at', 'expires_at', 'created_by'];

    protected $hidden = ['secret'];

    protected function casts(): array
    {
        return ['permissions' => 'array', 'is_active' => 'boolean', 'last_used_at' => 'datetime', 'expires_at' => 'datetime'];
    }

    public function createdBy() { return $this->belongsTo(User::class, 'created_by'); }
}
