<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with([
                'subscription' => fn($q) => $q->with('plan')->where('status', 'active'),
            ])
            ->when($request->search, fn($q) => $q->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%");
            }))
            ->when($request->status && $request->status !== 'all', fn($q) => $q->where('status', $request->status))
            ->when($request->role && $request->role !== 'all', fn($q) => $q->where('role', $request->role))
            ->when($request->verification_status && $request->verification_status !== 'all', function ($q) use ($request) {
                match ($request->verification_status) {
                    'verified'   => $q->where('is_verified', true),
                    'pending'    => $q->where('is_verified', false)->where('kyc_status', 'pending'),
                    'unverified' => $q->where('is_verified', false)->where(
                        fn($q) => $q->whereNull('kyc_status')->orWhere('kyc_status', '!=', 'pending')
                    ),
                    default => null,
                };
            })
            ->when($request->country, fn($q) => $q->where('country', $request->country));

        $paginated = $query->orderByDesc('created_at')->paginate($request->integer('per_page', 25));

        $users = $paginated->getCollection()->map(fn(User $u) => $this->formatUser($u));

        $stats = [
            'total_users'     => User::count(),
            'active_users'    => User::where('status', 'active')->count(),
            'verified_users'  => User::where('is_verified', true)->count(),
            'suspended_users' => User::where('status', 'suspended')->count(),
        ];

        return response()->json([
            'data'  => $users,
            'meta'  => [
                'total'        => $paginated->total(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
            ],
            'stats' => $stats,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'         => 'required|string|max:100',
            'email'        => 'required|email|unique:users,email',
            'phone'        => 'nullable|string|max:20|unique:users,phone',
            'password'     => 'required|string|min:8',
            'role'         => 'sometimes|in:user,moderator,support,analyst,marketing,finance,admin',
            'gender'       => 'nullable|in:male,female,non_binary,prefer_not_to_say',
            'country_code' => 'nullable|string|max:5',
        ]);

        $data['password']          = Hash::make($data['password']);
        $data['referral_code']     = strtoupper(substr(uniqid(), -8));
        $data['email_verified_at'] = now();
        $data['role']              = $data['role'] ?? 'user';

        $user = User::create($data);

        AuditLog::create([
            'user_id'      => auth()->id(),
            'action'       => 'create',
            'module'       => 'users',
            'description'  => "Created user #{$user->id}: {$user->name}",
            'subject_id'   => $user->id,
            'subject_type' => User::class,
            'ip_address'   => $request->ip(),
        ]);

        return response()->json($this->formatUser($user->load('subscription.plan')), 201);
    }

    public function show(User $user)
    {
        return response()->json($user->load(['photos', 'subscription.plan', 'transactions' => fn($q) => $q->limit(10)]));
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:100',
            'email'       => "sometimes|email|unique:users,email,{$user->id}",
            'role'        => 'sometimes|in:user,moderator,support,analyst,marketing,finance,admin',
            'is_verified' => 'sometimes|boolean',
            'bio'         => 'sometimes|string|max:500',
        ]);

        $user->update($data);

        AuditLog::create([
            'user_id'      => auth()->id(),
            'action'       => 'update',
            'module'       => 'users',
            'description'  => "Updated user #{$user->id}: {$user->name}",
            'subject_id'   => $user->id,
            'subject_type' => User::class,
            'ip_address'   => $request->ip(),
        ]);

        return response()->json($user->fresh());
    }

    public function suspend(Request $request, User $user)
    {
        $data = $request->validate([
            'reason'       => 'nullable|string',
            'duration_days'=> 'nullable|integer|min:1|max:365',
        ]);

        $user->update([
            'status'            => 'suspended',
            'suspension_reason' => $data['reason'] ?? 'Suspended by admin',
            'suspended_until'   => isset($data['duration_days'])
                ? now()->addDays($data['duration_days'])
                : null,
        ]);

        AuditLog::create([
            'user_id'      => auth()->id(),
            'action'       => 'suspend',
            'module'       => 'users',
            'description'  => "Suspended user #{$user->id}: " . ($data['reason'] ?? 'No reason'),
            'subject_id'   => $user->id,
            'subject_type' => User::class,
            'ip_address'   => $request->ip(),
        ]);

        return response()->json(['message' => 'User suspended successfully.']);
    }

    public function unsuspend(User $user)
    {
        $user->update(['status' => 'active', 'suspension_reason' => null, 'suspended_until' => null]);

        AuditLog::create([
            'user_id'      => auth()->id(),
            'action'       => 'unsuspend',
            'module'       => 'users',
            'description'  => "Unsuspended user #{$user->id}: {$user->name}",
            'subject_id'   => $user->id,
            'subject_type' => User::class,
            'ip_address'   => request()->ip(),
        ]);

        return response()->json(['message' => 'User unsuspended.']);
    }

    public function verify(User $user)
    {
        $user->update(['is_verified' => true, 'kyc_status' => 'approved']);

        AuditLog::create([
            'user_id'      => auth()->id(),
            'action'       => 'verify',
            'module'       => 'users',
            'description'  => "Verified user #{$user->id}: {$user->name}",
            'subject_id'   => $user->id,
            'subject_type' => User::class,
            'ip_address'   => request()->ip(),
        ]);

        return response()->json(['message' => 'User verified.']);
    }

    public function approveKyc(User $user)
    {
        $user->update(['kyc_status' => 'approved', 'is_verified' => true]);
        return response()->json(['message' => 'KYC approved.']);
    }

    public function rejectKyc(Request $request, User $user)
    {
        $request->validate(['reason' => 'required|string']);
        $user->update(['kyc_status' => 'rejected']);
        return response()->json(['message' => 'KYC rejected.']);
    }

    public function destroy(User $user)
    {
        $userName = $user->name;
        $userId   = $user->id;

        $user->delete();

        AuditLog::create([
            'user_id'      => auth()->id(),
            'action'       => 'delete',
            'module'       => 'users',
            'description'  => "Deleted user #{$userId}: {$userName}",
            'ip_address'   => request()->ip(),
        ]);

        return response()->json(['message' => 'User deleted.']);
    }

    public function bulkAction(Request $request)
    {
        $data = $request->validate([
            'action'    => 'required|in:suspend,unsuspend,delete,verify',
            'user_ids'  => 'required|array',
            'user_ids.*'=> 'integer|exists:users,id',
        ]);

        $users = User::whereIn('id', $data['user_ids']);

        match ($data['action']) {
            'suspend'   => $users->update(['status' => 'suspended']),
            'unsuspend' => $users->update(['status' => 'active']),
            'delete'    => $users->get()->each->delete(),
            'verify'    => $users->update(['is_verified' => true, 'kyc_status' => 'approved']),
        };

        return response()->json(['message' => "Bulk {$data['action']} applied to " . count($data['user_ids']) . ' users.']);
    }

    public function addNote(Request $request, User $user) { return response()->json(['message' => 'Note added.']); }
    public function addTag(Request $request, User $user)  { return response()->json(['message' => 'Tag added.']); }

    private function formatUser(User $user): array
    {
        $verificationStatus = 'unverified';
        if ($user->is_verified) {
            $verificationStatus = 'verified';
        } elseif ($user->kyc_status === 'pending') {
            $verificationStatus = 'pending';
        }

        return [
            'id'                  => $user->id,
            'name'                => $user->name ?? '',
            'email'               => $user->email,
            'phone'               => $user->phone,
            'profile_photo'       => $user->avatar,
            'status'              => $user->status ?? 'active',
            'role'                => $user->role ?? 'user',
            'city'                => $user->city,
            'country'             => $user->country,
            'is_verified'         => (bool) $user->is_verified,
            'verification_status' => $verificationStatus,
            'subscription_plan'   => $user->relationLoaded('subscription') ? $user->subscription?->plan?->name : null,
            'last_login_at'       => $user->last_active_at?->toISOString(),
            'created_at'          => $user->created_at?->toISOString(),
        ];
    }
}
