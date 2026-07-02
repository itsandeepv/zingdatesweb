<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = ['user_id', 'type', 'title', 'body', 'data', 'is_read', 'read_at', 'notifiable_id', 'notifiable_type'];

    protected function casts(): array
    {
        return ['data' => 'array', 'is_read' => 'boolean', 'read_at' => 'datetime'];
    }

    public function user() { return $this->belongsTo(User::class); }
}
