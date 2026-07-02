<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeatureFlag extends Model
{
    protected $fillable = ['key', 'name', 'description', 'is_enabled', 'rollout_percentage', 'target_user_ids'];

    protected function casts(): array
    {
        return ['is_enabled' => 'boolean', 'target_user_ids' => 'array'];
    }
}
