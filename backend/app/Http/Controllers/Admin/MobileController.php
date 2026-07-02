<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppVersion;
use App\Models\FeatureFlag;
use Illuminate\Http\Request;

class MobileController extends Controller
{
    public function versions()
    {
        return response()->json(AppVersion::orderByDesc('created_at')->get());
    }

    public function createVersion(Request $request)
    {
        $data = $request->validate([
            'version'       => 'required|string|max:20',
            'platform'      => 'required|in:ios,android,both',
            'status'        => 'required|in:latest,supported,deprecated,blocked',
            'changelog'     => 'nullable|string',
            'release_notes' => 'nullable|string',
            'force_update'  => 'boolean',
            'download_url'  => 'nullable|url',
            'released_at'   => 'nullable|date',
        ]);

        return response()->json(AppVersion::create($data), 201);
    }

    public function updateVersion(Request $request, AppVersion $appVersion)
    {
        $data = $request->validate([
            'status'       => 'sometimes|in:latest,supported,deprecated,blocked',
            'force_update' => 'sometimes|boolean',
        ]);

        $appVersion->update($data);
        return response()->json($appVersion->fresh());
    }

    public function featureFlags()
    {
        return response()->json(FeatureFlag::all());
    }

    public function updateFlag(Request $request, FeatureFlag $featureFlag)
    {
        $data = $request->validate([
            'is_enabled'          => 'sometimes|boolean',
            'rollout_percentage'  => 'sometimes|integer|min:0|max:100',
            'target_user_ids'     => 'nullable|array',
        ]);

        $featureFlag->update($data);
        return response()->json($featureFlag->fresh());
    }

    public function config()
    {
        return response()->json(\App\Models\AppConfig::where('is_public', false)->get());
    }

    public function updateConfig(Request $request)
    {
        $data = $request->validate(['config' => 'required|array']);

        foreach ($data['config'] as $key => $value) {
            \App\Models\AppConfig::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        return response()->json(['message' => 'App config updated.']);
    }

    public function crashes()
    {
        return response()->json(['crashes' => [], 'message' => 'Integrate with Firebase Crashlytics for crash reports.']);
    }
}
