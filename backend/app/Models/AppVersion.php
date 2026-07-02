<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppVersion extends Model
{
    protected $fillable = ['version', 'platform', 'status', 'changelog', 'release_notes', 'force_update', 'download_url', 'released_at'];

    protected function casts(): array
    {
        return ['force_update' => 'boolean', 'released_at' => 'datetime'];
    }
}
