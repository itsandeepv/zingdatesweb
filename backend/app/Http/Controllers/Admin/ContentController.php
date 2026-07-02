<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use App\Models\MediaFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ContentController extends Controller
{
    public function pages()
    {
        return response()->json(\App\Models\Page::all());
    }

    public function updatePage(Request $request, \App\Models\Page $page)
    {
        $data = $request->validate(['content' => 'required|string', 'status' => 'in:published,draft']);
        $page->update($data);
        return response()->json($page->fresh());
    }

    public function blog(Request $request)
    {
        return response()->json(BlogPost::with('author:id,name')->orderByDesc('created_at')->paginate(25));
    }

    public function createPost(Request $request)
    {
        $data = $request->validate([
            'title'            => 'required|string|max:200',
            'excerpt'          => 'nullable|string|max:500',
            'body'             => 'required|string',
            'category'         => 'nullable|string',
            'tags'             => 'nullable|array',
            'cover_image'      => 'nullable|url',
            'status'           => 'required|in:draft,published',
            'meta_title'       => 'nullable|string|max:60',
            'meta_description' => 'nullable|string|max:160',
        ]);

        $data['author_id']     = auth()->id();
        $data['slug']          = Str::slug($data['title']);
        $data['published_at']  = $data['status'] === 'published' ? now() : null;

        return response()->json(BlogPost::create($data), 201);
    }

    public function updatePost(Request $request, BlogPost $blogPost)
    {
        $data = $request->validate([
            'title'   => 'sometimes|string|max:200',
            'body'    => 'sometimes|string',
            'status'  => 'sometimes|in:draft,published,archived',
        ]);

        if (isset($data['status']) && $data['status'] === 'published' && !$blogPost->published_at) {
            $data['published_at'] = now();
        }

        $blogPost->update($data);
        return response()->json($blogPost->fresh());
    }

    public function deletePost(BlogPost $blogPost)
    {
        $blogPost->delete();
        return response()->json(['message' => 'Post deleted.']);
    }

    public function media(Request $request)
    {
        return response()->json(MediaFile::with('uploader:id,name')->orderByDesc('created_at')->paginate(40));
    }

    public function uploadMedia(Request $request)
    {
        $request->validate(['file' => 'required|file|max:20480', 'folder' => 'nullable|string']);

        $file = $request->file('file');
        $folder = 'media/' . ($request->folder ?? 'general');
        $path = Storage::disk('s3')->put($folder, $file, 'public');

        $media = MediaFile::create([
            'uploaded_by' => auth()->id(),
            'name'        => $file->getClientOriginalName(),
            'path'        => $path,
            'url'         => Storage::disk('s3')->url($path),
            'mime_type'   => $file->getMimeType(),
            'size_bytes'  => $file->getSize(),
            'folder'      => $request->folder,
        ]);

        return response()->json($media, 201);
    }

    public function deleteMedia(MediaFile $mediaFile)
    {
        Storage::disk('s3')->delete($mediaFile->path);
        $mediaFile->delete();
        return response()->json(['message' => 'Media deleted.']);
    }
}
