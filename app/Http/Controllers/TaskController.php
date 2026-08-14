<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\TaskItem;
use App\Models\TimeEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = $request->user()->id;

        $query = TaskItem::query()
            ->where('user_id', $userId)
            ->with(['project:id,name,color', 'attachments']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->integer('project_id'));
        }

        $tasks = $query->orderBy('due_date')->orderByDesc('priority')->get();

        $projects = Project::query()
            ->where('user_id', $userId)
            ->where('is_archived', false)
            ->orderBy('name')
            ->get(['id', 'name', 'color']);

        $activeTaskId = TimeEntry::query()
            ->where('user_id', $userId)
            ->whereNull('ended_at')
            ->value('task_item_id');

        return Inertia::render('Tasks/Index', [
            'tasks' => $tasks,
            'projects' => $projects,
            'activeTaskId' => $activeTaskId,
            'filters' => $request->only(['status', 'project_id']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateTask($request);

        $request->user()->tasks()->create($data);

        return back();
    }

    public function update(Request $request, TaskItem $task): RedirectResponse
    {
        abort_if($task->user_id !== $request->user()->id, 403);

        $data = $this->validateTask($request);

        if ($data['status'] === 'done' && $task->status !== 'done') {
            $data['completed_at'] = now();
        } elseif ($data['status'] !== 'done') {
            $data['completed_at'] = null;
        }

        $task->update($data);

        return back();
    }

    public function destroy(Request $request, TaskItem $task): RedirectResponse
    {
        abort_if($task->user_id !== $request->user()->id, 403);

        $task->delete();

        return back();
    }

    private function validateTask(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'project_id' => ['nullable', 'integer', Rule::exists('projects', 'id')->where('user_id', $request->user()->id)],
            'status' => ['required', Rule::in(['todo', 'in_progress', 'done'])],
            'priority' => ['required', Rule::in(['low', 'medium', 'high'])],
            'due_date' => ['nullable', 'date'],
        ]);
    }
}
