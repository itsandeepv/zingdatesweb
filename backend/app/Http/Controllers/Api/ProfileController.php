<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function me(Request $request)
    {
        return response()->json($request->user()->load(['photos', 'subscription.plan']));
    }

    public function show(string $username)
    {
        $user = User::where('username', $username)->firstOrFail();
        return response()->json($user->only([
            'id', 'name', 'username', 'bio', 'profession',
            'city', 'country', 'avatar', 'is_verified', 'last_active_at',
        ]));
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:100',
            'bio'         => 'sometimes|string|max:500',
            'profession'  => 'sometimes|string|max:100',
            'gender'      => 'sometimes|in:male,female,non_binary,prefer_not_to_say',
            'city'        => 'sometimes|string|max:100',
            'country'     => 'sometimes|string|max:100',
            'interests'   => 'sometimes|array',
            'date_of_birth'=> 'sometimes|date|before:-18 years',
        ]);

        $request->user()->update($data);
        return response()->json($request->user()->fresh());
    }

    public function uploadPhoto(Request $request)
    {
        $request->validate(['photo' => 'required|image|mimes:jpg,jpeg,png,webp|max:10240']);

        $path = Storage::disk('s3')->put('photos/' . $request->user()->id, $request->file('photo'), 'public');

        $photo = $request->user()->photos()->create([
            'path'       => $path,
            'sort_order' => $request->user()->photos()->count(),
            'is_primary' => $request->user()->photos()->count() === 0,
        ]);

        return response()->json($photo, 201);
    }

    public function deletePhoto(Request $request, int $index)
    {
        $photo = $request->user()->photos()->where('sort_order', $index)->firstOrFail();
        Storage::disk('s3')->delete($photo->path);
        $photo->delete();
        return response()->json(['message' => 'Photo deleted.']);
    }

    public function updateLocation(Request $request)
    {
        $data = $request->validate([
            'latitude'  => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'city'      => 'nullable|string',
            'country'   => 'nullable|string',
        ]);

        $request->user()->update($data);
        return response()->json(['message' => 'Location updated.']);
    }

    public function coinBalance(Request $request)
    {
        return response()->json(['balance' => $request->user()->coin_balance]);
    }

    public function discover(Request $request)
    {
        $user = $request->user();

        $blockedIds = \App\Models\Connection::where(function ($q) use ($user) {
            $q->where('sender_id', $user->id)->orWhere('receiver_id', $user->id);
        })->where('status', 'blocked')->pluck('sender_id')->merge(
            \App\Models\Connection::where(function ($q) use ($user) {
                $q->where('sender_id', $user->id)->orWhere('receiver_id', $user->id);
            })->pluck('receiver_id')
        )->unique();

        $users = User::where('id', '!=', $user->id)
            ->whereNotIn('id', $blockedIds)
            ->where('status', 'active')
            ->when($request->gender, fn($q) => $q->where('gender', $request->gender))
            ->when($request->city, fn($q) => $q->where('city', $request->city))
            ->with(['photos' => fn($q) => $q->where('is_primary', true)])
            ->inRandomOrder()
            ->limit(20)
            ->get();

        return response()->json($users);
    }
}
