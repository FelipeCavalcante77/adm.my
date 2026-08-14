<?php

namespace App\Http\Controllers;

use App\Models\TaskAttachment;
use App\Models\TaskItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TaskAttachmentController extends Controller
{
    public function store(Request $request, TaskItem $task): RedirectResponse
    {
        abort_if($task->user_id !== $request->user()->id, 403);

        $data = $request->validate([
            'file' => ['required', 'file', 'max:10240'],
        ]);

        $file = $data['file'];
        $path = $file->store('task-attachments/'.$task->id, 'public');

        $task->attachments()->create([
            'user_id' => $request->user()->id,
            'original_name' => $file->getClientOriginalName(),
            'path' => $path,
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize(),
        ]);

        return back();
    }

    public function destroy(Request $request, TaskAttachment $attachment): RedirectResponse
    {
        abort_if($attachment->user_id !== $request->user()->id, 403);

        Storage::disk('public')->delete($attachment->path);
        $attachment->delete();

        return back();
    }
}
