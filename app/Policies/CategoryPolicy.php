<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;

/**
 * CategoryPolicy — controls authorization for category management.
 *
 * - Admin: Full control
 * - Manager: Can manage categories (create, edit, delete)
 * - Reporter: View only
 */
class CategoryPolicy
{
    /**
     * Admins bypass all checks.
     */
    public function before(User $user): ?bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return null;
    }

    /**
     * Determine if user can view category index.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasRole(['reporter', 'manager']);
    }

    /**
     * Determine if user can view a category.
     */
    public function view(User $user, Category $category): bool
    {
        // Only active categories, or if user is manager/admin
        if (!$category->is_active && !$user->isManager()) {
            return false;
        }

        return $user->hasRole(['reporter', 'manager']);
    }

    /**
     * Determine if user can create categories.
     */
    public function create(User $user): bool
    {
        return $user->isManager();
    }

    /**
     * Determine if user can update a category.
     */
    public function update(User $user, Category $category): bool
    {
        return $user->isManager();
    }

    /**
     * Determine if user can delete a category.
     */
    public function delete(User $user, Category $category): bool
    {
        return $user->isManager();
    }

    /**
     * Determine if user can reorder categories.
     */
    public function reorder(User $user): bool
    {
        return $user->isManager();
    }
}
