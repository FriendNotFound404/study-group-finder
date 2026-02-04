<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FeedbackController extends Controller
{
    public function index() {
        return Feedback::with('user')->latest()->get();
    }

    public function store(Request $request) {
        $validated = $request->validate([
            'group_name' => 'required|string',
            'rating' => 'required|integer|min:1|max:5',
            'text' => 'required|string'
        ]);

        $feedback = Feedback::create(array_merge($validated, [
            'user_id' => Auth::id()
        ]));

        return response()->json($feedback, 201);
    }
}