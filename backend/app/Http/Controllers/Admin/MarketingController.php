<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\CouponCode;
use Illuminate\Http\Request;

class MarketingController extends Controller
{
    public function campaigns(Request $request)
    {
        return response()->json(Campaign::with('createdBy:id,name')->orderByDesc('created_at')->paginate(25));
    }

    public function createCampaign(Request $request)
    {
        $data = $request->validate([
            'name'            => 'required|string|max:100',
            'subject'         => 'nullable|string|max:200',
            'body'            => 'required|string',
            'type'            => 'required|in:email,push,sms',
            'audience_filter' => 'nullable|array',
            'scheduled_at'    => 'nullable|date|after:now',
        ]);

        $data['created_by'] = auth()->id();
        return response()->json(Campaign::create($data), 201);
    }

    public function updateCampaign(Request $request, Campaign $campaign)
    {
        if ($campaign->status === 'sent') {
            return response()->json(['message' => 'Cannot edit a sent campaign.'], 422);
        }

        $data = $request->validate([
            'name'         => 'sometimes|string|max:100',
            'subject'      => 'nullable|string|max:200',
            'body'         => 'sometimes|string',
            'scheduled_at' => 'nullable|date|after:now',
        ]);

        $campaign->update($data);
        return response()->json($campaign->fresh());
    }

    public function sendCampaign(Campaign $campaign)
    {
        if ($campaign->status === 'sent') {
            return response()->json(['message' => 'Campaign already sent.'], 422);
        }

        $campaign->update(['status' => 'sending', 'sent_at' => now()]);
        // Dispatch job: SendCampaignJob::dispatch($campaign);
        return response()->json(['message' => 'Campaign send queued.']);
    }

    public function deleteCampaign(Campaign $campaign)
    {
        $campaign->delete();
        return response()->json(['message' => 'Campaign deleted.']);
    }

    public function coupons(Request $request)
    {
        return response()->json(CouponCode::orderByDesc('created_at')->paginate(25));
    }

    public function createCoupon(Request $request)
    {
        $data = $request->validate([
            'code'               => 'required|string|unique:coupon_codes|max:20',
            'discount_type'      => 'required|in:percentage,fixed',
            'discount_value'     => 'required|numeric|min:0',
            'max_discount_amount'=> 'nullable|numeric|min:0',
            'min_order_amount'   => 'nullable|numeric|min:0',
            'usage_limit'        => 'nullable|integer|min:1',
            'per_user_limit'     => 'nullable|integer|min:1',
            'valid_from'         => 'nullable|date',
            'valid_until'        => 'nullable|date|after:valid_from',
            'applicable_plans'   => 'nullable|array',
            'is_active'          => 'boolean',
        ]);

        return response()->json(CouponCode::create($data), 201);
    }

    public function updateCoupon(Request $request, CouponCode $couponCode)
    {
        $data = $request->validate([
            'is_active'   => 'sometimes|boolean',
            'valid_until' => 'nullable|date',
            'usage_limit' => 'nullable|integer|min:1',
        ]);

        $couponCode->update($data);
        return response()->json($couponCode->fresh());
    }

    public function deleteCoupon(CouponCode $couponCode)
    {
        $couponCode->delete();
        return response()->json(['message' => 'Coupon deleted.']);
    }
}
