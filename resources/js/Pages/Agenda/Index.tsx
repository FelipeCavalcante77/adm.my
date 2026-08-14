import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import AppLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { format, getDay, parse, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FormEventHandler, useMemo, useState } from 'react';
import {
    Calendar as BigCalendar,
    dateFnsLocalizer,
    Event as CalendarEvent,
    SlotInfo,
} from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'pt-BR': ptBR };

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
    getDay,
    locales,
});

interface RawAgendaItem {
    id: number;
    type: 'event' | 'task';
    title: string;
    description: string | null;
    starts_at: string;
    ends_at: string | null;
    all_day: boolean;
    location: string | null;
    color: string | null;
}

interface AgendaProps {
    events: RawAgendaItem[];
    [key: string]: unknown;
}

interface RbcEvent extends CalendarEvent {
    id: number;
    type: 'event' | 'task';
    resource: RawAgendaItem;
}

interface EventForm {
    title: string;
    description: string;
    starts_at: string;
    ends_at: string;
    all_day: boolean;
    location: string;
    color: string;
    [key: string]: string | boolean;
}

function toDatetimeLocal(value: string): string {
    const date = new Date(value);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function Index({ events }: PageProps<AgendaProps>) {
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<RawAgendaItem | null>(null);

    const { data, setData, post, put, processing, errors, clearErrors } =
        useForm<EventForm>({
            title: '',
            description: '',
            starts_at: '',
            ends_at: '',
            all_day: false,
            location: '',
            color: '#6366f1',
        });

    const calendarEvents: RbcEvent[] = useMemo(
        () =>
            events.map((e) => ({
                id: e.id,
                type: e.type,
                title: e.title,
                start: new Date(e.starts_at),
                end: new Date(e.ends_at ?? e.starts_at),
                allDay: e.all_day,
                resource: e,
            })),
        [events],
    );

    const openCreate = (slot?: SlotInfo) => {
        setEditing(null);
        clearErrors();
        setData({
            title: '',
            description: '',
            starts_at: slot
                ? toDatetimeLocal(slot.start.toISOString())
                : '',
            ends_at: slot ? toDatetimeLocal(slot.end.toISOString()) : '',
            all_day: false,
            location: '',
            color: '#6366f1',
        });
        setShowModal(true);
    };

    const openEdit = (item: RawAgendaItem) => {
        if (item.type === 'task') {
            router.visit(route('tasks.index'));
            return;
        }

        setEditing(item);
        clearErrors();
        setData({
            title: item.title,
            description: item.description ?? '',
            starts_at: toDatetimeLocal(item.starts_at),
            ends_at: item.ends_at ? toDatetimeLocal(item.ends_at) : '',
            all_day: item.all_day,
            location: item.location ?? '',
            color: item.color ?? '#6366f1',
        });
        setShowModal(true);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (editing) {
            put(route('agenda.update', editing.id), {
                onSuccess: () => setShowModal(false),
            });
        } else {
            post(route('agenda.store'), {
                onSuccess: () => setShowModal(false),
            });
        }
    };

    const destroy = () => {
        if (editing && confirm(`Excluir o evento "${editing.title}"?`)) {
            router.delete(route('agenda.destroy', editing.id), {
                onSuccess: () => setShowModal(false),
            });
        }
    };

    return (
        <AppLayout header="Agenda">
            <Head title="Agenda" />

            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Eventos e prazos de tarefas em um só lugar
                </p>
                <PrimaryButton onClick={() => openCreate()}>
                    Novo evento
                </PrimaryButton>
            </div>

            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div style={{ height: 700 }} className="agenda-calendar">
                    <BigCalendar
                        localizer={localizer}
                        events={calendarEvents}
                        startAccessor="start"
                        endAccessor="end"
                        selectable
                        onSelectSlot={(slot) => openCreate(slot)}
                        onSelectEvent={(event) =>
                            openEdit((event as RbcEvent).resource)
                        }
                        eventPropGetter={(event) => {
                            const e = event as RbcEvent;
                            return {
                                style: {
                                    backgroundColor:
                                        e.resource.color ?? '#6366f1',
                                    borderRadius: 6,
                                    border: 'none',
                                    opacity: e.type === 'task' ? 0.85 : 1,
                                    fontStyle:
                                        e.type === 'task'
                                            ? 'italic'
                                            : 'normal',
                                },
                            };
                        }}
                        culture="pt-BR"
                        messages={{
                            next: 'Próximo',
                            previous: 'Anterior',
                            today: 'Hoje',
                            month: 'Mês',
                            week: 'Semana',
                            day: 'Dia',
                            agenda: 'Agenda',
                            date: 'Data',
                            time: 'Hora',
                            event: 'Evento',
                            noEventsInRange: 'Nenhum evento neste período.',
                        }}
                    />
                </div>
            </div>

            <p className="mt-3 text-xs text-gray-400">
                Eventos em itálico representam prazos de tarefas —{' '}
                <Link
                    href={route('tasks.index')}
                    className="text-indigo-600 hover:underline dark:text-indigo-400"
                >
                    gerencie tarefas aqui
                </Link>
                .
            </p>

            <Modal show={showModal} onClose={() => setShowModal(false)}>
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        {editing ? 'Editar evento' : 'Novo evento'}
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

                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="starts_at" value="Início" />
                            <TextInput
                                id="starts_at"
                                type="datetime-local"
                                className="mt-1 block w-full"
                                value={data.starts_at}
                                onChange={(e) =>
                                    setData('starts_at', e.target.value)
                                }
                            />
                            <InputError
                                message={errors.starts_at}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="ends_at" value="Fim" />
                            <TextInput
                                id="ends_at"
                                type="datetime-local"
                                className="mt-1 block w-full"
                                value={data.ends_at}
                                onChange={(e) =>
                                    setData('ends_at', e.target.value)
                                }
                            />
                            <InputError
                                message={errors.ends_at}
                                className="mt-2"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                        <input
                            id="all_day"
                            type="checkbox"
                            checked={data.all_day}
                            onChange={(e) =>
                                setData('all_day', e.target.checked)
                            }
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
                        />
                        <InputLabel htmlFor="all_day" value="Dia inteiro" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="location" value="Local" />
                        <TextInput
                            id="location"
                            className="mt-1 block w-full"
                            value={data.location}
                            onChange={(e) =>
                                setData('location', e.target.value)
                            }
                        />
                        <InputError
                            message={errors.location}
                            className="mt-2"
                        />
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

                    <div className="mt-6 flex items-center justify-between">
                        <div>
                            {editing && (
                                <DangerButton
                                    type="button"
                                    onClick={destroy}
                                >
                                    Excluir
                                </DangerButton>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <SecondaryButton
                                onClick={() => setShowModal(false)}
                            >
                                Cancelar
                            </SecondaryButton>
                            <PrimaryButton disabled={processing}>
                                {editing ? 'Salvar' : 'Criar'}
                            </PrimaryButton>
                        </div>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
