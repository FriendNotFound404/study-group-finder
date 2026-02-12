<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rating extends Model
{
    protected $fillable = [
        'user_id',
        'group_id',
        'group_rating',
        'leader_rating',
        'update_count'
    ];

    protected $casts = [
        'group_rating' => 'float',
        'leader_rating' => 'float',
        'update_count' => 'integer',
    ];

    // Relationship to User (who submitted the rating)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relationship to StudyGroup (which group was rated)
    public function group()
    {
        return $this->belongsTo(StudyGroup::class, 'group_id');
    }
}
