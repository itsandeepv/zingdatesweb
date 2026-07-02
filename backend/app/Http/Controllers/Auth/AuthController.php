<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\OtpCode;
use App\Services\OTPService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private OTPService $otpService) {}

    /* ─────────────────────────────────────────────────────────
     |  PHONE OTP  (dev mode — OTP returned in response)
     ───────────────────────────────────────────────────────── */

    public function sendOtp(Request $request)
    {
        $data = $request->validate([
            'phone'        => 'required|string|max:20',
            'country_code' => 'required|string|max:5',
        ]);

        $otp = $this->otpService->send($data['phone'], $data['country_code']);

        return response()->json([
            'message'  => 'OTP generated successfully.',
            'otp'      => $otp,       // remove this line when going live
            'dev_mode' => true,
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $data = $request->validate([
            'phone'        => 'required|string',
            'country_code' => 'required|string',
            'otp'          => 'required|string|size:6',
        ]);

        if (!$this->otpService->verifyPhone($data['phone'], $data['otp'])) {
            throw ValidationException::withMessages(['otp' => 'Invalid or expired OTP.']);
        }

        $user = User::firstOrCreate(
            ['phone' => $data['phone']],
            [
                'name'              => 'User' . rand(1000, 9999),
                'country_code'      => $data['country_code'],
                'phone_verified_at' => now(),
                'referral_code'     => strtoupper(substr(uniqid(), -8)),
            ]
        );

        $user->update(['last_active_at' => now()]);

        $token = $user->createToken('mobile')->plainTextToken;

        return response()->json([
            'token'       => $token,
            'user'        => $user,
            'is_new_user' => $user->wasRecentlyCreated,
        ]);
    }

    /* ─────────────────────────────────────────────────────────
     |  EMAIL OTP  (dev mode — OTP returned in response)
     |  When SMTP is configured, the OTP will be emailed instead.
     ───────────────────────────────────────────────────────── */

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
        ]);

        $otp = $this->otpService->sendEmail($data['email']);

        return response()->json([
            'message'  => 'OTP sent to your email.',
            'otp'      => $otp,       // remove this line when going live
            'dev_mode' => true,
        ]);
    }

    public function verifyEmailOtp(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'otp'   => 'required|string|size:6',
        ]);

        if (!$this->otpService->verifyEmail($data['email'], $data['otp'])) {
            throw ValidationException::withMessages(['otp' => 'Invalid or expired OTP.']);
        }

        $user = User::firstOrCreate(
            ['email' => $data['email']],
            [
                'name'              => 'User' . rand(1000, 9999),
                'email_verified_at' => now(),
                'referral_code'     => strtoupper(substr(uniqid(), -8)),
            ]
        );

        $user->update(['last_active_at' => now()]);

        $token = $user->createToken('web')->plainTextToken;

        return response()->json([
            'token'       => $token,
            'user'        => $user,
            'is_new_user' => $user->wasRecentlyCreated,
        ]);
    }

    /* ─────────────────────────────────────────────────────────
     |  ADMIN LOGIN  (password-based — intentionally kept)
     ───────────────────────────────────────────────────────── */

    public function adminLogin(Request $request)
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => 'Invalid credentials.']);
        }

        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $user->update(['last_active_at' => now()]);

        $token = $user->createToken('admin', ['admin'])->plainTextToken;

        return response()->json(['token' => $token, 'user' => $user]);
    }

    /* ─────────────────────────────────────────────────────────
     |  REGISTER  (no password — phone already verified via OTP)
     ───────────────────────────────────────────────────────── */

    public function register(Request $request)
    {
        $data = $request->validate([
            'name'          => 'required|string|max:100',
            'phone'         => 'required|string|unique:users',
            'country_code'  => 'required|string',
            'gender'        => 'required|in:male,female,non_binary,prefer_not_to_say',
            'date_of_birth' => 'required|date|before:-18 years',
            'bio'           => 'nullable|string|max:500',
            'profession'    => 'nullable|string|max:100',
            'city'          => 'nullable|string|max:100',
            'interests'     => 'nullable|array|min:3',
            'referred_by'   => 'nullable|string|exists:users,referral_code',
        ]);

        if (isset($data['referred_by'])) {
            $referrer = User::where('referral_code', $data['referred_by'])->first();
            $data['referred_by'] = $referrer?->id;
        }

        $data['referral_code']     = strtoupper(substr(uniqid(), -8));
        $data['phone_verified_at'] = now();

        $user  = User::create($data);
        $token = $user->createToken('mobile')->plainTextToken;

        return response()->json(['token' => $token, 'user' => $user], 201);
    }

    /* ─────────────────────────────────────────────────────────
     |  SOCIAL LOGIN
     ───────────────────────────────────────────────────────── */

    public function socialLogin(Request $request)
    {
        $data = $request->validate([
            'provider' => 'required|in:google,facebook',
            'token'    => 'required|string',
            'name'     => 'required|string',
            'email'    => 'nullable|email',
            'avatar'   => 'nullable|url',
        ]);

        $field = $data['provider'] . '_id';
        $user  = User::firstOrCreate(
            [$field => $data['token']],
            [
                'name'              => $data['name'],
                'email'             => $data['email'] ?? null,
                'avatar'            => $data['avatar'] ?? null,
                'email_verified_at' => now(),
                'referral_code'     => strtoupper(substr(uniqid(), -8)),
            ]
        );

        $user->update(['last_active_at' => now()]);
        $token = $user->createToken('mobile')->plainTextToken;

        return response()->json([
            'token'       => $token,
            'user'        => $user,
            'is_new_user' => $user->wasRecentlyCreated,
        ]);
    }

    /* ─────────────────────────────────────────────────────────
     |  MISC
     ───────────────────────────────────────────────────────── */

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function refresh(Request $request)
    {
        $user = $request->user();
        $request->user()->currentAccessToken()->delete();
        $token = $user->createToken('mobile')->plainTextToken;
        return response()->json(['token' => $token]);
    }
}
