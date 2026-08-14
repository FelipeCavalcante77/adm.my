<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class TaskAttachment extends Model
{
    protected $fillable = [
        'task_item_id',
        'user_id',
        'original_name',
        'path',
        'mime_type',
        'size',
    ];

    protected $appends = ['url'];

    protected $hidden = ['path'];

    public function task(): BelongsTo
    {
        return $this->belongsTo(TaskItem::class, 'task_item_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->path);
    }
}
