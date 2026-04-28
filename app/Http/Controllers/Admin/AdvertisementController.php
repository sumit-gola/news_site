<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Advertisement;
use App\Models\AdSchedule;
use App\Models\AdVariant;
use App\Repositories\AdvertisementRepository;
use App\Services\AdAnalyticsService;
use App\Services\AdServingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdvertisementController extends Controller
{
    public function __construct(
        private readonly AdvertisementRepository $repository,
        private readonly AdAnalyticsService      $analytics,
        private readonly AdServingService        $serving,
    ) {}

    // ─── Admin List ──────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Advertisement::class);

        $filters = $request->only(['search', 'status', 'ad_type', 'placement', 'device', 'trashed']);

        return Inertia::render('admin/advertisements/index', [
            'advertisements' => $this->repository->paginatedForAdmin($filters),
            'stats'          => $this->repository->statsSnapshot(),
            'filters'        => $filters,
        ]);
    }

    // ─── Analytics Dashboard ─────────────────────────────────────────────────

    public function analytics(Request $request): Response
    {
        $this->authorize('viewAny', Advertisement::class);

        $from = Carbon::parse($request->input('date_from', now()->subDays(29)->toDateString()))->startOfDay();
        $to   = Carbon::parse($request->input('date_to', now()->toDateString()))->endOfDay();

        return Inertia::render('admin/advertisements/analytics', [
            'summary'       => $this->analytics->summary($from, $to),
            'timeSeries'    => $this->analytics->timeSeries($from, $to),
            'topPerformers' => $this->analytics->topPerformers($from, $to),
            'byPlacement'   => $this->analytics->byPlacement($from, $to),
            'filters'       => ['date_from' => $from->toDateString(), 'date_to' => $to->toDateString()],
        ]);
    }

    // ─── CRUD ────────────────────────────────────────────────────────────────

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Advertisement::class);

        $validated = $this->validateAd($request);
        $mediaUrl  = $this->handleMediaUpload($request);

        $ad = Advertisement::create([
            ...$validated,
            'media_url'  => $mediaUrl ?? $validated['media_url'] ?? null,
            'created_by' => auth()->id(),
        ]);

        $this->syncSchedule($ad, $request);
        $this->syncVariants($ad, $request);

        $this->serving->flushCache();
        ActivityLog::record('created', "Created advertisement \"{$ad->title}\"", $ad);

        return back()->with('success', 'Advertisement created successfully.');
    }

    public function update(Request $request, Advertisement $advertisement): RedirectResponse
    {
        $this->authorize('update', Advertisement::class);

        $validated = $this->validateAd($request, $advertisement->id);

        if ($request->hasFile('media_file')) {
            $this->deleteLocalMedia($advertisement->media_url);
            $validated['media_url'] = $this->handleMediaUpload($request);
        } elseif ($request->boolean('remove_media')) {
            $this->deleteLocalMedia($advertisement->media_url);
            $validated['media_url'] = null;
        }

        $before = $advertisement->only(['title', 'status', 'placement_type', 'ad_type']);
        $advertisement->update($validated);

        $this->syncSchedule($advertisement, $request);
        $this->syncVariants($advertisement, $request);

        $this->serving->flushCache();
        ActivityLog::record('updated', "Updated advertisement \"{$advertisement->title}\"", $advertisement, [
            'before' => $before,
            'after'  => $advertisement->only(['title', 'status', 'placement_type', 'ad_type']),
        ]);

        return back()->with('success', 'Advertisement updated successfully.');
    }

    public function destroy(Advertisement $advertisement): RedirectResponse
    {
        $this->authorize('delete', Advertisement::class);

        $title = $advertisement->title;
        ActivityLog::record('deleted', "Deleted advertisement \"{$title}\"", $advertisement);
        $advertisement->delete();

        $this->serving->flushCache();
        return back()->with('success', 'Advertisement deleted.');
    }

    public function restore(int $id): RedirectResponse
    {
        $this->authorize('delete', Advertisement::class);

        $ad = $this->repository->findTrashed($id);
        $ad->restore();

        $this->serving->flushCache();
        ActivityLog::record('restored', "Restored advertisement \"{$ad->title}\"", $ad);

        return back()->with('success', 'Advertisement restored.');
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $this->authorize('delete', Advertisement::class);

        $request->validate([
            'ids'   => ['required', 'array'],
            'ids.*' => ['integer', 'exists:advertisements,id'],
        ]);

        Advertisement::whereIn('id', $request->ids)->each(function (Advertisement $ad) {
            ActivityLog::record('deleted', "Bulk deleted advertisement \"{$ad->title}\"", $ad);
        });

        Advertisement::whereIn('id', $request->ids)->delete();
        $this->serving->flushCache();

        return back()->with('success', count($request->ids).' advertisements deleted.');
    }

    public function toggleStatus(Advertisement $advertisement): RedirectResponse
    {
        $this->authorize('update', Advertisement::class);

        $advertisement->update([
            'status' => $advertisement->status === 'active' ? 'inactive' : 'active',
        ]);

        $this->serving->flushCache();
        ActivityLog::record('updated', "Toggled status for \"{$advertisement->title}\" to {$advertisement->status}", $advertisement);

        return back()->with('success', 'Status updated.');
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private function validateAd(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'title'                   => ['required', 'string', 'max:255'],
            'description'             => ['nullable', 'string', 'max:1000'],
            'ad_type'                 => ['required', Rule::in(['fixed', 'closable', 'floating', 'popup', 'inline', 'sticky'])],
            'media_file'              => ['nullable', 'file', 'mimes:jpeg,jpg,png,gif,webp,mp4,webm', 'max:20480'],
            'media_type'              => ['required', Rule::in(['image', 'video', 'html', 'script'])],
            'embed_code'              => ['nullable', 'string'],
            'redirect_url'            => ['required', 'url', 'max:2048'],
            'cta_label'               => ['nullable', 'string', 'max:80'],
            'bg_color'                => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'placement_type'          => ['required', Rule::in(['header', 'sidebar', 'inline', 'footer', 'popup'])],
            'device_target'           => ['required', Rule::in(['all', 'desktop', 'tablet', 'mobile'])],
            'float_position'          => ['nullable', Rule::in(['bottom-right', 'bottom-left', 'top-right', 'top-left'])],
            'float_animation'         => ['nullable', Rule::in(['slide', 'fade', 'bounce'])],
            'popup_delay_seconds'     => ['integer', 'min:0', 'max:60'],
            'popup_frequency_minutes' => ['nullable', 'integer', 'min:1', 'max:1440'],
            'sticky_offset_px'        => ['integer', 'min:0', 'max:9999'],
            'start_datetime'          => ['nullable', 'date'],
            'end_datetime'            => ['nullable', 'date', 'after:start_datetime'],
            'status'                  => ['required', Rule::in(['active', 'inactive', 'draft'])],
            'priority'                => ['required', 'integer', 'min:0', 'max:9999'],
            'is_dismissible'          => ['boolean'],
            'ab_testing_enabled'      => ['boolean'],
            // Schedule
            'schedule.days_of_week'   => ['nullable', 'array'],
            'schedule.days_of_week.*' => ['integer', 'min:0', 'max:6'],
            'schedule.time_from'      => ['nullable', 'date_format:H:i'],
            'schedule.time_to'        => ['nullable', 'date_format:H:i'],
            'schedule.timezone'       => ['nullable', 'string', 'max:50'],
            // Variants
            'variants'                => ['nullable', 'array', 'max:2'],
            'variants.*.label'        => ['required', 'string', 'in:A,B'],
            'variants.*.media_url'    => ['nullable', 'string'],
            'variants.*.cta_label'   => ['nullable', 'string', 'max:80'],
            'variants.*.weight'       => ['required', 'integer', 'min:1', 'max:99'],
        ]);
    }

    private function syncSchedule(Advertisement $ad, Request $request): void
    {
        $scheduleData = $request->input('schedule', []);

        if (empty(array_filter($scheduleData))) {
            $ad->schedule()->delete();
            return;
        }

        $ad->schedule()->updateOrCreate(
            ['advertisement_id' => $ad->id],
            [
                'days_of_week' => $scheduleData['days_of_week'] ?? null,
                'time_from'    => $scheduleData['time_from']    ?? null,
                'time_to'      => $scheduleData['time_to']      ?? null,
                'timezone'     => $scheduleData['timezone']     ?? 'UTC',
            ]
        );
    }

    private function syncVariants(Advertisement $ad, Request $request): void
    {
        if (!$request->boolean('ab_testing_enabled')) {
            $ad->variants()->delete();
            return;
        }

        $variants = $request->input('variants', []);

        foreach ($variants as $v) {
            $ad->variants()->updateOrCreate(
                ['advertisement_id' => $ad->id, 'label' => $v['label']],
                [
                    'media_url'  => $v['media_url']  ?? null,
                    'embed_code' => $v['embed_code'] ?? null,
                    'cta_label'  => $v['cta_label']  ?? null,
                    'weight'     => $v['weight']      ?? 50,
                ]
            );
        }
    }

    private function handleMediaUpload(Request $request): ?string
    {
        if (!$request->hasFile('media_file')) return null;
        return $request->file('media_file')->store('advertisements', 'public');
    }

    private function deleteLocalMedia(?string $url): void
    {
        if ($url && !str_starts_with($url, 'http')) {
            Storage::disk('public')->delete($url);
        }
    }
}
