<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\StudyGroup;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CalendarController extends Controller {
    public function index() {
        $user = Auth::user();
        
        // Get personal events + events of groups the user has joined
        $joinedGroupIds = $user->joinedGroups()->pluck('study_groups.id');
        
        return Event::where('user_id', $user->id)
            ->orWhereIn('group_id', $joinedGroupIds)
            ->orderBy('start_time', 'asc')
            ->get();
    }

    public function store(Request $request) {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|string',
            'start_time' => 'required|date',
            'location' => 'nullable|string',
            'group_id' => 'nullable|exists:study_groups,id'
        ]);

        // Authorization check: Only the Leader (creator) of a group can add sessions to it
        if ($request->filled('group_id')) {
            $group = StudyGroup::findOrFail($request->group_id);
            if ($group->creator_id !== Auth::id()) {
                return response()->json(['message' => 'Unauthorized. Only the group leader can schedule sessions for this hub.'], 403);
            }
        }
        
        $event = Auth::user()->events()->create($validated);

        // If this is a group event, notify all members
        if ($request->filled('group_id')) {
            $group = $group ?? StudyGroup::findOrFail($request->group_id);
            $members = $group->members()->where('users.id', '!=', Auth::id())->get();

            foreach ($members as $member) {
                Notification::create([
                    'user_id' => $member->id,
                    'type' => 'event',
                    'data' => [
                        'group_name' => $group->name,
                        'message' => "New meeting scheduled for '{$group->name}': {$event->title} on " . date('M j, g:i A', strtotime($event->start_time))
                    ]
                ]);
            }
        }
        
        return $event;
    }

    public function destroy($id) {
        $event = Event::findOrFail($id);
        
        // Only creator can delete
        if ($event->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $event->delete();
        return response()->json(['message' => 'Event deleted']);
    }
}