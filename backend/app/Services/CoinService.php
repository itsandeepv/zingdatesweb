<?php

namespace App\Services;

use App\Models\User;
use App\Models\CoinLedger;
use Illuminate\Support\Facades\DB;

class CoinService
{
    public function credit(User $user, float $amount, string $source, string $description = '', array $reference = []): void
    {
        DB::transaction(function () use ($user, $amount, $source, $description, $reference) {
            $user->increment('coin_balance', $amount);
            $user->refresh();
            CoinLedger::create([
                'user_id'        => $user->id,
                'amount'         => $amount,
                'type'           => 'credit',
                'source'         => $source,
                'balance_after'  => $user->coin_balance,
                'description'    => $description,
                'reference_id'   => $reference['id'] ?? null,
                'reference_type' => $reference['type'] ?? null,
            ]);
        });
    }

    public function debit(User $user, float $amount, string $source, string $description = '', array $reference = []): bool
    {
        if ($user->coin_balance < $amount) {
            return false;
        }

        DB::transaction(function () use ($user, $amount, $source, $description, $reference) {
            $user->decrement('coin_balance', $amount);
            $user->refresh();
            CoinLedger::create([
                'user_id'        => $user->id,
                'amount'         => $amount,
                'type'           => 'debit',
                'source'         => $source,
                'balance_after'  => $user->coin_balance,
                'description'    => $description,
                'reference_id'   => $reference['id'] ?? null,
                'reference_type' => $reference['type'] ?? null,
            ]);
        });

        return true;
    }

    public function getBalance(User $user): float
    {
        return (float) $user->coin_balance;
    }

    public function getLedger(User $user, int $perPage = 20)
    {
        return CoinLedger::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }
}
