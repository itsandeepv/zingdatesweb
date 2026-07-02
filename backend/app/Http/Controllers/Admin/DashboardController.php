<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\{User, Subscription, Transaction, Event, SupportTicket, AuditLog};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats()
    {
        $now = now();

        return response()->json([
            'users' => [
                'total'          => User::count(),
                'active'         => User::where('status', 'active')->count(),
                'premium'        => User::where('is_premium', true)->count(),
                'new_this_month' => User::whereMonth('created_at', $now->month)->count(),
                'growth_rate'    => $this->growthRate(User::class),
            ],
            'revenue' => [
                'total'          => Transaction::where('status', 'completed')->sum('amount'),
                'this_month'     => Transaction::where('status', 'completed')
                    ->whereMonth('created_at', $now->month)->sum('amount'),
                'mrr'            => Subscription::where('status', 'active')
                    ->where('billing_cycle', 'monthly')->sum('amount'),
                'growth_rate'    => $this->revenueGrowthRate(),
            ],
            'subscriptions' => [
                'active'         => Subscription::where('status', 'active')->count(),
                'cancelled'      => Subscription::where('status', 'cancelled')
                    ->whereMonth('cancelled_at', $now->month)->count(),
                'churn_rate'     => $this->churnRate(),
            ],
            'events' => [
                'total'          => Event::count(),
                'pending'        => Event::where('status', 'pending')->count(),
                'upcoming'       => Event::where('status', 'approved')
                    ->where('starts_at', '>', $now)->count(),
            ],
            'support' => [
                'open_tickets'   => SupportTicket::whereIn('status', ['open', 'in_progress'])->count(),
                'urgent'         => SupportTicket::where('priority', 'urgent')
                    ->where('status', 'open')->count(),
            ],
            'user_growth'    => $this->monthlyUserGrowth(),
            'revenue_trend'  => $this->monthlyRevenueTrend(),
            'top_countries'  => $this->topCountries(),
            'recent_activity'=> AuditLog::with('user:id,name,avatar')
                ->orderByDesc('created_at')->limit(10)->get(),
        ]);
    }

    public function activity(Request $request)
    {
        return response()->json(
            AuditLog::with('user:id,name,avatar')
                ->orderByDesc('created_at')
                ->paginate($request->integer('per_page', 25))
        );
    }

    private function growthRate(string $model): float
    {
        $thisMonth = $model::whereMonth('created_at', now()->month)->count();
        $lastMonth = $model::whereMonth('created_at', now()->subMonth()->month)->count();
        if ($lastMonth === 0) return 100.0;
        return round(($thisMonth - $lastMonth) / $lastMonth * 100, 1);
    }

    private function revenueGrowthRate(): float
    {
        $this_m = Transaction::where('status', 'completed')->whereMonth('created_at', now()->month)->sum('amount');
        $last_m = Transaction::where('status', 'completed')->whereMonth('created_at', now()->subMonth()->month)->sum('amount');
        if ($last_m == 0) return 100.0;
        return round(($this_m - $last_m) / $last_m * 100, 1);
    }

    private function churnRate(): float
    {
        $active    = Subscription::where('status', 'active')->count();
        $cancelled = Subscription::where('status', 'cancelled')->whereMonth('cancelled_at', now()->month)->count();
        if ($active === 0) return 0;
        return round($cancelled / $active * 100, 1);
    }

    private function monthlyUserGrowth(): array
    {
        return DB::table('users')
            ->selectRaw('MONTH(created_at) as month, YEAR(created_at) as year, COUNT(*) as count')
            ->where('created_at', '>=', now()->subMonths(12))
            ->groupByRaw('YEAR(created_at), MONTH(created_at)')
            ->orderByRaw('YEAR(created_at), MONTH(created_at)')
            ->get()->toArray();
    }

    private function monthlyRevenueTrend(): array
    {
        return DB::table('transactions')
            ->selectRaw('MONTH(created_at) as month, YEAR(created_at) as year, SUM(amount) as total')
            ->where('status', 'completed')
            ->where('created_at', '>=', now()->subMonths(12))
            ->groupByRaw('YEAR(created_at), MONTH(created_at)')
            ->orderByRaw('YEAR(created_at), MONTH(created_at)')
            ->get()->toArray();
    }

    private function topCountries(): array
    {
        return DB::table('users')
            ->select('country', DB::raw('COUNT(*) as user_count'))
            ->whereNotNull('country')
            ->groupBy('country')
            ->orderByDesc('user_count')
            ->limit(10)
            ->get()->toArray();
    }
}
