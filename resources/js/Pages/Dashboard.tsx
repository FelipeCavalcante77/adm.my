import AppLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    Bell,
    Bitcoin,
    Calendar,
    CheckCircle2,
    Clock,
    CloudFog,
    CloudLightning,
    CloudRain,
    Cloudy,
    DollarSign,
    Euro,
    ExternalLink,
    Lightbulb,
    ListTodo,
    Moon,
    Newspaper,
    Pause,
    Snowflake,
    Sun,
    TrendingDown,
    TrendingUp,
    Wind,
} from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface TaskToday {
    id: number;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
    project_id: number | null;
}

interface Reminder {
    id: number;
    title: string;
    remind_at: string;
    task_item_id: number | null;
}

interface AgendaEvent {
    id: number;
    title: string;
    starts_at: string;
    ends_at: string | null;
    all_day: boolean;
    color: string | null;
}

interface RunningEntry {
    id: number;
    task_item_id: number;
    started_at: string;
    task: { id: number; title: string } | null;
}

interface TechNewsItem {
    id: number;
    title: string;
    url: string;
    tag: string;
    source: string;
    published_at: string;
}

interface TipsData {
    techNews: TechNewsItem[];
    managementTip: string;
}

const tagLabels: Record<string, string> = {
    ai: 'IA',
    security: 'Segurança',
    productivity: 'Produtividade',
};

interface WeatherData {
    location: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
    isDay: boolean;
    description: string;
    icon: string;
}

const weatherIcons: Record<string, typeof Sun> = {
    clear: Sun,
    'partly-cloudy': Cloudy,
    cloudy: Cloudy,
    fog: CloudFog,
    rain: CloudRain,
    snow: Snowflake,
    storm: CloudLightning,
};

function useWeather(): { weather: WeatherData | null; loading: boolean } {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios
            .get<{ weather: WeatherData | null }>(route('weather.index'))
            .then((res) => setWeather(res.data.weather))
            .catch(() => setWeather(null))
            .finally(() => setLoading(false));
    }, []);

    return { weather, loading };
}

interface CurrencyRate {
    code: string;
    label: string;
    bid: number;
    pctChange: number;
}

const currencyIcons: Record<string, typeof DollarSign> = {
    USD: DollarSign,
    EUR: Euro,
    BTC: Bitcoin,
};

function useCurrency(): { rates: CurrencyRate[]; loading: boolean } {
    const [rates, setRates] = useState<CurrencyRate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios
            .get<{ rates: CurrencyRate[] }>(route('currency.index'))
            .then((res) => setRates(res.data.rates))
            .catch(() => setRates([]))
            .finally(() => setLoading(false));
    }, []);

    return { rates, loading };
}

function useTips(): { tips: TipsData | null; loading: boolean; error: boolean } {
    const [tips, setTips] = useState<TipsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        axios
            .get<TipsData>(route('tips.index'))
            .then((res) => setTips(res.data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, []);

    return { tips, loading, error };
}

interface DashboardProps {
    tasksToday: TaskToday[];
    overdueCount: number;
    upcomingReminders: Reminder[];
    upcomingEvents: AgendaEvent[];
    runningEntry: RunningEntry | null;
    weekSeconds: number;
    last7Days: { date: string; hours: number }[];
    [key: string]: unknown;
}

function formatHours(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}

function useElapsed(startedAt: string | null): string {
    const [elapsed, setElapsed] = useState('00:00:00');

    useEffect(() => {
        if (!startedAt) return;

        const tick = () => {
            const start = new Date(startedAt).getTime();
            const diff = Math.max(0, Math.floor((Date.now() - start) / 1000));
            const h = Math.floor(diff / 3600)
                .toString()
                .padStart(2, '0');
            const m = Math.floor((diff % 3600) / 60)
                .toString()
                .padStart(2, '0');
            const s = (diff % 60).toString().padStart(2, '0');
            setElapsed(`${h}:${m}:${s}`);
        };

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [startedAt]);

    return elapsed;
}

const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    high: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
};

function Card({
    children,
    className = '',
    delay = 0,
}: {
    children: ReactNode;
    className?: string;
    delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay, ease: 'easeOut' }}
            className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
        >
            {children}
        </motion.div>
    );
}

