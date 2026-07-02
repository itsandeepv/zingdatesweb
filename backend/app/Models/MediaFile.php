<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MediaFile extends Model
{
    protected $fillable = ['uploaded_by', 'name', 'path', 'url', 'mime_type', 'size_bytes', 'width', 'height', 'disk', 'folder'];

    public function uploader() { return $this->belongsTo(User::class, 'uploaded_by'); }
}
