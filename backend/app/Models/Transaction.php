<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'user_id', 'transaction_id', 'type', 'amount', 'currency',
        'status', 'payment_gateway', 'gateway_transaction_id', 'gateway_order_id',
        'gateway_response', 'description', 'failure_reason',
        'refundable_id', 'refundable_type', 'refund_amount', 'refunded_at', 'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'amount'           => 'decimal:2',
            'refund_amount'    => 'decimal:2',
            'refunded_at'      => 'datetime',
            'gateway_response' => 'array',
        ];
    }

    public function user() { return $this->belongsTo(User::class); }
}
