<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Advertisement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdvertisementController extends Controller
{
    /**
     * List advertisements with filters and pagination.
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Advertisement::class);

        $query = Advertisement::with('creator:id,name')
            ->when($request->search, fn ($q) => $q->where('title', 'like', "%{$request->search}%"))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->placement, fn ($q) => $q->where('placement_type', $request->placement))
            ->when($request->device, fn ($q) => $q->where('device_target', $request->device))
            ->when($request->date_from, fn ($q) => $q->where('start_datetime', '>=', $request->date_from))
            ->when($request->date_to, fn ($q) => $q->where('end_datetime', '<=', $request->date_to))
            ->orderByDesc('priority')
            ->orderByDesc('created_at');

        $stats = [
            'total'     => Advertisement::count(),
            'active'    => Advertisement::where('status', 'active')->count(),
            'draft'     => Advertisement::where('status', 'draft')->count(),
            'inactive'  => Advertisement::where('status', 'inactive')->count(),
        ];

        return Inertia::render('admin/advertisements/index', [
            'advertisements' => $query->paginate(15)->withQueryString(),
            'stats'          => $stats,
            'filters'        => $request->only(['search', 'status', 'placement', 'device', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Create a new advertisement.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Advertisement::class);

        $validated = $this->validateAd($request);

        $mediaUrl = $this->handleMediaUpload($request);

        $ad = Advertisement::create([
            ...$validated,
            'media_url'  => $mediaUrl,
            'created_by' => auth()->id(),
        ]);

        ActivityLog::record('created', "Created advertisement \"{$ad->title}\"", $ad, [
            'title'          => $ad->title,
            'placement_type' => $ad->placement_type,
            'status'         => $ad->status,
        ]);

        return back()->with('success', 'Advertisement created successfully.');
    }

    /**
     * Update an existing advertisement.
     */
    public function update(Request $request, Advertisement $advertisement): RedirectResponse
    {
        $this->authorize('update', Advertisement::class);

        $validated = $this->validateAd($request, $advertisement->id);

        if ($request->hasFile('media_file')) {
            // Remove old file if it's a local path
            if ($advertisement->media_url && !str_starts_with($advertisement->media_url, 'http')) {
                Storage::disk('public')->delete($advertisement->media_url);
            }
            $validated['media_url'] = $this->handleMediaUpload($request);
        } elseif ($request->boolean('remove_media')) {
            if ($advertisement->media_url && !str_starts_with($advertisement->media_url, 'http')) {
                Storage::disk('public')->delete($advertisement->media_url);
            }
            $validated['media_url'] = null;
        }

        $before = $advertisement->only(['title', 'status', 'placement_type']);
        $advertisement->update($validated);

        ActivityLog::record('updated', "Updated advertisement \"{$advertisement->title}\"", $advertisement, [
            'before' => $before,
            'after'  => $advertisement->only(['title', 'status', 'placement_type']),
        ]);

        return back()->with('success', 'Advertisement updated successfully.');
    }

    /**
     * Delete an advertisement.
     */
    public function destroy(Advertisement $advertisement): RedirectResponse
    {
        $this->authorize('delete', Advertisement::class);

        $title = $advertisement->title;

        if ($advertisement->media_url && !str_starts_with($advertisement->media_url, 'http')) {
            Storage::disk('public')->delete($advertisement->media_url);
        }

        ActivityLog::record('deleted', "Deleted advertisement \"{$title}\"", $advertisement);
        $advertisement->delete();

        return back()->with('success', 'Advertisement deleted successfully.');
    }

    /**
     * Bulk delete advertisements.
     */
    public function bulkDestroy(Request $request): RedirectResponse
    {
        $this->authorize('delete', Advertisement::class);

        $request->validate([
            'ids'   => ['required', 'array'],
            'ids.*' => ['integer', 'exists:advertisements,id'],
        ]);

        Advertisement::whereIn('id', $request->ids)->each(function (Advertisement $ad) {
            if ($ad->media_url && !str_starts_with($ad->media_url, 'http')) {
                Storage::disk('public')->delete($ad->media_url);
            }
            ActivityLog::record('deleted', "Bulk deleted advertisement \"{$ad->title}\"", $ad);
        });

        Advertisement::whereIn('id', $request->ids)->delete();

        return back()->with('success', count($request->ids).' advertisements deleted.');
    }

    /**
     * Toggle status: active ↔ inactive.
     */
    public function toggleStatus(Advertisement $advertisement): RedirectResponse
    {
        $this->authorize('update', Advertisement::class);

        $advertisement->update([
            'status' => $advertisement->status === 'active' ? 'inactive' : 'active',
        ]);

        ActivityLog::record('updated', "Toggled status for \"{$advertisement->title}\" to {$advertisement->status}", $advertisement);

        return back()->with('success', 'Advertisement status updated.');
    }

    // ─── Private Helpers ────────────────────────────────────────────────────────

    private function validateAd(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'title'          => ['required', 'string', 'max:255'],
            'description'    => ['nullable', 'string', 'max:1000'],
            'media_file'     => ['nullable', 'file', 'mimes:jpeg,jpg,png,gif,webp,mp4,webm', 'max:20480'],
            'media_type'     => ['required', Rule::in(['image', 'video'])],
            'redirect_url'   => ['required', 'url', 'max:2048'],
            'placement_type' => ['required', Rule::in(['header', 'sidebar', 'inline', 'footer', 'popup'])],
            'device_target'  => ['required', Rule::in(['all', 'desktop', 'tablet', 'mobile'])],
            'start_datetime' => ['nullable', 'date'],
            'end_datetime'   => ['nullable', 'date', 'after:start_datetime'],
            'status'         => ['required', Rule::in(['active', 'inactive', 'draft'])],
            'priority'       => ['required', 'integer', 'min:0', 'max:9999'],
            'is_dismissible' => ['boolean'],
        ]);
    }

    private function handleMediaUpload(Request $request): ?string
    {
        if (!$request->hasFile('media_file')) {
            return null;
        }

        return $request->file('media_file')->store('advertisements', 'public');
    }
}
