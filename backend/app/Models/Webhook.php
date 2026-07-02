<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Webhook extends Model
{
    protected $fillable = ['name', 'url', 'events', 'secret', 'is_active', 'success_count', 'failure_count', 'last_triggered_at', 'last_response'];

    protected $hidden = ['secret'];

    protected function casts(): array
    {
        return ['events' => 'array', 'is_active' => 'boolean', 'last_triggered_at' => 'datetime', 'last_response' => 'array'];
    }
}
