<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * List users with role/status filters and pagination.
     */
    public function index(Request $request): Response
    {
        $query = User::with('roles')
            ->when($request->search, fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            }))
            ->when($request->role, fn ($q) => $q->whereHas('roles', fn ($r) => $r->where('name', $request->role)))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest();

        return Inertia::render('admin/users/index', [
            'users'   => $query->paginate(10)->withQueryString(),
            'roles'   => Role::all(),
            'filters' => $request->only(['search', 'role', 'status']),
        ]);
    }

    /**
     * Create a new user.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role'     => ['required', 'string', 'exists:roles,name'],
            'status'   => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'status'   => $validated['status'],
        ]);

        $user->assignRole($validated['role']);

        ActivityLog::record('created', "Created user {$user->name}", $user, [
            'name'  => $user->name,
            'email' => $user->email,
            'role'  => $validated['role'],
        ]);

        return back()->with('success', 'User created successfully.');
    }

    /**
     * Update an existing user.
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'role'     => ['required', 'string', 'exists:roles,name'],
            'status'   => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $before = ['name' => $user->name, 'email' => $user->email, 'status' => $user->status];

        $user->update([
            'name'   => $validated['name'],
            'email'  => $validated['email'],
            'status' => $validated['status'],
        ]);

        if ($validated['password']) {
            $user->update(['password' => Hash::make($validated['password'])]);
        }

        $user->syncRoles([$validated['role']]);

        ActivityLog::record('updated', "Updated user {$user->name}", $user, [
            'before' => $before,
            'after'  => ['name' => $user->name, 'email' => $user->email, 'status' => $user->status],
        ]);

        return back()->with('success', 'User updated successfully.');
    }

    /**
     * Delete a user.
     */
    public function destroy(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $name = $user->name;
        ActivityLog::record('deleted', "Deleted user {$name}", $user);
        $user->delete();

        return back()->with('success', 'User deleted successfully.');
    }

    /**
     * Bulk delete users.
     */
    public function bulkDestroy(Request $request): RedirectResponse
    {
        $request->validate([
            'ids'   => ['required', 'array'],
            'ids.*' => ['integer', 'exists:users,id'],
        ]);

        $ids = array_filter($request->ids, fn ($id) => $id !== auth()->id());

        User::whereIn('id', $ids)->each(function (User $user) {
            ActivityLog::record('deleted', "Bulk deleted user {$user->name}", $user);
        });

        User::whereIn('id', $ids)->delete();

        return back()->with('success', count($ids).' users deleted.');
    }

    /**
     * Toggle user status (active ↔ inactive).
     */
    public function toggleStatus(User $user): RedirectResponse
    {
        $user->update(['status' => $user->status === 'active' ? 'inactive' : 'active']);
        ActivityLog::record('updated', "Toggled status for {$user->name} to {$user->status}", $user);

        return back()->with('success', 'User status updated.');
    }
}
