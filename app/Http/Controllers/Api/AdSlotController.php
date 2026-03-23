<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdPerformance;
use App\Models\Advertisement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdSlotController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'position' => ['required', 'in:header,sidebar,inline,footer,popup'],
            'page' => ['required', 'in:home,article,category,search'],
            'category' => ['nullable', 'string'],
            'category_id' => ['nullable', 'integer'],
            'country' => ['nullable', 'string', 'size:2'],
            'locale' => ['nullable', 'string', 'max:10'],
            'audience_tags' => ['nullable', 'string'],
            'session_id' => ['nullable', 'string', 'max:120'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);

        $categoryId = $request->integer('category_id');
        $requestedCountry = strtoupper($request->string('country')->toString() ?: '');
        $requestedLocale = strtolower($request->string('locale')->toString() ?: Str::before((string) $request->header('Accept-Language', ''), ','));
        $requestedTags = array_values(array_filter(array_map('trim', explode(',', (string) $request->string('audience_tags')))));
        $device = $this->resolveDevice($request);
        $page = $request->string('page')->toString();
        $position = $request->string('position')->toString();

        $ads = Advertisement::query()
            ->active()
            ->where('position', $position)
            ->where(function ($q): void {
                $q->where('workflow_status', 'approved')->orWhereNull('workflow_status');
            })
            ->where(function ($query) use ($request): void {
                $query->whereNull('pages')
                    ->orWhereJsonContains('pages', $request->string('page')->toString());
            })
            ->when($categoryId, function ($query) use ($categoryId): void {
                $query->where(function ($q) use ($categoryId): void {
                    $q->whereNull('category_ids')
                        ->orWhereJsonContains('category_ids', $categoryId);
                });
            })
            ->orderByDesc('priority')
            ->limit($request->integer('limit', 5))
            ->get();

        $ads = $ads->filter(function (Advertisement $ad) use ($device, $requestedCountry, $requestedLocale, $requestedTags, $request): bool {
            if ($this->isFrequencyCapped($ad, $request)) {
                return false;
            }

            $devices = $ad->device_targets ?? [];
            if (!empty($devices) && !in_array($device, $devices, true)) {
                return false;
            }

            $countries = array_map('strtoupper', $ad->geo_countries ?? []);
            if (!empty($countries) && $requestedCountry !== '' && !in_array($requestedCountry, $countries, true)) {
                return false;
            }

            $locales = array_map('strtolower', $ad->language_locales ?? []);
            if (!empty($locales) && $requestedLocale !== '' && !in_array($requestedLocale, $locales, true)) {
                return false;
            }

            $audience = $ad->audience_tags ?? [];
            if (!empty($audience) && !empty($requestedTags) && count(array_intersect($audience, $requestedTags)) === 0) {
                return false;
            }

            return true;
        })->values();

        if ($ads->isEmpty()) {
            $ads = Advertisement::query()
                ->active()
                ->where('position', $position)
                ->where('is_fallback', true)
                ->where(function ($query) use ($page): void {
                    $query->whereNull('pages')->orWhereJsonContains('pages', $page);
                })
                ->orderByDesc('priority')
                ->limit(1)
                ->get();
        }

        $ads = $ads->map(function (Advertisement $ad) {
            return [
                'id' => $ad->id,
                'title' => $ad->title,
                'ad_type' => $ad->ad_type,
                'image_path' => $ad->image_path,
                'html_code' => $ad->html_code,
                'script_code' => $ad->script_code,
                'target_url' => $this->appendUtmParams($ad),
                'open_in_new_tab' => $ad->open_in_new_tab,
                'width' => $ad->width,
                'height' => $ad->height,
                'position' => $ad->position,
                'video_embed_url' => $ad->video_embed_url,
            ];
        });

        return response()->json([
            'data' => $ads,
        ]);
    }

    public function trackImpression(Request $request, Advertisement $advertisement, ?int $id = null): JsonResponse
    {
        if (!$advertisement->exists && $id) {
            $advertisement = Advertisement::query()->findOrFail($id);
        }

        $advertisement->increment('total_impressions');
        $advertisement->update(['last_served_at' => now()]);

        $row = AdPerformance::firstOrCreate([
            'advertisement_id' => $advertisement->id,
            'date' => now()->toDateString(),
        ]);

        $row->increment('impressions');
        $this->updateCtr($row);

        $this->logEvent($advertisement, 'impression');

        return response()->json(['ok' => true]);
    }

    public function trackClick(Request $request, Advertisement $advertisement, ?int $id = null): JsonResponse
    {
        if (!$advertisement->exists && $id) {
            $advertisement = Advertisement::query()->findOrFail($id);
        }

        $advertisement->increment('total_clicks');

        $row = AdPerformance::firstOrCreate([
            'advertisement_id' => $advertisement->id,
            'date' => now()->toDateString(),
        ]);

        $row->increment('clicks');
        $this->updateCtr($row);
        $this->logEvent($advertisement, 'click');

        return response()->json(['ok' => true]);
    }

    private function updateCtr(AdPerformance $row): void
    {
        $row->refresh();

        $ctr = $row->impressions > 0
            ? round(($row->clicks / $row->impressions) * 100, 4)
            : 0;

        $row->update(['ctr' => $ctr]);
    }

    private function resolveDevice(Request $request): string
    {
        $ua = strtolower((string) $request->userAgent());

        if (str_contains($ua, 'ipad') || str_contains($ua, 'tablet')) {
            return 'tablet';
        }

        if (str_contains($ua, 'mobile') || str_contains($ua, 'android') || str_contains($ua, 'iphone')) {
            return 'mobile';
        }

        return 'desktop';
    }

    private function isFrequencyCapped(Advertisement $ad, Request $request): bool
    {
        $capType = $ad->frequency_cap_type ?? 'none';
        $capValue = (int) ($ad->frequency_cap_value ?? 0);

        if ($capType === 'none' || $capValue <= 0) {
            return false;
        }

        $visitor = (string) ($request->user()?->id ?: $request->ip() ?: 'guest');
        $session = $request->string('session_id')->toString() ?: $request->session()?->getId() ?: 'session';
        $day = now()->toDateString();

        $key = match ($capType) {
            'session' => "ads:cap:session:{$ad->id}:{$session}",
            'day' => "ads:cap:day:{$ad->id}:{$visitor}:{$day}",
            'user' => "ads:cap:user:{$ad->id}:{$visitor}",
            default => null,
        };

        if ($key === null) {
            return false;
        }

        $count = (int) Cache::get($key, 0);

        return $count >= $capValue;
    }

    private function appendUtmParams(Advertisement $ad): ?string
    {
        $target = $ad->target_url;
        if (!$target) {
            return null;
        }

        $utm = $ad->utm_params ?? [];
        if (empty($utm)) {
            return $target;
        }

        $query = http_build_query(array_filter([
            'utm_source' => data_get($utm, 'source'),
            'utm_medium' => data_get($utm, 'medium'),
            'utm_campaign' => data_get($utm, 'campaign'),
            'utm_term' => data_get($utm, 'term'),
            'utm_content' => data_get($utm, 'content'),
        ]));

        if ($query === '') {
            return $target;
        }

        return str_contains($target, '?') ? "{$target}&{$query}" : "{$target}?{$query}";
    }

    private function logEvent(Advertisement $ad, string $eventType): void
    {
        $device = request()->headers->get('X-Device') ?: $this->resolveDevice(request());
        $country = strtoupper((string) request()->string('country')) ?: null;
        $locale = strtolower((string) request()->string('locale')) ?: null;

        DB::table('ad_event_logs')->insert([
            'advertisement_id' => $ad->id,
            'event_type' => $eventType,
            'page' => request()->string('page')->toString() ?: (is_array($ad->pages) ? ($ad->pages[0] ?? null) : null),
            'position' => request()->string('position')->toString() ?: $ad->position,
            'device' => $device,
            'country' => $country,
            'locale' => $locale,
            'slot_id' => $ad->ad_slot_id,
            'advertiser_id' => $ad->advertiser_id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if ($eventType !== 'impression') {
            return;
        }

        $capType = $ad->frequency_cap_type ?? 'none';
        $capValue = (int) ($ad->frequency_cap_value ?? 0);
        if ($capType === 'none' || $capValue <= 0) {
            return;
        }

        $req = request();
        $visitor = (string) ($req->user()?->id ?: $req->ip() ?: 'guest');
        $session = $req->string('session_id')->toString() ?: $req->session()?->getId() ?: 'session';
        $day = now()->toDateString();

        $key = match ($capType) {
            'session' => "ads:cap:session:{$ad->id}:{$session}",
            'day' => "ads:cap:day:{$ad->id}:{$visitor}:{$day}",
            'user' => "ads:cap:user:{$ad->id}:{$visitor}",
            default => null,
        };

        if ($key !== null) {
            Cache::put($key, ((int) Cache::get($key, 0)) + 1, now()->addDay());
        }
    }
}
