<?php

namespace App\Services;

use App\Models\OtpCode;

class OTPService
{
    private int $expiryMinutes;

    public function __construct()
    {
        $this->expiryMinutes = (int) config('app.otp_expiry_minutes', 10);
    }

    /**
     * Generate and save a phone OTP.
     * Returns the code directly — no SMS sent (dev mode).
     */
    public function send(string $phone, string $countryCode): string
    {
        $code = $this->generate();

        OtpCode::create([
            'phone'        => $phone,
            'country_code' => $countryCode,
            'code'         => $code,
            'type'         => 'login',
            'expires_at'   => now()->addMinutes($this->expiryMinutes),
        ]);

        return $code;
    }

    /**
     * Generate and save an email OTP.
     * Returns the code directly — no email sent yet (SMTP not configured).
     */
    public function sendEmail(string $email): string
    {
        $code = $this->generate();

        OtpCode::create([
            'email'        => $email,
            'country_code' => '00',
            'code'         => $code,
            'type'         => 'login',
            'expires_at'   => now()->addMinutes($this->expiryMinutes),
        ]);

        return $code;
    }

    public function verifyPhone(string $phone, string $code): bool
    {
        if ($this->isBypassed($code)) return true;

        $otp = OtpCode::where('phone', $phone)
            ->where('code', $code)
            ->where('is_used', false)
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (!$otp) return false;

        $otp->update(['is_used' => true]);
        return true;
    }

    public function verifyEmail(string $email, string $code): bool
    {
        if ($this->isBypassed($code)) return true;

        $otp = OtpCode::where('email', $email)
            ->where('code', $code)
            ->where('is_used', false)
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (!$otp) return false;

        $otp->update(['is_used' => true]);
        return true;
    }

    /**
     * DEV ONLY — bypass OTP verification.
     * When OTP_BYPASS is enabled, the master code (OTP_BYPASS_CODE, default
     * 123456) is always accepted. Set OTP_BYPASS_CODE=* to accept any code.
     * Turn OTP_BYPASS off before going live.
     */
    private function isBypassed(string $code): bool
    {
        if (!config('app.otp_bypass', false)) {
            return false;
        }

        $master = (string) config('app.otp_bypass_code', '123456');

        return $master === '*' || $code === $master;
    }

    private function generate(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }
}
