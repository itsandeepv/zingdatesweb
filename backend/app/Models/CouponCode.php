<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CouponCode extends Model
{
    protected $fillable = ['code', 'discount_type', 'discount_value', 'max_discount_amount', 'min_order_amount', 'usage_limit', 'usage_count', 'per_user_limit', 'applicable_plans', 'is_active', 'valid_from', 'valid_until'];

    protected function casts(): array
    {
        return ['applicable_plans' => 'array', 'is_active' => 'boolean', 'valid_from' => 'datetime', 'valid_until' => 'datetime'];
    }
}
