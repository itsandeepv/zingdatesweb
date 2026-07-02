<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (!in_array($user->role, ['admin', 'super_admin', 'moderator', 'support', 'analyst', 'marketing', 'finance'])) {
            return response()->json(['message' => 'Access denied. Admin role required.'], 403);
        }

        return $next($request);
    }
}
