<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

#[Fillable(['name', 'email', 'password', 'status'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at'      => 'datetime',
            'password'               => 'hashed',
            'two_factor_confirmed_at'=> 'datetime',
        ];
    }

    // ─── RBAC Relationships ────────────────────────────────────────────────────

    /**
     * Roles assigned to this user.
     */
    public function roles(): BelongsToMany
    {
        return $this->morphToMany(Role::class, 'model', 'model_has_roles');
    }

    /**
     * Direct permissions assigned to this user.
     */
    public function permissions(): BelongsToMany
    {
        return $this->morphToMany(Permission::class, 'model', 'model_has_permissions');
    }

    /**
     * Articles authored by this user.
     */
    public function articles(): HasMany
    {
        return $this->hasMany(Article::class, 'user_id');
    }

    // ─── RBAC Helpers ─────────────────────────────────────────────────────────

    /**
     * Assign one or more roles by name.
     */
    public function assignRole(string|array $roles): void
    {
        $roleIds = Role::whereIn('name', (array) $roles)->pluck('id');
        $this->roles()->syncWithoutDetaching($roleIds);
    }

    /**
     * Remove a role by name.
     */
    public function removeRole(string $role): void
    {
        $roleModel = Role::where('name', $role)->first();
        if ($roleModel) {
            $this->roles()->detach($roleModel->id);
        }
    }

    /**
     * Sync roles (replaces all existing roles).
     */
    public function syncRoles(array $roleNames): void
    {
        $roleIds = Role::whereIn('name', $roleNames)->pluck('id');
        $this->roles()->sync($roleIds);
    }

    /**
     * Check if the user has a specific role.
     */
    public function hasRole(string|array $roles): bool
    {
        $this->loadMissing('roles');
        return $this->roles->whereIn('name', (array) $roles)->isNotEmpty();
    }

    /**
     * Check if user has any of the given permissions (direct or via roles).
     */
    public function hasPermission(string $permission): bool
    {
        // Direct user permission
        $this->loadMissing('permissions');
        if ($this->permissions->contains('name', $permission)) {
            return true;
        }

        // Via roles
        $this->loadMissing('roles.permissions');
        foreach ($this->roles as $role) {
            if ($role->permissions->contains('name', $permission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get the user's primary role (first assigned).
     */
    public function getPrimaryRoleAttribute(): ?Role
    {
        $this->loadMissing('roles');
        return $this->roles->first();
    }

    /**
     * Check if user is an admin.
     */
    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    /**
     * Check if user is a manager.
     */
    public function isManager(): bool
    {
        return $this->hasRole('manager');
    }

    /**
     * Scope a query to users with the given role.
     */
    public function scopeRole(Builder $query, string $roleName)
    {
        return $query->whereHas('roles', fn ($q) => $q->where('name', $roleName));
    }

    /**
     * Check if user is a reporter.
     */
    public function isReporter(): bool
    {
        return $this->hasRole('reporter');
    }

    /**
     * Check if user account is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
