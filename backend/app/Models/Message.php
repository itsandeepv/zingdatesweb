<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = [
        'conversation_id', 'sender_id', 'type', 'body',
        'media_url', 'media_duration', 'is_read', 'read_at', 'is_deleted',
    ];

    protected function casts(): array
    {
        return ['is_read' => 'boolean', 'is_deleted' => 'boolean', 'read_at' => 'datetime'];
    }

    public function conversation() { return $this->belongsTo(Conversation::class); }
    public function sender()       { return $this->belongsTo(User::class, 'sender_id'); }
}
