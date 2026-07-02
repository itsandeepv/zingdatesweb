<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = [
        'name', 'slug', 'description', 'tier',
        'price_monthly', 'price_yearly', 'currency',
        'features', 'max_likes_per_day', 'max_messages_per_day',
        'coins_included', 'can_see_who_liked', 'priority_match',
        'hide_ads', 'read_receipts', 'is_active', 'is_popular', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'features'           => 'array',
            'is_active'          => 'boolean',
            'is_popular'         => 'boolean',
            'can_see_who_liked'  => 'boolean',
            'priority_match'     => 'boolean',
            'hide_ads'           => 'boolean',
            'read_receipts'      => 'boolean',
            'price_monthly'      => 'decimal:2',
            'price_yearly'       => 'decimal:2',
        ];
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }
}
