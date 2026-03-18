import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Loader2,
    MoreHorizontal,
    Pencil,
    Plus,
    Shield,
    ShieldCheck,
    Trash2,
    Users,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast, ToastProvider } from '@/components/ui/toast';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Permission, Role } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Roles & Permissions', href: '/admin/roles' },
];

const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'gray', 'orange'] as const;

const colorClass: Record<string, string> = {
    red:    'bg-red-100    text-red-700    border-red-200',
    blue:   'bg-blue-100   text-blue-700   border-blue-200',
    green:  'bg-green-100  text-green-700  border-green-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    gray:   'bg-gray-100   text-gray-700   border-gray-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
};

// ── Role Form Modal ───────────────────────────────────────────────────────────
function RoleFormModal({
    open,
    onClose,
    editRole,
    permissions,
}: {
    open: boolean;
    onClose: () => void;
    editRole: Role | null;
    permissions: Record<string, Permission[]>;
}) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name:         editRole?.name ?? '',
        display_name: editRole?.display_name ?? '',
        description:  editRole?.description ?? '',
        color:        editRole?.color ?? 'blue',
        permissions:  (editRole?.permissions ?? []).map((p) => p.name),
    });

    React.useEffect(() => {
        if (open) {
            setData({
                name:         editRole?.name ?? '',
                display_name: editRole?.display_name ?? '',
                description:  editRole?.description ?? '',
                color:        editRole?.color ?? 'blue',
                permissions:  (editRole?.permissions ?? []).map((p) => p.name),
            });
        }
    }, [open, editRole]);

    const togglePermission = (name: string) => {
        setData('permissions', data.permissions.includes(name)
            ? data.permissions.filter((p) => p !== name)
            : [...data.permissions, name]
        );
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const url = editRole ? `/admin/roles/${editRole.id}` : '/admin/roles';
        const method = editRole ? put : post;

        method(url, {
            onSuccess: () => {
                toast.success(editRole ? 'Role updated.' : 'Role created.');
                reset();
                onClose();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="size-5" />
                        {editRole ? 'Edit Role' : 'Create New Role'}
                    </DialogTitle>
                    <DialogDescription>
                        {editRole ? 'Modify role details and permissions.' : 'Define a new role with specific permissions.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-5 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="name">Role Name <span className="text-muted-foreground">(slug)</span></Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                                placeholder="content_editor"
                                disabled={!!editRole}
                            />
                            {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="display_name">Display Name</Label>
                            <Input
                                id="display_name"
                                value={data.display_name}
                                onChange={(e) => setData('display_name', e.target.value)}
                                placeholder="Content Editor"
                            />
                            {errors.display_name && <p className="text-destructive text-xs">{errors.display_name}</p>}
                        </div>
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Brief description of what this role can do"
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <Label>Badge Color</Label>
                        <div className="flex flex-wrap gap-2">
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setData('color', c)}
                                    className={`rounded-md border px-3 py-1 text-xs font-medium capitalize transition-all ${colorClass[c]} ${data.color === c ? 'ring-2 ring-offset-1 ring-current' : 'opacity-60'}`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Permissions grouped by category */}
                    <div className="grid gap-2">
                        <Label>Permissions</Label>
                        <div className="border rounded-lg max-h-64 overflow-y-auto">
                            {Object.entries(permissions).map(([group, perms]) => (
                                <div key={group} className="border-b last:border-b-0 p-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 capitalize">
                                        {group}
                                    </p>
                                    <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 sm:grid-cols-3">
                                        {perms.map((perm) => (
                                            <label
                                                key={perm.id}
                                                className="flex items-center gap-2 cursor-pointer"
                                            >
                                                <Checkbox
                                                    checked={data.permissions.includes(perm.name)}
                                                    onCheckedChange={() => togglePermission(perm.name)}
                                                />
                                                <span className="text-sm">{perm.display_name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-muted-foreground text-xs">
                            {data.permissions.length} permission{data.permissions.length !== 1 ? 's' : ''} selected
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                            {editRole ? 'Save Changes' : 'Create Role'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ── Delete Role Dialog ────────────────────────────────────────────────────────
function DeleteRoleDialog({
    open,
    onClose,
    role,
}: {
    open: boolean;
    onClose: () => void;
    role: Role | null;
}) {
    const [processing, setProcessing] = React.useState(false);

    const handleDelete = () => {
        if (!role) return;
        setProcessing(true);
        router.delete(`/admin/roles/${role.id}`, {
            onSuccess: () => {
                toast.success('Role deleted.');
                onClose();
            },
            onError: (e) => toast.error(e.message ?? 'Cannot delete this role.'),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-destructive flex items-center gap-2">
                        <Trash2 className="size-5" />
                        Delete Role
                    </DialogTitle>
                    <DialogDescription>
                        Delete <strong>{role?.display_name}</strong>? Users with this role will lose it. System roles (Admin, Manager, Reporter) cannot be deleted.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
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
interface PageProps {
    roles: (Role & { users_count: number })[];
    permissions: Record<string, Permission[]>;
}

export default function RolesIndex({ roles, permissions }: PageProps) {
    const { props } = usePage<{ flash: { success?: string; error?: string } }>();

    React.useEffect(() => {
        if (props.flash?.success) toast.success(props.flash.success);
        if (props.flash?.error) toast.error(props.flash.error);
    }, [props.flash]);

    const [modalOpen, setModalOpen] = React.useState(false);
    const [editRole, setEditRole] = React.useState<Role | null>(null);
    const [deleteRole, setDeleteRole] = React.useState<Role | null>(null);
    const [activeTab, setActiveTab] = React.useState('roles');

    const totalPermissions = Object.values(permissions).flat().length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles & Permissions" />
            <ToastProvider />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
                        <p className="text-muted-foreground text-sm">
                            {roles.length} roles · {totalPermissions} permissions defined
                        </p>
                    </div>
                    <Button onClick={() => { setEditRole(null); setModalOpen(true); }}>
                        <Plus className="mr-1.5 size-4" />
                        New Role
                    </Button>
                </div>

                <Tabs defaultValue="roles">
                    <TabsList>
                        <TabsTrigger value="roles">
                            <Shield className="mr-1.5 size-4" />
                            Roles
                        </TabsTrigger>
                        <TabsTrigger value="permissions">
                            <ShieldCheck className="mr-1.5 size-4" />
                            All Permissions
                        </TabsTrigger>
                    </TabsList>

                    {/* Roles Tab */}
                    <TabsContent value="roles" className="mt-4">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {roles.map((role) => (
                                <div
                                    key={role.id}
                                    className="rounded-xl border bg-card p-5 shadow-xs transition-shadow hover:shadow-md"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex flex-col gap-1">
                                            <span
                                                className={`inline-flex w-fit items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold ${colorClass[role.color] ?? colorClass.gray}`}
                                            >
                                                <Shield className="size-3" />
                                                {role.display_name}
                                            </span>
                                            {role.description && (
                                                <p className="text-muted-foreground text-xs mt-1">{role.description}</p>
                                            )}
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="-mt-1 -mr-1">
                                                    <MoreHorizontal className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => { setEditRole(role); setModalOpen(true); }}
                                                >
                                                    <Pencil className="mr-2 size-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => setDeleteRole(role)}
                                                    disabled={['admin','manager','reporter'].includes(role.name)}
                                                >
                                                    <Trash2 className="mr-2 size-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <Users className="size-3.5" />
                                            {role.users_count} user{role.users_count !== 1 ? 's' : ''}
                                        </span>
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <ShieldCheck className="size-3.5" />
                                            {role.permissions?.length ?? 0} permissions
                                        </span>
                                    </div>

                                    {/* Permission pills */}
                                    {role.permissions && role.permissions.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {role.permissions.slice(0, 6).map((p) => (
                                                <span
                                                    key={p.id}
                                                    className="bg-muted rounded px-1.5 py-0.5 text-xs text-muted-foreground"
                                                >
                                                    {p.name}
                                                </span>
                                            ))}
                                            {role.permissions.length > 6 && (
                                                <span className="text-muted-foreground text-xs">
                                                    +{role.permissions.length - 6} more
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* All Permissions Tab */}
                    <TabsContent value="permissions" className="mt-4">
                        <div className="rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Permission</TableHead>
                                        <TableHead>Key</TableHead>
                                        <TableHead>Group</TableHead>
                                        <TableHead>Assigned to Roles</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.entries(permissions).map(([group, perms]) =>
                                        perms.map((perm) => {
                                            const assignedRoles = roles.filter((r) =>
                                                r.permissions?.some((p) => p.id === perm.id)
                                            );
                                            return (
                                                <TableRow key={perm.id}>
                                                    <TableCell className="font-medium">{perm.display_name}</TableCell>
                                                    <TableCell>
                                                        <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
                                                            {perm.name}
                                                        </code>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="bg-muted rounded-md px-2 py-0.5 text-xs capitalize">
                                                            {perm.group}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1">
                                                            {assignedRoles.length === 0 ? (
                                                                <span className="text-muted-foreground text-xs">None</span>
                                                            ) : (
                                                                assignedRoles.map((r) => (
                                                                    <span
                                                                        key={r.id}
                                                                        className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium ${colorClass[r.color] ?? colorClass.gray}`}
                                                                    >
                                                                        {r.display_name}
                                                                    </span>
                                                                ))
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <RoleFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                editRole={editRole}
                permissions={permissions}
            />
            <DeleteRoleDialog
                open={!!deleteRole}
                onClose={() => setDeleteRole(null)}
                role={deleteRole}
            />
        </AppLayout>
    );
}
