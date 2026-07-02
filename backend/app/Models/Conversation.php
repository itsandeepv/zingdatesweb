<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    protected $fillable = [
        'user_one_id', 'user_two_id', 'last_message_id',
        'last_message_at', 'user_one_unread', 'user_two_unread',
        'user_one_deleted', 'user_two_deleted',
    ];

    protected function casts(): array
    {
        return [
            'last_message_at'   => 'datetime',
            'user_one_deleted'  => 'boolean',
            'user_two_deleted'  => 'boolean',
        ];
    }

    public function userOne()     { return $this->belongsTo(User::class, 'user_one_id'); }
    public function userTwo()     { return $this->belongsTo(User::class, 'user_two_id'); }
    public function messages()    { return $this->hasMany(Message::class); }
    public function lastMessage() { return $this->belongsTo(Message::class, 'last_message_id'); }

    public function getOtherUser(int $userId): User
    {
        return $this->user_one_id === $userId ? $this->userTwo : $this->userOne;
    }
}
