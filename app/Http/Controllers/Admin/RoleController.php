<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    /**
     * List roles with their permissions.
     */
    public function index(): Response
    {
        return Inertia::render('admin/roles/index', [
            'roles'       => Role::with('permissions')->withCount('users')->get(),
            'permissions' => Permission::grouped(),
        ]);
    }

    /**
     * Create a new role.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'         => ['required', 'string', 'max:50', 'unique:roles', 'regex:/^[a-z_]+$/'],
            'display_name' => ['required', 'string', 'max:100'],
            'description'  => ['nullable', 'string', 'max:255'],
            'color'        => ['required', 'string', 'in:red,blue,green,yellow,purple,gray,orange'],
            'permissions'  => ['nullable', 'array'],
            'permissions.*'=> ['string', 'exists:permissions,name'],
        ]);

        $role = Role::create([
            'name'         => $validated['name'],
            'display_name' => $validated['display_name'],
            'description'  => $validated['description'] ?? null,
            'color'        => $validated['color'],
        ]);

        if (! empty($validated['permissions'])) {
            $role->syncPermissionsByName($validated['permissions']);
        }

        return back()->with('success', 'Role created successfully.');
    }

    /**
     * Update role details and permissions.
     */
    public function update(Request $request, Role $role): RedirectResponse
    {
        $validated = $request->validate([
            'display_name' => ['required', 'string', 'max:100'],
            'description'  => ['nullable', 'string', 'max:255'],
            'color'        => ['required', 'string', 'in:red,blue,green,yellow,purple,gray,orange'],
            'permissions'  => ['nullable', 'array'],
            'permissions.*'=> ['string', 'exists:permissions,name'],
        ]);

        $role->update([
            'display_name' => $validated['display_name'],
            'description'  => $validated['description'] ?? null,
            'color'        => $validated['color'],
        ]);

        $role->syncPermissionsByName($validated['permissions'] ?? []);

        return back()->with('success', 'Role updated successfully.');
    }

    /**
     * Delete a role (cannot delete core roles).
     */
    public function destroy(Role $role): RedirectResponse
    {
        if (in_array($role->name, ['admin', 'manager', 'reporter'])) {
            return back()->with('error', 'Cannot delete system roles.');
        }

        $role->delete();

        return back()->with('success', 'Role deleted successfully.');
    }
}
