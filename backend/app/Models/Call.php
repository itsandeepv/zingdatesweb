<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Call extends Model
{
    protected $fillable = ['caller_id', 'receiver_id', 'type', 'status', 'duration_seconds', 'coins_charged', 'coins_per_minute', 'session_id', 'answered_at', 'ended_at'];

    protected function casts(): array
    {
        return ['answered_at' => 'datetime', 'ended_at' => 'datetime', 'coins_charged' => 'decimal:2', 'coins_per_minute' => 'decimal:2'];
    }

    public function caller()   { return $this->belongsTo(User::class, 'caller_id'); }
    public function receiver() { return $this->belongsTo(User::class, 'receiver_id'); }
}
