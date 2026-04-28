import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    ChevronDown,
    FileText,
    FolderGit2,
    HardDrive,
    LayoutDashboard,
    LayoutGrid,
    List,
    Megaphone,
    MessageSquare,
    Newspaper,
    PenSquare,
    Settings,
    Shield,
    Trash2,
    Users,
} from 'lucide-react';
import * as React from 'react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavUser } from '@/components/nav-user';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarSeparator,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { Auth, NavItem } from '@/types';

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { auth, comments } = usePage<{ auth: Auth; comments?: { pendingCount?: number } }>().props;
    const user = auth?.user;
    const roles = user?.roles?.map((r) => r.name) ?? [];
    const pendingCommentsCount = comments?.pendingCount ?? 0;

    const isAdmin    = roles.includes('admin');
    const isManager  = roles.includes('manager');
    const isReporter = roles.includes('reporter');

    const { url } = usePage();

    return (
        <Sidebar collapsible="icon" variant="inset">
            {/* ── Header ─────────────────────────────────────── */}
            <SidebarHeader className="border-b border-sidebar-border/30 px-3 py-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent active:bg-transparent">
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="gap-0 px-3 py-3">
                {/* ── Dashboard ──────────────────────────────── */}
                <SidebarGroup className="py-1">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={url === String(dashboard())}
                                tooltip={{ children: 'Dashboard' }}
                                className="group/item h-9 gap-3 rounded-lg px-3 font-medium transition-all duration-150
                                    hover:bg-violet-50 hover:text-violet-700
                                    data-[active=true]:bg-gradient-to-r data-[active=true]:from-violet-600 data-[active=true]:to-indigo-600
                                    data-[active=true]:text-white data-[active=true]:shadow-md data-[active=true]:shadow-violet-200
                                    dark:hover:bg-violet-950/40 dark:hover:text-violet-400
                                    dark:data-[active=true]:shadow-violet-900/40"
                            >
                                <Link href={dashboard()} prefetch>
                                    <LayoutGrid className="size-4 shrink-0" />
                                    <span className="text-sm">Dashboard</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                {/* ── Admin Section ──────────────────────────── */}
                {isAdmin && (
                    <>
                        <div className="my-2 h-px bg-gradient-to-r from-transparent via-red-200 to-transparent dark:via-red-800/40" />
                        <AdminNav pendingCommentsCount={pendingCommentsCount} />
                    </>
                )}

                {/* ── Manager Section ────────────────────────── */}
                {(isAdmin || isManager) && (
                    <>
                        <div className="my-2 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent dark:via-blue-800/40" />
                        <ManagerNav />
                    </>
                )}

                {/* ── Reporter Section ───────────────────────── */}
                {(isAdmin || isManager || isReporter) && (
                    <>
                        <div className="my-2 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent dark:via-emerald-800/40" />
                        <ReporterNav />
                    </>
                )}
            </SidebarContent>

            {/* ── Footer ─────────────────────────────────────── */}
            <SidebarFooter className="border-t border-sidebar-border/30 px-3 pt-2 pb-3">
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

/* ── Section header ─────────────────────────────────────────── */
function SectionHeader({
    label,
    icon: Icon,
    gradient,
    textColor,
}: {
    label: string;
    icon: React.ElementType;
    gradient: string;
    textColor: string;
}) {
    return (
        <div className={`mb-2 flex items-center gap-2 rounded-lg px-2 py-1.5 ${gradient}`}>
            <div className={`flex size-5 shrink-0 items-center justify-center rounded-md bg-white/20`}>
                <Icon className={`size-3 ${textColor}`} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${textColor}`}>{label}</span>
        </div>
    );
}

/* ── Count badge helper ─────────────────────────────────────── */
function CountBadge({ count, color = 'red' }: { count: number; color?: string }) {
    if (count <= 0) return null;
    const colors: Record<string, string> = {
        red:   'bg-red-500 text-white',
        amber: 'bg-amber-500 text-white',
        blue:  'bg-blue-500 text-white',
    };
    return (
        <span className={`ml-auto flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums ${colors[color]}`}>
            {count > 99 ? '99+' : count}
        </span>
    );
}

/* ── Shared nav item class builders ────────────────────────────── */
function navItemCls(activeGradient: string, activeText: string, hoverBg: string, hoverText: string) {
    return `group/item h-9 gap-3 rounded-lg px-3 font-medium transition-all duration-150
        ${hoverBg} ${hoverText}
        data-[active=true]:bg-gradient-to-r ${activeGradient}
        data-[active=true]:${activeText} data-[active=true]:shadow-sm`;
}

/* ── Admin Nav ──────────────────────────────────────────────── */
function AdminNav({ pendingCommentsCount }: { pendingCommentsCount: number }) {
    const { url } = usePage();
    const [commentsOpen, setCommentsOpen] = React.useState(url.startsWith('/admin/comments'));

    const items = [
        { title: 'User Management',     href: '/admin/users',             icon: Users      },
        { title: 'Roles & Permissions', href: '/admin/roles',             icon: Shield     },
        { title: 'Articles',            href: '/admin/articles',          icon: Newspaper  },
        { title: 'Pages',               href: '/pages',                   icon: FileText   },
        { title: 'Categories',          href: '/categories',              icon: BookOpen   },
        { title: 'Advertisements',      href: '/admin/advertisements',    icon: Megaphone  },
        { title: 'Media Library',       href: '/admin/media',             icon: HardDrive  },
        { title: 'Settings',            href: '/settings/profile',        icon: Settings   },
    ];

    const activeCls = 'group/item h-9 gap-3 rounded-lg px-3 transition-all duration-150 ' +
        'hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-400 ' +
        'data-[active=true]:bg-gradient-to-r data-[active=true]:from-red-500 data-[active=true]:to-rose-600 ' +
        'data-[active=true]:text-white data-[active=true]:font-semibold data-[active=true]:shadow-md data-[active=true]:shadow-red-200/60 ' +
        'dark:data-[active=true]:shadow-red-900/40';

    return (
        <SidebarGroup className="py-1">
            <SidebarGroupLabel className="mb-1 px-0">
                <SectionHeader
                    label="Admin"
                    icon={Shield}
                    gradient="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30"
                    textColor="text-red-600 dark:text-red-400"
                />
            </SidebarGroupLabel>
            <SidebarMenu className="gap-0.5">
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={url.startsWith(item.href)}
                            tooltip={{ children: item.title }}
                            className={activeCls}
                        >
                            <Link href={item.href} prefetch>
                                <item.icon className="size-4 shrink-0" />
                                <span className="text-sm">{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}

                {/* Comments collapsible */}
                <Collapsible open={commentsOpen} onOpenChange={setCommentsOpen} asChild>
                    <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                                isActive={commentsOpen}
                                tooltip={{ children: 'Comments' }}
                                className={activeCls}
                            >
                                <MessageSquare className="size-4 shrink-0" />
                                <span className="text-sm">Comments</span>
                                {pendingCommentsCount > 0 && <CountBadge count={pendingCommentsCount} color="red" />}
                                <ChevronDown className={`ml-auto size-3.5 shrink-0 opacity-60 transition-transform duration-200 ${commentsOpen ? 'rotate-180' : ''}`} />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub className="ml-3 border-l-2 border-red-200 pl-2 dark:border-red-800/50">
                                {[
                                    { href: '/admin/comments/dashboard',   icon: LayoutDashboard, label: 'Dashboard',    active: url === '/admin/comments/dashboard' },
                                    { href: '/admin/comments',             icon: List,            label: 'All Comments', active: url === '/admin/comments' && !url.includes('trashed') },
                                    { href: '/admin/comments?trashed=true',icon: Trash2,          label: 'Trash',        active: url.includes('trashed=true') },
                                ].map(({ href, icon: Icon, label, active }) => (
                                    <SidebarMenuSubItem key={label}>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={active}
                                            className="h-7 gap-2 rounded-md text-xs transition-all duration-150 hover:text-red-600 data-[active=true]:text-red-600 dark:data-[active=true]:text-red-400"
                                        >
                                            <Link href={href} prefetch>
                                                <Icon className="size-3.5 shrink-0" />
                                                <span>{label}</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                ))}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                </Collapsible>
            </SidebarMenu>
        </SidebarGroup>
    );
}

/* ── Manager Nav ────────────────────────────────────────────── */
function ManagerNav() {
    const { url } = usePage();

    const items = [
        { title: 'Manager Dashboard', href: '/manager/dashboard', icon: LayoutGrid },
        { title: 'Articles',          href: '/articles',          icon: Newspaper  },
        { title: 'Pages',             href: '/pages',             icon: FileText   },
        { title: 'Categories',        href: '/categories',        icon: BookOpen   },
    ];

    const activeCls = 'group/item h-9 gap-3 rounded-lg px-3 transition-all duration-150 ' +
        'hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 ' +
        'data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-500 data-[active=true]:to-cyan-600 ' +
        'data-[active=true]:text-white data-[active=true]:font-semibold data-[active=true]:shadow-md data-[active=true]:shadow-blue-200/60 ' +
        'dark:data-[active=true]:shadow-blue-900/40';

    return (
        <SidebarGroup className="py-1">
            <SidebarGroupLabel className="mb-1 px-0">
                <SectionHeader
                    label="Manager"
                    icon={Shield}
                    gradient="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30"
                    textColor="text-blue-600 dark:text-blue-400"
                />
            </SidebarGroupLabel>
            <SidebarMenu className="gap-0.5">
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={url.startsWith(item.href)}
                            tooltip={{ children: item.title }}
                            className={activeCls}
                        >
                            <Link href={item.href} prefetch>
                                <item.icon className="size-4 shrink-0" />
                                <span className="text-sm">{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}

/* ── Reporter Nav ───────────────────────────────────────────── */
function ReporterNav() {
    const { url } = usePage();

    const items = [
        { title: 'Reporter Dashboard', href: '/reporter/dashboard', icon: LayoutGrid },
        { title: 'My Articles',        href: '/articles',           icon: Newspaper  },
        { title: 'New Article',        href: '/articles/create',    icon: PenSquare  },
    ];

    const activeCls = 'group/item h-9 gap-3 rounded-lg px-3 transition-all duration-150 ' +
        'hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400 ' +
        'data-[active=true]:bg-gradient-to-r data-[active=true]:from-emerald-500 data-[active=true]:to-teal-600 ' +
        'data-[active=true]:text-white data-[active=true]:font-semibold data-[active=true]:shadow-md data-[active=true]:shadow-emerald-200/60 ' +
        'dark:data-[active=true]:shadow-emerald-900/40';

    return (
        <SidebarGroup className="py-1">
            <SidebarGroupLabel className="mb-1 px-0">
                <SectionHeader
                    label="Reporter"
                    icon={PenSquare}
                    gradient="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30"
                    textColor="text-emerald-600 dark:text-emerald-400"
                />
            </SidebarGroupLabel>
            <SidebarMenu className="gap-0.5">
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={item.href === '/articles/create' ? url === item.href : url.startsWith(item.href)}
                            tooltip={{ children: item.title }}
                            className={activeCls}
                        >
                            <Link href={item.href} prefetch>
                                <item.icon className="size-4 shrink-0" />
                                <span className="text-sm">{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
