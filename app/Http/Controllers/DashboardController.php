<?php

namespace App\Http\Controllers;

use App\Models\AgendaEvent;
use App\Models\Reminder;
use App\Models\TaskItem;
use App\Models\TimeEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = $request->user()->id;
        $today = Carbon::today();

        $tasksToday = TaskItem::query()
            ->where('user_id', $userId)
            ->where('status', '!=', 'done')
            ->whereDate('due_date', $today)
            ->orderBy('priority', 'desc')
            ->get(['id', 'title', 'status', 'priority', 'due_date', 'project_id']);

        $overdueCount = TaskItem::query()
            ->where('user_id', $userId)
            ->where('status', '!=', 'done')
            ->whereDate('due_date', '<', $today)
            ->count();

        $upcomingReminders = Reminder::query()
            ->where('user_id', $userId)
            ->where('is_done', false)
            ->where('remind_at', '>=', now())
            ->orderBy('remind_at')
            ->limit(5)
            ->get(['id', 'title', 'remind_at', 'task_item_id']);

        $upcomingEvents = AgendaEvent::query()
            ->where('user_id', $userId)
            ->where('starts_at', '>=', now())
            ->orderBy('starts_at')
            ->limit(5)
            ->get(['id', 'title', 'starts_at', 'ends_at', 'all_day', 'color']);

        $runningEntry = TimeEntry::query()
            ->where('user_id', $userId)
            ->whereNull('ended_at')
            ->with('task:id,title')
            ->first(['id', 'task_item_id', 'started_at']);

        $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY);
        $weekEnd = Carbon::now()->endOfWeek(Carbon::SUNDAY);

        $weekSeconds = (int) TimeEntry::query()
            ->where('user_id', $userId)
            ->whereNotNull('ended_at')
            ->whereBetween('started_at', [$weekStart, $weekEnd])
            ->sum('duration_seconds');

        $last7Days = [];
        for ($i = 6; $i >= 0; $i--) {
            $day = Carbon::today()->subDays($i);
            $seconds = (int) TimeEntry::query()
                ->where('user_id', $userId)
                ->whereNotNull('duration_seconds')
                ->whereDate('started_at', $day)
                ->sum('duration_seconds');

            $last7Days[] = [
                'date' => $day->format('Y-m-d'),
                'hours' => round($seconds / 3600, 2),
            ];
        }

        return Inertia::render('Dashboard', [
            'tasksToday' => $tasksToday,
            'overdueCount' => $overdueCount,
            'upcomingReminders' => $upcomingReminders,
            'upcomingEvents' => $upcomingEvents,
            'runningEntry' => $runningEntry,
            'weekSeconds' => $weekSeconds,
            'last7Days' => $last7Days,
        ]);
    }
}
