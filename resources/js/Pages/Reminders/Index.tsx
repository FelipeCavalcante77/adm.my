import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { confirmDelete } from '@/lib/swal';
import { PageProps } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { AlertCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface TaskOption {
    id: number;
    title: string;
}

interface ReminderRow {
    id: number;
    title: string;
    note: string | null;
    remind_at: string;
    is_done: boolean;
    task_item_id: number | null;
    task: TaskOption | null;
}

interface RemindersProps {
    reminders: ReminderRow[];
    tasks: TaskOption[];
    [key: string]: unknown;
}

interface ReminderForm {
    title: string;
    note: string;
    remind_at: string;
    task_item_id: string;
    [key: string]: string;
}

function toDatetimeLocal(value: string): string {
    const date = new Date(value);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function Index({ reminders, tasks }: PageProps<RemindersProps>) {
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<ReminderRow | null>(null);

    const { data, setData, post, processing, errors, clearErrors } =
        useForm<ReminderForm>({
            title: '',
            note: '',
            remind_at: '',
            task_item_id: '',
        });

    const openCreate = () => {
        setEditing(null);
        clearErrors();
        setData({ title: '', note: '', remind_at: '', task_item_id: '' });
        setShowModal(true);
    };

    const openEdit = (reminder: ReminderRow) => {
        setEditing(reminder);
        clearErrors();
        setData({
            title: reminder.title,
            note: reminder.note ?? '',
            remind_at: toDatetimeLocal(reminder.remind_at),
            task_item_id: reminder.task_item_id
                ? String(reminder.task_item_id)
                : '',
        });
        setShowModal(true);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        const payload = {
            ...data,
            task_item_id: data.task_item_id || null,
        };

        if (editing) {
            router.put(route('reminders.update', editing.id), payload, {
                onSuccess: () => setShowModal(false),
            });
        } else {
            post(route('reminders.store'), {
                onSuccess: () => setShowModal(false),
            });
        }
    };

    const toggleDone = (reminder: ReminderRow) => {
        router.put(
            route('reminders.update', reminder.id),
            { is_done: !reminder.is_done },
            { preserveScroll: true },
        );
    };

    const destroy = async (reminder: ReminderRow) => {
        if (await confirmDelete(`Excluir o lembrete "${reminder.title}"?`)) {
            router.delete(route('reminders.destroy', reminder.id));
        }
    };

    const isOverdue = (reminder: ReminderRow) =>
        !reminder.is_done && new Date(reminder.remind_at) < new Date();

    return (
        <AppLayout header="Lembretes">
            <Head title="Lembretes" />

            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {reminders.length} lembrete(s)
                </p>
                <PrimaryButton onClick={openCreate}>
                    <Plus className="mr-1 h-4 w-4" /> Novo lembrete
                </PrimaryButton>
            </div>

            <div className="mt-6 space-y-3">
                {reminders.map((reminder, i) => (
                    <motion.div
                        key={reminder.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.25 }}
                        className={`flex items-center gap-4 rounded-2xl border p-4 shadow-sm ${
                            isOverdue(reminder)
                                ? 'border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10'
                                : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'
                        }`}
                    >
                        <input
                            type="checkbox"
                            checked={reminder.is_done}
                            onChange={() => toggleDone(reminder)}
                            className="h-5 w-5 shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
                        />

                        <div className="min-w-0 flex-1">
                            <p
                                className={`truncate text-sm font-medium ${
                                    reminder.is_done
                                        ? 'text-gray-400 line-through'
                                        : 'text-gray-900 dark:text-white'
                                }`}
                            >
                                {reminder.title}
                            </p>
                            {reminder.note && (
                                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                    {reminder.note}
                                </p>
                            )}
                            {reminder.task && (
                                <p className="text-xs text-indigo-500">
                                    {reminder.task.title}
                                </p>
                            )}
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                            {isOverdue(reminder) && (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span
                                className={`text-xs font-medium ${
                                    isOverdue(reminder)
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-gray-500 dark:text-gray-400'
                                }`}
                            >
                                {new Date(reminder.remind_at).toLocaleString(
                                    'pt-BR',
                                    {
                                        day: '2-digit',
                                        month: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    },
                                )}
                            </span>
                            <button
                                onClick={() => openEdit(reminder)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                            >
                                <Pencil className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => destroy(reminder)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}

                {reminders.length === 0 && (
                    <p className="text-sm text-gray-400">
                        Nenhum lembrete ainda.
                    </p>
                )}
            </div>

            <Modal show={showModal} onClose={() => setShowModal(false)}>
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        {editing ? 'Editar lembrete' : 'Novo lembrete'}
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
                        <InputLabel htmlFor="remind_at" value="Data e hora" />
                        <TextInput
                            id="remind_at"
                            type="datetime-local"
                            className="mt-1 block w-full"
                            value={data.remind_at}
                            onChange={(e) =>
                                setData('remind_at', e.target.value)
                            }
                        />
                        <InputError
                            message={errors.remind_at}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-4">
                        <InputLabel
                            htmlFor="task_item_id"
                            value="Tarefa vinculada (opcional)"
                        />
                        <select
                            id="task_item_id"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            value={data.task_item_id}
                            onChange={(e) =>
                                setData('task_item_id', e.target.value)
                            }
                        >
                            <option value="">Nenhuma</option>
                            {tasks.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="note" value="Nota" />
                        <textarea
                            id="note"
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            value={data.note}
                            onChange={(e) => setData('note', e.target.value)}
                        />
                        <InputError message={errors.note} className="mt-2" />
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
