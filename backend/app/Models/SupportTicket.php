<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupportTicket extends Model
{
    protected $fillable = [
        'ticket_number', 'user_id', 'assigned_to', 'subject', 'description',
        'category', 'priority', 'status', 'attachments',
        'first_response_at', 'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'attachments'       => 'array',
            'first_response_at' => 'datetime',
            'resolved_at'       => 'datetime',
        ];
    }

    public function user()    { return $this->belongsTo(User::class); }
    public function agent()   { return $this->belongsTo(User::class, 'assigned_to'); }
    public function replies() { return $this->hasMany(TicketReply::class, 'ticket_id'); }

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($ticket) {
            $ticket->ticket_number = 'TKT-' . strtoupper(substr(uniqid(), -6));
        });
    }
}
