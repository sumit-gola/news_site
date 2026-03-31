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
            <SidebarHeader className="border-b border-sidebar-border/40 pb-3">
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

            <SidebarContent className="gap-0 px-2 py-2">
                {/* ── Dashboard ──────────────────────────────── */}
                <SidebarGroup className="py-1">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={url === String(dashboard())}
                                tooltip={{ children: 'Dashboard' }}
                                className="group/item transition-all duration-150 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold"
                            >
                                <Link href={dashboard()} prefetch>
                                    <LayoutGrid className="transition-transform duration-150 group-hover/item:scale-110" />
                                    <span>Dashboard</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                {/* ── Admin Section ──────────────────────────── */}
                {isAdmin && (
                    <>
                        <SidebarSeparator className="my-1 opacity-40" />
                        <AdminNav pendingCommentsCount={pendingCommentsCount} />
                    </>
                )}

                {/* ── Manager Section ────────────────────────── */}
                {(isAdmin || isManager) && (
                    <>
                        <SidebarSeparator className="my-1 opacity-40" />
                        <ManagerNav />
                    </>
                )}

                {/* ── Reporter Section ───────────────────────── */}
                {(isAdmin || isManager || isReporter) && (
                    <>
                        <SidebarSeparator className="my-1 opacity-40" />
                        <ReporterNav />
                    </>
                )}
            </SidebarContent>

            {/* ── Footer ─────────────────────────────────────── */}
            <SidebarFooter className="border-t border-sidebar-border/40 pt-2">
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

/* ── Role badge helper ──────────────────────────────────────── */
function RoleBadge({ color, icon: Icon, label }: { color: string; icon: React.ElementType; label: string }) {
    const colors: Record<string, string> = {
        red:   'bg-red-50 text-red-600 ring-red-200 dark:bg-red-950/60 dark:text-red-400 dark:ring-red-800',
        blue:  'bg-blue-50 text-blue-600 ring-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:ring-blue-800',
        green: 'bg-emerald-50 text-emerald-600 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:ring-emerald-800',
    };
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${colors[color]}`}>
            <Icon className="size-2.5" />
            {label}
        </span>
    );
}

/* ── Count badge helper ─────────────────────────────────────── */
function CountBadge({ count, color = 'red' }: { count: number; color?: string }) {
    if (count <= 0) return null;
    const colors: Record<string, string> = {
        red:    'bg-red-500 text-white',
        amber:  'bg-amber-500 text-white',
        blue:   'bg-blue-500 text-white',
    };
    return (
        <span className={`ml-auto flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums ${colors[color]}`}>
            {count > 99 ? '99+' : count}
        </span>
    );
}

/* ── Admin Nav ──────────────────────────────────────────────── */
function AdminNav({ pendingCommentsCount }: { pendingCommentsCount: number }) {
    const { url } = usePage();

    const [commentsOpen, setCommentsOpen] = React.useState(url.startsWith('/admin/comments'));

    const items = [
        { title: 'User Management',     href: '/admin/users',      icon: Users     },
        { title: 'Roles & Permissions', href: '/admin/roles',      icon: Shield    },
        { title: 'Articles',            href: '/admin/articles',   icon: Newspaper },
        { title: 'Pages',               href: '/pages',            icon: FileText  },
        { title: 'Categories',          href: '/categories',       icon: BookOpen  },
        { title: 'Media Library',       href: '/admin/media',      icon: HardDrive },
        { title: 'Settings',            href: '/settings/profile', icon: Settings  },
    ];

    return (
        <SidebarGroup className="py-1">
            <SidebarGroupLabel className="mb-1 px-1">
                <RoleBadge color="red" icon={Shield} label="Admin" />
            </SidebarGroupLabel>
            <SidebarMenu className="gap-0.5">
                {/* Static items */}
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={url.startsWith(item.href)}
                            tooltip={{ children: item.title }}
                            className="group/item h-8 transition-all duration-150 data-[active=true]:bg-red-50 data-[active=true]:text-red-600 data-[active=true]:font-medium dark:data-[active=true]:bg-red-950/40 dark:data-[active=true]:text-red-400"
                        >
                            <Link href={item.href} prefetch>
                                <item.icon className="size-4 transition-transform duration-150 group-hover/item:scale-110" />
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
                                className="group/item h-8 transition-all duration-150 data-[active=true]:bg-red-50 data-[active=true]:text-red-600 data-[active=true]:font-medium dark:data-[active=true]:bg-red-950/40 dark:data-[active=true]:text-red-400"
                            >
                                <MessageSquare className="size-4 transition-transform duration-150 group-hover/item:scale-110" />
                                <span className="text-sm">Comments</span>
                                {pendingCommentsCount > 0 && <CountBadge count={pendingCommentsCount} color="red" />}
                                <ChevronDown className={`ml-1 size-3 shrink-0 opacity-60 transition-transform duration-200 ${commentsOpen ? 'rotate-180' : ''}`} />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub className="border-l-2 border-red-200/60 dark:border-red-800/40 ml-3 pl-2">
                                {[
                                    { href: '/admin/comments/dashboard', icon: LayoutDashboard, label: 'Dashboard',    active: url === '/admin/comments/dashboard'           },
                                    { href: '/admin/comments',           icon: List,            label: 'All Comments', active: url === '/admin/comments' && !url.includes('trashed') },
                                    { href: '/admin/comments?trashed=true', icon: Trash2,       label: 'Trash',        active: url.includes('trashed=true')                  },
                                ].map(({ href, icon: Icon, label, active }) => (
                                    <SidebarMenuSubItem key={label}>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={active}
                                            className="h-7 text-xs transition-all duration-150 data-[active=true]:text-red-600 dark:data-[active=true]:text-red-400"
                                        >
                                            <Link href={href} prefetch>
                                                <Icon className="size-3.5" />
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

    return (
        <SidebarGroup className="py-1">
            <SidebarGroupLabel className="mb-1 px-1">
                <RoleBadge color="blue" icon={Shield} label="Manager" />
            </SidebarGroupLabel>
            <SidebarMenu className="gap-0.5">
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={url.startsWith(item.href)}
                            tooltip={{ children: item.title }}
                            className="group/item h-8 transition-all duration-150 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-600 data-[active=true]:font-medium dark:data-[active=true]:bg-blue-950/40 dark:data-[active=true]:text-blue-400"
                        >
                            <Link href={item.href} prefetch>
                                <item.icon className="size-4 transition-transform duration-150 group-hover/item:scale-110" />
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
        { title: 'Reporter Dashboard', href: '/reporter/dashboard', icon: LayoutGrid  },
        { title: 'My Articles',        href: '/articles',           icon: Newspaper   },
        { title: 'New Article',        href: '/articles/create',    icon: PenSquare   },
    ];

    return (
        <SidebarGroup className="py-1">
            <SidebarGroupLabel className="mb-1 px-1">
                <RoleBadge color="green" icon={PenSquare} label="Reporter" />
            </SidebarGroupLabel>
            <SidebarMenu className="gap-0.5">
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={item.href === '/articles/create' ? url === item.href : url.startsWith(item.href)}
                            tooltip={{ children: item.title }}
                            className="group/item h-8 transition-all duration-150 data-[active=true]:bg-emerald-50 data-[active=true]:text-emerald-600 data-[active=true]:font-medium dark:data-[active=true]:bg-emerald-950/40 dark:data-[active=true]:text-emerald-400"
                        >
                            <Link href={item.href} prefetch>
                                <item.icon className="size-4 transition-transform duration-150 group-hover/item:scale-110" />
                                <span className="text-sm">{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
