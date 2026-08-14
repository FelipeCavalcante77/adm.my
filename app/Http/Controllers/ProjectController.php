<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function index(Request $request): Response
    {
        $projects = Project::query()
            ->where('user_id', $request->user()->id)
            ->withCount('tasks')
            ->orderBy('name')
            ->get();

        return Inertia::render('Projects/Index', [
            'projects' => $projects,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:20'],
            'description' => ['nullable', 'string'],
        ]);

        $request->user()->projects()->create($data);

        return back();
    }

    public function update(Request $request, Project $project): RedirectResponse
    {
        abort_if($project->user_id !== $request->user()->id, 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:20'],
            'description' => ['nullable', 'string'],
            'is_archived' => ['sometimes', 'boolean'],
        ]);

        $project->update($data);

        return back();
    }

    public function destroy(Request $request, Project $project): RedirectResponse
    {
        abort_if($project->user_id !== $request->user()->id, 403);

        $project->delete();

        return back();
    }
}
