<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\StudyGroup;
use App\Models\User;
use App\Models\Notification;
use App\Services\KarmaService;
use App\Mail\MessageReceivedMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class MessageController extends Controller {
    public function index($groupId) {
        return Message::where('group_id', $groupId)
            ->with('user')
            ->oldest()
            ->get();
    }

    public function store(Request $request, $groupId) {
        // Validate: content or file must be present
        $request->validate([
            'content' => 'nullable|string',
            'file' => 'nullable|file|max:10240' // 10MB max
        ]);

        // At least one of content or file must be present
        if (!$request->content && !$request->hasFile('file')) {
            return response()->json(['message' => 'Message must contain text or a file'], 400);
        }

        $group = StudyGroup::findOrFail($groupId);
        $user = Auth::user();

        // Ensure user is a member
        if (!$group->members()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Must be a member to chat'], 403);
        }

        // Prepare message data
        $messageData = [
            'group_id' => $groupId,
            'user_id' => $user->id,
            'content' => $request->content ?? ''
        ];

        // Handle file upload
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $originalName = $file->getClientOriginalName();
            $fileName = time() . '_' . $originalName;

            // Store file in storage/app/public/chat-files
            $filePath = $file->storeAs('chat-files', $fileName, 'public');

            $messageData['file_path'] = $filePath;
            $messageData['file_name'] = $originalName;
            $messageData['file_type'] = $file->getMimeType();
            $messageData['file_size'] = $file->getSize();
        }

        $msg = Message::create($messageData);

        // Notify other members (Simplified: Notify creator if sender isn't creator)
        if ($group->creator_id !== $user->id) {
            $notificationMessage = $msg->file_path
                ? "{$user->name} sent a file in '{$group->name}': \"{$msg->file_name}\""
                : "{$user->name} sent a message in '{$group->name}': \"{$request->content}\"";

            Notification::create([
                'user_id' => $group->creator_id,
                'type' => 'message',
                'data' => [
                    'user_name' => $user->name,
                    'group_name' => $group->name,
                    'message' => $notificationMessage
                ]
            ]);

            // Send email notification to group leader if their email is verified
            $leader = User::find($group->creator_id);
            if ($leader && $leader->email_verified_at) {
                try {
                    $messagePreview = $msg->file_path
                        ? "📎 Sent a file: {$msg->file_name}"
                        : substr($request->content, 0, 100) . (strlen($request->content) > 100 ? '...' : '');

                    Mail::to($leader->email)->send(new MessageReceivedMail(
                        $leader->name,
                        $user->name,
                        $group->name,
                        $messagePreview
                    ));
                } catch (\Exception $e) {
                    \Log::error('Failed to send message notification email: ' . $e->getMessage());
                }
            }
        }

        // Grant karma for contribution (bonus if file attached)
        KarmaService::awardMessage($user, $msg->file_path !== null);

        return $msg->load('user');
    }
}