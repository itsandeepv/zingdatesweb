<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\{Connection, Group, UserReport};
use Illuminate\Http\Request;

class SocialController extends Controller
{
    public function connections(Request $request)
    {
        return response()->json(
            Connection::with(['sender:id,name,email', 'receiver:id,name,email'])
                ->when($request->status, fn($q) => $q->where('status', $request->status))
                ->orderByDesc('created_at')
                ->paginate(25)
        );
    }

    public function groups(Request $request)
    {
        return response()->json(
            Group::with('owner:id,name')
                ->withCount('members')
                ->orderByDesc('created_at')
                ->paginate(25)
        );
    }

    public function reports(Request $request)
    {
        return response()->json(
            UserReport::with(['reporter:id,name', 'reported:id,name', 'resolvedBy:id,name'])
                ->when($request->status, fn($q) => $q->where('status', $request->status))
                ->orderByDesc('created_at')
                ->paginate(25)
        );
    }

    public function handleReport(Request $request, UserReport $userReport)
    {
        $data = $request->validate([
            'action'      => 'required|in:resolve,dismiss,warn,suspend',
            'admin_notes' => 'nullable|string',
        ]);

        $userReport->update([
            'status'      => in_array($data['action'], ['resolve', 'suspend']) ? 'resolved' : 'dismissed',
            'admin_notes' => $data['admin_notes'] ?? null,
            'resolved_by' => auth()->id(),
            'resolved_at' => now(),
        ]);

        if ($data['action'] === 'suspend') {
            $userReport->reported->update(['status' => 'suspended']);
        }

        return response()->json(['message' => 'Report handled.']);
    }
}
