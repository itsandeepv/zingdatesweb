<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id', 'action', 'module', 'description',
        'old_values', 'new_values', 'ip_address', 'user_agent',
        'subject_id', 'subject_type',
    ];

    protected function casts(): array
    {
        return ['old_values' => 'array', 'new_values' => 'array', 'created_at' => 'datetime'];
    }

    public function user() { return $this->belongsTo(User::class); }

    protected static function boot()
    {
        parent::boot();
        static::creating(fn($m) => $m->created_at = now());
    }
}
