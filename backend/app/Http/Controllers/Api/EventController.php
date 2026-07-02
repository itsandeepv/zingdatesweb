<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $query = Event::with('organizer:id,name,avatar,is_verified')
            ->withCount('registrations')
            ->where('status', 'approved')
            ->when($request->category, fn($q) => $q->where('category', $request->category))
            ->when($request->city, fn($q) => $q->where('city', $request->city))
            ->when($request->type, fn($q) => $q->where('type', $request->type))
            ->when($request->from, fn($q) => $q->where('starts_at', '>=', $request->from))
            ->orderBy('starts_at');

        return response()->json($query->paginate(20));
    }

    public function show(string $slug)
    {
        $event = Event::where('slug', $slug)
            ->where('status', 'approved')
            ->with('organizer:id,name,avatar,is_verified')
            ->withCount('registrations')
            ->firstOrFail();

        $event->increment('views_count');

        return response()->json($event);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'         => 'required|string|max:200',
            'description'   => 'required|string',
            'category'      => 'required|string',
            'type'          => 'required|in:in_person,virtual,hybrid',
            'venue_name'    => 'required_if:type,in_person|nullable|string',
            'venue_address' => 'nullable|string',
            'city'          => 'nullable|string',
            'country'       => 'nullable|string',
            'virtual_link'  => 'required_if:type,virtual|nullable|url',
            'starts_at'     => 'required|date|after:now',
            'ends_at'       => 'required|date|after:starts_at',
            'max_capacity'  => 'nullable|integer|min:1',
            'ticket_price'  => 'nullable|numeric|min:0',
            'is_free'       => 'boolean',
            'cover_image'   => 'nullable|url',
            'tags'          => 'nullable|array',
        ]);

        $data['user_id'] = $request->user()->id;
        $data['status'] = 'pending';

        return response()->json(Event::create($data), 201);
    }

    public function update(Request $request, Event $event)
    {
        if ($event->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $data = $request->validate([
            'title'       => 'sometimes|string|max:200',
            'description' => 'sometimes|string',
            'cover_image' => 'nullable|url',
        ]);

        $event->update($data);
        return response()->json($event->fresh());
    }

    public function destroy(Request $request, Event $event)
    {
        if ($event->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $event->delete();
        return response()->json(['message' => 'Event deleted.']);
    }
}
