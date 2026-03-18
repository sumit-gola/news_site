import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Loader2,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Shield,
    Trash2,
    UserCog,
} from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast, ToastProvider } from '@/components/ui/toast';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Paginated, Role, User } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'User Management', href: '/admin/users' },
];

const roleBadgeClass: Record<string, string> = {
    admin:    'bg-red-100    text-red-700    border-red-200    dark:bg-red-900/30    dark:text-red-400',
    manager:  'bg-blue-100   text-blue-700   border-blue-200   dark:bg-blue-900/30   dark:text-blue-400',
    reporter: 'bg-green-100  text-green-700  border-green-200  dark:bg-green-900/30  dark:text-green-400',
};

interface PageProps {
    users: Paginated<User>;
    roles: Role[];
    filters: { search?: string; role?: string; status?: string };
}

// ── User Form Modal ───────────────────────────────────────────────────────────
function UserFormModal({
    open,
    onClose,
    editUser,
    roles,
}: {
    open: boolean;
    onClose: () => void;
    editUser: User | null;
    roles: Role[];
}) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name:                  editUser?.name ?? '',
        email:                 editUser?.email ?? '',
        password:              '',
        password_confirmation: '',
        role:                  editUser?.roles?.[0]?.name ?? '',
        status:                editUser?.status ?? 'active',
    });

    React.useEffect(() => {
        if (open) {
            setData({
                name:                  editUser?.name ?? '',
                email:                 editUser?.email ?? '',
                password:              '',
                password_confirmation: '',
                role:                  editUser?.roles?.[0]?.name ?? '',
                status:                editUser?.status ?? 'active',
            });
        }
    }, [open, editUser]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const url = editUser ? `/admin/users/${editUser.id}` : '/admin/users';
        const method = editUser ? put : post;

        method(url, {
            onSuccess: () => {
                toast.success(editUser ? 'User updated.' : 'User created.');
                reset();
                onClose();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserCog className="size-5" />
                        {editUser ? 'Edit User' : 'Add New User'}
                    </DialogTitle>
                    <DialogDescription>
                        {editUser ? 'Update user details and role.' : 'Create a new user account.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4 py-2">
                    <div className="grid gap-1.5">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="John Doe"
                        />
                        {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="john@example.com"
                        />
                        {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="password">
                            Password {editUser && <span className="text-muted-foreground">(leave blank to keep)</span>}
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                        />
                        {errors.password && <p className="text-destructive text-xs">{errors.password}</p>}
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="password_confirmation">Confirm Password</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="role">Role</Label>
                            <select
                                id="role"
                                value={data.role}
                                onChange={(e) => setData('role', e.target.value)}
                                className="border-input bg-background text-foreground flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1"
                            >
                                <option value="">Select role</option>
                                {roles.map((r) => (
                                    <option key={r.id} value={r.name}>
                                        {r.display_name}
                                    </option>
                                ))}
                            </select>
                            {errors.role && <p className="text-destructive text-xs">{errors.role}</p>}
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value as 'active' | 'inactive')}
                                className="border-input bg-background text-foreground flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                            {editUser ? 'Save Changes' : 'Create User'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ── Delete Confirmation Dialog ────────────────────────────────────────────────
function DeleteDialog({
    open,
    onClose,
    user,
}: {
    open: boolean;
    onClose: () => void;
    user: User | null;
}) {
    const [processing, setProcessing] = React.useState(false);

    const handleDelete = () => {
        if (!user) return;
        setProcessing(true);
        router.delete(`/admin/users/${user.id}`, {
            onSuccess: () => {
                toast.success('User deleted.');
                onClose();
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 className="size-5" />
                        Delete User
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete <strong>{user?.name}</strong>? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={processing}>
                        {processing && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UsersIndex({ users, roles, filters }: PageProps) {
    const { props } = usePage<{ flash: { success?: string; error?: string } }>();

    // Show flash messages as toasts
    React.useEffect(() => {
        if (props.flash?.success) toast.success(props.flash.success);
        if (props.flash?.error) toast.error(props.flash.error);
    }, [props.flash]);

    // Filters
    const [search, setSearch] = React.useState(filters.search ?? '');
    const [roleFilter, setRoleFilter] = React.useState(filters.role ?? '');
    const [statusFilter, setStatusFilter] = React.useState(filters.status ?? '');

    const applyFilters = (overrides: Record<string, string> = {}) => {
        router.get(
            '/admin/users',
            { search, role: roleFilter, status: statusFilter, ...overrides },
            { preserveState: true, replace: true },
        );
    };

    // Modals
    const [modalOpen, setModalOpen] = React.useState(false);
    const [editUser, setEditUser] = React.useState<User | null>(null);
    const [deleteUser, setDeleteUser] = React.useState<User | null>(null);

    // Bulk selection
    const [selected, setSelected] = React.useState<number[]>([]);
    const allSelected = users.data.length > 0 && selected.length === users.data.length;

    const toggleSelectAll = () => {
        setSelected(allSelected ? [] : users.data.map((u) => u.id));
    };

    const toggleSelect = (id: number) => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const bulkDelete = () => {
        if (!selected.length) return;
        router.delete('/admin/users', {
            data: { ids: selected },
            onSuccess: () => {
                toast.success(`${selected.length} users deleted.`);
                setSelected([]);
            },
        });
    };

    const toggleStatus = (user: User) => {
        router.patch(`/admin/users/${user.id}/toggle-status`, {}, {
            onSuccess: () => toast.success(`Status updated for ${user.name}.`),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Management" />
            <ToastProvider />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                        <p className="text-muted-foreground text-sm">
                            Manage users, assign roles and control access.
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            setEditUser(null);
                            setModalOpen(true);
                        }}
                    >
                        <Plus className="mr-1.5 size-4" />
                        Add User
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search name or email..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search })}
                        />
                    </div>

                    <select
                        value={roleFilter}
                        onChange={(e) => {
                            setRoleFilter(e.target.value);
                            applyFilters({ role: e.target.value });
                        }}
                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                    >
                        <option value="">All Roles</option>
                        {roles.map((r) => (
                            <option key={r.id} value={r.name}>
                                {r.display_name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            applyFilters({ status: e.target.value });
                        }}
                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    {selected.length > 0 && (
                        <Button variant="destructive" size="sm" onClick={bulkDelete}>
                            <Trash2 className="mr-1.5 size-4" />
                            Delete {selected.length} selected
                        </Button>
                    )}
                </div>

                {/* Table */}
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10">
                                    <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                                </TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="w-14" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.data.map((user) => {
                                    const role = user.roles?.[0];
                                    return (
                                        <TableRow key={user.id} data-state={selected.includes(user.id) ? 'selected' : undefined}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selected.includes(user.id)}
                                                    onCheckedChange={() => toggleSelect(user.id)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{user.name}</span>
                                                    <span className="text-muted-foreground text-xs">{user.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {role ? (
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${roleBadgeClass[role.name] ?? 'bg-gray-100 text-gray-700'}`}
                                                    >
                                                        <Shield className="size-3" />
                                                        {role.display_name}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">No role</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={user.status === 'active'}
                                                        onCheckedChange={() => toggleStatus(user)}
                                                    />
                                                    <span
                                                        className={`text-xs font-medium ${user.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}
                                                    >
                                                        {user.status === 'active' ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="size-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setEditUser(user);
                                                                setModalOpen(true);
                                                            }}
                                                        >
                                                            <Pencil className="mr-2 size-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => setDeleteUser(user)}
                                                        >
                                                            <Trash2 className="mr-2 size-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-sm">
                            Showing {users.from}–{users.to} of {users.total} users
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                disabled={users.current_page === 1}
                                onClick={() =>
                                    router.get(`/admin/users?page=${users.current_page - 1}`, filters, {
                                        preserveState: true,
                                    })
                                }
                            >
                                <ChevronLeft className="size-4" />
                            </Button>
                            {users.links.slice(1, -1).map((link, i) => (
                                <Button
                                    key={i}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="icon"
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url &&
                                        router.get(link.url, filters, { preserveState: true })
                                    }
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                            <Button
                                variant="outline"
                                size="icon"
                                disabled={users.current_page === users.last_page}
                                onClick={() =>
                                    router.get(`/admin/users?page=${users.current_page + 1}`, filters, {
                                        preserveState: true,
                                    })
                                }
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <UserFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                editUser={editUser}
                roles={roles}
            />
            <DeleteDialog open={!!deleteUser} onClose={() => setDeleteUser(null)} user={deleteUser} />
        </AppLayout>
    );
}
