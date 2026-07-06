<?php

return [

    'name'            => env('APP_NAME', 'Peppy'),
    'env'             => env('APP_ENV', 'production'),
    'debug'           => (bool) env('APP_DEBUG', false),
    'url'             => env('APP_URL', 'http://localhost'),
    'frontend_url'    => env('FRONTEND_URL', 'http://localhost:3000'),

    // OTP settings (dev conveniences — disable bypass before going live)
    'otp_expiry_minutes' => (int) env('OTP_EXPIRY_MINUTES', 10),
    'otp_bypass'         => (bool) env('OTP_BYPASS', false),
    'otp_bypass_code'    => env('OTP_BYPASS_CODE', '123456'),

    'timezone'        => 'UTC',
    'locale'          => 'en',
    'fallback_locale' => 'en',
    'faker_locale'    => 'en_US',
    'cipher'          => 'AES-256-CBC',
    'key'             => env('APP_KEY'),
    'previous_keys'   => array_filter(explode(',', env('APP_PREVIOUS_KEYS', ''))),

    'maintenance' => [
        'driver' => 'file',
    ],

    'providers' => Illuminate\Support\ServiceProvider::defaultProviders()->merge([
        App\Providers\AppServiceProvider::class,
    ])->toArray(),

];
