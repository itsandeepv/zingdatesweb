<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BlogPost extends Model
{
    use SoftDeletes;

    protected $fillable = ['author_id', 'title', 'slug', 'excerpt', 'body', 'cover_image', 'category', 'tags', 'status', 'meta_title', 'meta_description', 'views_count', 'published_at'];

    protected function casts(): array
    {
        return ['tags' => 'array', 'published_at' => 'datetime'];
    }

    public function author() { return $this->belongsTo(User::class, 'author_id'); }
}
