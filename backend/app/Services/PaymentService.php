<?php

namespace App\Services;

use App\Models\Transaction;
use App\Models\User;
use Stripe\StripeClient;
use Razorpay\Api\Api as RazorpayApi;
use Illuminate\Support\Str;

class PaymentService
{
    private StripeClient $stripe;
    private RazorpayApi $razorpay;

    public function __construct()
    {
        $this->stripe   = new StripeClient(config('services.stripe.secret'));
        $this->razorpay = new RazorpayApi(
            config('services.razorpay.key'),
            config('services.razorpay.secret')
        );
    }

    public function createStripeIntent(int $amountCents, string $currency, User $user): array
    {
        $intent = $this->stripe->paymentIntents->create([
            'amount'   => $amountCents,
            'currency' => strtolower($currency),
            'metadata' => ['user_id' => $user->id],
        ]);

        return [
            'client_secret'     => $intent->client_secret,
            'payment_intent_id' => $intent->id,
        ];
    }

    public function createRazorpayOrder(float $amount, string $currency): array
    {
        $order = $this->razorpay->order->create([
            'receipt'         => 'rcpt_' . Str::random(10),
            'amount'          => (int) ($amount * 100),
            'currency'        => strtoupper($currency),
            'payment_capture' => 1,
        ]);

        return ['order_id' => $order->id, 'amount' => $amount, 'currency' => $currency];
    }

    public function recordTransaction(User $user, array $data): Transaction
    {
        return Transaction::create([
            'user_id'                => $user->id,
            'transaction_id'         => 'TXN-' . strtoupper(Str::random(12)),
            'type'                   => $data['type'],
            'amount'                 => $data['amount'],
            'currency'               => $data['currency'] ?? 'USD',
            'status'                 => $data['status'] ?? 'pending',
            'payment_gateway'        => $data['gateway'],
            'gateway_transaction_id' => $data['gateway_txn_id'] ?? null,
            'description'            => $data['description'] ?? null,
            'ip_address'             => request()->ip(),
        ]);
    }

    public function refundStripe(string $paymentIntentId, int $amountCents): array
    {
        $refund = $this->stripe->refunds->create([
            'payment_intent' => $paymentIntentId,
            'amount'         => $amountCents,
        ]);

        return ['refund_id' => $refund->id, 'status' => $refund->status];
    }
}