export default function Dashboard({
    tasksToday,
    overdueCount,
    upcomingReminders,
    upcomingEvents,
    runningEntry,
    weekSeconds,
    last7Days,
}: PageProps<DashboardProps>) {
    const elapsed = useElapsed(runningEntry?.started_at ?? null);
    const { tips, loading: tipsLoading, error: tipsError } = useTips();
    const { weather, loading: weatherLoading } = useWeather();
    const { rates, loading: ratesLoading } = useCurrency();
    const WeatherIcon = weather
        ? weather.icon === 'clear' && !weather.isDay
            ? Moon
            : (weatherIcons[weather.icon] ?? Cloudy)
        : Cloudy;

    const chartData = last7Days.map((d) => ({
        day: new Date(d.date + 'T00:00:00').toLocaleDateString('pt-BR', {
            weekday: 'short',
        }),
        horas: d.hours,
    }));

    return (
        <AppLayout header="Dashboard">
            <Head title="Dashboard" />

            {((!weatherLoading && weather) ||
                (!ratesLoading && rates.length > 0)) && (
                <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {!weatherLoading && weather && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                        >
                            <div className="flex items-center gap-3">
                                <WeatherIcon className="h-8 w-8 text-amber-500" />
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {weather.temperature}&deg;C &middot;{' '}
                                        {weather.description}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {weather.location}
                                    </p>
                                </div>
                            </div>
                            <div className="hidden items-center gap-4 text-xs text-gray-400 sm:flex">
                                <span className="flex items-center gap-1">
                                    <Wind className="h-3.5 w-3.5" />
                                    {weather.windSpeed} km/h
                                </span>
                                <span>Umidade {weather.humidity}%</span>
                            </div>
                        </motion.div>
                    )}

                    {!ratesLoading && rates.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.05 }}
                            className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                        >
                            {rates.map((rate) => {
                                const RateIcon =
                                    currencyIcons[rate.code] ?? DollarSign;
                                const isUp = rate.pctChange >= 0;
                                const TrendIcon = isUp
                                    ? TrendingUp
                                    : TrendingDown;

                                return (
                                    <div
                                        key={rate.code}
                                        className="flex items-center gap-2"
                                    >
                                        <RateIcon className="h-6 w-6 shrink-0 text-indigo-500" />
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {rate.bid.toLocaleString(
                                                    'pt-BR',
                                                    {
                                                        style: 'currency',
                                                        currency: 'BRL',
                                                    },
                                                )}
                                            </p>
                                            <p
                                                className={`flex items-center gap-0.5 text-xs ${
                                                    isUp
                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                        : 'text-red-600 dark:text-red-400'
                                                }`}
                                            >
                                                <TrendIcon className="h-3 w-3" />
                                                {rate.pctChange}%
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <Card delay={0}>
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Tarefas hoje
                        </p>
                        <ListTodo className="h-5 w-5 text-indigo-500" />
                    </div>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                        {tasksToday.length}
                    </p>
                </Card>

                <Card delay={0.05}>
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Atrasadas
                        </p>
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                    </div>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                        {overdueCount}
                    </p>
                </Card>

                <Card delay={0.1}>
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Horas essa semana
                        </p>
                        <Clock className="h-5 w-5 text-violet-500" />
                    </div>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                        {formatHours(weekSeconds)}
                    </p>
                </Card>

                <Card delay={0.15}>
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Cronômetro
                        </p>
                        {runningEntry ? (
                            <span className="flex h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
                        ) : (
                            <Pause className="h-5 w-5 text-gray-400" />
                        )}
                    </div>
                    {runningEntry ? (
                        <>
                            <p className="mt-2 font-mono text-2xl font-bold text-gray-900 dark:text-white">
                                {elapsed}
                            </p>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                {runningEntry.task?.title}
                            </p>
                        </>
                    ) : (
                        <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
                            Nenhum timer ativo
                        </p>
                    )}
                </Card>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2" delay={0.2}>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Últimos 7 dias
                    </h3>
                    <div className="mt-4 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis
                                    dataKey="day"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(99,102,241,0.08)' }}
                                    contentStyle={{
                                        borderRadius: 12,
                                        border: '1px solid #e5e7eb',
                                    }}
                                />
                                <Bar
                                    dataKey="horas"
                                    fill="#6366f1"
                                    radius={[6, 6, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card delay={0.25}>
                    <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-indigo-500" />
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            Lembretes
                        </h3>
                    </div>
                    <ul className="mt-4 space-y-3">
                        {upcomingReminders.length === 0 && (
                            <p className="text-sm text-gray-400">
                                Nenhum lembrete próximo.
                            </p>
                        )}
                        {upcomingReminders.map((r) => (
                            <li
                                key={r.id}
                                className="flex items-center justify-between text-sm"
                            >
                                <span className="truncate text-gray-700 dark:text-gray-300">
                                    {r.title}
                                </span>
                                <span className="ml-2 shrink-0 text-xs text-gray-400">
                                    {new Date(r.remind_at).toLocaleString(
                                        'pt-BR',
                                        {
                                            day: '2-digit',
                                            month: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        },
                                    )}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <Link
                        href={route('reminders.index')}
                        className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    >
                        Ver todos &rarr;
                    </Link>
                </Card>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card delay={0.3}>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            Tarefas de hoje
                        </h3>
                    </div>
                    <ul className="mt-4 space-y-2">
                        {tasksToday.length === 0 && (
                            <p className="text-sm text-gray-400">
                                Nenhuma tarefa para hoje.
                            </p>
                        )}
                        {tasksToday.map((t) => (
                            <li
                                key={t.id}
                                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800"
                            >
                                <span className="truncate text-sm text-gray-700 dark:text-gray-300">
                                    {t.title}
                                </span>
                                <span
                                    className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[t.priority]}`}
                                >
                                    {t.priority}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <Link
                        href={route('tasks.index')}
                        className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    >
                        Ver todas &rarr;
                    </Link>
                </Card>

                <Card delay={0.35}>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-indigo-500" />
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            Próximos eventos
                        </h3>
                    </div>
                    <ul className="mt-4 space-y-2">
                        {upcomingEvents.length === 0 && (
                            <p className="text-sm text-gray-400">
                                Nenhum evento próximo.
                            </p>
                        )}
                        {upcomingEvents.map((e) => (
                            <li
                                key={e.id}
                                className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800"
                            >
                                <span
                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                    style={{
                                        backgroundColor:
                                            e.color ?? '#6366f1',
                                    }}
                                />
                                <span className="flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
                                    {e.title}
                                </span>
                                <span className="shrink-0 text-xs text-gray-400">
                                    {new Date(e.starts_at).toLocaleDateString(
                                        'pt-BR',
                                        { day: '2-digit', month: '2-digit' },
                                    )}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <Link
                        href={route('agenda.index')}
                        className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    >
                        Ver agenda &rarr;
                    </Link>
                </Card>
            </div>

            <div className="mt-6">
                <Card delay={0.4}>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-2">
                                <Newspaper className="h-4 w-4 text-indigo-500" />
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    Novidades de tecnologia
                                </h3>
                            </div>

                            {tipsLoading && (
                                <ul className="mt-4 space-y-3">
                                    {[0, 1, 2].map((i) => (
                                        <li
                                            key={i}
                                            className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-800"
                                        />
                                    ))}
                                </ul>
                            )}

                            {!tipsLoading && tipsError && (
                                <p className="mt-4 text-sm text-gray-400">
                                    Não foi possível carregar novidades agora.
                                </p>
                            )}

                            {!tipsLoading &&
                                !tipsError &&
                                tips?.techNews.length === 0 && (
                                    <p className="mt-4 text-sm text-gray-400">
                                        Nenhuma novidade disponível no
                                        momento.
                                    </p>
                                )}

                            {!tipsLoading && !tipsError && tips && (
                                <ul className="mt-4 space-y-3">
                                    {tips.techNews.map((n) => (
                                        <li key={n.id}>
                                            <a
                                                href={n.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group flex items-start gap-2 rounded-lg px-1 py-1 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                                            >
                                                <span className="mt-0.5 shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                                                    {tagLabels[n.tag] ??
                                                        n.tag}
                                                </span>
                                                <span className="flex-1 truncate text-sm text-gray-700 group-hover:text-indigo-600 dark:text-gray-300 dark:group-hover:text-indigo-400">
                                                    {n.title}
                                                </span>
                                                <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-300 group-hover:text-indigo-500" />
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-4 text-white">
                            <div className="flex items-center gap-2">
                                <Lightbulb className="h-4 w-4" />
                                <h3 className="text-sm font-semibold">
                                    Dica de gestão do dia
                                </h3>
                            </div>
                            <p className="mt-3 text-sm leading-relaxed text-indigo-50">
                                {tipsLoading
                                    ? 'Carregando...'
                                    : (tips?.managementTip ??
                                      'Sem dica disponível hoje.')}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
