<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Connection;
use App\Models\User;
use Illuminate\Http\Request;

class ConnectionController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $connections = Connection::with(['sender:id,name,username,avatar,is_verified', 'receiver:id,name,username,avatar,is_verified'])
            ->where(fn($q) => $q->where('sender_id', $userId)->orWhere('receiver_id', $userId))
            ->where('status', 'accepted')
            ->orderByDesc('accepted_at')
            ->paginate(20);

        return response()->json($connections);
    }

    public function send(Request $request, User $user)
    {
        $existing = Connection::where(fn($q) =>
            $q->where('sender_id', $request->user()->id)->where('receiver_id', $user->id)
        )->orWhere(fn($q) =>
            $q->where('sender_id', $user->id)->where('receiver_id', $request->user()->id)
        )->first();

        if ($existing) {
            return response()->json(['message' => 'Connection already exists.'], 422);
        }

        $connection = Connection::create([
            'sender_id'   => $request->user()->id,
            'receiver_id' => $user->id,
            'status'      => 'pending',
        ]);

        return response()->json($connection, 201);
    }

    public function accept(Request $request, User $user)
    {
        $connection = Connection::where('sender_id', $user->id)
            ->where('receiver_id', $request->user()->id)
            ->where('status', 'pending')
            ->firstOrFail();

        $connection->update(['status' => 'accepted', 'accepted_at' => now()]);

        return response()->json(['message' => 'Connection accepted.']);
    }

    public function reject(Request $request, User $user)
    {
        Connection::where('sender_id', $user->id)
            ->where('receiver_id', $request->user()->id)
            ->where('status', 'pending')
            ->delete();

        return response()->json(['message' => 'Connection rejected.']);
    }

    public function remove(Request $request, User $user)
    {
        Connection::where(fn($q) =>
            $q->where('sender_id', $request->user()->id)->where('receiver_id', $user->id)
        )->orWhere(fn($q) =>
            $q->where('sender_id', $user->id)->where('receiver_id', $request->user()->id)
        )->delete();

        return response()->json(['message' => 'Connection removed.']);
    }

    public function followers(Request $request)
    {
        return response()->json(
            Connection::with('sender:id,name,username,avatar,is_verified')
                ->where('receiver_id', $request->user()->id)
                ->where('status', 'pending')
                ->paginate(20)
        );
    }

    public function following(Request $request)
    {
        return response()->json(
            Connection::with('receiver:id,name,username,avatar,is_verified')
                ->where('sender_id', $request->user()->id)
                ->where('status', 'pending')
                ->paginate(20)
        );
    }

    public function like(Request $request, User $user)
    {
        return $this->send($request, $user);
    }

    public function pass(Request $request, User $user)
    {
        return response()->json(['message' => 'Passed.']);
    }
}
