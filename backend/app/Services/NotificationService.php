<?php

namespace App\Services;

use App\Models\{User, Notification, DeviceToken};
use Illuminate\Support\Facades\Log;

class NotificationService
{
    public function send(User $user, string $type, string $title, string $body, array $data = []): void
    {
        Notification::create([
            'user_id' => $user->id,
            'type'    => $type,
            'title'   => $title,
            'body'    => $body,
            'data'    => $data,
        ]);

        $tokens = DeviceToken::where('user_id', $user->id)
            ->where('last_used_at', '>=', now()->subDays(30))
            ->pluck('token')
            ->toArray();

        if (!empty($tokens)) {
            $this->sendPush($tokens, $title, $body, $data);
        }
    }

    public function broadcast(array $userIds, string $type, string $title, string $body, array $data = []): void
    {
        $notifications = array_map(fn($id) => [
            'user_id'    => $id,
            'type'       => $type,
            'title'      => $title,
            'body'       => $body,
            'data'       => json_encode($data),
            'is_read'    => false,
            'created_at' => now(),
            'updated_at' => now(),
        ], $userIds);

        foreach (array_chunk($notifications, 500) as $chunk) {
            Notification::insert($chunk);
        }
    }

    private function sendPush(array $tokens, string $title, string $body, array $data = []): void
    {
        try {
            $credPath = config('services.firebase.credentials');
            if (!$credPath || !file_exists(storage_path('app/' . basename($credPath)))) {
                return;
            }

            $factory = (new \Kreait\Firebase\Factory)->withServiceAccount($credPath);
            $messaging = $factory->createMessaging();

            foreach (array_chunk($tokens, 500) as $chunk) {
                $message = \Kreait\Firebase\Messaging\MulticastSendReport::class;

                $messaging->sendMulticast(
                    \Kreait\Firebase\Messaging\CloudMessage::new()
                        ->withNotification(\Kreait\Firebase\Messaging\Notification::create($title, $body))
                        ->withData($data),
                    $chunk
                );
            }
        } catch (\Throwable $e) {
            Log::error('Push notification failed', ['error' => $e->getMessage()]);
        }
    }
}
