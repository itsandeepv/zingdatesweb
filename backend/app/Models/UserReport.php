<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserReport extends Model
{
    protected $fillable = ['reporter_id', 'reported_id', 'reason', 'description', 'status', 'admin_notes', 'resolved_by', 'resolved_at'];

    protected function casts(): array
    {
        return ['resolved_at' => 'datetime'];
    }

    public function reporter()   { return $this->belongsTo(User::class, 'reporter_id'); }
    public function reported()   { return $this->belongsTo(User::class, 'reported_id'); }
    public function resolvedBy() { return $this->belongsTo(User::class, 'resolved_by'); }
}
