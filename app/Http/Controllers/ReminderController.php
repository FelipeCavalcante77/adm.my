<?php

namespace App\Http\Controllers;

use App\Models\Reminder;
use App\Models\TaskItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ReminderController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = $request->user()->id;

        $reminders = Reminder::query()
            ->where('user_id', $userId)
            ->with('task:id,title')
            ->orderBy('remind_at')
            ->get();

        $tasks = TaskItem::query()
            ->where('user_id', $userId)
            ->where('status', '!=', 'done')
            ->orderBy('title')
            ->get(['id', 'title']);

        return Inertia::render('Reminders/Index', [
            'reminders' => $reminders,
            'tasks' => $tasks,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateReminder($request);

        $request->user()->reminders()->create($data);

        return back();
    }

    public function update(Request $request, Reminder $reminder): RedirectResponse
    {
        abort_if($reminder->user_id !== $request->user()->id, 403);

        if ($request->has('is_done') && count($request->all()) === 1) {
            $data = $request->validate(['is_done' => ['required', 'boolean']]);
        } else {
            $data = $this->validateReminder($request);
        }

        $reminder->update($data);

        return back();
    }

    public function destroy(Request $request, Reminder $reminder): RedirectResponse
    {
        abort_if($reminder->user_id !== $request->user()->id, 403);

        $reminder->delete();

        return back();
    }

    private function validateReminder(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'note' => ['nullable', 'string'],
            'remind_at' => ['required', 'date'],
            'task_item_id' => ['nullable', 'integer', Rule::exists('task_items', 'id')->where('user_id', $request->user()->id)],
            'is_done' => ['sometimes', 'boolean'],
        ]);
    }
}
