<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SeoRedirect extends Model
{
    protected $table = 'seo_redirects';

    protected $fillable = ['from_url', 'to_url', 'status_code', 'is_active', 'hit_count'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }
}
