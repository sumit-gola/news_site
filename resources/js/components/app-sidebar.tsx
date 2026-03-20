import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    FileText,
    FolderGit2,
    LayoutGrid,
    Newspaper,
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
    SidebarMenuButton,
    SidebarMenuItem,
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
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth?.user;
    const roles = user?.roles?.map((r) => r.name) ?? [];

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

                {isAdmin && <AdminNav />}

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

function AdminNav() {
    const { url } = usePage();

    const items = [
        { title: 'User Management',    href: '/admin/users',      icon: Users      },
        { title: 'Roles & Permissions', href: '/admin/roles',     icon: Shield     },
        { title: 'Articles',           href: '/articles',        icon: Newspaper  },
        { title: 'New Article',        href: '/articles/create', icon: FileText   },
        { title: 'Categories',         href: '/categories',      icon: BookOpen   },
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
            </SidebarMenu>
        </SidebarGroup>
    );
}

function ManagerNav() {
    const { url } = usePage();

    const items = [
        { title: 'Manager Dashboard', href: '/manager/dashboard', icon: LayoutGrid },
        { title: 'Articles',          href: '/articles',          icon: Newspaper  },
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
