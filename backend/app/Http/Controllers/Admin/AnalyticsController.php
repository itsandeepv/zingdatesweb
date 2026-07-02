<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\{User, Transaction, Subscription, Event};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function overview()
    {
        return response()->json([
            'total_users'         => User::count(),
            'active_users_30d'    => User::where('last_active_at', '>=', now()->subDays(30))->count(),
            'new_users_30d'       => User::where('created_at', '>=', now()->subDays(30))->count(),
            'total_revenue'       => Transaction::where('status', 'completed')->sum('amount'),
            'revenue_30d'         => Transaction::where('status', 'completed')->where('created_at', '>=', now()->subDays(30))->sum('amount'),
            'active_subscriptions'=> Subscription::where('status', 'active')->count(),
            'total_events'        => Event::count(),
        ]);
    }

    public function users()
    {
        return response()->json([
            'by_gender'  => User::select('gender', DB::raw('count(*) as count'))->groupBy('gender')->get(),
            'by_country' => User::select('country', DB::raw('count(*) as count'))->whereNotNull('country')->groupBy('country')->orderByDesc('count')->limit(20)->get(),
            'by_status'  => User::select('status', DB::raw('count(*) as count'))->groupBy('status')->get(),
            'growth'     => DB::table('users')->selectRaw('DATE(created_at) as date, COUNT(*) as count')->where('created_at', '>=', now()->subDays(30))->groupBy('date')->orderBy('date')->get(),
        ]);
    }

    public function revenue()
    {
        return response()->json([
            'by_gateway'  => Transaction::where('status', 'completed')->select('payment_gateway', DB::raw('SUM(amount) as total'))->groupBy('payment_gateway')->get(),
            'by_type'     => Transaction::where('status', 'completed')->select('type', DB::raw('SUM(amount) as total'))->groupBy('type')->get(),
            'by_currency' => Transaction::where('status', 'completed')->select('currency', DB::raw('SUM(amount) as total'))->groupBy('currency')->get(),
            'daily'       => DB::table('transactions')->selectRaw('DATE(created_at) as date, SUM(amount) as total')->where('status', 'completed')->where('created_at', '>=', now()->subDays(30))->groupBy('date')->orderBy('date')->get(),
        ]);
    }

    public function events()
    {
        return response()->json([
            'by_status'   => Event::select('status', DB::raw('count(*) as count'))->groupBy('status')->get(),
            'by_category' => Event::select('category', DB::raw('count(*) as count'))->groupBy('category')->orderByDesc('count')->get(),
        ]);
    }

    public function marketing() { return response()->json([]); }

    public function export(Request $request) { return response()->json(['message' => 'Export queued.']); }
}
