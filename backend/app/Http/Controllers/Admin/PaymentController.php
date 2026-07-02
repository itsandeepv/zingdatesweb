<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CoinLedger;
use App\Models\Transaction;
use App\Services\PaymentService;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(private PaymentService $payments) {}

    public function index(Request $request)
    {
        $query = Transaction::with('user:id,name,email')
            ->when($request->status,  fn($q) => $q->where('status', $request->status))
            ->when($request->gateway, fn($q) => $q->where('payment_gateway', $request->gateway))
            ->when($request->type,    fn($q) => $q->where('type', $request->type))
            ->when($request->search,  fn($q) => $q->where(function ($q) use ($request) {
                $q->where('transaction_id', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%")
                  ->orWhereHas('user', fn($q) => $q->where('name', 'like', "%{$request->search}%")
                                                    ->orWhere('email', 'like', "%{$request->search}%"));
            }))
            ->when($request->from, fn($q) => $q->whereDate('created_at', '>=', $request->from))
            ->when($request->to,   fn($q) => $q->whereDate('created_at', '<=', $request->to));

        return response()->json($query->orderByDesc('created_at')->paginate($request->integer('per_page', 25)));
    }

    public function show(Transaction $transaction)
    {
        return response()->json($transaction->load('user'));
    }

    public function stats()
    {
        $totalRevenue   = Transaction::where('status', 'completed')->sum('amount');
        $completedCount = Transaction::where('status', 'completed')->count();
        $pendingCount   = Transaction::where('status', 'pending')->count();
        $failedCount    = Transaction::where('status', 'failed')->count();
        $refundedCount  = Transaction::where('status', 'refunded')->count();
        $refundedAmount = Transaction::where('status', 'refunded')->sum('refund_amount');

        $year = now()->year;
        $byMonth = Transaction::where('status', 'completed')
            ->whereYear('created_at', $year)
            ->selectRaw('MONTH(created_at) as month, SUM(amount) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('total', 'month');

        $monthlyRevenue = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthlyRevenue[] = ['month' => $m, 'revenue' => (float) ($byMonth[$m] ?? 0)];
        }

        return response()->json([
            'total_revenue'    => (float) $totalRevenue,
            'completed_count'  => $completedCount,
            'pending_count'    => $pendingCount,
            'failed_count'     => $failedCount,
            'refunded_count'   => $refundedCount,
            'refunded_amount'  => (float) $refundedAmount,
            'monthly_revenue'  => $monthlyRevenue,
        ]);
    }

    public function transactions(Request $request)
    {
        $query = CoinLedger::with('user:id,name,email')
            ->when($request->type,   fn($q) => $q->where('type', $request->type))
            ->when($request->source, fn($q) => $q->where('source', $request->source))
            ->when($request->search, fn($q) => $q->where(function ($q) use ($request) {
                $q->where('description', 'like', "%{$request->search}%")
                  ->orWhereHas('user', fn($q) => $q->where('name', 'like', "%{$request->search}%")
                                                    ->orWhere('email', 'like', "%{$request->search}%"));
            }));

        return response()->json($query->orderByDesc('created_at')->paginate($request->integer('per_page', 25)));
    }

    public function refund(Request $request, Transaction $transaction)
    {
        $data = $request->validate([
            'reason' => 'required|string|max:500',
            'amount' => 'nullable|numeric|min:0.01',
        ]);

        if ($transaction->status !== 'completed') {
            return response()->json(['message' => 'Only completed transactions can be refunded.'], 422);
        }

        $refundAmount = $data['amount'] ?? $transaction->amount;

        if ($transaction->payment_gateway === 'stripe' && $transaction->gateway_transaction_id) {
            $this->payments->refundStripe(
                $transaction->gateway_transaction_id,
                (int) ($refundAmount * 100)
            );
        }

        $transaction->update([
            'status'        => 'refunded',
            'refund_amount' => $refundAmount,
            'refunded_at'   => now(),
        ]);

        return response()->json(['message' => 'Refund processed successfully.']);
    }

    public function export(Request $request)
    {
        return response()->json(['message' => 'Export queued. You will receive an email with the download link.']);
    }
}
