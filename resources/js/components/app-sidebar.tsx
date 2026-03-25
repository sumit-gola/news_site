import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    BookOpen,
    FileText,
    FolderGit2,
    ImagePlus,
    LayoutGrid,
    Megaphone,
    Newspaper,
    PanelsTopLeft,
    Settings,
    Shield,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarGroup,
    SidebarGroupLabel,
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
    const { auth, ads } = usePage<{ auth: Auth; ads?: { activeCount?: number } }>().props;
    const user = auth?.user;
    const roles = user?.roles?.map((r) => r.name) ?? [];
    const activeAdsCount = ads?.activeCount ?? 0;

    const isAdmin    = roles.includes('admin');
    const isManager  = roles.includes('manager');
    const isReporter = roles.includes('reporter');

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />

                {isAdmin && <AdminNav activeAdsCount={activeAdsCount} />}

                {(isAdmin || isManager) && <ManagerNav />}

                {(isAdmin || isManager || isReporter) && <ReporterNav />}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

function AdminNav({ activeAdsCount }: { activeAdsCount: number }) {
    const { url } = usePage();

    const items = [
        { title: 'User Management',    href: '/admin/users',       icon: Users     },
        { title: 'Roles & Permissions', href: '/admin/roles',       icon: Shield    },
        { title: 'Articles',            href: '/admin/articles',    icon: Newspaper },
        { title: 'Pages',               href: '/pages',             icon: FileText  },
        { title: 'Categories',          href: '/categories',        icon: BookOpen  },
        { title: 'Settings',            href: '/settings/profile',  icon: Settings  },
    ];

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="flex items-center gap-1.5 text-xs font-semibold text-red-500 dark:text-red-400">
                <Settings className="size-3" />
                Admin
            </SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={url.startsWith(item.href)}
                            tooltip={{ children: item.title }}
                        >
                            <Link href={item.href} prefetch>
                                <item.icon />
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}

                <SidebarMenuItem>
                    <SidebarMenuButton
                        isActive={url.startsWith('/admin/advertisements') || url.startsWith('/admin/advertisers') || url.startsWith('/admin/ad-slots')}
                        tooltip={{ children: 'Advertisements' }}
                    >
                        <Megaphone />
                        <span>Advertisements</span>
                    </SidebarMenuButton>
                    <SidebarMenuBadge>{activeAdsCount}</SidebarMenuBadge>

                    <SidebarMenuSub>
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={url.startsWith('/admin/advertisements')}>
                                <Link href="/admin/advertisements" prefetch>
                                    <Newspaper />
                                    <span>All Ads</span>
                                </Link>
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={url === '/admin/advertisements/create'}>
                                <Link href="/admin/advertisements/create" prefetch>
                                    <ImagePlus />
                                    <span>Add New Ad</span>
                                </Link>
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={url.startsWith('/admin/advertisers')}>
                                <Link href="/admin/advertisers" prefetch>
                                    <Users />
                                    <span>Clients</span>
                                </Link>
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={url.startsWith('/admin/ad-slots')}>
                                <Link href="/admin/ad-slots" prefetch>
                                    <PanelsTopLeft />
                                    <span>Ad Slots</span>
                                </Link>
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={url.startsWith('/admin/advertisements/analytics')}>
                                <Link href="/admin/advertisements/analytics" prefetch>
                                    <BarChart3 />
                                    <span>Analytics</span>
                                </Link>
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                    </SidebarMenuSub>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
    );
}

function ManagerNav() {
    const { url } = usePage();

    const items = [
        { title: 'Manager Dashboard', href: '/manager/dashboard', icon: LayoutGrid },
        { title: 'Articles',          href: '/articles',          icon: Newspaper  },
        { title: 'Pages',             href: '/pages',             icon: FileText   },
        { title: 'Categories',        href: '/categories',        icon: BookOpen   },
    ];

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 dark:text-blue-400">
                <Shield className="size-3" />
                Manager
            </SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={url.startsWith(item.href)}
                            tooltip={{ children: item.title }}
                        >
                            <Link href={item.href} prefetch>
                                <item.icon />
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}

function ReporterNav() {
    const { url } = usePage();

    const items = [
        { title: 'Reporter Dashboard', href: '/reporter/dashboard', icon: LayoutGrid },
        { title: 'My Articles',        href: '/articles',           icon: Newspaper  },
        { title: 'New Article',        href: '/articles/create',    icon: FileText   },
    ];

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="flex items-center gap-1.5 text-xs font-semibold text-green-500 dark:text-green-400">
                <LayoutGrid className="size-3" />
                Reporter
            </SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={url.startsWith(item.href)}
                            tooltip={{ children: item.title }}
                        >
                            <Link href={item.href} prefetch>
                                <item.icon />
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
