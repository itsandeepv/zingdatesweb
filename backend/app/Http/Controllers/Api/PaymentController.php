<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\{PaymentService, CoinService};
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        private PaymentService $payments,
        private CoinService $coins,
    ) {}

    public function createIntent(Request $request)
    {
        $data = $request->validate([
            'amount'   => 'required|numeric|min:0.5',
            'currency' => 'required|string|size:3',
            'gateway'  => 'required|in:stripe,razorpay',
        ]);

        if ($data['gateway'] === 'stripe') {
            $result = $this->payments->createStripeIntent(
                (int) ($data['amount'] * 100),
                $data['currency'],
                $request->user()
            );
        } else {
            $result = $this->payments->createRazorpayOrder($data['amount'], $data['currency']);
        }

        return response()->json($result);
    }

    public function rechargeCoins(Request $request)
    {
        $data = $request->validate([
            'package_id' => 'required|integer',
            'amount'     => 'required|numeric|min:0.99',
            'coins'      => 'required|integer|min:1',
            'currency'   => 'required|string|size:3',
        ]);

        $txn = $this->payments->recordTransaction($request->user(), [
            'type'        => 'coin_purchase',
            'amount'      => $data['amount'],
            'currency'    => $data['currency'],
            'status'      => 'completed',
            'gateway'     => 'stripe',
            'description' => "Purchased {$data['coins']} coins",
        ]);

        $this->coins->credit(
            $request->user(),
            $data['coins'],
            'purchase',
            "Coin recharge — {$data['coins']} coins",
            ['id' => $txn->id, 'type' => 'transaction']
        );

        return response()->json([
            'balance'     => $request->user()->fresh()->coin_balance,
            'coins_added' => $data['coins'],
        ]);
    }

    public function stripeWebhook(Request $request)
    {
        // Handle Stripe webhook events
        return response()->json(['received' => true]);
    }

    public function razorpayWebhook(Request $request)
    {
        // Handle Razorpay webhook events
        return response()->json(['received' => true]);
    }

    public function history(Request $request)
    {
        return response()->json(
            $request->user()->transactions()->orderByDesc('created_at')->paginate(20)
        );
    }
}
