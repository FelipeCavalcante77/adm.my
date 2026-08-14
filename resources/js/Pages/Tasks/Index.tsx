import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface ProjectOption {
    id: number;
    name: string;
    color: string | null;
}

interface TaskRow {
    id: number;
    title: string;
    description: string | null;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    due_date: string | null;
    project_id: number | null;
    project: ProjectOption | null;
}

interface TasksProps {
    tasks: TaskRow[];
    projects: ProjectOption[];
    activeTaskId: number | null;
    filters: { status?: string; project_id?: string };
    [key: string]: unknown;
}

interface TaskForm {
    title: string;
    description: string;
    project_id: string;
    status: string;
    priority: string;
    due_date: string;
    [key: string]: string;
}

const columns: { key: TaskRow['status']; label: string }[] = [
    { key: 'todo', label: 'A fazer' },
    { key: 'in_progress', label: 'Em andamento' },
    { key: 'done', label: 'Concluído' },
];

const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    high: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
};

export default function Index({
    tasks,
    projects,
    activeTaskId,
    filters,
}: PageProps<TasksProps>) {
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<TaskRow | null>(null);

    const { data, setData, post, processing, errors, clearErrors } =
        useForm<TaskForm>({
            title: '',
            description: '',
            project_id: '',
            status: 'todo',
            priority: 'medium',
            due_date: '',
        });

    const openCreate = () => {
        setEditing(null);
        clearErrors();
        setData({
            title: '',
            description: '',
            project_id: '',
            status: 'todo',
            priority: 'medium',
            due_date: '',
        });
        setShowModal(true);
    };

    const openEdit = (task: TaskRow) => {
        setEditing(task);
        clearErrors();
        setData({
            title: task.title,
            description: task.description ?? '',
            project_id: task.project_id ? String(task.project_id) : '',
            status: task.status,
            priority: task.priority,
            due_date: task.due_date ?? '',
        });
        setShowModal(true);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        const payload = {
            ...data,
            project_id: data.project_id || null,
            due_date: data.due_date || null,
        };

        if (editing) {
            router.put(route('tasks.update', editing.id), payload, {
                onSuccess: () => setShowModal(false),
            });
        } else {
            post(route('tasks.store'), {
                onSuccess: () => setShowModal(false),
            });
        }
    };

    const destroy = (task: TaskRow) => {
        if (confirm(`Excluir a tarefa "${task.title}"?`)) {
            router.delete(route('tasks.destroy', task.id));
        }
    };

    const startTimer = (task: TaskRow) => {
        router.post(route('timer.start'), { task_item_id: task.id });
    };

    const applyFilter = (key: 'status' | 'project_id', value: string) => {
        router.get(
            route('tasks.index'),
            { ...filters, [key]: value || undefined },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AppLayout header="Tarefas">
            <Head title="Tarefas" />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        className="rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        value={filters.project_id ?? ''}
                        onChange={(e) =>
                            applyFilter('project_id', e.target.value)
                        }
                    >
                        <option value="">Todos os projetos</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>

                    <select
                        className="rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        value={filters.status ?? ''}
                        onChange={(e) => applyFilter('status', e.target.value)}
                    >
                        <option value="">Todos os status</option>
                        <option value="todo">A fazer</option>
                        <option value="in_progress">Em andamento</option>
                        <option value="done">Concluído</option>
                    </select>
                </div>

                <PrimaryButton onClick={openCreate}>
                    <Plus className="mr-1 h-4 w-4" /> Nova tarefa
                </PrimaryButton>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
                {columns.map((col) => {
                    const colTasks = tasks.filter((t) => t.status === col.key);

                    return (
                        <div
                            key={col.key}
                            className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-900/40"
                        >
                            <div className="mb-3 flex items-center justify-between px-1">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    {col.label}
                                </h3>
                                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                    {colTasks.length}
                                </span>
                            </div>

                            <div className="space-y-3">
                                {colTasks.map((task, i) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            delay: i * 0.03,
                                            duration: 0.25,
                                        }}
                                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                                {task.title}
                                            </h4>
                                            {activeTaskId === task.id && (
                                                <span className="flex h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
                                            )}
                                        </div>

                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            {task.project && (
                                                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                    <span
                                                        className="h-2 w-2 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                task.project
                                                                    .color ??
                                                                '#6366f1',
                                                        }}
                                                    />
                                                    {task.project.name}
                                                </span>
                                            )}
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[task.priority]}`}
                                            >
                                                {task.priority}
                                            </span>
                                            {task.due_date && (
                                                <span className="text-xs text-gray-400">
                                                    {new Date(
                                                        task.due_date +
                                                            'T00:00:00',
                                                    ).toLocaleDateString(
                                                        'pt-BR',
                                                    )}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-3 flex items-center justify-end gap-1">
                                            {task.status !== 'done' && (
                                                <button
                                                    onClick={() =>
                                                        startTimer(task)
                                                    }
                                                    title="Iniciar cronômetro"
                                                    className="rounded-lg p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10"
                                                >
                                                    <Play className="h-4 w-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() =>
                                                    openEdit(task)
                                                }
                                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => destroy(task)}
                                                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}

                                {colTasks.length === 0 && (
                                    <p className="px-1 text-xs text-gray-400">
                                        Nenhuma tarefa.
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <Modal show={showModal} onClose={() => setShowModal(false)}>
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        {editing ? 'Editar tarefa' : 'Nova tarefa'}
                    </h2>

                    <div className="mt-4">
                        <InputLabel htmlFor="title" value="Título" />
                        <TextInput
                            id="title"
                            className="mt-1 block w-full"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                        />
                        <InputError message={errors.title} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="description" value="Descrição" />
                        <textarea
                            id="description"
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                        />
                        <InputError
                            message={errors.description}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="project_id" value="Projeto" />
                            <select
                                id="project_id"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                value={data.project_id}
                                onChange={(e) =>
                                    setData('project_id', e.target.value)
                                }
                            >
                                <option value="">Sem projeto</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={errors.project_id}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel htmlFor="due_date" value="Prazo" />
                            <TextInput
                                id="due_date"
                                type="date"
                                className="mt-1 block w-full"
                                value={data.due_date}
                                onChange={(e) =>
                                    setData('due_date', e.target.value)
                                }
                            />
                            <InputError
                                message={errors.due_date}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel htmlFor="status" value="Status" />
                            <select
                                id="status"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                value={data.status}
                                onChange={(e) =>
                                    setData('status', e.target.value)
                                }
                            >
                                <option value="todo">A fazer</option>
                                <option value="in_progress">
                                    Em andamento
                                </option>
                                <option value="done">Concluído</option>
                            </select>
                            <InputError
                                message={errors.status}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel htmlFor="priority" value="Prioridade" />
                            <select
                                id="priority"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                value={data.priority}
                                onChange={(e) =>
                                    setData('priority', e.target.value)
                                }
                            >
                                <option value="low">Baixa</option>
                                <option value="medium">Média</option>
                                <option value="high">Alta</option>
                            </select>
                            <InputError
                                message={errors.priority}
                                className="mt-2"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setShowModal(false)}>
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {editing ? 'Salvar' : 'Criar'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
