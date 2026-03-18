<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Permissions ────────────────────────────────────────────────────
        $permissions = [
            // Users
            ['name' => 'users.view',   'display_name' => 'View Users',   'group' => 'users'],
            ['name' => 'users.create', 'display_name' => 'Create Users', 'group' => 'users'],
            ['name' => 'users.edit',   'display_name' => 'Edit Users',   'group' => 'users'],
            ['name' => 'users.delete', 'display_name' => 'Delete Users', 'group' => 'users'],

            // Roles
            ['name' => 'roles.view',   'display_name' => 'View Roles',         'group' => 'roles'],
            ['name' => 'roles.create', 'display_name' => 'Create Roles',       'group' => 'roles'],
            ['name' => 'roles.edit',   'display_name' => 'Edit Roles',         'group' => 'roles'],
            ['name' => 'roles.delete', 'display_name' => 'Delete Roles',       'group' => 'roles'],
            ['name' => 'roles.assign', 'display_name' => 'Assign Roles',       'group' => 'roles'],

            // Articles
            ['name' => 'articles.view',    'display_name' => 'View Articles',    'group' => 'articles'],
            ['name' => 'articles.create',  'display_name' => 'Create Articles',  'group' => 'articles'],
            ['name' => 'articles.edit',    'display_name' => 'Edit Any Article', 'group' => 'articles'],
            ['name' => 'articles.delete',  'display_name' => 'Delete Articles',  'group' => 'articles'],
            ['name' => 'articles.approve', 'display_name' => 'Approve Articles', 'group' => 'articles'],
            ['name' => 'articles.publish', 'display_name' => 'Publish Articles', 'group' => 'articles'],

            // Categories
            ['name' => 'categories.view',   'display_name' => 'View Categories',   'group' => 'categories'],
            ['name' => 'categories.create', 'display_name' => 'Create Categories', 'group' => 'categories'],
            ['name' => 'categories.edit',   'display_name' => 'Edit Categories',   'group' => 'categories'],
            ['name' => 'categories.delete', 'display_name' => 'Delete Categories', 'group' => 'categories'],

            // Media
            ['name' => 'media.upload', 'display_name' => 'Upload Media', 'group' => 'media'],
            ['name' => 'media.delete', 'display_name' => 'Delete Media', 'group' => 'media'],

            // Analytics
            ['name' => 'analytics.view', 'display_name' => 'View Analytics', 'group' => 'analytics'],
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm['name']], $perm);
        }

        // ── 2. Roles ──────────────────────────────────────────────────────────
        $admin = Role::firstOrCreate(['name' => 'admin'], [
            'display_name' => 'Admin',
            'description'  => 'Full system access',
            'color'        => 'red',
        ]);

        $manager = Role::firstOrCreate(['name' => 'manager'], [
            'display_name' => 'Manager',
            'description'  => 'Manage reporters and approve content',
            'color'        => 'blue',
        ]);

        $reporter = Role::firstOrCreate(['name' => 'reporter'], [
            'display_name' => 'Reporter',
            'description'  => 'Create and submit articles',
            'color'        => 'green',
        ]);

        // ── 3. Assign Permissions to Roles ────────────────────────────────────

        // Admin gets everything
        $admin->syncPermissionsByName(Permission::pluck('name')->all());

        // Manager permissions
        $manager->syncPermissionsByName([
            'users.view',
            'articles.view', 'articles.edit', 'articles.approve', 'articles.publish', 'articles.delete',
            'categories.view', 'categories.create', 'categories.edit',
            'media.upload', 'media.delete',
            'analytics.view',
        ]);

        // Reporter permissions
        $reporter->syncPermissionsByName([
            'articles.view', 'articles.create',
            'categories.view',
            'media.upload',
        ]);

        // ── 4. Default Users ──────────────────────────────────────────────────
        $adminUser = User::firstOrCreate(['email' => 'admin@newsportal.com'], [
            'name'     => 'Admin User',
            'password' => Hash::make('password'),
            'status'   => 'active',
        ]);
        $adminUser->syncRoles(['admin']);

        $managerUser = User::firstOrCreate(['email' => 'manager@newsportal.com'], [
            'name'     => 'Manager User',
            'password' => Hash::make('password'),
            'status'   => 'active',
        ]);
        $managerUser->syncRoles(['manager']);

        $reporterUser = User::firstOrCreate(['email' => 'reporter@newsportal.com'], [
            'name'     => 'Reporter User',
            'password' => Hash::make('password'),
            'status'   => 'active',
        ]);
        $reporterUser->syncRoles(['reporter']);

        $this->command->info('Roles, permissions and default users seeded successfully.');
    }
}
