<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdSlot;
use App\Models\Advertisement;
use App\Models\Advertiser;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdvertisementController extends Controller
{
    public function index(Request $request): Response
    {
        $ads = Advertisement::query()
            ->with(['advertiser:id,name', 'slot:id,name'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->position, fn ($q) => $q->where('position', $request->position))
            ->when($request->page, fn ($q) => $q->whereJsonContains('pages', $request->page))
            ->when($request->from_date, fn ($q) => $q->whereDate('start_date', '>=', $request->from_date))
            ->when($request->to_date, fn ($q) => $q->whereDate('end_date', '<=', $request->to_date))
            ->when($request->search, fn ($q) => $q->where('title', 'like', '%' . trim((string) $request->search) . '%'))
            ->orderByDesc('priority')
            ->latest('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Advertisement $ad) => $this->serializeAd($ad));

        return Inertia::render('admin/advertisements/Index', [
            'ads' => $ads,
            'filters' => $request->only(['status', 'position', 'page', 'from_date', 'to_date', 'search']),
            'summary' => [
                'total' => Advertisement::count(),
                'active' => Advertisement::active()->count(),
                'scheduled' => Advertisement::where('status', 'active')->where('start_date', '>', now())->count(),
                'expired' => Advertisement::whereNotNull('end_date')->where('end_date', '<', now())->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/advertisements/Create', [
            'advertisers' => Advertiser::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'email', 'phone']),
            'categories' => Category::query()->active()->orderBy('name')->get(['id', 'name']),
            'slots' => AdSlot::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'position', 'page']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $payload = $this->validateAndNormalize($request);
        Advertisement::create($payload);

        return redirect()->route('admin.advertisements.index')->with('success', 'Advertisement created successfully.');
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
            ],
            'advertisers' => Advertiser::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'email', 'phone']),
            'categories' => Category::query()->active()->orderBy('name')->get(['id', 'name']),
            'slots' => AdSlot::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'position', 'page']),
        ]);
    }

    public function update(Request $request, Advertisement $advertisement): RedirectResponse
    {
        $payload = $this->validateAndNormalize($request, $advertisement);
        $advertisement->update($payload);

        return redirect()->route('admin.advertisements.index')->with('success', 'Advertisement updated successfully.');
    }

    public function destroy(Advertisement $advertisement): RedirectResponse
    {
        if ($advertisement->image_path) {
            Storage::disk('public')->delete($advertisement->image_path);
        }

        $advertisement->delete();

        return back()->with('success', 'Advertisement deleted successfully.');
    }

    public function toggleStatus(Advertisement $advertisement): RedirectResponse
    {
        $advertisement->update([
            'status' => $advertisement->status === 'active' ? 'paused' : 'active',
        ]);

        return back()->with('success', 'Advertisement status updated.');
    }

    private function validateAndNormalize(Request $request, ?Advertisement $advertisement = null): array
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:190'],
            'advertiser_id' => ['nullable', 'exists:advertisers,id'],
            'ad_slot_id' => ['nullable', 'exists:ad_slots,id'],
            'client_name' => ['nullable', 'string', 'max:120'],
            'client_email' => ['nullable', 'email', 'max:190'],
            'client_phone' => ['nullable', 'string', 'max:40'],
            'ad_type' => ['required', Rule::in(['image', 'html', 'script'])],
            'image_file' => ['nullable', 'image', 'max:4096'],
            'image_path' => ['nullable', 'string', 'max:500'],
            'html_code' => ['nullable', 'string'],
            'script_code' => ['nullable', 'string'],
            'target_url' => ['nullable', 'url', 'max:500'],
            'open_in_new_tab' => ['boolean'],
            'width' => ['nullable', 'integer', 'min:1', 'max:5000'],
            'height' => ['nullable', 'integer', 'min:1', 'max:5000'],
            'position' => ['required', Rule::in(['header', 'sidebar', 'inline', 'footer', 'popup'])],
            'pages' => ['nullable', 'array'],
            'pages.*' => ['string', Rule::in(['home', 'article', 'category', 'search'])],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'priority' => ['required', 'integer', 'min:1', 'max:999'],
            'rotation_type' => ['required', Rule::in(['sequential', 'random'])],
            'status' => ['required', Rule::in(['active', 'inactive'])],
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
            'title' => $validated['title'],
            'slug' => Str::slug($validated['title']),
            'description' => $validated['title'],
            'ad_type' => $validated['ad_type'],
            'image_url' => $validated['image_path'] ?? $advertisement?->image_path,
            'image_path' => $validated['image_path'] ?? $advertisement?->image_path,
            'video_url' => null,
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
            'start_date' => $validated['start_date'] ?? null,
            'end_date' => $validated['end_date'] ?? null,
            'daily_limit' => null,
            'priority' => $validated['priority'],
            'is_responsive' => true,
            'targeting' => [
                'pages' => $validated['pages'] ?? [],
                'category_ids' => $validated['category_ids'] ?? [],
                'position' => $validated['position'],
            ],
            'rotation_type' => $validated['rotation_type'],
            'status' => $validated['status'] === 'inactive' ? 'paused' : $validated['status'],
        ];
    }

    private function serializeAd(Advertisement $ad): array
    {
        $computedStatus = in_array($ad->status, ['paused', 'archived'], true) ? 'inactive' : $ad->status;
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
            'raw_status' => in_array($ad->status, ['paused', 'archived'], true) ? 'inactive' : $ad->status,
            'ctr' => $ad->ctr,
            'total_impressions' => $ad->total_impressions,
            'total_clicks' => $ad->total_clicks,
        ];
    }
}
