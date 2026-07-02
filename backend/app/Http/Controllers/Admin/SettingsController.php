<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\\Setting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = \App\Models\Setting::all()->groupBy('group');
        return response()->json($settings);
    }

    public function update(Request $request)
    {
        $data = $request->validate(['settings' => 'required|array']);

        foreach ($data['settings'] as $key => $value) {
            \App\Models\Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        return response()->json(['message' => 'Settings updated.']);
    }

    public function toggleMaintenance(Request $request)
    {
        $setting = \App\Models\Setting::firstOrCreate(['key' => 'maintenance_mode'], ['value' => '0', 'group' => 'system']);
        $setting->update(['value' => $setting->value === '1' ? '0' : '1']);
        return response()->json(['maintenance_mode' => $setting->value === '1']);
    }

    public function updateSecurity(Request $request)
    {
        $data = $request->validate([
            'two_factor_required' => 'boolean',
            'session_timeout'     => 'integer|min:5|max:1440',
            'ip_whitelist'        => 'nullable|string',
        ]);

        foreach ($data as $key => $value) {
            \App\Models\Setting::updateOrCreate(['key' => $key, 'group' => 'security'], ['value' => $value]);
        }

        return response()->json(['message' => 'Security settings updated.']);
    }
}
