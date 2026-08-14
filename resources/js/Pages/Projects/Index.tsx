import DangerButton from '@/Components/DangerButton';
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
import { Archive, ArchiveRestore, FolderKanban, Pencil, Plus, Trash2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface ProjectRow {
    id: number;
    name: string;
    color: string | null;
    description: string | null;
    is_archived: boolean;
    tasks_count: number;
}

interface ProjectsProps {
    projects: ProjectRow[];
    [key: string]: unknown;
}

interface ProjectForm {
    name: string;
    color: string;
    description: string;
    [key: string]: string;
}

export default function Index({ projects }: PageProps<ProjectsProps>) {
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<ProjectRow | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<ProjectForm>({
            name: '',
            color: '#6366f1',
            description: '',
        });

    const openCreate = () => {
        setEditing(null);
        reset();
        clearErrors();
        setData({ name: '', color: '#6366f1', description: '' });
        setShowModal(true);
    };

    const openEdit = (project: ProjectRow) => {
        setEditing(project);
        clearErrors();
        setData({
            name: project.name,
            color: project.color ?? '#6366f1',
            description: project.description ?? '',
        });
        setShowModal(true);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (editing) {
            put(route('projects.update', editing.id), {
                onSuccess: () => setShowModal(false),
            });
        } else {
            post(route('projects.store'), {
                onSuccess: () => setShowModal(false),
            });
        }
    };

    const toggleArchive = (project: ProjectRow) => {
        router.put(route('projects.update', project.id), {
            name: project.name,
            color: project.color,
            description: project.description,
            is_archived: !project.is_archived,
        });
    };

    const destroy = async (project: ProjectRow) => {
        if (await confirmDelete(`Excluir o projeto "${project.name}"?`)) {
            router.delete(route('projects.destroy', project.id));
        }
    };

    return (
        <AppLayout header="Projetos">
            <Head title="Projetos" />

            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {projects.length} projeto(s)
                </p>
                <PrimaryButton onClick={openCreate}>
                    <Plus className="mr-1 h-4 w-4" /> Novo projeto
                </PrimaryButton>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project, i) => (
                    <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.3 }}
                        className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 ${
                            project.is_archived ? 'opacity-60' : ''
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                                <span
                                    className="h-3.5 w-3.5 rounded-full"
                                    style={{
                                        backgroundColor:
                                            project.color ?? '#6366f1',
                                    }}
                                />
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {project.name}
                                </h3>
                            </div>
                            <FolderKanban className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                        </div>

                        {project.description && (
                            <p className="mt-2 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                                {project.description}
                            </p>
                        )}

                        <div className="mt-4 flex items-center justify-between">
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                {project.tasks_count} tarefa(s)
                            </span>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => toggleArchive(project)}
                                    title={
                                        project.is_archived
                                            ? 'Desarquivar'
                                            : 'Arquivar'
                                    }
                                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                                >
                                    {project.is_archived ? (
                                        <ArchiveRestore className="h-4 w-4" />
                                    ) : (
                                        <Archive className="h-4 w-4" />
                                    )}
                                </button>
                                <button
                                    onClick={() => openEdit(project)}
                                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => destroy(project)}
                                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {projects.length === 0 && (
                    <p className="col-span-full text-sm text-gray-400">
                        Nenhum projeto ainda. Crie o primeiro!
                    </p>
                )}
            </div>

            <Modal show={showModal} onClose={() => setShowModal(false)}>
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        {editing ? 'Editar projeto' : 'Novo projeto'}
                    </h2>

                    <div className="mt-4">
                        <InputLabel htmlFor="name" value="Nome" />
                        <TextInput
                            id="name"
                            className="mt-1 block w-full"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="color" value="Cor" />
                        <input
                            id="color"
                            type="color"
                            className="mt-1 block h-10 w-20 cursor-pointer rounded-md border-gray-300 dark:border-gray-700"
                            value={data.color}
                            onChange={(e) => setData('color', e.target.value)}
                        />
                        <InputError message={errors.color} className="mt-2" />
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
