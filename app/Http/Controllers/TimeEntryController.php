<?php

namespace App\Http\Controllers;

use App\Models\TimeEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class TimeEntryController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $userId = $request->user()->id;

        $data = $request->validate([
            'task_item_id' => ['required', 'integer', Rule::exists('task_items', 'id')->where('user_id', $userId)],
            'date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i'],
            'duration_minutes' => ['nullable', 'integer', 'min:1'],
            'note' => ['nullable', 'string'],
        ]);

        $startedAt = Carbon::parse($data['date'].' '.$data['start_time']);

        if (! empty($data['end_time'])) {
            $endedAt = Carbon::parse($data['date'].' '.$data['end_time']);
            if ($endedAt->lessThanOrEqualTo($startedAt)) {
                $endedAt->addDay();
            }
        } elseif (! empty($data['duration_minutes'])) {
            $endedAt = $startedAt->copy()->addMinutes($data['duration_minutes']);
        } else {
            return back()->withErrors(['end_time' => 'Informe o horário de término ou a duração.']);
        }

        $request->user()->timeEntries()->create([
            'task_item_id' => $data['task_item_id'],
            'started_at' => $startedAt,
            'ended_at' => $endedAt,
            'duration_seconds' => abs($endedAt->getTimestamp() - $startedAt->getTimestamp()),
            'note' => $data['note'] ?? null,
            'is_manual' => true,
        ]);

        return back();
    }

    public function destroy(Request $request, TimeEntry $timeEntry): RedirectResponse
    {
        abort_if($timeEntry->user_id !== $request->user()->id, 403);

        $timeEntry->delete();

        return back();
    }

    public function start(Request $request): RedirectResponse
    {
        $userId = $request->user()->id;

        $data = $request->validate([
            'task_item_id' => ['required', 'integer', Rule::exists('task_items', 'id')->where('user_id', $userId)],
        ]);

        $running = TimeEntry::query()
            ->where('user_id', $userId)
            ->whereNull('ended_at')
            ->first();

        if ($running) {
            $now = now();
            $running->update([
                'ended_at' => $now,
                'duration_seconds' => abs($now->getTimestamp() - $running->started_at->getTimestamp()),
            ]);
        }

        $request->user()->timeEntries()->create([
            'task_item_id' => $data['task_item_id'],
            'started_at' => now(),
            'ended_at' => null,
            'duration_seconds' => null,
            'is_manual' => false,
        ]);

        return back();
    }

    public function stop(Request $request): RedirectResponse
    {
        $userId = $request->user()->id;

        $running = TimeEntry::query()
            ->where('user_id', $userId)
            ->whereNull('ended_at')
            ->first();

        if ($running) {
            $now = now();
            $running->update([
                'ended_at' => $now,
                'duration_seconds' => abs($now->getTimestamp() - $running->started_at->getTimestamp()),
            ]);
        }

        return back();
    }
}
