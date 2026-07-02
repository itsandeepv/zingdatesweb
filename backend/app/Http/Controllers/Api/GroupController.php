<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GroupController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Group::with('owner:id,name,avatar')
                ->withCount('members')
                ->where('is_active', true)
                ->when($request->category, fn($q) => $q->where('category', $request->category))
                ->orderByDesc('members_count')
                ->paginate(20)
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'type'        => 'required|in:public,private,secret',
            'category'    => 'nullable|string',
        ]);

        $data['owner_id'] = $request->user()->id;
        $data['slug']     = Str::slug($data['name']) . '-' . Str::random(4);

        $group = Group::create($data);
        $group->members()->create(['user_id' => $request->user()->id, 'role' => 'admin']);

        return response()->json($group, 201);
    }

    public function show(Group $group)
    {
        return response()->json($group->load('owner:id,name,avatar')->loadCount('members'));
    }

    public function join(Request $request, Group $group)
    {
        if ($group->type === 'secret') {
            return response()->json(['message' => 'Cannot join a secret group without invitation.'], 403);
        }

        $group->members()->firstOrCreate(['user_id' => $request->user()->id]);
        $group->increment('members_count');

        return response()->json(['message' => 'Joined group.']);
    }

    public function leave(Request $request, Group $group)
    {
        $group->members()->where('user_id', $request->user()->id)->delete();
        $group->decrement('members_count');
        return response()->json(['message' => 'Left group.']);
    }
}
