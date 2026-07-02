<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function index(Request $request)
    {
        $query = Subscription::with(['user:id,name,email', 'plan:id,name,tier'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->plan_id, fn($q) => $q->where('plan_id', $request->plan_id));

        return response()->json($query->orderByDesc('created_at')->paginate(25));
    }

    public function show(Subscription $subscription)
    {
        return response()->json($subscription->load(['user', 'plan']));
    }

    public function cancel(Request $request, Subscription $subscription)
    {
        $data = $request->validate(['reason' => 'nullable|string']);
        $subscription->update([
            'status'               => 'cancelled',
            'cancelled_at'         => now(),
            'cancellation_reason'  => $data['reason'] ?? 'Cancelled by admin',
            'auto_renew'           => false,
        ]);
        return response()->json(['message' => 'Subscription cancelled.']);
    }
}
