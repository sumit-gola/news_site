<?php

namespace App\Policies;

use App\Models\Page;
use App\Models\User;

/**
 * PagePolicy — admins and managers can manage all pages.
 * Admins bypass everything via before().
 */
class PagePolicy
{
    public function before(User $user): ?bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return $user->hasRole(['manager', 'admin']);
    }

    public function view(User $user, Page $page): bool
    {
        return $user->hasRole(['manager', 'admin']);
    }

    public function create(User $user): bool
    {
        return $user->hasRole(['manager', 'admin']);
    }

    public function update(User $user, Page $page): bool
    {
        return $user->hasRole(['manager', 'admin']);
    }

    public function delete(User $user, Page $page): bool
    {
        return $user->hasRole(['manager', 'admin']);
    }

    public function restore(User $user, Page $page): bool
    {
        return $user->isAdmin();
    }

    public function forceDelete(User $user, Page $page): bool
    {
        return $user->isAdmin();
    }

    public function duplicate(User $user, Page $page): bool
    {
        return $user->hasRole(['manager', 'admin']);
    }
}
