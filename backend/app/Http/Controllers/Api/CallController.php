<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Call, User};
use App\Services\CoinService;
use Illuminate\Http\Request;

class CallController extends Controller
{
    public function __construct(private CoinService $coins) {}

    public function initiate(Request $request, User $user)
    {
        $data = $request->validate(['type' => 'required|in:audio,video']);

        $coinsPerMinute = $data['type'] === 'video' ? 10 : 5;

        if ($request->user()->coin_balance < $coinsPerMinute) {
            return response()->json(['message' => 'Insufficient coins. Please recharge to make calls.'], 402);
        }

        $call = Call::create([
            'caller_id'       => $request->user()->id,
            'receiver_id'     => $user->id,
            'type'            => $data['type'],
            'status'          => 'initiated',
            'coins_per_minute'=> $coinsPerMinute,
            'session_id'      => 'sess_' . uniqid(),
        ]);

        return response()->json($call, 201);
    }

    public function accept(Request $request, Call $call)
    {
        if ($call->receiver_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $call->update(['status' => 'active', 'answered_at' => now()]);
        return response()->json($call);
    }

    public function decline(Request $request, Call $call)
    {
        $call->update(['status' => 'declined', 'ended_at' => now()]);
        return response()->json(['message' => 'Call declined.']);
    }

    public function end(Request $request, Call $call)
    {
        if (!in_array($request->user()->id, [$call->caller_id, $call->receiver_id])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $now = now();
        $duration = $call->answered_at ? $call->answered_at->diffInSeconds($now) : 0;
        $minutes = ceil($duration / 60);
        $coinsCharged = $minutes * $call->coins_per_minute;

        $this->coins->debit(
            $call->caller,
            $coinsCharged,
            $call->type === 'video' ? 'video_call' : 'audio_call',
            "Call with user #{$call->receiver_id} — {$minutes} min",
            ['id' => $call->id, 'type' => Call::class]
        );

        $call->update([
            'status'        => 'ended',
            'duration_seconds'=> $duration,
            'coins_charged' => $coinsCharged,
            'ended_at'      => $now,
        ]);

        return response()->json(['call' => $call, 'coins_charged' => $coinsCharged]);
    }
}
