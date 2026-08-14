import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { confirmDelete } from '@/lib/swal';
import { PageProps } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Play, Square, Trash2 } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

interface TaskOption {
    id: number;
    title: string;
    status: string;
    project_name: string | null;
}

interface RunningEntry {
    id: number;
    task_item_id: number;
    started_at: string;
    task: { id: number; title: string } | null;
}

interface EntryRow {
    id: number;
    task_item_id: number;
    started_at: string;
    ended_at: string | null;
    duration_seconds: number | null;
    note: string | null;
    is_manual: boolean;
    task: { id: number; title: string } | null;
}

interface TimerProps {
    tasks: TaskOption[];
    runningEntry: RunningEntry | null;
    recentEntries: EntryRow[];
    [key: string]: unknown;
}

interface ManualForm {
    task_item_id: string;
    date: string;
    start_time: string;
    end_time: string;
    note: string;
    [key: string]: string;
}

function useElapsed(startedAt: string | null): string {
    const [elapsed, setElapsed] = useState('00:00:00');

    useEffect(() => {
        if (!startedAt) {
            setElapsed('00:00:00');
            return;
        }

        const tick = () => {
            const start = new Date(startedAt).getTime();
            const diff = Math.max(0, Math.floor((Date.now() - start) / 1000));
            const h = Math.floor(diff / 3600).toString().padStart(2, '0');
            const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
            const s = (diff % 60).toString().padStart(2, '0');
            setElapsed(`${h}:${m}:${s}`);
        };

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [startedAt]);

    return elapsed;
}

function formatDuration(seconds: number | null): string {
    if (seconds === null) return '-';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
}

function TimerSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="mx-auto h-4 w-40 rounded-full bg-white/20" />
            <div className="mx-auto mt-4 h-14 w-72 max-w-full rounded-xl bg-white/20" />
            <div className="mx-auto mt-3 h-5 w-48 rounded-full bg-white/20" />
            <div className="mx-auto mt-6 h-12 w-40 rounded-xl bg-white/20" />
        </div>
    );
}

