<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Event, EventRegistration};
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EventRegistrationController extends Controller
{
    public function register(Request $request, Event $event)
    {
        if ($event->status !== 'approved') {
            return response()->json(['message' => 'Event is not available for registration.'], 422);
        }

        if ($event->isFull()) {
            return response()->json(['message' => 'Event is at full capacity.'], 422);
        }

        $existing = EventRegistration::where('event_id', $event->id)
            ->where('user_id', $request->user()->id)
            ->whereNot('status', 'cancelled')
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Already registered.'], 422);
        }

        $reg = EventRegistration::create([
            'event_id'    => $event->id,
            'user_id'     => $request->user()->id,
            'status'      => 'registered',
            'ticket_code' => strtoupper(Str::random(8)),
        ]);

        return response()->json($reg, 201);
    }

    public function cancel(Request $request, Event $event)
    {
        EventRegistration::where('event_id', $event->id)
            ->where('user_id', $request->user()->id)
            ->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Registration cancelled.']);
    }

    public function checkIn(Request $request, Event $event)
    {
        $reg = EventRegistration::where('event_id', $event->id)
            ->where('user_id', $request->user()->id)
            ->where('status', 'registered')
            ->firstOrFail();

        $reg->update(['is_checked_in' => true, 'checked_in_at' => now(), 'status' => 'attended']);

        return response()->json(['message' => 'Check-in successful.', 'ticket_code' => $reg->ticket_code]);
    }

    public function list(Request $request, Event $event)
    {
        if ($event->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        return response()->json($event->registrations()->with('user:id,name,email,avatar')->paginate(50));
    }
}
