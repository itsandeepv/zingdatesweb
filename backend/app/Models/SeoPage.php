<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SeoPage extends Model
{
    protected $table = 'seo_pages';

    protected $fillable = ['page_key', 'page_title', 'meta_title', 'meta_description', 'meta_keywords', 'og_title', 'og_description', 'og_image', 'canonical_url', 'robots', 'schema_markup'];

    protected function casts(): array
    {
        return ['schema_markup' => 'array'];
    }
}
