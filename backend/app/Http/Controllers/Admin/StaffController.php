<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class StaffController extends Controller
{
    public function index(Request $request)
    {
        $roles = ['moderator', 'support', 'analyst', 'marketing', 'finance', 'admin'];

        return response()->json(
            User::whereIn('role', $roles)
                ->when($request->role, fn($q) => $q->where('role', $request->role))
                ->orderByDesc('created_at')
                ->paginate(25)
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'  => 'required|string|max:100',
            'email' => 'required|email|unique:users',
            'role'  => 'required|in:moderator,support,analyst,marketing,finance,admin',
        ]);

        $tempPassword = Str::random(12);
        $data['password']     = Hash::make($tempPassword);
        $data['referral_code'] = strtoupper(substr(uniqid(), -8));

        $staff = User::create($data);

        return response()->json([
            'staff'         => $staff,
            'temp_password' => $tempPassword,
            'message'       => 'Staff member invited. Temporary password sent.',
        ], 201);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:100',
            'role' => 'sometimes|in:moderator,support,analyst,marketing,finance,admin',
        ]);

        $user->update($data);
        return response()->json($user->fresh());
    }

    public function suspend(User $user)
    {
        $user->update(['status' => 'suspended']);
        return response()->json(['message' => 'Staff member suspended.']);
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'Staff member removed.']);
    }
}
