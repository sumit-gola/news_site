<?php

namespace App\Policies;

use App\Models\Article;
use App\Models\User;

/**
 * ArticlePolicy — enforces granular authorization for article operations.
 *
 * Operations are controlled by roles:
 * - Reporter: create, edit own, submit for approval, view own
 * - Manager: view pending/published, approve/reject, view all
 * - Admin: full control (bypassed in before())
 */
class ArticlePolicy
{
    /**
     * Admins bypass all policy checks.
     */
    public function before(User $user): ?bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return null; // fall through to methods
    }

    /**
     * Determine if user can view the article index.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasRole(['reporter', 'manager']);
    }

    /**
     * Determine if user can view a specific article.
     */
    public function view(User $user, Article $article): bool
    {
        // Reporters see their own articles + published
        if ($user->isReporter()) {
            return $article->user_id === $user->id || $article->isPublished();
        }

        // Managers see pending, published, and rejected
        if ($user->isManager()) {
            return in_array($article->status, ['pending', 'published', 'rejected']);
        }

        return false;
    }

    /**
     * Determine if user can create an article.
     */
    public function create(User $user): bool
    {
        return $user->hasRole(['reporter', 'manager']);
    }

    /**
     * Determine if user can update an article.
     */
    public function update(User $user, Article $article): bool
    {
        // Reporters can only edit their own draft/rejected articles
        if ($user->isReporter()) {
            return $article->user_id === $user->id && in_array($article->status, ['draft', 'rejected']);
        }

        // Managers can edit any non-published article
        if ($user->isManager()) {
            return !$article->isPublished();
        }

        return false;
    }

    /**
     * Determine if user can delete an article.
     */
    public function delete(User $user, Article $article): bool
    {
        // Reporters can only delete their own draft articles
        if ($user->isReporter()) {
            return $article->user_id === $user->id && $article->isDraft();
        }

        // Managers can delete non-published articles
        if ($user->isManager()) {
            return !$article->isPublished();
        }

        return false;
    }

    /**
     * Determine if user can submit article for approval.
     */
    public function submitForApproval(User $user, Article $article): bool
    {
        return $user->isReporter() && $article->user_id === $user->id && $article->isDraft();
    }

    /**
     * Determine if user can approve an article.
     */
    public function approve(User $user, Article $article): bool
    {
        return $user->isManager() && $article->isPending();
    }

    /**
     * Determine if user can reject an article.
     */
    public function reject(User $user, Article $article): bool
    {
        return $user->isManager() && $article->isPending();
    }

    /**
     * Determine if user can publish an article directly (draft → published).
     */
    public function publish(User $user, Article $article): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine if user can restore a deleted article.
     */
    public function restore(User $user, Article $article): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine if user can permanently delete an article.
     */
    public function forceDelete(User $user, Article $article): bool
    {
        return $user->isAdmin();
    }
}
