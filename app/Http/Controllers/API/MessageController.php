<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\StudyGroup;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MessageController extends Controller {
    public function index($groupId) {
        return Message::where('group_id', $groupId)
            ->with('user')
            ->oldest()
            ->get();
    }

    public function store(Request $request, $groupId) {
        $request->validate(['content' => 'required|string']);
        
        $group = StudyGroup::findOrFail($groupId);
        $user = Auth::user();
        
        // Ensure user is a member
        if (!$group->members()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Must be a member to chat'], 403);
        }

        $msg = Message::create([
            'group_id' => $groupId,
            'user_id' => $user->id,
            'content' => $request->content
        ]);
        
        // Notify other members (Simplified: Notify creator if sender isn't creator)
        if ($group->creator_id !== $user->id) {
            Notification::create([
                'user_id' => $group->creator_id,
                'type' => 'message',
                'data' => [
                    'user_name' => $user->name,
                    'group_name' => $group->name,
                    'message' => "{$user->name} sent a message in '{$group->name}': \"{$request->content}\""
                ]
            ]);
        }
        
        // Grant karma for contribution
        $user->increment('karma_points', 5);
        
        return $msg->load('user');
    }
}