<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ApiKey;
use App\Models\Webhook;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ApiManagementController extends Controller
{
    public function keys()
    {
        return response()->json(ApiKey::with('createdBy:id,name')->orderByDesc('created_at')->get());
    }

    public function createKey(Request $request)
    {
        $data = $request->validate([
            'name'                  => 'required|string|max:100',
            'type'                  => 'required|in:public,private,admin',
            'permissions'           => 'nullable|array',
            'ip_whitelist'          => 'nullable|string',
            'rate_limit_per_minute' => 'nullable|integer|min:1',
            'expires_at'            => 'nullable|date',
        ]);

        $data['key']        = 'pk_' . Str::random(40);
        $data['secret']     = 'sk_' . Str::random(60);
        $data['created_by'] = auth()->id();

        return response()->json(ApiKey::create($data), 201);
    }

    public function rotateKey(ApiKey $apiKey)
    {
        $apiKey->update(['key' => 'pk_' . Str::random(40), 'secret' => 'sk_' . Str::random(60)]);
        return response()->json($apiKey->fresh());
    }

    public function revokeKey(ApiKey $apiKey)
    {
        $apiKey->update(['is_active' => false]);
        return response()->json(['message' => 'API key revoked.']);
    }

    public function logs(Request $request)
    {
        return response()->json(['logs' => [], 'message' => 'Configure request logging middleware for detailed API logs.']);
    }

    public function webhooks()
    {
        return response()->json(Webhook::orderByDesc('created_at')->get());
    }

    public function createWebhook(Request $request)
    {
        $data = $request->validate([
            'name'   => 'required|string|max:100',
            'url'    => 'required|url',
            'events' => 'required|array',
        ]);

        $data['secret'] = Str::random(32);
        return response()->json(Webhook::create($data), 201);
    }

    public function updateWebhook(Request $request, Webhook $webhook)
    {
        $data = $request->validate([
            'url'       => 'sometimes|url',
            'events'    => 'sometimes|array',
            'is_active' => 'sometimes|boolean',
        ]);

        $webhook->update($data);
        return response()->json($webhook->fresh());
    }

    public function testWebhook(Webhook $webhook)
    {
        return response()->json(['message' => 'Test event dispatched to ' . $webhook->url]);
    }

    public function deleteWebhook(Webhook $webhook)
    {
        $webhook->delete();
        return response()->json(['message' => 'Webhook deleted.']);
    }
}
