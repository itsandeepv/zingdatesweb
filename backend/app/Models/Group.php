<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Group extends Model
{
    use SoftDeletes;

    protected $fillable = ['owner_id', 'name', 'slug', 'description', 'cover_image', 'category', 'type', 'members_count', 'max_members', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function owner()   { return $this->belongsTo(User::class, 'owner_id'); }
    public function members() { return $this->hasMany(GroupMember::class); }
}
