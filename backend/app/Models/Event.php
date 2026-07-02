<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Sluggable\HasSlug;
use Spatie\Sluggable\SlugOptions;

class Event extends Model
{
    use SoftDeletes, HasSlug;

    protected $fillable = [
        'user_id', 'title', 'slug', 'description', 'category', 'type', 'status',
        'venue_name', 'venue_address', 'city', 'country', 'latitude', 'longitude',
        'virtual_link', 'starts_at', 'ends_at', 'max_capacity', 'ticket_price',
        'currency', 'is_free', 'cover_image', 'tags', 'views_count', 'cancellation_reason',
    ];

    protected function casts(): array
    {
        return [
            'starts_at'     => 'datetime',
            'ends_at'       => 'datetime',
            'is_free'       => 'boolean',
            'tags'          => 'array',
            'ticket_price'  => 'decimal:2',
        ];
    }

    public function getSlugOptions(): SlugOptions
    {
        return SlugOptions::create()->generateSlugsFrom('title')->saveSlugsTo('slug');
    }

    public function organizer()       { return $this->belongsTo(User::class, 'user_id'); }
    public function registrations()   { return $this->hasMany(EventRegistration::class); }
    public function attendeesCount()  { return $this->registrations()->where('status', 'registered')->count(); }
    public function isFull(): bool    { return $this->max_capacity && $this->attendeesCount() >= $this->max_capacity; }
}
