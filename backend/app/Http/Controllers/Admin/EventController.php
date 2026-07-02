<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $query = Event::with('organizer:id,name,email')
            ->withCount('registrations')
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->category, fn($q) => $q->where('category', $request->category))
            ->when($request->search, fn($q) => $q->where('title', 'like', "%{$request->search}%"));

        return response()->json($query->orderByDesc('created_at')->paginate(25));
    }

    public function show(Event $event)
    {
        return response()->json($event->load(['organizer', 'registrations.user:id,name,email,avatar']));
    }

    public function approve(Event $event)
    {
        $event->update(['status' => 'approved']);
        return response()->json(['message' => 'Event approved.']);
    }

    public function cancel(Request $request, Event $event)
    {
        $data = $request->validate(['reason' => 'required|string']);
        $event->update(['status' => 'cancelled', 'cancellation_reason' => $data['reason']]);
        return response()->json(['message' => 'Event cancelled.']);
    }

    public function destroy(Event $event)
    {
        $event->delete();
        return response()->json(['message' => 'Event deleted.']);
    }
}
