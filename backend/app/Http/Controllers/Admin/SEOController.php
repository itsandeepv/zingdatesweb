<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SeoPage;
use App\Models\SeoRedirect;
use Illuminate\Http\Request;

class SEOController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\SeoPage::all());
    }

    public function show(\App\Models\SeoPage $seoPage)
    {
        return response()->json($seoPage);
    }

    public function update(Request $request, \App\Models\SeoPage $seoPage)
    {
        $data = $request->validate([
            'meta_title'       => 'nullable|string|max:60',
            'meta_description' => 'nullable|string|max:160',
            'meta_keywords'    => 'nullable|string',
            'og_title'         => 'nullable|string|max:60',
            'og_description'   => 'nullable|string|max:200',
            'og_image'         => 'nullable|url',
            'canonical_url'    => 'nullable|url',
            'robots'           => 'nullable|string',
            'schema_markup'    => 'nullable|json',
        ]);

        $seoPage->update($data);
        return response()->json($seoPage->fresh());
    }

    public function generateSitemap()
    {
        return response()->json(['url' => url('/sitemap.xml'), 'message' => 'Sitemap generation queued.']);
    }

    public function redirects()
    {
        return response()->json(\App\Models\SeoRedirect::all());
    }

    public function addRedirect(Request $request)
    {
        $data = $request->validate([
            'from_url'    => 'required|string',
            'to_url'      => 'required|string',
            'status_code' => 'required|in:301,302,307,308',
        ]);

        return response()->json(\App\Models\SeoRedirect::create($data), 201);
    }

    public function deleteRedirect(\App\Models\SeoRedirect $seoRedirect)
    {
        $seoRedirect->delete();
        return response()->json(['message' => 'Redirect deleted.']);
    }
}
