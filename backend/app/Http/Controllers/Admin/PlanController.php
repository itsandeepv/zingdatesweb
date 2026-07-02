<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    public function index()
    {
        return response()->json(Plan::withCount('subscriptions')->orderBy('sort_order')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'            => 'required|string|max:100',
            'slug'            => 'required|string|unique:plans',
            'description'     => 'nullable|string',
            'tier'            => 'required|in:free,premium,vip,corporate',
            'price_monthly'   => 'required|numeric|min:0',
            'price_yearly'    => 'required|numeric|min:0',
            'currency'        => 'required|string|size:3',
            'features'        => 'nullable|array',
            'coins_included'  => 'nullable|integer|min:0',
            'is_active'       => 'boolean',
            'is_popular'      => 'boolean',
            'sort_order'      => 'nullable|integer',
        ]);

        return response()->json(Plan::create($data), 201);
    }

    public function update(Request $request, Plan $plan)
    {
        $data = $request->validate([
            'name'          => 'sometimes|string|max:100',
            'description'   => 'nullable|string',
            'price_monthly' => 'sometimes|numeric|min:0',
            'price_yearly'  => 'sometimes|numeric|min:0',
            'features'      => 'nullable|array',
            'is_active'     => 'sometimes|boolean',
            'is_popular'    => 'sometimes|boolean',
        ]);

        $plan->update($data);
        return response()->json($plan->fresh());
    }

    public function destroy(Plan $plan)
    {
        if ($plan->subscriptions()->where('status', 'active')->exists()) {
            return response()->json(['message' => 'Cannot delete a plan with active subscriptions.'], 422);
        }
        $plan->delete();
        return response()->json(['message' => 'Plan deleted.']);
    }
}
