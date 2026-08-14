import AppLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CalendarCheck, Clock, TrendingUp } from 'lucide-react';
import { ReactNode } from 'react';
import {
    Bar,
    BarChart,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface DayHours {
    date: string;
    hours: number;
}

interface ProjectHours {
    project: string;
    hours: number;
    color: string;
}

interface ReportsProps {
    hoursPerDay: DayHours[];
    hoursPerProject: ProjectHours[];
    totalHoursThisMonth: number;
    tasksCompletedThisMonth: number;
    avgHoursPerDay: number;
    [key: string]: unknown;
}

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

export default function Index({
    hoursPerDay,
    hoursPerProject,
    totalHoursThisMonth,
    tasksCompletedThisMonth,
    avgHoursPerDay,
}: PageProps<ReportsProps>) {
    const chartData = hoursPerDay.map((d) => ({
        day: new Date(d.date + 'T00:00:00').toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
        }),
        horas: d.hours,
    }));

    return (
        <AppLayout header="Relatórios">
            <Head title="Relatórios" />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <Card delay={0}>
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Horas este mês
                        </p>
                        <Clock className="h-5 w-5 text-indigo-500" />
                    </div>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                        {totalHoursThisMonth}h
                    </p>
                </Card>

                <Card delay={0.05}>
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Tarefas concluídas
                        </p>
                        <CalendarCheck className="h-5 w-5 text-emerald-500" />
                    </div>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                        {tasksCompletedThisMonth}
                    </p>
                </Card>

                <Card delay={0.1}>
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Média horas/dia
                        </p>
                        <TrendingUp className="h-5 w-5 text-violet-500" />
                    </div>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                        {avgHoursPerDay}h
                    </p>
                </Card>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2" delay={0.15}>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Horas por dia (últimos 30 dias)
                    </h3>
                    <div className="mt-4 h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis
                                    dataKey="day"
                                    tickLine={false}
                                    axisLine={false}
                                    interval={2}
                                    tick={{ fontSize: 11, fill: '#9ca3af' }}
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
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card delay={0.2}>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Horas por projeto
                    </h3>
                    <div className="mt-4 h-72">
                        {hoursPerProject.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={hoursPerProject}
                                        dataKey="hours"
                                        nameKey="project"
                                        innerRadius={55}
                                        outerRadius={90}
                                        paddingAngle={3}
                                    >
                                        {hoursPerProject.map((entry, i) => (
                                            <Cell
                                                key={i}
                                                fill={entry.color}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: 12,
                                            border: '1px solid #e5e7eb',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="flex h-full items-center justify-center text-sm text-gray-400">
                                Sem dados suficientes.
                            </p>
                        )}
                    </div>
                    <ul className="mt-2 space-y-1">
                        {hoursPerProject.map((p) => (
                            <li
                                key={p.project}
                                className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
                            >
                                <span className="flex items-center gap-2">
                                    <span
                                        className="h-2.5 w-2.5 rounded-full"
                                        style={{ backgroundColor: p.color }}
                                    />
                                    {p.project}
                                </span>
                                <span>{p.hours}h</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </AppLayout>
    );
}
