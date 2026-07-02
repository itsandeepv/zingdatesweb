<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventRegistration extends Model
{
    protected $fillable = ['event_id', 'user_id', 'status', 'ticket_code', 'is_checked_in', 'checked_in_at', 'transaction_id'];

    protected function casts(): array
    {
        return ['is_checked_in' => 'boolean', 'checked_in_at' => 'datetime'];
    }

    public function event()       { return $this->belongsTo(Event::class); }
    public function user()        { return $this->belongsTo(User::class); }
    public function transaction() { return $this->belongsTo(Transaction::class); }
}
