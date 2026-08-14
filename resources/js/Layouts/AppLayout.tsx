import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    BarChart3,
    Bell,
    Calendar,
    ChevronDown,
    FolderKanban,
    LayoutDashboard,
    ListTodo,
    Menu,
    Timer,
    X,
} from 'lucide-react';
import { PropsWithChildren, ReactNode, useState } from 'react';

interface NavItem {
    name: string;
    href: string;
    routeName: string;
    icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
    {
        name: 'Dashboard',
        href: route('dashboard'),
        routeName: 'dashboard',
        icon: LayoutDashboard,
    },
    {
        name: 'Tarefas',
        href: route('tasks.index'),
        routeName: 'tasks.*',
        icon: ListTodo,
    },
    {
        name: 'Cronômetro',
        href: route('timer.index'),
        routeName: 'timer.*',
        icon: Timer,
    },
    {
        name: 'Agenda',
        href: route('agenda.index'),
        routeName: 'agenda.*',
        icon: Calendar,
    },
    {
        name: 'Relatórios',
        href: route('reports.index'),
        routeName: 'reports.*',
        icon: BarChart3,
    },
    {
        name: 'Lembretes',
        href: route('reminders.index'),
        routeName: 'reminders.*',
        icon: Bell,
    },
    {
        name: 'Projetos',
        href: route('projects.index'),
        routeName: 'projects.*',
        icon: FolderKanban,
    },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 px-6 py-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white shadow-lg shadow-indigo-500/30">
                    A
                </div>
                <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                    admmy
                </span>
            </div>

            <nav className="flex-1 space-y-1 px-3">
                {navItems.map((item) => {
                    const active = route().current(item.routeName);
                    const Icon = item.icon;

                    return (
                        <motion.div
                            key={item.name}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Link
                                href={item.href}
                                onClick={onNavigate}
                                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                                    active
                                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                                }`}
                            >
                                {active && (
                                    <motion.span
                                        layoutId="active-nav-pill"
                                        className="absolute inset-y-0 left-0 w-1 rounded-r-full bg-indigo-600 dark:bg-indigo-400"
                                        transition={{
                                            type: 'spring',
                                            stiffness: 400,
                                            damping: 30,
                                        }}
                                    />
                                )}
                                <Icon
                                    className={`h-[18px] w-[18px] shrink-0 ${
                                        active
                                            ? 'text-indigo-600 dark:text-indigo-300'
                                            : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'
                                    }`}
                                    strokeWidth={2}
                                />
                                <span>{item.name}</span>
                            </Link>
                        </motion.div>
                    );
                })}
            </nav>

            <div className="px-6 py-4 text-xs text-gray-400 dark:text-gray-600">
                admmy &copy; {new Date().getFullYear()}
            </div>
        </div>
    );
}

export default function AppLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage().props.auth.user;
    const { url } = usePage();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-gray-200 bg-white/80 backdrop-blur-xl lg:block dark:border-gray-800 dark:bg-gray-900/80">
                <SidebarContent />
            </aside>

            {/* Mobile drawer */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{
                                type: 'spring',
                                stiffness: 340,
                                damping: 32,
                            }}
                            className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl lg:hidden dark:bg-gray-900"
                        >
                            <div className="flex justify-end px-4 pt-4">
                                <button
                                    onClick={() => setMobileOpen(false)}
                                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <SidebarContent
                                onNavigate={() => setMobileOpen(false)}
                            />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <div className="lg:pl-64">
                {/* Topbar */}
                <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/80">
                    <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setMobileOpen(true)}
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            {header && (
                                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {header}
                                </div>
                            )}
                        </div>

                        <Dropdown>
                            <Dropdown.Trigger>
                                <button
                                    type="button"
                                    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                >
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white">
                                        {user.name.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="hidden sm:inline">
                                        {user.name}
                                    </span>
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                </button>
                            </Dropdown.Trigger>

                            <Dropdown.Content>
                                <Dropdown.Link href={route('profile.edit')}>
                                    Perfil
                                </Dropdown.Link>
                                <Dropdown.Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                >
                                    Sair
                                </Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    <motion.main
                        key={url}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
                    >
                        {children}
                    </motion.main>
                </AnimatePresence>
            </div>
        </div>
    );
}
