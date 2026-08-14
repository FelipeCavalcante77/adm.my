<?php

namespace App\Http\Controllers;

use App\Models\TaskItem;
use App\Models\TimeEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = $request->user()->id;

        $rangeStart = Carbon::today()->subDays(29);
        $rangeEnd = Carbon::today()->endOfDay();

        $dailyRows = TimeEntry::query()
            ->where('user_id', $userId)
            ->whereNotNull('duration_seconds')
            ->whereBetween('started_at', [$rangeStart, $rangeEnd])
            ->select(DB::raw('DATE(started_at) as day'), DB::raw('SUM(duration_seconds) as seconds'))
            ->groupBy('day')
            ->pluck('seconds', 'day');

        $hoursPerDay = [];
        for ($i = 29; $i >= 0; $i--) {
            $day = Carbon::today()->subDays($i);
            $key = $day->format('Y-m-d');
            $seconds = (int) ($dailyRows[$key] ?? 0);

            $hoursPerDay[] = [
                'date' => $key,
                'hours' => round($seconds / 3600, 2),
            ];
        }

        $projectRows = TimeEntry::query()
            ->join('task_items', 'task_items.id', '=', 'time_entries.task_item_id')
            ->leftJoin('projects', 'projects.id', '=', 'task_items.project_id')
            ->where('time_entries.user_id', $userId)
            ->whereNotNull('time_entries.duration_seconds')
            ->select(
                DB::raw("COALESCE(projects.name, 'Sem projeto') as project_name"),
                DB::raw("COALESCE(projects.color, '#9ca3af') as project_color"),
                DB::raw('SUM(time_entries.duration_seconds) as seconds'),
            )
            ->groupBy('project_name', 'project_color')
            ->orderByDesc('seconds')
            ->get();

        $hoursPerProject = $projectRows->map(fn ($row) => [
            'project' => $row->project_name,
            'hours' => round($row->seconds / 3600, 2),
            'color' => $row->project_color,
        ]);

        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd = Carbon::now()->endOfMonth();
        $today = Carbon::today();

        $monthSeconds = (int) TimeEntry::query()
            ->where('user_id', $userId)
            ->whereNotNull('duration_seconds')
            ->whereBetween('started_at', [$monthStart, $monthEnd])
            ->sum('duration_seconds');

        $totalHoursThisMonth = round($monthSeconds / 3600, 2);

        $tasksCompletedThisMonth = TaskItem::query()
            ->where('user_id', $userId)
            ->where('status', 'done')
            ->whereBetween('completed_at', [$monthStart, $monthEnd])
            ->count();

        $daysElapsedThisMonth = max(1, $today->day);
        $avgHoursPerDay = round($totalHoursThisMonth / $daysElapsedThisMonth, 2);

        return Inertia::render('Reports/Index', [
            'hoursPerDay' => $hoursPerDay,
            'hoursPerProject' => $hoursPerProject,
            'totalHoursThisMonth' => $totalHoursThisMonth,
            'tasksCompletedThisMonth' => $tasksCompletedThisMonth,
            'avgHoursPerDay' => $avgHoursPerDay,
        ]);
    }
}
