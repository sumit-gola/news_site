<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdAuditEvent;
use App\Models\AdSlot;
use App\Models\Advertisement;
use App\Models\Advertiser;
use App\Models\Category;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdvertisementController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = min(max((int) $request->integer('per_page', 15), 10), 100);
        $sortBy = (string) $request->string('sort_by', 'priority');
        $sortDir = $request->string('sort_dir', 'desc')->toString() === 'asc' ? 'asc' : 'desc';
        $allowedSort = ['priority', 'start_date', 'end_date', 'created_at', 'total_impressions', 'total_clicks', 'title'];

        $ads = Advertisement::query()
            ->with(['advertiser:id,name', 'slot:id,name'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->workflow_status, fn ($q) => $q->where('workflow_status', $request->workflow_status))
            ->when($request->ad_type, fn ($q) => $q->where('ad_type', $request->ad_type))
            ->when($request->position, fn ($q) => $q->where('position', $request->position))
            ->when($request->page, fn ($q) => $q->whereJsonContains('pages', $request->page))
            ->when($request->advertiser_id, fn ($q) => $q->where('advertiser_id', $request->integer('advertiser_id')))
            ->when($request->slot_id, fn ($q) => $q->where('ad_slot_id', $request->integer('slot_id')))
            ->when($request->has_media !== null && $request->has_media !== '', function (Builder $q) use ($request): void {
                if ($request->boolean('has_media')) {
                    $q->whereNotNull('image_path');
                } else {
                    $q->whereNull('image_path');
                }
            })
            ->when($request->is_pinned !== null && $request->is_pinned !== '', fn ($q) => $q->where('is_pinned', $request->boolean('is_pinned')))
            ->when($request->from_date, fn ($q) => $q->whereDate('start_date', '>=', $request->from_date))
            ->when($request->to_date, fn ($q) => $q->whereDate('end_date', '<=', $request->to_date))
            ->when($request->search, fn ($q) => $q->where('title', 'like', '%' . trim((string) $request->search) . '%'))
            ->when($request->display_behavior, fn ($q) => $q->where('display_behavior', $request->display_behavior))
            ->orderBy(in_array($sortBy, $allowedSort, true) ? $sortBy : 'priority', $sortDir)
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Advertisement $ad) => $this->serializeAd($ad));

        $underperforming = Advertisement::query()
            ->where('status', 'active')
            ->where('total_impressions', '>', 100)
            ->whereRaw('(CASE WHEN total_impressions > 0 THEN (total_clicks * 100.0) / total_impressions ELSE 0 END) < 0.5')
            ->count();

        $expiringSoon = Advertisement::query()
            ->where('status', 'active')
            ->whereBetween('end_date', [now(), now()->addDays(7)])
            ->count();

        return Inertia::render('admin/advertisements/Index', [
            'ads' => $ads,
            'filters' => $request->only([
                'status',
                'workflow_status',
                'ad_type',
                'position',
                'page',
                'slot_id',
                'advertiser_id',
                'from_date',
                'to_date',
                'search',
                'has_media',
                'is_pinned',
                'display_behavior',
                'sort_by',
                'sort_dir',
                'per_page',
            ]),
            'summary' => [
                'total' => Advertisement::count(),
                'active' => Advertisement::active()->count(),
                'scheduled' => Advertisement::where('status', 'active')->where('start_date', '>', now())->count(),
                'expired' => Advertisement::whereNotNull('end_date')->where('end_date', '<', now())->count(),
                'underperforming' => $underperforming,
                'expiring_soon' => $expiringSoon,
            ],
            'options' => [
                'advertisers' => Advertiser::query()->orderBy('name')->get(['id', 'name']),
                'slots' => AdSlot::query()->orderBy('name')->get(['id', 'name', 'position', 'page']),
            ],
            'presets' => [
                ['id' => 'active_home', 'label' => 'Active Homepage Ads', 'filters' => ['status' => 'active', 'page' => 'home']],
                ['id' => 'expiring_7d', 'label' => 'Expiring in 7 days', 'filters' => ['status' => 'active', 'to_date' => now()->addDays(7)->toDateString()]],
                ['id' => 'underperforming', 'label' => 'Underperforming', 'filters' => ['status' => 'active', 'sort_by' => 'total_clicks', 'sort_dir' => 'asc']],
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/advertisements/Create', [
            'advertisers' => Advertiser::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'email', 'phone']),
            'categories' => Category::query()->active()->orderBy('name')->get(['id', 'name']),
            'slots' => AdSlot::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'position', 'page']),
            'fallbackAds' => Advertisement::query()->orderBy('title')->limit(200)->get(['id', 'title']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $payload = $this->validateAndNormalize($request);
        $ad = Advertisement::create($payload);
        $this->audit($ad, 'created', ['status' => $ad->status]);

        return redirect('/admin/advertisements')->with('success', 'Advertisement created successfully.');
    }

    public function edit(Advertisement $advertisement): Response
    {
        return Inertia::render('admin/advertisements/Edit', [
            'advertisement' => [
                'id' => $advertisement->id,
                'advertiser_id' => $advertisement->advertiser_id,
                'ad_slot_id' => $advertisement->ad_slot_id,
                'title' => $advertisement->title,
                'ad_type' => $advertisement->ad_type,
                'image_path' => $advertisement->image_path,
                'html_code' => $advertisement->html_code,
                'script_code' => $advertisement->script_code,
                'target_url' => $advertisement->target_url,
                'open_in_new_tab' => (bool) $advertisement->open_in_new_tab,
                'width' => $advertisement->width,
                'height' => $advertisement->height,
                'position' => $advertisement->position,
                'pages' => $advertisement->pages ?? [],
                'category_ids' => $advertisement->category_ids ?? [],
                'start_date' => optional($advertisement->start_date)?->format('Y-m-d\TH:i'),
                'end_date' => optional($advertisement->end_date)?->format('Y-m-d\TH:i'),
                'priority' => $advertisement->priority,
                'rotation_type' => $advertisement->rotation_type,
                'status' => $advertisement->status,
                'workflow_status' => $advertisement->workflow_status ?? 'draft',
                'is_pinned' => (bool) $advertisement->is_pinned,
                'is_house_ad' => (bool) $advertisement->is_house_ad,
                'is_fallback' => (bool) $advertisement->is_fallback,
                'fallback_ad_id' => $advertisement->fallback_ad_id,
                'frequency_cap_type' => $advertisement->frequency_cap_type ?? 'none',
                'frequency_cap_value' => $advertisement->frequency_cap_value,
                'device_targets' => $advertisement->device_targets ?? ['desktop', 'tablet', 'mobile'],
                'geo_countries' => $advertisement->geo_countries ?? [],
                'language_locales' => $advertisement->language_locales ?? [],
                'audience_tags' => $advertisement->audience_tags ?? [],
                'utm_source' => data_get($advertisement->utm_params, 'source', ''),
                'utm_medium' => data_get($advertisement->utm_params, 'medium', ''),
                'utm_campaign' => data_get($advertisement->utm_params, 'campaign', ''),
                'utm_term' => data_get($advertisement->utm_params, 'term', ''),
                'utm_content' => data_get($advertisement->utm_params, 'content', ''),
                'recurrence_type' => $advertisement->recurrence_type ?? 'always',
                'recurrence_days' => $advertisement->recurrence_days ?? [],
                'reviewer_notes' => $advertisement->reviewer_notes ?? '',
                'internal_comments' => $advertisement->internal_comments ?? '',
                'supported_sizes' => $advertisement->supported_sizes ?? [],
                'variant_enabled' => (bool) $advertisement->variant_enabled,
                'variant_split' => $advertisement->variant_split ?? 50,
                'winner_metric' => $advertisement->winner_metric ?? 'ctr',
                'video_embed_url' => $advertisement->video_embed_url ?? '',
                'display_behavior' => $advertisement->display_behavior ?? 'standard',
                'display_config' => $advertisement->display_config ?? [],
                'is_closable' => (bool) $advertisement->is_closable,
                'close_button_delay_seconds' => $advertisement->close_button_delay_seconds ?? 0,
                'schedule_rules' => $advertisement->schedule_rules ?? [],
                'max_total_impressions' => $advertisement->max_total_impressions,
                'max_daily_impressions' => $advertisement->max_daily_impressions,
                'url_patterns' => $advertisement->url_patterns ?? [],
                'exclude_rules' => $advertisement->exclude_rules ?? [],
            ],
            'advertisers' => Advertiser::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'email', 'phone']),
            'categories' => Category::query()->active()->orderBy('name')->get(['id', 'name']),
            'slots' => AdSlot::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'position', 'page']),
            'fallbackAds' => Advertisement::query()->whereKeyNot($advertisement->id)->orderBy('title')->limit(200)->get(['id', 'title']),
            'events' => $advertisement->auditEvents()->limit(20)->get(['id', 'event_type', 'meta', 'created_at']),
        ]);
    }

    public function update(Request $request, Advertisement $advertisement): RedirectResponse
    {
        $payload = $this->validateAndNormalize($request, $advertisement);
        $advertisement->update($payload);
        $this->audit($advertisement, 'updated', ['status' => $advertisement->status]);

        return redirect('/admin/advertisements')->with('success', 'Advertisement updated successfully.');
    }

    public function destroy(Advertisement $advertisement): RedirectResponse
    {
        if ($advertisement->image_path) {
            Storage::disk('public')->delete($advertisement->image_path);
        }

        $this->audit($advertisement, 'deleted', ['title' => $advertisement->title]);
        $advertisement->delete();

        return back()->with('success', 'Advertisement deleted successfully.');
    }

    public function toggleStatus(Advertisement $advertisement): RedirectResponse
    {
        $next = $advertisement->status === 'active' ? 'paused' : 'active';
        $advertisement->update([
            'status' => $next,
            'workflow_status' => $next === 'active' ? 'approved' : 'paused',
        ]);
        $this->audit($advertisement, 'status_toggled', ['status' => $next]);

        return back()->with('success', 'Advertisement status updated.');
    }

    public function bulkAction(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'action' => ['required', Rule::in(['activate', 'pause', 'archive', 'delete', 'duplicate', 'pin', 'unpin', 'move_slot', 'change_priority'])],
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:advertisements,id'],
            'slot_id' => ['nullable', 'integer', 'exists:ad_slots,id'],
            'priority' => ['nullable', 'integer', 'min:1', 'max:999'],
        ]);

        $ads = Advertisement::query()->whereIn('id', $validated['ids'])->get();
        $count = $ads->count();

        foreach ($ads as $ad) {
            switch ($validated['action']) {
                case 'activate':
                    $ad->update(['status' => 'active', 'workflow_status' => 'approved']);
                    break;
                case 'pause':
                    $ad->update(['status' => 'paused', 'workflow_status' => 'paused']);
                    break;
                case 'archive':
                    $ad->update(['status' => 'archived', 'workflow_status' => 'archived']);
                    break;
                case 'pin':
                    $ad->update(['is_pinned' => true]);
                    break;
                case 'unpin':
                    $ad->update(['is_pinned' => false]);
                    break;
                case 'move_slot':
                    if (!empty($validated['slot_id'])) {
                        $ad->update(['ad_slot_id' => (int) $validated['slot_id']]);
                    }
                    break;
                case 'change_priority':
                    if (!empty($validated['priority'])) {
                        $ad->update(['priority' => (int) $validated['priority']]);
                    }
                    break;
                case 'duplicate':
                    $clone = $ad->replicate();
                    $clone->title = $ad->title . ' (Copy)';
                    $clone->slug = Str::slug($clone->title . '-' . Str::random(6));
                    $clone->status = 'draft';
                    $clone->save();
                    $this->audit($clone, 'duplicated', ['source_id' => $ad->id]);
                    break;
                case 'delete':
                    $this->audit($ad, 'deleted_bulk', ['title' => $ad->title]);
                    $ad->delete();
                    break;
            }

            if ($validated['action'] !== 'delete') {
                $this->audit($ad, 'bulk_' . $validated['action'], ['id' => $ad->id]);
            }
        }

        return back()->with('success', "Bulk action applied to {$count} ad(s).");
    }

    private function validateAndNormalize(Request $request, ?Advertisement $advertisement = null): array
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:190'],
            'advertiser_id' => ['nullable', 'exists:advertisers,id'],
            'ad_slot_id' => ['nullable', 'exists:ad_slots,id'],
            'fallback_ad_id' => ['nullable', 'integer', 'exists:advertisements,id'],
            'client_name' => ['nullable', 'string', 'max:120'],
            'client_email' => ['nullable', 'email', 'max:190'],
            'client_phone' => ['nullable', 'string', 'max:40'],
            'ad_type' => ['required', Rule::in(['image', 'html', 'script'])],
            'image_file' => ['nullable', 'image', 'max:4096'],
            'image_path' => ['nullable', 'string', 'max:500'],
            'video_embed_url' => ['nullable', 'url', 'max:500'],
            'html_code' => ['nullable', 'string'],
            'script_code' => ['nullable', 'string'],
            'target_url' => ['nullable', 'url', 'max:500'],
            'open_in_new_tab' => ['boolean'],
            'width' => ['nullable', 'integer', 'min:1', 'max:5000'],
            'height' => ['nullable', 'integer', 'min:1', 'max:5000'],
            'position' => ['required', Rule::in(['header', 'sidebar', 'inline', 'footer', 'popup', 'below_nav', 'left_sidebar_top', 'left_sidebar_bottom', 'right_sidebar_top', 'right_sidebar_bottom', 'in_article', 'between_articles', 'sticky_top', 'sticky_bottom', 'floating_bottom_right', 'floating_bottom_left', 'full_screen_overlay', 'notification_bar'])],
            'display_behavior' => ['nullable', Rule::in(['standard', 'closable', 'rotational', 'sticky', 'floating', 'interstitial', 'expandable', 'slide_in'])],
            'display_config' => ['nullable', 'array'],
            'is_closable' => ['boolean'],
            'close_button_delay_seconds' => ['nullable', 'integer', 'min:0', 'max:60'],
            'schedule_rules' => ['nullable', 'array'],
            'max_total_impressions' => ['nullable', 'integer', 'min:0'],
            'max_daily_impressions' => ['nullable', 'integer', 'min:0'],
            'url_patterns' => ['nullable', 'array'],
            'url_patterns.*' => ['string', 'max:200'],
            'exclude_rules' => ['nullable', 'array'],
            'pages' => ['nullable', 'array'],
            'pages.*' => ['string', Rule::in(['home', 'article', 'category', 'search'])],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
            'device_targets' => ['nullable', 'array'],
            'device_targets.*' => ['string', Rule::in(['desktop', 'tablet', 'mobile'])],
            'geo_countries' => ['nullable', 'array'],
            'geo_countries.*' => ['string', 'size:2'],
            'language_locales' => ['nullable', 'array'],
            'language_locales.*' => ['string', 'max:10'],
            'audience_tags' => ['nullable', 'array'],
            'audience_tags.*' => ['string', 'max:40'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'recurrence_type' => ['nullable', Rule::in(['always', 'weekdays', 'weekends', 'custom'])],
            'recurrence_days' => ['nullable', 'array'],
            'recurrence_days.*' => ['integer', 'between:0,6'],
            'frequency_cap_type' => ['nullable', Rule::in(['none', 'session', 'day', 'user'])],
            'frequency_cap_value' => ['nullable', 'integer', 'min:1', 'max:500'],
            'priority' => ['required', 'integer', 'min:1', 'max:999'],
            'rotation_type' => ['required', Rule::in(['sequential', 'random'])],
            'status' => ['required', Rule::in(['draft', 'active', 'paused', 'expired', 'archived'])],
            'workflow_status' => ['nullable', Rule::in(['draft', 'pending_review', 'approved', 'rejected', 'active', 'paused', 'archived'])],
            'reviewer_notes' => ['nullable', 'string'],
            'internal_comments' => ['nullable', 'string'],
            'is_pinned' => ['boolean'],
            'is_house_ad' => ['boolean'],
            'is_fallback' => ['boolean'],
            'supported_sizes' => ['nullable', 'array'],
            'supported_sizes.*' => ['string', 'max:30'],
            'variant_enabled' => ['boolean'],
            'variant_split' => ['nullable', 'integer', 'min:1', 'max:99'],
            'winner_metric' => ['nullable', Rule::in(['ctr', 'clicks', 'impressions'])],
            'utm_source' => ['nullable', 'string', 'max:120'],
            'utm_medium' => ['nullable', 'string', 'max:120'],
            'utm_campaign' => ['nullable', 'string', 'max:120'],
            'utm_term' => ['nullable', 'string', 'max:120'],
            'utm_content' => ['nullable', 'string', 'max:120'],
        ]);

        if ($validated['ad_type'] === 'image' && !$request->hasFile('image_file') && empty($validated['image_path']) && !$advertisement?->image_path) {
            throw ValidationException::withMessages([
                'image_file' => 'Image is required for image ads.',
            ]);
        }

        if ($validated['ad_type'] === 'html' && empty($validated['html_code'])) {
            throw ValidationException::withMessages([
                'html_code' => 'HTML code is required for HTML ads.',
            ]);
        }

        if ($validated['ad_type'] === 'script' && empty($validated['script_code'])) {
            throw ValidationException::withMessages([
                'script_code' => 'Script code is required for script ads.',
            ]);
        }

        if ($request->hasFile('image_file')) {
            if ($advertisement?->image_path) {
                Storage::disk('public')->delete($advertisement->image_path);
            }

            $validated['image_path'] = $request->file('image_file')->store('ads', 'public');
        }

        return [
            'advertiser_id' => $validated['advertiser_id'] ?? null,
            'ad_slot_id' => $validated['ad_slot_id'] ?? null,
            'fallback_ad_id' => $validated['fallback_ad_id'] ?? null,
            'title' => $validated['title'],
            'slug' => Str::slug($validated['title']),
            'description' => $validated['title'],
            'ad_type' => $validated['ad_type'],
            'image_url' => $validated['image_path'] ?? $advertisement?->image_path,
            'image_path' => $validated['image_path'] ?? $advertisement?->image_path,
            'video_url' => $validated['video_embed_url'] ?? null,
            'video_embed_url' => $validated['video_embed_url'] ?? null,
            'has_video' => !empty($validated['video_embed_url']),
            'html_code' => $validated['html_code'] ?? null,
            'script_code' => $validated['script_code'] ?? null,
            'size' => ($validated['width'] ?? null) && ($validated['height'] ?? null)
                ? ($validated['width'] . 'x' . $validated['height'])
                : 'custom',
            'custom_width' => $validated['width'] ?? null,
            'custom_height' => $validated['height'] ?? null,
            'redirect_url' => $validated['target_url'] ?? null,
            'target_url' => $validated['target_url'] ?? null,
            'open_in_new_tab' => $request->boolean('open_in_new_tab'),
            'width' => $validated['width'] ?? null,
            'height' => $validated['height'] ?? null,
            'position' => $validated['position'],
            'pages' => $validated['pages'] ?? [],
            'category_ids' => $validated['category_ids'] ?? [],
            'device_targets' => $validated['device_targets'] ?? ['desktop', 'tablet', 'mobile'],
            'geo_countries' => array_map('strtoupper', $validated['geo_countries'] ?? []),
            'language_locales' => $validated['language_locales'] ?? [],
            'audience_tags' => $validated['audience_tags'] ?? [],
            'start_date' => $validated['start_date'] ?? null,
            'end_date' => $validated['end_date'] ?? null,
            'recurrence_type' => $validated['recurrence_type'] ?? 'always',
            'recurrence_days' => $validated['recurrence_days'] ?? [],
            'frequency_cap_type' => $validated['frequency_cap_type'] ?? 'none',
            'frequency_cap_value' => $validated['frequency_cap_value'] ?? null,
            'daily_limit' => null,
            'priority' => $validated['priority'],
            'is_responsive' => true,
            'is_pinned' => $request->boolean('is_pinned'),
            'is_house_ad' => $request->boolean('is_house_ad'),
            'is_fallback' => $request->boolean('is_fallback'),
            'targeting' => [
                'pages' => $validated['pages'] ?? [],
                'category_ids' => $validated['category_ids'] ?? [],
                'position' => $validated['position'],
                'devices' => $validated['device_targets'] ?? ['desktop', 'tablet', 'mobile'],
                'countries' => $validated['geo_countries'] ?? [],
                'locales' => $validated['language_locales'] ?? [],
                'audience_tags' => $validated['audience_tags'] ?? [],
            ],
            'rotation_type' => $validated['rotation_type'],
            'status' => $validated['status'],
            'workflow_status' => $validated['workflow_status'] ?? ($validated['status'] === 'active' ? 'approved' : 'draft'),
            'reviewer_notes' => $validated['reviewer_notes'] ?? null,
            'internal_comments' => $validated['internal_comments'] ?? null,
            'supported_sizes' => $validated['supported_sizes'] ?? [],
            'variant_enabled' => $request->boolean('variant_enabled'),
            'variant_split' => $validated['variant_split'] ?? 50,
            'winner_metric' => $validated['winner_metric'] ?? 'ctr',
            'utm_params' => array_filter([
                'source' => $validated['utm_source'] ?? null,
                'medium' => $validated['utm_medium'] ?? null,
                'campaign' => $validated['utm_campaign'] ?? null,
                'term' => $validated['utm_term'] ?? null,
                'content' => $validated['utm_content'] ?? null,
            ]),
            'display_behavior' => $validated['display_behavior'] ?? 'standard',
            'display_config' => $validated['display_config'] ?? null,
            'is_closable' => $request->boolean('is_closable'),
            'close_button_delay_seconds' => $validated['close_button_delay_seconds'] ?? 0,
            'schedule_rules' => $validated['schedule_rules'] ?? null,
            'max_total_impressions' => $validated['max_total_impressions'] ?? null,
            'max_daily_impressions' => $validated['max_daily_impressions'] ?? null,
            'url_patterns' => $validated['url_patterns'] ?? null,
            'exclude_rules' => $validated['exclude_rules'] ?? null,
        ];
    }

    private function serializeAd(Advertisement $ad): array
    {
        $computedStatus = $ad->status;
        if ($ad->status === 'active' && $ad->start_date && $ad->start_date->isFuture()) {
            $computedStatus = 'scheduled';
        }
        if ($ad->status === 'active' && $ad->end_date && $ad->end_date->isPast()) {
            $computedStatus = 'expired';
        }

        return [
            'id' => $ad->id,
            'title' => $ad->title,
            'ad_type' => $ad->ad_type,
            'image_path' => $ad->image_path,
            'advertiser' => $ad->advertiser,
            'position' => $ad->position,
            'pages' => $ad->pages ?? [],
            'width' => $ad->width,
            'height' => $ad->height,
            'start_date' => optional($ad->start_date)?->toDateTimeString(),
            'end_date' => optional($ad->end_date)?->toDateTimeString(),
            'priority' => $ad->priority,
            'status' => $computedStatus,
            'raw_status' => $ad->status,
            'ctr' => $ad->ctr,
            'total_impressions' => $ad->total_impressions,
            'total_clicks' => $ad->total_clicks,
            'workflow_status' => $ad->workflow_status,
            'is_pinned' => (bool) $ad->is_pinned,
            'is_house_ad' => (bool) $ad->is_house_ad,
            'ad_slot_id' => $ad->ad_slot_id,
            'advertiser_id' => $ad->advertiser_id,
            'frequency_cap_type' => $ad->frequency_cap_type,
            'frequency_cap_value' => $ad->frequency_cap_value,
            'device_targets' => $ad->device_targets ?? [],
            'audience_tags' => $ad->audience_tags ?? [],
            'display_behavior' => $ad->display_behavior ?? 'standard',
            'is_closable' => (bool) $ad->is_closable,
        ];
    }

    private function audit(Advertisement $advertisement, string $eventType, array $meta = []): void
    {
        AdAuditEvent::query()->create([
            'advertisement_id' => $advertisement->id,
            'actor_id' => Auth::id(),
            'event_type' => $eventType,
            'meta' => $meta,
        ]);
    }
}
