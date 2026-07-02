<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketReply extends Model
{
    protected $fillable = ['ticket_id', 'user_id', 'body', 'attachments', 'is_staff_reply', 'is_internal_note'];

    protected function casts(): array
    {
        return ['attachments' => 'array', 'is_staff_reply' => 'boolean', 'is_internal_note' => 'boolean'];
    }

    public function ticket() { return $this->belongsTo(SupportTicket::class, 'ticket_id'); }
    public function user()   { return $this->belongsTo(User::class); }
}
