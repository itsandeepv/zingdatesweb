<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Plan, Subscription};
use App\Services\PaymentService;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function __construct(private PaymentService $payments) {}

    public function current(Request $request)
    {
        return response()->json($request->user()->subscription?->load('plan'));
    }

    public function subscribe(Request $request)
    {
        $data = $request->validate([
            'plan_id'       => 'required|exists:plans,id',
            'billing_cycle' => 'required|in:monthly,yearly',
        ]);

        $plan = Plan::findOrFail($data['plan_id']);
        $amount = $data['billing_cycle'] === 'yearly' ? $plan->price_yearly : $plan->price_monthly;

        $request->user()->subscription?->update(['status' => 'cancelled', 'cancelled_at' => now()]);

        $sub = Subscription::create([
            'user_id'              => $request->user()->id,
            'plan_id'              => $plan->id,
            'status'               => 'active',
            'billing_cycle'        => $data['billing_cycle'],
            'amount'               => $amount,
            'currency'             => $plan->currency,
            'current_period_start' => now(),
            'current_period_end'   => $data['billing_cycle'] === 'yearly' ? now()->addYear() : now()->addMonth(),
        ]);

        $request->user()->update(['is_premium' => true]);

        return response()->json($sub->load('plan'), 201);
    }

    public function cancel(Request $request, Subscription $subscription)
    {
        if ($subscription->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $data = $request->validate(['reason' => 'nullable|string']);

        $subscription->update([
            'status'              => 'cancelled',
            'cancelled_at'        => now(),
            'cancellation_reason' => $data['reason'] ?? null,
            'auto_renew'          => false,
        ]);

        return response()->json(['message' => 'Subscription cancelled. Access continues until period end.']);
    }

    public function upgrade(Request $request, Subscription $subscription)
    {
        $data = $request->validate(['plan_id' => 'required|exists:plans,id']);
        $subscription->update(['plan_id' => $data['plan_id']]);
        return response()->json($subscription->fresh()->load('plan'));
    }
}
