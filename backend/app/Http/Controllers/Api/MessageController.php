<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Conversation, Message, User};
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function conversations(Request $request)
    {
        $userId = $request->user()->id;

        $conversations = Conversation::with(['userOne:id,name,username,avatar', 'userTwo:id,name,username,avatar', 'lastMessage'])
            ->where(fn($q) => $q->where('user_one_id', $userId)->orWhere('user_two_id', $userId))
            ->where(fn($q) => $q->where(fn($q) => $q->where('user_one_id', $userId)->where('user_one_deleted', false))
                ->orWhere(fn($q) => $q->where('user_two_id', $userId)->where('user_two_deleted', false)))
            ->orderByDesc('last_message_at')
            ->paginate(30);

        return response()->json($conversations);
    }

    public function conversation(Request $request, User $user)
    {
        $authId = $request->user()->id;
        $userId = $user->id;

        $conv = Conversation::firstOrCreate(
            ['user_one_id' => min($authId, $userId), 'user_two_id' => max($authId, $userId)]
        );

        // Reset unread count
        if ($conv->user_one_id === $authId) {
            $conv->update(['user_one_unread' => 0]);
        } else {
            $conv->update(['user_two_unread' => 0]);
        }

        $messages = Message::where('conversation_id', $conv->id)
            ->where('is_deleted', false)
            ->orderByDesc('created_at')
            ->paginate(50);

        return response()->json(['conversation' => $conv, 'messages' => $messages]);
    }

    public function send(Request $request, User $user)
    {
        $data = $request->validate([
            'body'      => 'required_without:media_url|nullable|string|max:2000',
            'type'      => 'required|in:text,image,audio,video,gift',
            'media_url' => 'required_if:type,image,audio,video|nullable|url',
        ]);

        $authId = $request->user()->id;
        $userId = $user->id;

        $conv = Conversation::firstOrCreate(
            ['user_one_id' => min($authId, $userId), 'user_two_id' => max($authId, $userId)]
        );

        $message = Message::create([
            'conversation_id' => $conv->id,
            'sender_id'       => $authId,
            'type'            => $data['type'],
            'body'            => $data['body'] ?? null,
            'media_url'       => $data['media_url'] ?? null,
        ]);

        $unreadField = $conv->user_one_id === $userId ? 'user_one_unread' : 'user_two_unread';
        $conv->increment($unreadField);
        $conv->update(['last_message_id' => $message->id, 'last_message_at' => now()]);

        return response()->json($message, 201);
    }

    public function delete(Request $request, Message $message)
    {
        if ($message->sender_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $message->update(['is_deleted' => true]);
        return response()->json(['message' => 'Message deleted.']);
    }
}
