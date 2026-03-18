<?php

namespace App\Policies;

use App\Models\Media;
use App\Models\User;

/**
 * MediaPolicy — enforces authorization for media file operations.
 *
 * - Reporters can upload and manage their own media
 * - Managers can view all media but can only delete their own or non-published
 * - Admins have full control
 */
class MediaPolicy
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
     * Determine if user can view media index.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasRole(['reporter', 'manager']);
    }

    /**
     * Determine if user can view a specific media file.
     */
    public function view(User $user, Media $media): bool
    {
        // Reporters see their own or media in articles they can view
        if ($user->isReporter()) {
            return $media->user_id === $user->id;
        }

        // Managers can see all media
        return $user->isManager();
    }

    /**
     * Determine if user can create (upload) media.
     */
    public function create(User $user): bool
    {
        return $user->hasRole(['reporter', 'manager']);
    }

    /**
     * Determine if user can update media metadata.
     */
    public function update(User $user, Media $media): bool
    {
        // Reporters can only update their own
        if ($user->isReporter()) {
            return $media->user_id === $user->id;
        }

        // Managers can update any
        return $user->isManager();
    }

    /**
     * Determine if user can delete media.
     *
     * Cannot delete if attached to published articles.
     */
    public function delete(User $user, Media $media): bool
    {
        // Reporters can only delete their own unused media
        if ($user->isReporter()) {
            $attachedToPublished = $media->articles()
                ->where('status', 'published')
                ->exists();

            return $media->user_id === $user->id && !$attachedToPublished;
        }

        // Managers can delete media not in published articles
        if ($user->isManager()) {
            $attachedToPublished = $media->articles()
                ->where('status', 'published')
                ->exists();

            return !$attachedToPublished;
        }

        return false;
    }

    /**
     * Determine if user can restore deleted media.
     */
    public function restore(User $user, Media $media): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine if user can permanently delete media.
     */
    public function forceDelete(User $user, Media $media): bool
    {
        return $user->isAdmin();
    }
}