export default function Index({
    tasks,
    runningEntry,
    recentEntries,
}: PageProps<TimerProps>) {
    const [selectedTask, setSelectedTask] = useState<string>(
        tasks[0] ? String(tasks[0].id) : '',
    );
    const [isToggling, setIsToggling] = useState(false);
    const elapsed = useElapsed(runningEntry?.started_at ?? null);

    const { data, setData, post, processing, errors, reset } =
        useForm<ManualForm>({
            task_item_id: '',
            date: new Date().toISOString().slice(0, 10),
            start_time: '',
            end_time: '',
            note: '',
        });

    const start = () => {
        if (!selectedTask) return;
        setIsToggling(true);
        router.post(
            route('timer.start'),
            { task_item_id: selectedTask },
            { onFinish: () => setIsToggling(false) },
        );
    };

    const stop = () => {
        setIsToggling(true);
        router.post(
            route('timer.stop'),
            {},
            { onFinish: () => setIsToggling(false) },
        );
    };

    const submitManual: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('time-entries.store'), {
            onSuccess: () =>
                reset('start_time', 'end_time', 'note'),
        });
    };

    const deleteEntry = async (entry: EntryRow) => {
        if (await confirmDelete('Excluir este registro de tempo?')) {
            router.delete(route('time-entries.destroy', entry.id));
        }
    };

    return (
        <AppLayout header="Cronômetro">
            <Head title="Cronômetro" />

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-center text-white shadow-lg dark:border-gray-800"
            >
                {isToggling ? (
                    <TimerSkeleton />
                ) : runningEntry ? (
                    <>
                        <p className="text-sm font-medium uppercase tracking-widest text-indigo-100">
                            Em andamento
                        </p>
                        <p className="mt-3 font-mono text-6xl font-bold tabular-nums">
                            {elapsed}
                        </p>
                        <p className="mt-2 text-lg text-indigo-100">
                            {runningEntry.task?.title}
                        </p>
                        <button
                            onClick={stop}
                            disabled={isToggling}
                            className="mx-auto mt-6 flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-indigo-700 shadow-md transition hover:bg-indigo-50 disabled:opacity-50"
                        >
                            <Square className="h-4 w-4" /> Parar
                        </button>
                    </>
                ) : (
                    <>
                        <p className="text-sm font-medium uppercase tracking-widest text-indigo-100">
                            Pronto para começar?
                        </p>
                        <p className="mt-3 font-mono text-6xl font-bold tabular-nums">
                            00:00:00
                        </p>
                        <div className="mx-auto mt-6 flex max-w-md flex-col items-center gap-3 sm:flex-row">
                            <select
                                className="w-full rounded-xl border-0 bg-white/90 px-4 py-3 text-sm text-gray-800 shadow-sm focus:ring-2 focus:ring-white"
                                value={selectedTask}
                                onChange={(e) =>
                                    setSelectedTask(e.target.value)
                                }
                            >
                                {tasks.length === 0 && (
                                    <option value="">
                                        Nenhuma tarefa disponível
                                    </option>
                                )}
                                {tasks.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.title}
                                        {t.project_name
                                            ? ` (${t.project_name})`
                                            : ''}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={start}
                                disabled={!selectedTask || isToggling}
                                className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-indigo-700 shadow-md transition hover:bg-indigo-50 disabled:opacity-50"
                            >
                                <Play className="h-4 w-4" /> Iniciar
                            </button>
                        </div>
                    </>
                )}
            </motion.div>

            <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Adicionar registro manual
                </h3>
                <form
                    onSubmit={submitManual}
                    className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
                >
                    <div className="lg:col-span-2">
                        <InputLabel htmlFor="task_item_id" value="Tarefa" />
                        <select
                            id="task_item_id"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            value={data.task_item_id}
                            onChange={(e) =>
                                setData('task_item_id', e.target.value)
                            }
                        >
                            <option value="">Selecione...</option>
                            {tasks.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.title}
                                </option>
                            ))}
                        </select>
                        <InputError
                            message={errors.task_item_id}
                            className="mt-2"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="date" value="Data" />
                        <TextInput
                            id="date"
                            type="date"
                            className="mt-1 block w-full"
                            value={data.date}
                            onChange={(e) => setData('date', e.target.value)}
                        />
                        <InputError message={errors.date} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="start_time" value="Início" />
                        <TextInput
                            id="start_time"
                            type="time"
                            className="mt-1 block w-full"
                            value={data.start_time}
                            onChange={(e) =>
                                setData('start_time', e.target.value)
                            }
                        />
                        <InputError
                            message={errors.start_time}
                            className="mt-2"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="end_time" value="Fim" />
                        <TextInput
                            id="end_time"
                            type="time"
                            className="mt-1 block w-full"
                            value={data.end_time}
                            onChange={(e) =>
                                setData('end_time', e.target.value)
                            }
                        />
                        <InputError
                            message={errors.end_time}
                            className="mt-2"
                        />
                    </div>

                    <div className="lg:col-span-4">
                        <InputLabel htmlFor="note" value="Nota (opcional)" />
                        <TextInput
                            id="note"
                            className="mt-1 block w-full"
                            value={data.note}
                            onChange={(e) => setData('note', e.target.value)}
                        />
                    </div>

                    <PrimaryButton disabled={processing} className="h-fit">
                        Adicionar
                    </PrimaryButton>
                </form>
            </div>

            <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Registros recentes
                </h3>
                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
                        <thead>
                            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                                <th className="py-2 pr-4">Tarefa</th>
                                <th className="py-2 pr-4">Início</th>
                                <th className="py-2 pr-4">Duração</th>
                                <th className="py-2 pr-4">Nota</th>
                                <th className="py-2"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {recentEntries.map((entry) => (
                                <tr key={entry.id}>
                                    <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300">
                                        {entry.task?.title ?? '-'}
                                    </td>
                                    <td className="py-2.5 pr-4 text-gray-500 dark:text-gray-400">
                                        {new Date(
                                            entry.started_at,
                                        ).toLocaleString('pt-BR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </td>
                                    <td className="py-2.5 pr-4 text-gray-500 dark:text-gray-400">
                                        {formatDuration(
                                            entry.duration_seconds,
                                        )}
                                    </td>
                                    <td className="py-2.5 pr-4 text-gray-500 dark:text-gray-400">
                                        {entry.note ?? '-'}
                                    </td>
                                    <td className="py-2.5 text-right">
                                        <button
                                            onClick={() =>
                                                deleteEntry(entry)
                                            }
                                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {recentEntries.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="py-6 text-center text-gray-400"
                                    >
                                        Nenhum registro ainda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
