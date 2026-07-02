<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\TicketReply;
use Illuminate\Http\Request;

class SupportController extends Controller
{
    public function index(Request $request)
    {
        $query = SupportTicket::with(['user:id,name,email,avatar', 'agent:id,name'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->priority, fn($q) => $q->where('priority', $request->priority))
            ->when($request->category, fn($q) => $q->where('category', $request->category))
            ->when($request->assigned_to, fn($q) => $q->where('assigned_to', $request->assigned_to));

        return response()->json($query->orderByDesc('created_at')->paginate(25));
    }

    public function show(SupportTicket $ticket)
    {
        return response()->json($ticket->load(['user', 'agent', 'replies.user:id,name,avatar,role']));
    }

    public function reply(Request $request, SupportTicket $ticket)
    {
        $data = $request->validate([
            'body'            => 'required|string',
            'attachments'     => 'nullable|array',
            'is_internal_note'=> 'boolean',
        ]);

        if (!$ticket->first_response_at) {
            $ticket->update(['first_response_at' => now(), 'status' => 'in_progress']);
        }

        $reply = TicketReply::create([
            'ticket_id'       => $ticket->id,
            'user_id'         => auth()->id(),
            'body'            => $data['body'],
            'attachments'     => $data['attachments'] ?? null,
            'is_staff_reply'  => true,
            'is_internal_note'=> $data['is_internal_note'] ?? false,
        ]);

        return response()->json($reply, 201);
    }

    public function resolve(SupportTicket $ticket)
    {
        $ticket->update(['status' => 'resolved', 'resolved_at' => now()]);
        return response()->json(['message' => 'Ticket resolved.']);
    }

    public function escalate(SupportTicket $ticket)
    {
        $ticket->update(['status' => 'escalated', 'priority' => 'urgent']);
        return response()->json(['message' => 'Ticket escalated.']);
    }

    public function assign(Request $request, SupportTicket $ticket)
    {
        $data = $request->validate(['agent_id' => 'required|exists:users,id']);
        $ticket->update(['assigned_to' => $data['agent_id'], 'status' => 'in_progress']);
        return response()->json(['message' => 'Ticket assigned.']);
    }
}
