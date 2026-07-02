<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CoinLedger extends Model
{
    protected $fillable = [
        'user_id', 'amount', 'type', 'source', 'balance_after',
        'description', 'reference_id', 'reference_type',
    ];

    protected function casts(): array
    {
        return ['amount' => 'decimal:2', 'balance_after' => 'decimal:2'];
    }

    public function user() { return $this->belongsTo(User::class); }
}
