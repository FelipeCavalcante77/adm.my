<?php

namespace App\Http\Controllers;

use App\Models\TaskItem;
use App\Models\TimeEntry;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TimerController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = $request->user()->id;

        $tasks = TaskItem::query()
            ->where('user_id', $userId)
            ->where('status', '!=', 'done')
            ->with('project:id,name')
            ->orderBy('title')
            ->get(['id', 'title', 'status', 'project_id'])
            ->map(fn (TaskItem $task) => [
                'id' => $task->id,
                'title' => $task->title,
                'status' => $task->status,
                'project_name' => $task->project?->name,
            ]);

        $runningEntry = TimeEntry::query()
            ->where('user_id', $userId)
            ->whereNull('ended_at')
            ->with('task:id,title')
            ->first(['id', 'task_item_id', 'started_at']);

        $recentEntries = TimeEntry::query()
            ->where('user_id', $userId)
            ->whereNotNull('ended_at')
            ->with('task:id,title')
            ->orderByDesc('started_at')
            ->limit(20)
            ->get(['id', 'task_item_id', 'started_at', 'ended_at', 'duration_seconds', 'note', 'is_manual']);

        return Inertia::render('Timer/Index', [
            'tasks' => $tasks,
            'runningEntry' => $runningEntry,
            'recentEntries' => $recentEntries,
        ]);
    }
}
