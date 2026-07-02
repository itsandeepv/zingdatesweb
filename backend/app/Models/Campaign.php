<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Campaign extends Model
{
    protected $fillable = ['name', 'subject', 'body', 'type', 'status', 'audience_filter', 'recipient_count', 'sent_count', 'open_count', 'click_count', 'scheduled_at', 'sent_at', 'created_by'];

    protected function casts(): array
    {
        return ['audience_filter' => 'array', 'scheduled_at' => 'datetime', 'sent_at' => 'datetime'];
    }

    public function createdBy() { return $this->belongsTo(User::class, 'created_by'); }
}
