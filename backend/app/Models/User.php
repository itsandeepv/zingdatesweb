<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name', 'username', 'email', 'phone', 'country_code',
        'password', 'gender', 'date_of_birth', 'bio', 'profession',
        'city', 'country', 'latitude', 'longitude', 'interests', 'avatar',
        'role', 'status', 'is_verified', 'kyc_status', 'kyc_document',
        'coin_balance', 'two_factor_secret', 'two_factor_enabled',
        'google_id', 'facebook_id', 'referral_code', 'referred_by',
        'suspension_reason', 'suspended_until', 'last_active_at',
    ];

    protected $hidden = ['password', 'two_factor_secret', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at'    => 'datetime',
            'phone_verified_at'    => 'datetime',
            'suspended_until'      => 'datetime',
            'last_active_at'       => 'datetime',
            'date_of_birth'        => 'date',
            'interests'            => 'array',
            'is_verified'          => 'boolean',
            'is_premium'           => 'boolean',
            'two_factor_enabled'   => 'boolean',
            'coin_balance'         => 'decimal:2',
        ];
    }

    public function photos()
    {
        return $this->hasMany(UserPhoto::class)->orderBy('sort_order');
    }

    public function subscription()
    {
        return $this->hasOne(Subscription::class)->where('status', 'active')->latestOfMany();
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function coinLedger()
    {
        return $this->hasMany(CoinLedger::class);
    }

    public function sentConnections()
    {
        return $this->hasMany(Connection::class, 'sender_id');
    }

    public function receivedConnections()
    {
        return $this->hasMany(Connection::class, 'receiver_id');
    }

    public function events()
    {
        return $this->hasMany(Event::class);
    }

    public function eventRegistrations()
    {
        return $this->hasMany(EventRegistration::class);
    }

    public function notifications()
    {
        return $this->hasMany(\App\Models\Notification::class);
    }

    public function supportTickets()
    {
        return $this->hasMany(SupportTicket::class);
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin', 'super_admin']);
    }

    public function isSuspended(): bool
    {
        return $this->status === 'suspended'
            || ($this->suspended_until && $this->suspended_until->isFuture());
    }
}
