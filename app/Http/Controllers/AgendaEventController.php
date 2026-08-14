<?php

namespace App\Http\Controllers;

use App\Models\AgendaEvent;
use App\Models\TaskItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AgendaEventController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = $request->user()->id;

        $events = AgendaEvent::query()
            ->where('user_id', $userId)
            ->get()
            ->map(fn (AgendaEvent $event) => [
                'id' => $event->id,
                'type' => 'event',
                'title' => $event->title,
                'description' => $event->description,
                'starts_at' => $event->starts_at,
                'ends_at' => $event->ends_at,
                'all_day' => $event->all_day,
                'location' => $event->location,
                'color' => $event->color,
            ]);

        $taskEvents = TaskItem::query()
            ->where('user_id', $userId)
            ->whereNotNull('due_date')
            ->get()
            ->map(fn (TaskItem $task) => [
                'id' => $task->id,
                'type' => 'task',
                'title' => $task->title,
                'description' => $task->description,
                'starts_at' => $task->due_date,
                'ends_at' => $task->due_date,
                'all_day' => true,
                'location' => null,
                'color' => $task->status === 'done' ? '#22c55e' : '#f59e0b',
            ]);

        return Inertia::render('Agenda/Index', [
            'events' => $events->concat($taskEvents)->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateEvent($request);

        $request->user()->agendaEvents()->create($data);

        return back();
    }

    public function update(Request $request, AgendaEvent $agendaEvent): RedirectResponse
    {
        abort_if($agendaEvent->user_id !== $request->user()->id, 403);

        $data = $this->validateEvent($request);

        $agendaEvent->update($data);

        return back();
    }

    public function destroy(Request $request, AgendaEvent $agendaEvent): RedirectResponse
    {
        abort_if($agendaEvent->user_id !== $request->user()->id, 403);

        $agendaEvent->delete();

        return back();
    }

    private function validateEvent(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'all_day' => ['sometimes', 'boolean'],
            'location' => ['nullable', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:20'],
        ]);
    }
}
