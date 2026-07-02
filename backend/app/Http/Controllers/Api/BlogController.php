<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\Request;

class BlogController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            BlogPost::with('author:id,name,avatar')
                ->where('status', 'published')
                ->orderByDesc('published_at')
                ->paginate(12)
        );
    }

    public function show(string $slug)
    {
        $post = BlogPost::where('slug', $slug)->where('status', 'published')->firstOrFail();
        $post->increment('views_count');
        return response()->json($post->load('author:id,name,avatar'));
    }
}
